import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './site-files.mjs';

// Native captures only. Compression changes neither pixels nor UI content.
// Run after the app capture suite and its manifest/OCR checks succeed.
const appRoot = process.argv[2];
if (!appRoot || process.argv.length !== 3) throw new Error('Pass the Spectra repository path.');
const sourceRoot = join(resolve(appRoot), 'docs/release/app-store-assets/en-US');
const manifest = JSON.parse(await readFile(join(sourceRoot, 'manifest.json'), 'utf8'));
if (!/^[a-f0-9]{40}$/.test(manifest.appSourceCommit) || manifest.exampleData !== true) throw new Error('Invalid capture provenance');
const run = (command, args) => {
  const result = spawnSync(command, args, { maxBuffer: 32 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message ?? result.stderr.toString()}`);
  return result.stdout;
};
run('git', ['-C', resolve(appRoot), 'cat-file', '-e', `${manifest.appSourceCommit}^{commit}`]);
const hash = value => createHash('sha256').update(value).digest('hex');
const mappings = [
  ['01-quick-check', 'spectra-overview'],
  ['02-smart-glasses', 'spectra-smart-glasses'],
  ['03-magnetic-sweep', 'spectra-area-sweep'],
  ['05-monitor', 'spectra-monitor'],
];
const items = [];
for (const [id, name] of mappings) {
  const record = manifest.items.find(item => item.id === id);
  const relativeSource = `captures/${id}.png`;
  if (record?.capture !== relativeSource) throw new Error(`Unexpected capture: ${id}`);
  const source = join(sourceRoot, relativeSource);
  const bytes = await readFile(source);
  if (hash(bytes) !== record.captureSHA256) throw new Error(`Source hash mismatch: ${id}`);
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Not PNG: ${id}`);
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width !== 1320 || height !== 2868) throw new Error(`Unexpected native size: ${id}`);
  const output = `assets/images/${name}.webp`;
  const destination = join(root, output);
  // In lossless mode, q=100 spends more offline encoding effort, not image
  // fidelity. Preserve every pixel and the color profile within the site budget.
  run('cwebp', ['-quiet', '-lossless', '-exact', '-q', '100', '-m', '6', '-metadata', 'icc', source, '-o', destination]);
  const pixels = path => run('magick', [path, '-alpha', 'off', '-depth', '8', 'rgba:-']);
  const pixelSHA256 = hash(pixels(source));
  if (hash(pixels(destination)) !== pixelSHA256) throw new Error(`Compression changed pixels: ${id}`);
  items.push({ id, source: relativeSource, sourceSHA256: record.captureSHA256,
    output, outputSHA256: hash(await readFile(destination)), pixelSHA256,
    width, height, appearance: record.appearance });
}
const provenance = { schemaVersion: 1, appSourceCommit: manifest.appSourceCommit,
  captureDevice: manifest.captureDevice, captureRuntime: manifest.captureRuntime,
  exampleData: true, transformation: 'Lossless WebP; original dimensions and decoded pixels preserved.', items };
// Updated HTML must not reuse stale image responses. Keep filesystem paths in
// provenance query-free and version both the preview and full-size link from
// the final encoded bytes. This does not purge already-cached HTML documents.
const pages = [];
for (const page of ['index.html', 'spectra.html']) {
  let html = await readFile(join(root, page), 'utf8');
  for (const item of items) {
    let references = 0;
    html = html.replace(/\b(href|src)="([^"]+)"/g, (tag, attribute, value) => {
      if (value.split('?')[0] !== item.output) return tag;
      if (value !== item.output && !/^v=[a-f0-9]{12}$/.test(value.split('?').slice(1).join('?'))) {
        throw new Error(`Unexpected screenshot URL in ${page}: ${value}`);
      }
      references += 1;
      return `${attribute}="${item.output}?v=${item.outputSHA256.slice(0, 12)}"`;
    });
    const expected = page === 'spectra.html' ? 2 : item.id === '01-quick-check' ? 1 : 0;
    if (references !== expected) throw new Error(`Unexpected screenshot reference count in ${page}: ${item.id}`);
  }
  pages.push([page, html]);
}
for (const [page, html] of pages) await writeFile(join(root, page), html);
await writeFile(join(root, 'assets/data/spectra-screenshots.json'), JSON.stringify(provenance, null, 2) + '\n');
console.log(`Imported ${items.length} pixel-verified native captures from ${manifest.appSourceCommit}.`);
