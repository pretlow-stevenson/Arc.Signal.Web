import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, copyFile, mkdtemp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { root } from './site-files.mjs';

// Package the approved raster losslessly; never regenerate or substitute fonts.
const appRoot = process.argv[2];
if (!appRoot || process.argv.length !== 3) throw new Error('Pass the Spectra repository path.');
const sourcePath = 'App/Spectra/Assets.xcassets/SpectraWordmark.imageset/spectra-wordmark-original.png';
const source = join(resolve(appRoot), sourcePath);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceSHA256 = hash(await readFile(source));
assert.equal(sourceSHA256, '8ffe7d1e3a7dc2209965e0ebd5089eb100e3f1e842e48a4ad70da4e337f14964', 'Requires owner-approved source artwork');
const run = (command, args) => {
  const result = spawnSync(command, args, { maxBuffer: 32 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message ?? result.stderr.toString()}`);
  return result.stdout;
};
const working = await mkdtemp(join(tmpdir(), 'spectra-wordmark-'));
const encoded = join(working, 'wordmark.webp');
run('cwebp', ['-quiet', '-lossless', '-exact', '-q', '100', '-m', '6', '-metadata', 'icc', source, '-o', encoded]);
const pixels = path => run('magick', [path, '-alpha', 'off', '-depth', '8', 'rgba:-']);
const pixelSHA256 = hash(pixels(source));
assert.equal(hash(pixels(encoded)), pixelSHA256, 'Encoding changed artwork pixels');
const output = 'assets/images/spectra-wordmark.webp';
const outputBytes = await readFile(encoded);
assert.ok(outputBytes.length <= 415_000, 'Wordmark transfer allowance exceeded');
const outputSHA256 = hash(outputBytes);
const provenance = { schemaVersion: 1, source: sourcePath, sourceSHA256, output, outputSHA256,
  pixelSHA256, width: 1983, height: 793, displayViewBox: [466, 256, 1058, 280],
  transformation: 'Lossless WebP; all source dimensions and decoded pixels preserved. Whitespace cropped only in the view.' };
const pages = [];
for (const page of ['index.html', 'spectra.html']) {
  const html = await readFile(join(root, page), 'utf8');
  let count = 0;
  const updated = html.replace(/href="assets\/images\/spectra-wordmark\.webp(?:\?v=[a-f0-9]{12})?"/g, () => {
    count += 1;
    return `href="${output}?v=${outputSHA256.slice(0, 12)}"`;
  });
  assert.equal(count, 1, `Expected one product wordmark in ${page}`);
  pages.push([page, updated]);
}
// Validate both placements before replacing any published file.
await copyFile(encoded, join(root, output));
await writeFile(join(root, 'assets/data/spectra-brand.json'), JSON.stringify(provenance, null, 2) + '\n');
for (const [page, updated] of pages) await writeFile(join(root, page), updated);
console.log(`Imported exact-pixel wordmark (${outputBytes.length} bytes).`);
