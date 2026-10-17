import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, mkdir, copyFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {root, listPublicFiles} from '../scripts/site-files.mjs';
import {appStoreDestination, downloadControl, renderDownloads} from '../scripts/render-downloads.mjs';

const text = file => readFile(join(root, file), 'utf8');
const configuration = JSON.parse(await text('content/app-store.json'));
const script = await text('assets/js/site-download.js');
const badge = await readFile(join(root, 'assets/images/download-on-the-app-store.svg'));

test('launch-day pages have one preserved official badge and current download controls', async () => {
  assert.equal(createHash('sha256').update(badge).digest('hex'), 'a26fc5b38380272c92e9019a2eb8b45542a66814b3e2b203772db8904b9fb99f');
  const output = await renderDownloads(configuration);
  for (const [file, html] of output) {
    assert.equal(await text(file), html, `${file}: stale download controls`);
    assert.equal(html.split('src="assets/images/download-on-the-app-store.svg"').length - 1, 1);
    assert.ok(html.includes('Preparing for App Store launch'));
    assert.doesNotMatch(html, /coming soon|coming to the app store|planned U\.S\.|preparing Spectra for release|when Spectra launches|App Store will (?:show|appear)|public.release availability is not yet promised/i);
    assert.doesNotMatch(html, /javascript:|\sonclick=|href="#download"|href="spectra\.html#download"/);
    assert.match(html, /width="180" height="60" alt="Download on the App Store"/);
  }
  assert.equal((await listPublicFiles()).includes('content/app-store.json'), false);
});

test('stub buttons install only a user-initiated exact notice, independent of motion', () => {
  const messages = [];
  const buttons = Array.from({length: 3}, () => ({disabled: true, listeners: {}, addEventListener(type, callback) { this.listeners[type] = callback; }}));
  runInNewContext(script, {document: {querySelectorAll(selector) {
    assert.equal(selector, 'button[data-app-store-stub]'); return buttons;
  }}, window: {alert: value => messages.push(value)}});
  assert.deepEqual(messages, []);
  for (const button of buttons) { assert.equal(button.disabled, false); button.listeners.click(); }
  assert.deepEqual(messages, Array(3).fill('Releasing Fall 2026'));
  assert.doesNotMatch(script, /fetch|localStorage|matchMedia|IntersectionObserver|location|window\.open/);
  runInNewContext(script, {document: {querySelectorAll: () => []}, window: {alert() { assert.fail('No automatic alert'); }}});
});

test('real store mode uses ordinary query-escaped links without script or a notice', () => {
  // A synthetic product URL exercises rendering only; no network request.
  const destination = appStoreDestination({appStoreURL: 'https://apps.apple.com/us/app/synthetic-release-qa/id1234567890?l=en-US&mt=8'});
  const control = downloadControl(destination, ['product', 'app-store-download', 'app-store-link', true]);
  assert.match(control, /<a class="app-store-link"/);
  assert.match(control, /href="https:\/\/apps\.apple\.com\/us\/app\/synthetic-release-qa\/id1234567890\?l=en-US&amp;mt=8"/);
  assert.match(control, /rel="noreferrer" referrerpolicy="no-referrer"/);
  assert.doesNotMatch(control, /button|disabled|noscript|data-app-store-stub|Releasing/);
});

test('one future URL converts all three controls to native links without changing badge count', async () => {
  const destination = 'https://apps.apple.com/app/id1234567890';
  const output = await renderDownloads({appStoreURL: destination});
  for (const [file, html] of output) {
    assert.equal(html.split(`href="${destination}"`).length - 1, file === 'index.html' ? 1 : 2);
    assert.equal(html.split('src="assets/images/download-on-the-app-store.svg"').length - 1, 1);
    assert.doesNotMatch(html, /<button[^>]*data-app-store-stub|Releasing Fall 2026/);
  }
});

test('unknown CLI arguments fail without mutating either marketing page', async () => {
  const before = await Promise.all(['index.html', 'spectra.html'].map(text));
  const result = spawnSync(process.execPath, ['scripts/render-downloads.mjs', '--unexpected'], {
    cwd: root, encoding: 'utf8', timeout: 10_000,
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.deepEqual(await Promise.all(['index.html', 'spectra.html'].map(text)), before);
});

test('configuration rejects unsafe origins, ambiguity, credentials and non-product paths', () => {
  assert.equal(appStoreDestination({appStoreURL: null}), null);
  assert.equal(appStoreDestination({appStoreURL: 'https://apps.apple.com/fr/app/spectra-r%C3%A9seau/id123'}),
    'https://apps.apple.com/fr/app/spectra-r%C3%A9seau/id123');
  for (const appStoreURL of ['', 42, 'http://apps.apple.com/app/id123', 'javascript:alert(1)',
    'https://apps.apple.com.evil.example/app/id123', 'https://user:secret@apps.apple.com/app/id123',
    'https://apps.apple.com:8443/app/id123', 'https://apps.apple.com/app/id123#reviews',
    'https://apps.apple.com/', 'https://apps.apple.com/app/id0', ' https://apps.apple.com/app/id123',
    'https://apps.apple.com/app/spectra%2Fother/id123', 'https://apps.apple.com/app/id12\n3']) {
    assert.throws(() => appStoreDestination({appStoreURL}));
  }
  for (const value of [{}, [], null, {appStoreURL: null, extra: 'unreviewed'}]) assert.throws(() => appStoreDestination(value));
});

test('renderer fails closed on missing, duplicate or stale control and script markers', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'spectra-download-fixture-'));
  await mkdir(join(directory, 'assets/css'), {recursive: true});
  await mkdir(join(directory, 'assets/js'), {recursive: true});
  for (const file of ['assets/css/site.css', 'assets/js/site-download.js', 'index.html', 'spectra.html']) await copyFile(join(root, file), join(directory, file));
  const original = await text('index.html');
  for (const mutated of [original.replace('<!-- spectra-download:home -->', '<!-- missing -->'),
    original.replace('<!-- spectra-download:home -->', '<!-- spectra-download:home --><!-- /spectra-download:home --><!-- spectra-download:home -->'),
    original.replace(/<script src="assets\/js\/site-download\.js[^>]*><\/script>/, '')]) {
    await writeFile(join(directory, 'index.html'), mutated);
    await assert.rejects(renderDownloads(configuration, directory));
  }
});
