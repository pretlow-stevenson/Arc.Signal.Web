import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { root } from '../scripts/site-files.mjs';
import { replaceMonitorRecord, monitorCapture, validateMonitorPackage } from '../scripts/import-spectra-monitor.mjs';

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

test('single Monitor replacement preserves unrelated records and rejects producer/hash/order drift', async () => {
  const current = JSON.parse(await readFile(join(root, 'assets/data/spectra-screenshots.json'), 'utf8'));
  const replacement = { ...current.items.at(-1), source: 'en-US/captures/05-monitor.png',
    sourcePackage: 'submission-1.1.0-en-US', sourceSHA256: monitorCapture.sourceSHA256,
    captureProducer: { ...monitorCapture } };
  delete replacement.captureProducer.sourceSHA256;
  const original = structuredClone(current);
  const updated = replaceMonitorRecord(current, replacement);
  assert.deepEqual(current, original, 'Do not mutate the input manifest');
  assert.deepEqual(updated.items.slice(0, 3), current.items.slice(0, 3));
  for (const key of ['appVersion', 'bundleBuild', 'buildIdentifier', 'appSourceCommit']) {
    assert.equal(updated[key], current[key], `Preserve default ${key}`);
    assert.throws(() => replaceMonitorRecord({ ...current, [key]: 'wrong' }, replacement));
  }
  for (const index of [0, 1, 2]) {
    const changed = structuredClone(current);
    changed.items[index].outputSHA256 = 'a'.repeat(64);
    assert.throws(() => replaceMonitorRecord(changed, replacement));
    const relabeled = structuredClone(current);
    relabeled.items[index].captureProducer = replacement.captureProducer;
    assert.throws(() => replaceMonitorRecord(relabeled, replacement));
  }
  assert.throws(() => replaceMonitorRecord({ ...current, items: current.items.toReversed() }, replacement));
  for (const patch of [{ id: '01-quick-check' }, { sourceSHA256: 'a'.repeat(64) }, { width: 1206 },
    { sourcePackage: '../other' }, { captureProducer: { ...replacement.captureProducer, bundleBuild: '1086' } }]) {
    assert.throws(() => replaceMonitorRecord(current, { ...replacement, ...patch }));
  }
});

test('single Monitor import rejects absent/wrong source provenance before public writes', async t => {
  const before = await Promise.all(['spectra.html', 'assets/data/spectra-screenshots.json',
    'assets/images/spectra-overview.webp', 'assets/images/spectra-smart-glasses.webp',
    'assets/images/spectra-area-sweep.webp', 'assets/images/spectra-monitor.webp']
    .map(async file => [file, await readFile(join(root, file))]));
  const directory = await mkdtemp(join(tmpdir(), 'arc-signal-monitor-input-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [join(root, 'scripts/import-spectra-captures.mjs'), '--monitor-only', directory]);
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stdout.toString(), /Imported/);
  for (const patch of [{ appVersion: '1.0.0' }, { bundleBuild: '1086' }, { buildIdentifier: '1B1086' },
    { runtimeSourceCommit: 'a'.repeat(40) }, { bundleIdentifier: 'com.arcsignal.Spectra' },
    { bundleInfoPlistSHA256: 'a'.repeat(64) }]) {
    assert.throws(() => validateMonitorPackage({ build: { ...monitorCapture, ...patch } }), /Invalid Monitor capture/);
  }
  for (const [file, bytes] of before) assert.deepEqual(await readFile(join(root, file)), bytes, file);
});
