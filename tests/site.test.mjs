import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { root, documents, listPublicFiles } from '../scripts/site-files.mjs';
import { renderGuide } from '../scripts/render-guide.mjs';

const files = await listPublicFiles();
const pages = new Map(await Promise.all(documents.map(async name => [name, await readFile(join(root, name), 'utf8')])));
const css = await readFile(join(root, 'assets/css/site.css'), 'utf8');
const ids = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);

test('documents have descriptive metadata, one main landmark and one h1', () => {
  for (const [name, html] of pages) {
    assert.match(html, /^<!doctype html>/i, name);
    assert.match(html, /<html lang="en">/, name);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/, name);
    assert.match(html, /<title>[^<]*Arc Signal[^<]*<\/title>/, name);
    assert.equal([...html.matchAll(/<main\b/g)].length, 1, name);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, name);
    assert.equal(new Set(ids(html)).size, ids(html).length, `${name}: duplicate ID`);
  }
});

test('all local links, fragments, images, styles and font preloads resolve', () => {
  for (const [name, html] of pages) {
    for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
      assert.notEqual(value, '', `${name}: empty link`);
      // The launch brief requests this exact temporary download URL. Its sole
      // use on the App Store anchor is checked separately below.
      if (name === 'spectra.html' && value === 'http://') continue;
      if (value === 'mailto:support@arcsignal.app' && name === 'guide.html') continue;
      if (value.startsWith('https://')) {
        assert.ok(value.startsWith('https://arcsignal.app/'), `Unexpected external resource: ${value}`);
        continue;
      }
      assert.ok(!/^(?:[a-z]+:|\/\/)/i.test(value), `Unsupported URL: ${value}`);
      const [path, fragment] = value.split('#');
      const target = path === '/' ? 'index.html' : path.replace(/^\//, '') || name;
      assert.ok(files.includes(target), `${name}: missing ${target}`);
      if (fragment !== undefined) {
        assert.ok(fragment && ids(pages.get(target) ?? '').includes(fragment), `${name}: missing #${fragment}`);
      }
    }
    for (const [, labels] of html.matchAll(/\baria-(?:labelledby|describedby)="([^"]+)"/g)) {
      for (const id of labels.split(/\s+/)) assert.ok(ids(html).includes(id), `${name}: missing accessible label ${id}`);
    }
  }
  for (const [, path] of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    const relative = posix.normalize(posix.join('assets/css', path));
    assert.ok(files.includes(relative), `Missing CSS asset: ${relative}`);
  }
});

test('no scripts, embedded third-party content, forms, trackers or remote fonts', () => {
  for (const [name, html] of pages) {
    assert.doesNotMatch(html, /<(?:script|iframe|object|embed|form)\b|\son[a-z]+\s*=/i, name);
    assert.match(html, /default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'/, name);
    assert.match(html, /base-uri 'none'; form-action 'none'; object-src 'none'/, name);
    assert.doesNotMatch(html, /googletagmanager|google-analytics|fonts\.google|kmeans|sigint communications/i, name);
  }
  assert.doesNotMatch(css, /@import|https?:|data:/i);
});

test('App Store download uses the requested placeholder and states supported devices', () => {
  const html = pages.get('spectra.html');
  const download = html.match(/<a\b[^>]*\bid="app-store-download"[^>]*>[\s\S]*?<\/a>/)?.[0];
  assert.ok(download, 'Missing App Store download anchor');
  assert.match(download, /\bhref="http:\/\/"/);
  assert.match(download, /<img\b[^>]*src="assets\/images\/download-on-the-app-store\.svg"/);
  assert.doesNotMatch(download, /\bdisabled\b|aria-disabled="true"|tabindex="-1"/);
  assert.equal([...html.matchAll(/\b(?:href|src)="http:\/\/"/g)].length, 1, 'Placeholder must be confined to the download link');
  assert.match(html, /Now available on the App Store/);
  assert.match(html, /Apple iPhone 16\/17 running iOS 27/);
  assert.match(html, /id="compatibility"[^>]*>Apple iPhone 16\/17 · iOS 27<\/p>/);
  assert.doesNotMatch(html, /iPhone 16 and iPhone 17|iPhone 18/);
  assert.doesNotMatch(html, /coming soon|pre-?release|prelaunch|isn’t available|not available|at launch|no release date/i);
});

test('marketing retains the important measurement and identity limits', () => {
  const html = pages.get('spectra.html');
  for (const text of ['Arc Signal LLC', 'joined Wi-Fi network', 'not an exact distance or direction', 'cannot guarantee', 'Foreground', 'possible or probable', 'without pairing with or connecting']) {
    assert.ok(html.includes(text), `Missing qualification: ${text}`);
  }
  assert.match(html, /<summary>Can Spectra tell me a room is safe\?<\/summary><p>No\./);
});

test('keyboard access, reduced motion, responsive layouts and image dimensions remain present', () => {
  for (const html of pages.values()) {
    assert.match(html, /class="skip-link" href="#main"/);
    assert.match(html, /<main[^>]*id="main"[^>]*tabindex="-1"/);
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(tag, /\balt="[^"]+"/);
      assert.match(tag, /\bwidth="\d+"/);
      assert.match(tag, /\bheight="\d+"/);
    }
  }
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(css, /outline:\s*none[^}]*:focus-visible/);
});

test('body and action colors have sufficient contrast on their intended surfaces', () => {
  const luminance = hex => {
    const rgb = hex.match(/[\da-f]{2}/gi).map(channel => parseInt(channel, 16) / 255)
      .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  for (const [foreground, background] of [['535a65', 'f7f7f5'], ['535a65', 'e1ecf8'], ['075bb5', 'eef2f6'], ['b6c4d4', '111820'], ['ffffff', '075bb5'], ['295e4f', 'e8f0eb'], ['535a65', 'e4ece5'], ['ffffff', '295e4f']]) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${foreground} on ${background}`);
  }
});

test('fonts are real WOFF2 files with retained redistribution licenses', async () => {
  for (const font of ['inter-latin', 'bodoni-moda-latin']) {
    assert.equal((await readFile(join(root, `assets/fonts/${font}.woff2`))).subarray(0, 4).toString(), 'wOF2');
  }
  for (const name of ['Inter', 'Bodoni-Moda']) {
    assert.match(await readFile(join(root, `assets/fonts/${name}-OFL.txt`), 'utf8'), /SIL OPEN FONT LICENSE Version 1.1/);
  }
});

test('app screenshots have matching dimensions and explicit simulated-data disclosure', async () => {
  const html = pages.get('spectra.html');
  assert.match(html, /Readings are simulated examples, not evidence of nearby devices/);
  for (const name of ['spectra-overview', 'spectra-area-sweep']) {
    const image = await readFile(join(root, `assets/images/${name}.png`));
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    assert.equal(image.readUInt32BE(16), 1206);
    assert.equal(image.readUInt32BE(20), 2622);
    assert.match(html, new RegExp(`<img src="assets/images/${name}\\.png"[^>]*loading="lazy"`));
  }
});

test('public bundle excludes development files and remains lightweight', async () => {
  assert.ok(files.every(name => !/(^|\/)(?:\.git|tests|scripts|node_modules|\.env)(\/|$)/.test(name)));
  const bytes = await Promise.all(files.map(async name => (await stat(join(root, name))).size));
  assert.ok(bytes.reduce((sum, value) => sum + value, 0) < 3_000_000, 'Public assets exceed the 3 MB budget for two products');
  assert.equal((await readFile(join(root, 'CNAME'), 'utf8')).trim(), 'arcsignal.app');
  assert.match(await readFile(join(root, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/arcsignal\.app\/<\/loc>/);
});

test('product pages are reachable, independently indexed, and have active navigation', async () => {
  const home = pages.get('index.html');
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
  const descriptions = new Set();
  for (const name of ['index.html', 'spectra.html', 'seamless.html']) {
    const html = pages.get(name);
    const url = `https://arcsignal.app/${name === 'index.html' ? '' : name}`;
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), name);
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`), name);
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), name);
    descriptions.add(html.match(/<meta name="description" content="([^"]+)"/)?.[1]);
    if (name !== 'index.html') {
      assert.ok(home.includes(`href="${name}"`), name);
      assert.ok(html.includes(`href="${name}" aria-current="page"`), name);
    }
  }
  assert.equal(descriptions.size, 3, 'Each page needs its own search description');
  assert.ok(!descriptions.has(undefined));
  assert.match(home, /Security tools &amp; everyday utilities/);
  assert.match(pages.get('404.html'), /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(sitemap, /404/);
  for (const [, value] of pages.get('404.html').matchAll(/(?:href|src)="([^"]+)"/g)) {
    assert.ok(value.startsWith('/') || value.startsWith('#') || value.startsWith('https://'), `404 resource must work at any depth: ${value}`);
  }
});

test('Seamless describes the verified workflow, release status, and privacy limits', () => {
  const html = pages.get('seamless.html');
  for (const text of ['2–20', 'original pixel width', 'PNG', 'uncertain', 'Nothing is silently skipped', 'iOS 18 or later', 'Coming soon', 'iCloud', 'according to your settings', 'fictional sample content']) {
    assert.ok(html.includes(text), `Missing Seamless constraint: ${text}`);
  }
  assert.doesNotMatch(html, /href="http:\/\/"|Download on the App Store|Now available|iPhone 16\/17|iOS 27/);
  assert.doesNotMatch(pages.get('index.html'), /href="http:\/\/"/);
});

test('Seamless preview images retain source dimensions', async () => {
  for (const name of ['seamless-sequence', 'seamless-result']) {
    const image = await readFile(join(root, `assets/images/${name}.png`));
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    assert.equal(image.readUInt32BE(16), 1206);
    assert.equal(image.readUInt32BE(20), 2622);
    assert.ok(pages.get('seamless.html').includes(`src="assets/images/${name}.png" width="1206" height="2622"`));
  }
});

test('Spectra imagery and mode descriptions match current radio and magnetic workflows', () => {
  const html = pages.get('spectra.html');
  const quickCheck = html.match(/<article><p class="step-label">01 \/ Quick Check[\s\S]*?<\/article>/)?.[0];
  assert.ok(quickCheck);
  assert.match(quickCheck, /Bluetooth broadcasts, with optional local-network observations/);
  assert.match(quickCheck, /No magnetic measurement or calibration/);
  assert.match(html, /02 \/ Area Sweep/);
  assert.match(html, /Magnetic measurement is available in Area Sweep/);
  assert.match(html, /focused Smart Glasses check/);
  assert.match(html, /Available in Area Sweep\. See actual field readings/);
  assert.doesNotMatch(html, /Optional detector sound|Available in Area Sweep and Monitor/);
  assert.ok(!files.includes('assets/images/spectra-home.png'));
  assert.ok(!files.includes('assets/images/spectra-magnetic.png'));
  for (const page of [html, pages.get('index.html')]) {
    assert.doesNotMatch(page, /Room Sweep|simulator-preview notice|Use Lens|Sound Check|Camera frames and audio/);
  }
});

test('website Guide is generated from all twelve native topics with release and support context', async () => {
  const payload = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  assert.equal(payload.appVersion, '1.0.0');
  assert.equal(payload.build, '1000');
  assert.equal(payload.supportEmail, 'support@arcsignal.app');
  assert.equal(payload.articles.length, 12);
  assert.equal(pages.get('guide.html'), await renderGuide(), 'Stale generated Guide');
  for (const {content} of payload.articles) assert.ok(ids(pages.get('guide.html')).includes(content.id));
  assert.match(pages.get('guide.html'), /not anonymous/);
  assert.match(pages.get('guide.html'), /mailto:support@arcsignal.app/);
  assert.match(pages.get('guide.html'), /Nothing is attached or sent automatically/);
});
