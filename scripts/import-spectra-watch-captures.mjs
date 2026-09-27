import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './site-files.mjs';

// The companion is captured from the real native UI using disclosed simulator
// fixtures. Never generate, crop, redraw, or replace text inside its screens.
const appRoot = process.argv[2];
if (!appRoot || process.argv.length !== 3) throw new Error('Pass the Spectra repository path.');
const sourceRoot = join(resolve(appRoot), 'docs/release/watch-assets/en-US');
const manifest = JSON.parse(await readFile(join(sourceRoot, 'manifest.json'), 'utf8'));
if (manifest.schemaVersion !== 1 || manifest.exampleData !== true
    || !/^[a-f0-9]{40}$/.test(manifest.appSourceCommit)
    || !/^\d+\.\d+\.\d+$/.test(manifest.appVersion)
    || !/^\d{4,}$/.test(manifest.bundleBuild)
    || !/^\d+[A-Z]+\d{4,}$/.test(manifest.buildIdentifier)
    || !manifest.buildIdentifier.endsWith(manifest.bundleBuild)
    || typeof manifest.captureDevice !== 'string' || !manifest.captureDevice.startsWith('Apple Watch ')
    || typeof manifest.captureRuntime !== 'string' || !manifest.captureRuntime.includes('watchOS 27')
    || !Array.isArray(manifest.items)) throw new Error('Invalid Watch capture provenance');
const run = (command, args) => {
  const result = spawnSync(command, args, { maxBuffer: 32 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message ?? result.stderr.toString()}`);
  return result.stdout;
};
run('git', ['-C', resolve(appRoot), 'cat-file', '-e', `${manifest.appSourceCommit}^{commit}`]);
const hash = value => createHash('sha256').update(value).digest('hex');
const items = [];
let html = await readFile(join(root, 'spectra.html'), 'utf8');
for (const id of ['watch-start', 'watch-complete']) {
  const records = manifest.items.filter(item => item.id === id);
  if (records.length !== 1) throw new Error(`Missing or duplicate Watch capture: ${id}`);
  const record = records[0], relativeSource = `captures/${id}.png`;
  if (record.capture !== relativeSource || record.appearance !== 'dark') throw new Error(`Unexpected source path or appearance: ${id}`);
  const source = join(sourceRoot, relativeSource), bytes = await readFile(source);
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
      || hash(bytes) !== record.captureSHA256) throw new Error(`Invalid native screenshot: ${id}`);
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width !== record.width || height !== record.height || width < 300 || width > 600 || height < 350 || height > 700) {
    throw new Error(`Unexpected native Watch dimensions: ${id}`);
  }
  const output = `assets/images/spectra-${id}.webp`, destination = join(root, output);
  run('cwebp', ['-quiet', '-lossless', '-exact', '-q', '100', '-m', '6', '-metadata', 'icc', source, '-o', destination]);
  const pixels = path => run('magick', [path, '-depth', '8', 'rgba:-']);
  const pixelSHA256 = hash(pixels(source));
  if (hash(pixels(destination)) !== pixelSHA256) throw new Error(`Conversion changed native pixels: ${id}`);
  const outputSHA256 = hash(await readFile(destination));
  const versioned = `${output}?v=${outputSHA256.slice(0, 12)}`;
  let references = 0;
  html = html.replace(/\b(href|src)="([^"]+)"/g, (tag, attribute, value) => {
    if (value.split('?')[0] !== output) return tag;
    if (value !== output && !/^v=[a-f0-9]{12}$/.test(value.split('?').slice(1).join('?'))) throw new Error('Unexpected Watch image URL');
    references += 1;
    return `${attribute}="${versioned}"`;
  });
  if (references !== 2) throw new Error(`Expected linked preview for ${id}`);
  let previews = 0;
  html = html.replace(/<img src="([^"]+)" width="\d+" height="\d+"/g, (tag, src) => {
    if (src !== versioned) return tag;
    previews += 1;
    return `<img src="${versioned}" width="${width}" height="${height}"`;
  });
  if (previews !== 1) throw new Error(`Expected one dimensioned preview for ${id}`);
  items.push({ id, source: relativeSource, sourceSHA256: record.captureSHA256, output,
    outputSHA256, pixelSHA256, width, height, appearance: record.appearance });
}
await writeFile(join(root, 'spectra.html'), html);
await writeFile(join(root, 'assets/data/spectra-watch-screenshots.json'), JSON.stringify({
  schemaVersion: 1, platform: 'watchOS', appSourceCommit: manifest.appSourceCommit,
  appVersion: manifest.appVersion, bundleBuild: manifest.bundleBuild, buildIdentifier: manifest.buildIdentifier,
  captureDevice: manifest.captureDevice, captureRuntime: manifest.captureRuntime,
  exampleData: true, transformation: 'Lossless WebP; original dimensions and every RGBA pixel preserved.', items,
}, null, 2) + '\n');
console.log(`Imported ${items.length} pixel-verified Watch screens from ${manifest.appSourceCommit}.`);
