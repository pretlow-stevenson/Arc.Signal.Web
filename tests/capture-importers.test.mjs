import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { root } from '../scripts/site-files.mjs';

// Provenance must fail before Git/image tools or any public files are changed.
// These fixtures contain no private captures and require no image dependencies.
test('capture importers reject missing or contradictory identity before publication', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'arc-signal-capture-input-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const phone = join(directory, 'docs/release/app-store-assets/en-US');
  const watch = join(directory, 'docs/release/watch-assets/en-US');
  await mkdir(phone, { recursive: true });
  await mkdir(watch, { recursive: true });
  const before = await readFile(join(root, 'spectra.html'));
  const sha = 'a'.repeat(40);
  await writeFile(join(phone, 'manifest.json'), JSON.stringify({ appSourceCommit: sha, exampleData: true }));
  const validPhone = { appSourceCommit: sha, appVersion: '1.0.0', bundleBuild: '1020', buildIdentifier: '1A1020',
    bundleIdentifier: 'com.arcsignal.Spectra', minimumOSVersion: '27.0', bundleInfoPlistSHA256: 'b'.repeat(64) };
  for (const patch of [{ appSourceCommit: 'c'.repeat(40) }, { buildIdentifier: '1A1019' },
    { minimumOSVersion: '26.0' }, { bundleInfoPlistSHA256: undefined }]) {
    await writeFile(join(phone, 'capture-build.json'), JSON.stringify({ ...validPhone, ...patch }));
    const result = spawnSync(process.execPath, [join(root, 'scripts/import-spectra-captures.mjs'), directory]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr.toString(), /Invalid captured build provenance/);
  }
  const validWatch = { schemaVersion: 1, exampleData: true, appSourceCommit: sha, appVersion: '1.0.0',
    bundleBuild: '1020', buildIdentifier: '1A1020', captureDevice: 'Apple Watch SE 3',
    captureRuntime: 'watchOS 27.0 Simulator', items: [] };
  for (const patch of [{ exampleData: false }, { buildIdentifier: '1A1019' },
    { captureDevice: undefined }, { captureRuntime: 'watchOS 26.0' }]) {
    await writeFile(join(watch, 'manifest.json'), JSON.stringify({ ...validWatch, ...patch }));
    const result = spawnSync(process.execPath, [join(root, 'scripts/import-spectra-watch-captures.mjs'), directory]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr.toString(), /Invalid Watch capture provenance/);
  }
  assert.deepEqual(await readFile(join(root, 'spectra.html')), before);
});
