import { readFile, writeFile, copyFile, mkdtemp, rm, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { root } from './site-files.mjs';

// One approved replacement, not a generic way to relabel old images. The Guide
// correction in 1086 does not alter the pictured 1084 Monitor interface.
export const monitorCapture = Object.freeze({
  appVersion: '1.1.0', bundleBuild: '1084', buildIdentifier: '1B1084',
  appSourceCommit: '6bc11baa2bc10e42735f2728020d6d2d7be763b2',
  runtimeSourceCommit: '0e1cdfae8964f3afb626b1ccafbdb9ff0fe786cb',
  bundleIdentifier: 'dev.arcsignal.Spectra', minimumOSVersion: '27.0',
  bundleInfoPlistSHA256: '93d5fa185d2e8a1275c24a614f841bc8f70d8d455992434169778e124b3dd871',
  captureDevice: 'iPhone 17 Pro Max',
  captureRuntime: 'iOS 27.0 Simulator; Xcode 27.1; Build version 27A9275',
  sourceSHA256: '662a9b734156753ee6ade766dcf541eebc2d6a9f7f188666ef362458639f2029',
});
const ids = ['01-quick-check', '02-smart-glasses', '03-magnetic-sweep', '05-monitor'];
const retainedHashes = [
  '4422fc5da169b2500e72d3deea230cb8723a8884a1ad92fa0d784a95d4703e88',
  '4cb74f7556ae4412edfa127ce763fa8083010c882ef60ea95c7e120bcd2543bd',
  '64629dead2e2f832bdfec7b6018d1ad9224493408cd985e4b0a581337094dd2a',
];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const requireValue = (condition, message) => { if (!condition) throw new Error(`Invalid Monitor capture: ${message}`); };

export function validateMonitorPackage({ build, receipt, manifest, provenance, png, plist }) {
  const expected = monitorCapture;
  for (const key of ['appVersion', 'bundleBuild', 'buildIdentifier', 'runtimeSourceCommit',
    'bundleIdentifier', 'minimumOSVersion', 'bundleInfoPlistSHA256']) {
    requireValue(build[key] === expected[key], key);
  }
  requireValue(build.platform === 'iOS Simulator' && build.schemaVersion === 1, 'capture platform');
  requireValue(manifest.appSourceCommit === expected.appSourceCommit
    && manifest.nativeCaptureFilesModified === false && manifest.generatedAppInterface === false,
  'native, synthetic composition provenance');
  requireValue(manifest.captureDevice === expected.captureDevice && manifest.captureRuntime === expected.captureRuntime,
    'device/runtime');
  const monitor = manifest.items?.filter(item => item.sourceItemID === '05-monitor');
  requireValue(monitor?.length === 1 && monitor[0].id === '06-monitor' && monitor[0].appearance === 'dark'
    && monitor[0].exampleDisclosure === 'Example data · Actual app interface'
    && monitor[0].capture.path === 'en-US/captures/05-monitor.png'
    && monitor[0].capture.sha256 === expected.sourceSHA256
    && monitor[0].capture.width === 1320 && monitor[0].capture.height === 2868, 'composition source');
  requireValue(receipt.workingSourceCommit === expected.appSourceCommit
    && receipt.acceptedRuntimeSourceCommit === expected.runtimeSourceCommit
    && receipt.acceptedRuntimeInputMismatches?.length === 0
    && receipt.finalSourceRecheck?.workingAndStagedRuntimeDiffsClean === true
    && receipt.finalSourceRecheck?.actualInfoPlistSHA256Unchanged === true
    && receipt.captureEvidence?.passedTestCount === 16 && receipt.captureEvidence.failedTestCount === 0
    && receipt.captureEvidence.skippedTestCount === 0, 'source and test receipt');
  const actual = receipt.actualCaptureApp;
  requireValue(actual?.version === expected.appVersion && actual.numericBuild === expected.bundleBuild
    && actual.publicBuild === expected.buildIdentifier && actual.bundleIdentifier === expected.bundleIdentifier
    && actual.infoPlistSHA256 === expected.bundleInfoPlistSHA256 && actual.platform === 'iphonesimulator',
  'actual capture binary');
  requireValue(sha(plist) === expected.bundleInfoPlistSHA256, 'actual Info.plist hash');
  requireValue(provenance.workingSourceCommit === expected.appSourceCommit
    && provenance.runtimeSourceCommit === expected.runtimeSourceCommit && provenance.exampleData === true,
  'attachment source');
  const attachments = provenance.captures?.filter(item => item.id === '05-monitor');
  requireValue(attachments?.length === 1 && attachments[0].sha256 === expected.sourceSHA256
    && attachments[0].testIdentifier === 'AppStoreCaptureTests/testCaptureMonitor()'
    && attachments[0].deviceName === 'Spectra App Store Capture', 'native test attachment');
  requireValue(png.length > 24 && png.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
    && png.readUInt32BE(16) === 1320 && png.readUInt32BE(20) === 2868
    && sha(png) === expected.sourceSHA256, 'native PNG hash/dimensions');
}

function validateCurrentGallery(current) {
  requireValue([1, 2].includes(current.schemaVersion) && current.platform === 'iOS'
    && current.appVersion === '1.0.0' && current.bundleBuild === '1073' && current.buildIdentifier === '1A1073'
    && current.appSourceCommit === '5259e8ea0a0814c5272f8e0383cec7ca27984caf', 'retained default producer');
  requireValue(JSON.stringify(current.items.map(item => item.id)) === JSON.stringify(ids), 'gallery order');
  for (const [index, hash] of retainedHashes.entries()) {
    requireValue(current.items[index].outputSHA256 === hash && !current.items[index].captureProducer,
      `unchanged ${ids[index]} producer/hash`);
  }
}

export function replaceMonitorRecord(current, replacement) {
  validateCurrentGallery(current);
  const { sourceSHA256, ...producer } = monitorCapture;
  requireValue(replacement.id === '05-monitor' && replacement.output === 'assets/images/spectra-monitor.webp'
    && replacement.source === 'en-US/captures/05-monitor.png'
    && replacement.sourcePackage === 'submission-1.1.0-en-US'
    && replacement.sourceSHA256 === sourceSHA256 && replacement.width === 1320 && replacement.height === 2868
    && replacement.appearance === 'dark' && /^[a-f0-9]{64}$/.test(replacement.outputSHA256)
    && /^[a-f0-9]{64}$/.test(replacement.pixelSHA256)
    && JSON.stringify(replacement.captureProducer) === JSON.stringify(producer), 'replacement producer/record');
  return { ...current, schemaVersion: 2, items: [...current.items.slice(0, 3), replacement] };
}

export async function importMonitorCapture(appRoot) {
  const packageRoot = join(resolve(appRoot), 'docs/release/app-store-assets/submission-1.1.0-en-US');
  const json = async path => JSON.parse(await readFile(join(packageRoot, path), 'utf8'));
  // Fixed paths and resolved-path checks forbid a substituted out-of-package source.
  const source = join(packageRoot, 'en-US/captures/05-monitor.png');
  requireValue(await realpath(source) === source, 'capture path is a symlink');
  const input = { build: await json('capture-build.json'), receipt: await json('source-receipt.json'),
    manifest: await json('en-US/composition-manifest.json'), provenance: await json('en-US/capture-provenance.json'),
    png: await readFile(source), plist: await readFile(join(packageRoot, 'capture-app-Info.plist')) };
  validateMonitorPackage(input);
  const run = (command, args) => {
    const result = spawnSync(command, args, { maxBuffer: 32 * 1024 * 1024 });
    if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message ?? result.stderr.toString()}`);
    return result.stdout;
  };
  for (const commit of [monitorCapture.appSourceCommit, monitorCapture.runtimeSourceCommit]) {
    run('git', ['-C', resolve(appRoot), 'cat-file', '-e', `${commit}^{commit}`]);
  }
  const manifestPath = join(root, 'assets/data/spectra-screenshots.json');
  const current = JSON.parse(await readFile(manifestPath, 'utf8'));
  validateCurrentGallery(current); // Validate before encoding or publication.
  const retained = await Promise.all(current.items.slice(0, 3).map(async item => {
    requireValue(/^assets\/images\/spectra-[a-z-]+\.webp$/.test(item.output), 'retained output path');
    const bytes = await readFile(join(root, item.output));
    requireValue(sha(bytes) === item.outputSHA256, 'retained file hash');
    return bytes;
  }));
  const directory = await mkdtemp(join(tmpdir(), 'spectra-monitor-web-'));
  try {
    const encoded = join(directory, 'monitor.webp');
    run('cwebp', ['-quiet', '-lossless', '-exact', '-q', '100', '-m', '6', '-metadata', 'icc', source, '-o', encoded]);
    const pixelSHA256 = sha(run('magick', [source, '-alpha', 'off', '-depth', '8', 'rgba:-']));
    requireValue(sha(run('magick', [encoded, '-alpha', 'off', '-depth', '8', 'rgba:-'])) === pixelSHA256,
      'compression changed native pixels');
    const output = 'assets/images/spectra-monitor.webp';
    const outputSHA256 = sha(await readFile(encoded));
    const { sourceSHA256, ...captureProducer } = monitorCapture;
    const replacement = { id: '05-monitor', source: 'en-US/captures/05-monitor.png', sourceSHA256,
      output, outputSHA256, pixelSHA256, width: 1320, height: 2868, appearance: 'dark',
      sourcePackage: 'submission-1.1.0-en-US', captureProducer };
    const updated = replaceMonitorRecord(current, replacement);
    let html = await readFile(join(root, 'spectra.html'), 'utf8');
    let references = 0;
    html = html.replace(/\b(href|src)="([^"]+)"/g, (tag, attribute, value) => {
      if (value.split('?')[0] !== output) return tag;
      requireValue(value === output || /^v=[a-f0-9]{12}$/.test(value.split('?').slice(1).join('?')), 'cache URL');
      references += 1;
      return `${attribute}="${output}?v=${outputSHA256.slice(0, 12)}"`;
    });
    requireValue(references === 2, 'Monitor references');
    // Every validation and lossless comparison precedes the three scoped writes.
    await copyFile(encoded, join(root, output));
    await writeFile(manifestPath, JSON.stringify(updated, null, 2) + '\n');
    await writeFile(join(root, 'spectra.html'), html);
    for (const [index, item] of current.items.slice(0, 3).entries()) {
      requireValue((await readFile(join(root, item.output))).equals(retained[index]), 'unrelated image changed');
    }
    console.log(`Imported only Monitor from ${monitorCapture.buildIdentifier}; three original iPhone images preserved byte-for-byte.`);
  } finally { await rm(directory, { recursive: true, force: true }); }
}
