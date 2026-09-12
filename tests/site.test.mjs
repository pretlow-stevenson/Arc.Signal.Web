import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { createHash } from 'node:crypto';
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
      if (value === 'mailto:support@arcsignal.app' && ['guide.html', 'spectra-privacy.html'].includes(name)) continue;
      if (name === 'spectra-privacy.html' && value === 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement') continue;
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

test('unreleased download is a truthful status rather than a broken link', () => {
  const html = pages.get('spectra.html');
  assert.match(html, /<p id="app-store-download" class="status">App Store release coming soon<\/p>/);
  assert.match(html, /id="compatibility"[^>]*>iPhone 16 or later · iOS 27 or later<\/p>/);
  for (const page of [html, pages.get('index.html')]) {
    assert.doesNotMatch(page, /href="http:\/\/"|Available now|Now available|iPhone 16\/17/);
  }
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
  const provenance = JSON.parse(await readFile(join(root, 'assets/data/spectra-screenshots.json'), 'utf8'));
  assert.equal(provenance.exampleData, true);
  assert.match(provenance.appSourceCommit, /^[a-f0-9]{40}$/);
  assert.match(provenance.transformation, /Lossless WebP/);
  assert.deepEqual(provenance.items.map(item => item.id), ['01-quick-check', '02-smart-glasses', '03-magnetic-sweep', '05-monitor']);
  for (const item of provenance.items) {
    assert.match(item.output, /^assets\/images\/spectra-[a-z-]+\.webp$/);
    const image = await readFile(join(root, item.output));
    assert.equal(image.subarray(0, 4).toString(), 'RIFF');
    assert.equal(image.subarray(8, 12).toString(), 'WEBP');
    assert.equal(createHash('sha256').update(image).digest('hex'), item.outputSHA256);
    assert.match(item.sourceSHA256, /^[a-f0-9]{64}$/);
    assert.match(item.pixelSHA256, /^[a-f0-9]{64}$/);
    let size;
    for (let offset = 12; offset + 8 <= image.length;) {
      const type = image.subarray(offset, offset + 4).toString();
      const length = image.readUInt32LE(offset + 4), start = offset + 8;
      assert.ok(start + length <= image.length, 'Truncated image chunk');
      if (type === 'VP8X') size = [image.readUIntLE(start + 4, 3) + 1, image.readUIntLE(start + 7, 3) + 1];
      if (type === 'VP8L' && !size) {
        assert.equal(image[start], 0x2f);
        const bits = image.readUInt32LE(start + 1);
        size = [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
      }
      offset = start + length + (length % 2);
    }
    assert.deepEqual(size, [1320, 2868]);
    assert.equal(item.width, 1320); assert.equal(item.height, 2868);
    assert.ok(html.includes(`<img src="${item.output}" width="1320" height="2868"`));
    assert.ok(html.includes(`href="${item.output}"`));
  }
  assert.ok(!files.includes('assets/images/spectra-overview.png'));
  assert.ok(!files.includes('assets/images/spectra-area-sweep.png'));
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
  assert.match(html, /Focused glasses and watch checks/);
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
  assert.equal(payload.buildIdentifier, '1A1000');
  assert.equal(payload.minimumOS, 'iOS 27 or later');
  assert.equal(payload.supportedHardware, 'iPhone 16 or later');
  assert.equal(payload.privacyPolicyURL, 'https://arcsignal.app/spectra-privacy.html');
  assert.equal(payload.supportEmail, 'support@arcsignal.app');
  assert.equal(payload.articles.length, 12);
  assert.equal(pages.get('guide.html'), await renderGuide(), 'Stale generated Guide');
  for (const {content} of payload.articles) assert.ok(ids(pages.get('guide.html')).includes(content.id));
  assert.match(pages.get('guide.html'), /not anonymous/);
  assert.match(pages.get('guide.html'), /mailto:support@arcsignal.app/);
  assert.match(pages.get('guide.html'), /Nothing is attached or sent automatically/);
  assert.match(pages.get('guide.html'), /Build 1A1000/);
  assert.match(pages.get('guide.html'), /forced close, crash, or shutdown/);
});

test('privacy policy is public, linked, readable without scripts, and explains data choices', async () => {
  const policy = pages.get('spectra-privacy.html');
  assert.match(policy, /Effective September 12, 2026/);
  assert.match(policy, /<link rel="canonical" href="https:\/\/arcsignal.app\/spectra-privacy.html">/);
  for (const text of ['Arc Signal LLC', 'support@arcsignal.app', '50 sessions', '32 MiB', 'recovery copies',
      'Precise Location', 'Reduced identifying information', 'not anonymous', 'GitHub Pages', 'email provider',
      'do not sell', 'under 13', 'iOS file protection', 'camera images', 'geographic coordinates', 'privacy regulator']) {
    assert.ok(policy.includes(text), `Missing privacy explanation: ${text}`);
  }
  assert.doesNotMatch(policy, /<details\b/, 'Policy provisions remain readable without opening disclosures');
  for (const name of ['index.html', 'spectra.html', 'guide.html']) {
    assert.ok(pages.get(name).includes('href="spectra-privacy.html"'), `Missing policy link: ${name}`);
  }
  assert.match(await readFile(join(root, 'sitemap.xml'), 'utf8'), /https:\/\/arcsignal.app\/spectra-privacy.html/);
});
