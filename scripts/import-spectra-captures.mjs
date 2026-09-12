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
  run('cwebp', ['-quiet', '-lossless', '-exact', '-m', '6', '-metadata', 'icc', source, '-o', destination]);
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
await writeFile(join(root, 'assets/data/spectra-screenshots.json'), JSON.stringify(provenance, null, 2) + '\n');
console.log(`Imported ${items.length} pixel-verified native captures from ${manifest.appSourceCommit}.`);
