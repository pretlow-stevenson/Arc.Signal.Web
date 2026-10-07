import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { root, documents, listPublicFiles } from '../scripts/site-files.mjs';
import { renderGuide } from '../scripts/render-guide.mjs';
import { guideRuns, guidePlainText, renderGuideInline } from '../scripts/guide-inline.mjs';

const files = await listPublicFiles();
const pages = new Map(await Promise.all(documents.map(async name => [name, await readFile(join(root, name), 'utf8')])));
const css = await readFile(join(root, 'assets/css/site.css'), 'utf8');
const motionSource = await readFile(join(root, 'assets/js/site-motion.js'), 'utf8');
const revision = value => createHash('sha256').update(value).digest('hex').slice(0, 12);
const ids = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
// Content assertions ignore only our exact, noninteractive UI-label wrapper.
// Structural, URL and security assertions continue to inspect original HTML.
const prose = html => html.replace(/<b class="ui-label">([^<>]*)<\/b>/g, '$1');
const articleProse = article => [article.title, article.takeaway, article.important,
  ...article.steps, ...(article.sections.concat(article.technicalSections))
    .flatMap(section => [section.title, section.body])].map(guidePlainText).join('\n');
// Accurate, unchanged platform-specific screens may retain their actual older
// capture identity only with a review pinned to this exact Guide release.
function assertCaptureIdentity(value) {
  assert.match(value.bundleBuild, /^[1-9][0-9]{3}$/);
  assert.match(value.buildIdentifier, /^[1-9][0-9]{0,3}[A-Z]{1,3}[1-9][0-9]{3}$/);
  assert.ok(value.buildIdentifier.endsWith(value.bundleBuild));
  assert.match(value.appSourceCommit, /^[a-f0-9]{40}$/);
}
function assertCaptureReview(review, provenance, guide) {
  assert.equal(review.schemaVersion, 2);
  assert.equal(review.appVersion, guide.appVersion);
  assert.equal(provenance.appVersion, guide.appVersion);
  assert.equal(review.reviewedGuideBuild, guide.build);
  assert.equal(review.reviewedGuideBuildIdentifier, guide.buildIdentifier);
  assert.match(review.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(review.reason.length > 100);
  assert.ok(['iOS', 'watchOS'].includes(provenance.platform));
  const source = review.sources[provenance.platform];
  assertCaptureIdentity(provenance);
  assertCaptureIdentity(source);
  const train = guide.buildIdentifier.slice(0, -guide.build.length);
  assert.equal(provenance.buildIdentifier, train + provenance.bundleBuild);
  for (const key of ['bundleBuild', 'buildIdentifier', 'appSourceCommit']) {
    assert.equal(source[key], provenance[key], `${provenance.platform}: reviewed ${key}`);
  }
}
// Exact owner-approved program URL. Do not allow arbitrary tracking destinations
// or add visitor/scan identifiers to these public, campaign-level parameters.
const nordAffiliateHref = 'https://go.nordvpn.net/aff_c?offer_id=15&amp;aff_id=156788&amp;url_id=902';
const nordPrivacyURL = 'https://my.nordaccount.com/legal/privacy-policy/';
const editorialLinks = new Set([
  'https://ssd.eff.org/module/vpn.html',
  'https://consumer.ftc.gov/articles/are-public-wi-fi-networks-safe-what-you-need-know',
  'https://www.cisa.gov/secure-our-world',
]);

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
    for (const [attribute, value] of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
      assert.notEqual(value, '', `${name}: empty link`);
      if (attribute.startsWith('href=') && ['guide.html', 'spectra-privacy.html'].includes(name)
        && ['mailto:support@arcsignal.zendesk.com', 'https://arcsignal.zendesk.com'].includes(value)) continue;
      if (name === 'spectra-privacy.html' && attribute.startsWith('href=')
        && value === 'https://www.zendesk.com/company/agreements-and-terms/privacy-notice/') continue;
      if (name === 'spectra-privacy.html' && attribute.startsWith('href=')
        && value === 'https://www.apple.com/legal/privacy/data/en/apple-maps/') continue;
      if (name === 'spectra-privacy.html' && attribute.startsWith('href=') && [nordPrivacyURL, 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement'].includes(value)) continue;
      if (name === 'spectra.html' && attribute.startsWith('href=') && editorialLinks.has(value)) continue;
      if (name === 'spectra.html' && attribute.startsWith('href=') && value === 'https://developer.apple.com/download/files/accessories/dimensional-drawings/iphone-17-pro-max.pdf#page=5') continue;
      if (['index.html', 'spectra.html'].includes(name) && attribute.startsWith('href=') && value === nordAffiliateHref) continue;
      if (['index.html', 'spectra.html'].includes(name) && attribute.startsWith('href=') && value === 'https://buy.stripe.com/6oU3cufOq6KeftE5tR9MY00') continue;
      if (name === 'spectra-privacy.html' && attribute.startsWith('href=') && value === 'https://stripe.com/privacy') continue;
      if (value.startsWith('https://')) {
        assert.ok(value.startsWith('https://arcsignal.app/'), `Unexpected external resource: ${value}`);
        continue;
      }
      assert.ok(!/^(?:[a-z]+:|\/\/)/i.test(value), `Unsupported URL: ${value}`);
      const [path, fragment] = value.split('#');
      if (path.includes('?')) assert.match(path, /^assets\/(?:images\/spectra-[a-z-]+\.webp|css\/site\.css|js\/site-motion\.js)\?v=[a-f0-9]{12}$/);
      const pathname = path.split('?')[0];
      const target = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '') || name;
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

test('only the local optional motion script is permitted; no third-party content or tracking', () => {
  for (const [name, html] of pages) {
    const branded = ['index.html', 'spectra.html'].includes(name);
    const motion = `<script src="assets/js/site-motion.js${branded ? `?v=${revision(motionSource)}` : ''}" defer></script>`;
    const marketing = ['index.html', 'spectra.html', 'seamless.html'].includes(name);
    assert.equal(html.split(motion).length - 1, marketing ? 1 : 0, name);
    assert.doesNotMatch(html.replace(motion, ''), /<(?:script|iframe|object|embed|form)\b|\son[a-z]+\s*=/i, name);
    assert.match(html, /default-src 'none'; style-src 'self'; (?:script-src 'self'; )?font-src 'self'; img-src 'self'/, name);
    if (marketing) assert.ok(html.includes("script-src 'self'"), name);
    assert.match(html, /base-uri 'none'; form-action 'none'; object-src 'none'/, name);
    assert.doesNotMatch(html, /googletagmanager|google-analytics|fonts\.google|kmeans|sigint communications/i, name);
  }
  assert.doesNotMatch(css, /@import|https?:|data:/i);
});

test('branded pages fetch the exact CSS and motion revisions needed by the wordmark', () => {
  for (const name of ['index.html', 'spectra.html']) {
    const html = pages.get(name);
    assert.ok(html.includes(`href="assets/css/site.css?v=${revision(css)}"`), `${name}: stale stylesheet URL`);
    assert.ok(html.includes(`src="assets/js/site-motion.js?v=${revision(motionSource)}"`), `${name}: stale motion URL`);
  }
});

test('unreleased download is a truthful status rather than a broken link', () => {
  const html = pages.get('spectra.html');
  assert.match(html, /<p id="app-store-download" class="status">App Store release coming soon<\/p>/);
  assert.match(html, /id="compatibility"[^>]*>Requires an iPhone running iOS 27 or later/);
  assert.match(html, /Scanning does not require Apple Intelligence/);
  assert.match(html, /No in-app purchases\./);
  for (const page of [html, pages.get('index.html')]) {
    assert.doesNotMatch(page, /href="http:\/\/"|Available now|Now available|iPhone 16\/17/);
  }
});

test('voluntary development support uses only the approved checkout with clear privacy boundaries', () => {
  const sections = [];
  for (const name of ['index.html', 'spectra.html']) {
    const html = pages.get(name);
    const section = html.match(/<section\b[^>]*id="support-development"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, `${name}: missing development support`);
    sections.push(section);
    assert.match(section, /data-payment-provider="stripe" data-payment-status="active"/);
    const links = [...section.matchAll(/<a\b[^>]*>/g)].map(match => match[0]);
    assert.equal(links.length, 1);
    assert.equal(links[0].match(/href="([^"]+)"/)?.[1], 'https://buy.stripe.com/6oU3cufOq6KeftE5tR9MY00');
    assert.match(links[0], /rel="noreferrer" referrerpolicy="no-referrer" aria-describedby="development-payment-note"/);
    assert.match(section, /Support our work <span aria-hidden="true">↗<\/span><\/a>/);
    assert.match(section, /Optional one-time contribution · Checkout hosted by Stripe\./);
    assert.match(section, /App updates are included—no additional payment is required/);
    assert.match(section, /An optional contribution is a way to show your appreciation for Spectra/);
    assert.doesNotMatch(section, /\bsrc=|<form\b|<input\b|\bonclick=|\btips?\b|donat|tax.deduct|unlock|subscriber|disabled|pending-verification|Coming soon/i);
    assert.ok(html.indexOf('id="support-development"') > html.indexOf(name === 'index.html' ? 'id="cta-title"' : 'id="download"'));
    assert.doesNotMatch(html, /(?:src|href)="https:\/\/(?:js|checkout)\.stripe\.com/);
    assert.equal([...html.matchAll(/href="https:\/\/buy\.stripe\.com\/([^"]+)"/g)].length, 1);
  }
  assert.equal(sections[0], sections[1], 'Company and product contribution copy must agree');
  assert.doesNotMatch(pages.get('guide.html'), /id="support-development"/, 'Help stays focused on help');
  const privacy = pages.get('spectra-privacy.html');
  assert.match(privacy, /separate Stripe-hosted checkout/);
  assert.match(privacy, /Our website does not receive your full card number/);
  assert.match(privacy, /separately from on-device scan history/);
  assert.match(privacy, /href="https:\/\/stripe\.com\/privacy" rel="noreferrer" referrerpolicy="no-referrer"/);
});

test('marketing retains the important measurement and identity limits', () => {
  const html = pages.get('spectra.html');
  for (const text of ['Arc Signal LLC', 'joined Wi-Fi network', 'not an exact distance or direction', 'cannot guarantee', 'Foreground', 'possible or probable', 'without pairing with or connecting']) {
    assert.ok(html.includes(text), `Missing qualification: ${text}`);
  }
  assert.match(html, /<summary>Can Spectra tell me a room is safe\?<\/summary><p>No\./);
});

test('Bluetooth proximity copy describes numeric readings, not a retired chart', () => {
  assert.match(pages.get('spectra.html'), /live signal-strength reading/);
  const guide = pages.get('guide.html');
  assert.match(guide, /No current reading/);
  assert.match(guide, /Silence does not mean zero signal/);
  for (const html of [guide, pages.get('spectra.html')]) {
    assert.doesNotMatch(html, /live signal-strength graph|Compare the graph|full proximity graph replay/);
  }
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
  for (const [foreground, background] of [['535a65', 'f7f7f5'], ['535a65', 'e1ecf8'], ['075bb5', 'eef2f6'], ['b6c4d4', '111820'], ['ffffff', '075bb5'], ['295e4f', 'e8f0eb'], ['535a65', 'e4ece5'], ['ffffff', '295e4f'], ['161a21', 'f7f7f5'], ['075bb5', 'f7f7f5'], ['ffffff', '161a21']]) {
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
  assert.equal(provenance.platform, 'iOS');
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  assert.equal(provenance.appVersion, guide.appVersion);
  if (provenance.bundleBuild !== guide.build) {
    // A release not changing pictured screens can retain accurate imagery without falsifying its
    // capture provenance. The explicit review expires at the next Guide build.
    const review = JSON.parse(await readFile(join(root, 'docs/screenshot-content-review.json'), 'utf8'));
    assertCaptureReview(review, provenance, guide);
  } else {
    assert.equal(provenance.buildIdentifier, guide.buildIdentifier);
  }
  assert.equal(provenance.buildIdentifier, `1A${provenance.bundleBuild}`);
  assert.equal(provenance.minimumOSVersion, '27.0');
  assert.match(provenance.bundleInfoPlistSHA256, /^[a-f0-9]{64}$/);
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
    const versioned = `${item.output}?v=${item.outputSHA256.slice(0, 12)}`;
    assert.ok(html.includes(`<img src="${versioned}" width="1320" height="2868"`));
    assert.ok(html.includes(`href="${versioned}"`));
    if (item.id === '01-quick-check') assert.ok(pages.get('index.html').includes(`<img src="${versioned}"`));
    for (const page of pages.values()) {
      for (const [, url] of page.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
        if (url.split('?')[0] === item.output) assert.equal(url, versioned, 'Stale screenshot cache version');
      }
    }
  }
  assert.ok(!files.includes('assets/images/spectra-overview.png'));
  assert.ok(!files.includes('assets/images/spectra-area-sweep.png'));
});

test('Watch screenshots preserve current native dimensions and identify experimental scope', async () => {
  const html = pages.get('spectra.html');
  const section = html.match(/<section[^>]*id="watch-preview"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  for (const phrase of ['Experimental Watch', 'Current TestFlight companion', '30-second Bluetooth',
    'not background scanning', 'watchOS 27 or later', 'iOS 27 or later', 'Public-release availability is not yet promised',
    'Example data, not nearby-device evidence', 'guide.html#watch']) assert.ok(section.includes(phrase), phrase);
  const provenance = JSON.parse(await readFile(join(root, 'assets/data/spectra-watch-screenshots.json'), 'utf8'));
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  assert.equal(provenance.platform, 'watchOS');
  assert.equal(provenance.exampleData, true);
  // Independent platform capture provenance is never relabeled to match phone.
  // An older unchanged screen requires an explicit, expiring platform review.
  assert.match(provenance.appSourceCommit, /^[a-f0-9]{40}$/);
  assertCaptureIdentity(provenance);
  assert.equal(provenance.appVersion, guide.appVersion);
  if (provenance.bundleBuild !== guide.build) {
    const review = JSON.parse(await readFile(join(root, 'docs/screenshot-content-review.json'), 'utf8'));
    assertCaptureReview(review, provenance, guide);
  } else {
    assert.equal(provenance.buildIdentifier, guide.buildIdentifier);
  }
  assert.match(provenance.captureRuntime, /watchOS 27/);
  assert.match(provenance.transformation, /every RGBA pixel preserved/);
  assert.deepEqual(provenance.items.map(item => item.id), ['watch-start', 'watch-complete']);
  for (const item of provenance.items) {
    assert.match(item.output, /^assets\/images\/spectra-watch-(?:start|complete)\.webp$/);
    const image = await readFile(join(root, item.output));
    assert.equal(createHash('sha256').update(image).digest('hex'), item.outputSHA256);
    assert.match(item.sourceSHA256, /^[a-f0-9]{64}$/);
    assert.match(item.pixelSHA256, /^[a-f0-9]{64}$/);
    assert.equal(image.subarray(0, 4).toString(), 'RIFF');
    assert.equal(image.subarray(8, 12).toString(), 'WEBP');
    let size;
    for (let offset = 12; offset + 8 <= image.length;) {
      const type = image.subarray(offset, offset + 4).toString();
      const length = image.readUInt32LE(offset + 4), start = offset + 8;
      assert.ok(start + length <= image.length);
      if (type === 'VP8X') size = [image.readUIntLE(start + 4, 3) + 1, image.readUIntLE(start + 7, 3) + 1];
      if (type === 'VP8L' && !size) {
        assert.equal(image[start], 0x2f);
        const bits = image.readUInt32LE(start + 1);
        size = [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
      }
      offset = start + length + (length % 2);
    }
    assert.deepEqual(size, [item.width, item.height]);
    const versioned = `${item.output}?v=${item.outputSHA256.slice(0, 12)}`;
    assert.ok(section.includes(`<img src="${versioned}" width="${item.width}" height="${item.height}"`));
    assert.ok(section.includes(`href="${versioned}"`));
  }
  assert.match(css, /\.watch-screen-grid img \{ width: 100%; height: auto; \}/);
  assert.match(css, /@media \(max-width: 560px\) \{ \.watch-screen-grid \{ grid-template-columns: minmax\(0, 1fr\); \} \}/);
});

test('platform capture reviews reject stale releases and altered provenance', async () => {
  const review = JSON.parse(await readFile(join(root, 'docs/screenshot-content-review.json'), 'utf8'));
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const ios = JSON.parse(await readFile(join(root, 'assets/data/spectra-screenshots.json'), 'utf8'));
  const readme = await readFile(join(root, 'README.md'), 'utf8');
  assert.ok(readme.includes(`The iPhone capture identity is version ${ios.appVersion} / ${ios.buildIdentifier} / ${ios.bundleBuild}`),
    'README must describe the actual current iPhone producer');
  assert.ok(readme.includes(`captured from reviewed source \`${ios.appSourceCommit}\``),
    'README must retain the actual current capture source');
  for (const file of ['spectra-screenshots.json', 'spectra-watch-screenshots.json']) {
    const provenance = JSON.parse(await readFile(join(root, `assets/data/${file}`), 'utf8'));
    assertCaptureReview(review, provenance, guide);
    for (const key of ['bundleBuild', 'buildIdentifier', 'appSourceCommit']) {
      const altered = structuredClone(review);
      altered.sources[provenance.platform][key] = 'altered';
      assert.throws(() => assertCaptureReview(altered, provenance, guide), key);
      // Equal malformed/missing values on both sides must not authorize art.
      for (const value of [undefined, 'invalid']) {
        const invalidReview = structuredClone(review);
        const invalidProvenance = structuredClone(provenance);
        if (value === undefined) {
          delete invalidReview.sources[provenance.platform][key];
          delete invalidProvenance[key];
        } else {
          invalidReview.sources[provenance.platform][key] = value;
          invalidProvenance[key] = value;
        }
        assert.throws(() => assertCaptureReview(invalidReview, invalidProvenance, guide), `${key}: joint ${value}`);
      }
    }
    for (const key of ['appVersion', 'reviewedGuideBuild', 'reviewedGuideBuildIdentifier']) {
      assert.throws(() => assertCaptureReview({ ...review, [key]: 'stale' }, provenance, guide), key);
    }
    assert.throws(() => assertCaptureReview(review, { ...provenance, platform: 'unknown' }, guide));
    assert.throws(() => assertCaptureReview({ ...review, reason: '' }, provenance, guide));
    for (const value of ['1A1999', '2A' + provenance.bundleBuild]) {
      const inconsistentReview = structuredClone(review);
      inconsistentReview.sources[provenance.platform].buildIdentifier = value;
      assert.throws(() => assertCaptureReview(inconsistentReview, { ...provenance, buildIdentifier: value }, guide));
    }
  }
});

test('Spectra product wordmark preserves approved pixels and accessible placement', async () => {
  const brand = JSON.parse(await readFile(join(root, 'assets/data/spectra-brand.json'), 'utf8'));
  assert.equal(brand.sourceSHA256, '8ffe7d1e3a7dc2209965e0ebd5089eb100e3f1e842e48a4ad70da4e337f14964');
  assert.equal(brand.pixelSHA256, 'f7f6b0137e215e8ea6e3a828db3cbd63cad2d6c0024ac58949c2fe6552265103');
  assert.equal(brand.output, 'assets/images/spectra-wordmark.webp');
  assert.deepEqual([brand.width, brand.height], [1983, 793]);
  assert.deepEqual(brand.displayViewBox, [466, 256, 1058, 280]);
  const bytes = await readFile(join(root, brand.output));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), brand.outputSHA256);
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
  const reference = `href="${brand.output}?v=${brand.outputSHA256.slice(0, 12)}"`;
  for (const name of ['index.html', 'spectra.html']) {
    const html = pages.get(name);
    assert.equal(html.split(reference).length - 1, 1, `${name}: one cached product logo`);
    const wordmark = html.match(/<svg class="spectra-wordmark[^>]*>[\s\S]*?<\/svg>/)?.[0];
    assert.ok(wordmark);
    assert.match(wordmark, /viewBox="466 256 1058 280" width="1058" height="280"/);
    assert.match(wordmark, /role="img" aria-label="Spectra by Arc Signal" focusable="false"/);
    assert.match(wordmark, /<image href="[^"]+" width="1983" height="793"\/>/);
    assert.doesNotMatch(wordmark, /<(?:text|path|script|foreignObject)\b/, 'No retypesetting or tracing');
    assert.doesNotMatch(html.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '', /spectra-wordmark/);
    assert.doesNotMatch(html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '', /spectra-wordmark/);
    if (name === 'spectra.html') assert.match(html, /alt="Spectra’s white signal-wave icon on black"/);
  }
  assert.match(pages.get('index.html'), /<h3><svg class="spectra-wordmark"/);
  assert.match(pages.get('spectra.html'), /class="hero-copy hero-copy--branded"/);
  assert.match(css, /\.spectra-wordmark \{[^}]*max-width: 100%;[^}]*height: auto;[^}]*mix-blend-mode: multiply/);
  assert.doesNotMatch(css, /font-family:\s*['"]?Circular/i);
  const motion = await readFile(join(root, 'assets/js/site-motion.js'), 'utf8');
  assert.ok(motion.includes('.hero-copy:not(.hero-copy--branded)'));
  assert.match(css, /\.hero-copy--branded\.is-revealing \{ animation: none; \}/);
});

test('company homepage leads with Arc Signal and keeps product identity in its card', () => {
  const html = pages.get('index.html');
  const hero = html.match(/<section class="hero company-hero shell"[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero);
  assert.match(hero, /Arc Signal LLC/);
  assert.match(hero, /Know more\./);
  assert.match(hero, /Privacy-minded tools/);
  assert.match(hero, /<h1[^>]*>[\s\S]*?<\/h1>\s*<p class="hero-summary company-intro">[\s\S]*?<\/p>\s*<\/div>/);
  assert.match(css, /\.company-hero \{[^}]*grid-template-columns:/);
  assert.match(css, /\.company-hero \.hero-copy\.is-revealing \{ animation: none; \}/);
  assert.doesNotMatch(hero, /Spectra|<img\b|<figure\b|<a\b|hero-product|class="actions"/);
  const companyMark = hero.match(/<svg class="company-signal"[\s\S]*?<\/svg>/)?.[0];
  const navigationMark = html.match(/<svg class="brand-signal"[\s\S]*?<\/svg>/)?.[0];
  assert.ok(companyMark);
  assert.ok(navigationMark);
  assert.match(companyMark, /aria-hidden="true" focusable="false"/);
  assert.match(companyMark, /id="hero-signal-mask"/);
  // The hero uses the same actual waveform pixels and crop as the company header.
  assert.equal(companyMark.match(/viewBox="([^"]+)"/)[1], navigationMark.match(/viewBox="([^"]+)"/)[1]);
  assert.equal(companyMark.match(/<image[^>]+>/)[0], navigationMark.match(/<image[^>]+>/)[0]);
  assert.doesNotMatch(companyMark, /<(?:text|path|script|foreignObject)\b/);
  assert.doesNotMatch(html, /Discover Spectra/);
  const products = html.match(/<section[^>]*id="products"[\s\S]*?<\/section>/)?.[0];
  assert.match(products, /class="spectra-wordmark"/);
  assert.match(products, /Explore Spectra/);
  assert.match(products, /aria-label="Spectra principles"/);
  assert.match(html, /<nav aria-label="Primary navigation">\s*<a href="spectra.html">Spectra<\/a>/);
});

test('public bundle excludes development files and remains lightweight', async () => {
  assert.ok(files.every(name => !/(^|\/)(?:\.git|tests|scripts|node_modules|\.env)(\/|$)/.test(name)));
  const bytes = await Promise.all(files.map(async name => (await stat(join(root, name))).size));
  // The reviewed October 4 content budget is 3.1 decimal MB. Approved brand
  // images keep separately bounded allowances to preserve original pixels.
  const wordmarkIndex = files.indexOf('assets/images/spectra-wordmark.webp');
  assert.ok(wordmarkIndex >= 0);
  assert.ok(bytes[wordmarkIndex] <= 415_000, 'Wordmark exceeds its bounded allowance');
  const invertedIconIndex = files.indexOf('assets/images/spectra-icon-inverted.png');
  assert.ok(invertedIconIndex >= 0);
  assert.ok(bytes[invertedIconIndex] <= 50_000, 'Inverted icon exceeds its bounded allowance');
  assert.ok(bytes.reduce((sum, value, index) => sum + (index === wordmarkIndex || index === invertedIconIndex ? 0 : value), 0) < 3_100_000,
    'Public content excluding the approved brand images exceeds the reviewed 3.1 MB budget');
  assert.match(await readFile(join(root, 'README.md'), 'utf8'), /3\.1 MB content budget/);
  assert.equal((await readFile(join(root, 'CNAME'), 'utf8')).trim(), 'arcsignal.app');
  assert.match(await readFile(join(root, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/arcsignal\.app\/<\/loc>/);
});

test('public Spectra pages are reachable, indexed, and have active navigation', async () => {
  const home = pages.get('index.html');
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
  const descriptions = new Set();
  for (const name of ['index.html', 'spectra.html']) {
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
  assert.equal(descriptions.size, 2, 'Each page needs its own search description');
  assert.ok(!descriptions.has(undefined));
  assert.match(home, /<p class="eyebrow">Arc Signal LLC<\/p>/);
  assert.match(pages.get('404.html'), /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(sitemap, /404/);
  for (const [, value] of pages.get('404.html').matchAll(/(?:href|src)="([^"]+)"/g)) {
    assert.ok(value.startsWith('/') || value.startsWith('#') || value.startsWith('https://'), `404 resource must work at any depth: ${value}`);
  }
});

test('Seamless stays directly accessible but is absent from public promotion and indexing', async () => {
  assert.ok(files.includes('seamless.html'));
  assert.match(pages.get('seamless.html'), /<meta name="robots" content="noindex, follow">/);
  assert.match(pages.get('seamless.html'), /<link rel="canonical" href="https:\/\/arcsignal.app\/seamless.html">/);
  for (const [name, html] of pages) {
    if (name !== 'seamless.html') assert.doesNotMatch(html, /seamless|everyday utilities/i, name);
    // Product guidance may refer to the iPhone and Watch as both apps; the
    // corporate landing page must not market two publicly available products.
    if (name === 'index.html') assert.doesNotMatch(html, /both apps/i, name);
  }
  assert.doesNotMatch(await readFile(join(root, 'sitemap.xml'), 'utf8'), /seamless/i);
  assert.doesNotMatch(await readFile(join(root, 'robots.txt'), 'utf8'), /Disallow:/i, 'Allow crawlers to see noindex');
  for (const name of ['spectra.html', 'seamless.html']) {
    const hero = pages.get(name).match(/<section class="hero shell"[\s\S]*?<\/section>/)?.[0];
    assert.ok(hero);
    assert.doesNotMatch(hero, /See how it works|Explore the app/);
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
  assert.match(html, /Focused glasses and wearable checks/);
  assert.match(html, /Available in Area Sweep\. See actual field readings/);
  assert.doesNotMatch(html, /Optional detector sound|Available in Area Sweep and Monitor/);
  assert.ok(!files.includes('assets/images/spectra-home.png'));
  assert.ok(!files.includes('assets/images/spectra-magnetic.png'));
  for (const page of [html, pages.get('index.html')]) {
    assert.doesNotMatch(page, /Room Sweep|simulator-preview notice|Use Lens|Sound Check|Camera frames and audio/);
  }
});

test('magnetic guidance explains placement, practice, and inconclusive quiet readings', () => {
  for (const name of ['spectra.html', 'guide.html']) {
    const html = pages.get(name);
    for (const phrase of ['iPhone 17 Pro Max', 'USB-C end', 'No change does not rule out a device', 'speaker', 'pass/fail']) {
      assert.ok(html.includes(phrase), `${name}: ${phrase}`);
    }
  }
  assert.ok(pages.get('guide.html').includes('not a universal iPhone scanning point'));
  assert.ok(pages.get('guide.html').includes('unavailable or stale reading is not a quiet field'));
  assert.ok(pages.get('guide.html').includes('fresh reference'));
  assert.ok(pages.get('guide.html').includes('Practice with the magnetometer'));
  assert.ok(pages.get('guide.html').includes('does not resume measurement'));
  assert.ok(pages.get('spectra.html').includes('iphone-17-pro-max.pdf#page=5'));
});

test('website Guide is generated from all native topics with release and support context', async () => {
  const payload = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  assert.equal(payload.appVersion, '1.0.0');
  assert.match(payload.build, /^\d{4,}$/);
  assert.match(payload.buildIdentifier, /^\d+[A-Z]+\d{4,}$/);
  assert.ok(payload.buildIdentifier.endsWith(payload.build));
  assert.equal(payload.minimumOS, 'iOS 27 or later');
  assert.equal(payload.minimumWatchOS, 'watchOS 27 or later');
  assert.equal(payload.supportedHardware, 'iPhone');
  assert.equal(payload.privacyPolicyURL, 'https://arcsignal.app/spectra-privacy.html');
  assert.equal(payload.supportEmail, 'support@arcsignal.zendesk.com');
  assert.equal(payload.supportURL, 'https://arcsignal.zendesk.com');
  assert.equal(payload.articles.length, 13);
  assert.equal(pages.get('guide.html'), await renderGuide(), 'Stale generated Guide');
  for (const {content} of payload.articles) assert.ok(ids(pages.get('guide.html')).includes(content.id));
  assert.match(pages.get('guide.html'), /not anonymous/);
  assert.match(pages.get('guide.html'), /mailto:support@arcsignal.zendesk.com/);
  assert.ok(pages.get('guide.html').includes('href="https://arcsignal.zendesk.com" rel="noreferrer"'));
  assert.match(pages.get('guide.html'), /Nothing is attached or sent automatically/);
  assert.ok(pages.get('guide.html').includes(`Build ${payload.buildIdentifier}`));
  assert.match(pages.get('guide.html'), /forced close, crash, or shutdown/);
  for (const page of ['guide.html', 'spectra.html']) {
    const text = prose(pages.get(page));
    assert.ok(text.includes('watchOS 27 or later'));
    assert.ok(text.includes('iPhone app works without an Apple Watch'));
  }
  for (const page of ['guide.html', 'spectra-privacy.html']) {
    assert.ok(prose(pages.get(page)).includes('detection-engine revision, and catalog revision'));
  }
});

test('support migration preserves privacy boundaries and product documentation', async () => {
  for (const [name, html] of pages) assert.ok(!html.includes('support@arcsignal.app'), name);
  const guide = pages.get('guide.html');
  const policy = pages.get('spectra-privacy.html');
  assert.ok(guide.includes('href="https://arcsignal.zendesk.com" rel="noreferrer"'));
  assert.ok(policy.includes('href="https://arcsignal.zendesk.com" rel="noreferrer"'));
  assert.ok(policy.includes('Zendesk processes support correspondence for us'));
  assert.ok(policy.includes('We do not embed a Zendesk widget or SDK'));
  assert.ok(policy.includes('collecting device’s platform, hardware model'));
  assert.ok(policy.includes('Older missing details remain unknown'));
  assert.ok(guide.includes('A Watch capture remains a Watch capture after transfer or recheck'));
  assert.ok(guide.includes('bounded recent window of accepted RSSI samples'));
  assert.match(guide, /https:\/\/arcsignal\.app\/guide\.html/);
  for (const html of [guide, policy]) {
    assert.ok(html.includes('App and recognition versions remain, including the original capture build for rechecks.'));
    assert.doesNotMatch(html, /omits collector hardware, OS version and app build/);
    assert.doesNotMatch(html, /(?:href|src)="https:\/\/arcsignal\.zendesk\.com[^"\s]*[?#]/);
    assert.doesNotMatch(html, /<(?:script|iframe)[^>]*zendesk/i);
  }
});

test('authored Guide labels are complete, well formed and rendered without markup artifacts', async () => {
  const payload = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const html = pages.get('guide.html');
  for (const { content } of payload.articles) {
    const copy = [content.takeaway, content.important, ...content.steps,
      ...content.sections.concat(content.technicalSections).map(section => section.body)];
    const headings = [content.title, content.navigationTitle,
      ...content.sections.concat(content.technicalSections).map(section => section.title)];
    assert.ok(headings.every(value => !value.includes('**')), content.id + ': heading markup');
    assert.ok(copy.some(value => value.includes('**')), content.id + ': expected explicit interface labels');
    for (const source of copy) {
      assert.ok(html.includes(renderGuideInline(source)), content.id + ': unrendered prose');
      assert.ok(!guidePlainText(source).includes('**'), content.id + ': malformed label');
      const runs = guideRuns(source);
      for (const [index, run] of runs.entries()) {
        if (!run.emphasized) continue;
        assert.doesNotMatch(runs[index - 1]?.text ?? '', /[\p{L}\p{N}]$/u, 'partial-word label prefix');
        assert.doesNotMatch(runs[index + 1]?.text ?? '', /^[\p{L}\p{N}]/u, 'partial-word label suffix');
      }
    }
  }
  assert.doesNotMatch(html, /\*\*/);
});

test('Guide labels distinguish status meaning, real actions and Watch support metadata', async () => {
  const payload = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const monitor = payload.articles.find(article => article.content.id === 'monitoring')?.content;
  assert.ok(monitor);
  const silence = monitor.technicalSections.find(section => section.id === 'silence')?.body;
  assert.ok(silence);
  assert.match(silence, /^The \*\*Not recently seen\*\* label means/);
  const readable = guidePlainText(silence);
  assert.match(readable, /For Bluetooth, Spectra waits 45 seconds without an observation/);
  assert.match(readable, /For local-network services, it follows Bonjour announcements and removals/);
  assert.match(readable, /without physical movement/);
  assert.ok(monitor.steps.some(step => step.startsWith('Choose **Stop Monitor**')));
  assert.match(pages.get('guide.html'), /The <b class="ui-label">Not recently seen<\/b> label means/);
  const watch = payload.articles.find(article => article.content.id === 'watch')?.content;
  const settings = watch?.sections.find(section => section.id === 'settings')?.body;
  assert.ok(settings);
  assert.match(settings, /\*\*About\*\* shows the version/);
  assert.match(guidePlainText(settings), /numeric build and watchOS version installed on your Watch/);
  assert.match(guidePlainText(settings), /not a separate Watch catalog/);
});

test('Experimental Watch guidance distinguishes collection, transfer, import and privacy', async () => {
  const payload = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const watch = payload.articles.find(article => article.content.id === 'watch')?.content;
  assert.ok(watch);
  const text = articleProse(watch);
  for (const phrase of ['Experimental', '70 Seconds', 'Always On', 'partial', 'does not resume',
      'automatically', 'Add to Sessions', 'five capture', '4 MiB', 'Watch copies remain', '20 recent']) {
    assert.ok(text.includes(phrase), `Missing Watch guide: ${phrase}`);
  }
  const policy = prose(pages.get('spectra-privacy.html'));
  for (const phrase of ['Experimental Watch', 'advertisement payloads', 'names', 'five captures',
      '4 MiB', 'separate lifetimes', 'previously queued copies', '20 reports']) {
    assert.ok(policy.includes(phrase), `Missing Watch privacy: ${phrase}`);
  }
  assert.ok(pages.get('spectra.html').includes('availability in the final public release is not promised'));
  assert.ok(pages.get('spectra.html').includes('guide.html#watch'));
});

test('Watch collection origin stays distinct from wearable discovery in public guidance', async () => {
  const payload = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const watch = payload.articles.find(article => article.content.id === 'watch')?.content;
  const sessions = payload.articles.find(article => article.content.id === 'sessions')?.content;
  assert.ok(watch);
  assert.ok(sessions);
  assert.equal(watch.symbol, 'applewatch.radiowaves.left.and.right');
  for (const content of [watch, sessions]) {
    const text = articleProse(content);
    for (const phrase of ['Apple Watch · Bluetooth-only sweep', 'Watch-with-radio-waves', 'Experimental', 'recheck', 'partial']) {
      assert.ok(text.includes(phrase), `Missing Watch origin guidance: ${phrase}`);
    }
  }
  const faq = prose(pages.get('spectra.html'));
  assert.ok(faq.includes('Apple Watch · Bluetooth-only sweep'));
  assert.ok(faq.includes('not a search specifically for nearby watches'));
  assert.ok(faq.includes('Experimental and partial-capture status remain visible'));
  assert.ok(faq.includes('On Watch, Settings holds sweep guidance'));
  const watchText = articleProse(watch);
  for (const phrase of ['Completion haptic', 'Diagnostic reports', 'About', 'installed on your Watch']) {
    assert.ok(watchText.includes(phrase), `Missing Watch Settings guidance: ${phrase}`);
  }
});

test('Watch reset guidance distinguishes a request from confirmed remote erasure', async () => {
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const watch = guide.articles.find(item => item.content.id === 'watch').content;
  const text = articleProse(watch);
  for (const phrase of ['Watch reset pending', 'Watch reset confirmed', 'Watch reset not ready',
    'Watch reset needs attention', 'Reset Watch', 'Apple Watch', 'not captured signals',
    'newly paired or reinstalled Watch is not automatically erased', 'does not request a Watch reset']) {
    assert.ok(text.includes(phrase), `Missing reset distinction: ${phrase}`);
  }
  const recovery = watch.sections.find(section => section.id === 'reset-recovery');
  assert.doesNotMatch(recovery.body, /Experimental Watch/);
  for (const page of ['spectra.html', 'spectra-privacy.html']) {
    const visible = prose(pages.get(page));
    assert.ok(visible.includes('Watch reset pending'));
    assert.ok(visible.includes('Watch reset confirmed'));
    assert.doesNotMatch(visible, /It does not erase the Watch/);
  }
  const policy = prose(pages.get('spectra-privacy.html'));
  assert.ok(policy.includes('not captured signals'));
  assert.ok(policy.includes('A newly paired or reinstalled Watch is not automatically erased'));
});

test('privacy policy is public, linked, readable without scripts, and explains data choices', async () => {
  const policy = pages.get('spectra-privacy.html');
  assert.match(policy, /Effective October 1, 2026/);
  assert.match(policy, /<link rel="canonical" href="https:\/\/arcsignal.app\/spectra-privacy.html">/);
  for (const text of ['Arc Signal LLC', 'support@arcsignal.zendesk.com', '500 sessions', '256 MiB', 'recovery copies',
      'Precise Location', 'Reduced identifying information', 'not anonymous', 'GitHub Pages', 'email provider',
      'do not sell', 'under 13', 'iOS file protection', 'camera images', 'Geographic coordinates', 'privacy regulator']) {
    assert.ok(policy.includes(text), `Missing privacy explanation: ${text}`);
  }
  assert.doesNotMatch(policy, /<details\b/, 'Policy provisions remain readable without opening disclosures');
  for (const name of ['index.html', 'spectra.html', 'guide.html']) {
    assert.ok(pages.get(name).includes('href="spectra-privacy.html"'), `Missing policy link: ${name}`);
  }
  assert.match(await readFile(join(root, 'sitemap.xml'), 'utf8'), /https:\/\/arcsignal.app\/spectra-privacy.html/);
});

test('final-release guidance explains the sweep deadline without overriding saving preferences', async () => {
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const sections = guide.articles.flatMap(({ content }) => content.sections.concat(content.technicalSections));
  const limit = guidePlainText(sections.find(section => section.id === 'sweep-limit').body);
  for (const phrase of ['when collection begins', 'At 25 minutes', 'Extend 30 Minutes',
    'five minutes before', 'Save completed sessions', 'does not override your saving preference',
    'Monitor', 'Watch’s 30-second sweep are unchanged']) assert.ok(limit.includes(phrase), phrase);
  const product = prose(pages.get('spectra.html'));
  assert.match(product, /notice after 25 minutes/);
  assert.match(product, /30-minute limit/);
  assert.doesNotMatch(product, /untimed Area Sweep|Area Sweep has no timer/i);
});

test('location tagging remains per-check, optional, source-specific and separately shared', async () => {
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const sections = guide.articles.flatMap(({ content }) => content.sections.concat(content.technicalSections));
  const section = id => guidePlainText(sections.find(item => item.id === id).body);
  for (const phrase of ['off for each new check', 'permission is denied', 'single position',
    'Watch captures do not receive the phone’s location', 'Location is not required']) {
    assert.ok(section('tag-location').includes(phrase), phrase);
  }
  for (const phrase of ['ten seconds old', 'twelve seconds', '5 km or better',
    'not a guarantee of accuracy', 'No automatic address lookup', 'without a tag']) {
    assert.ok(section('location-quality').includes(phrase), phrase);
  }
  for (const phrase of ['every format by default', 'Technical archive', 'Include scan location',
    'fix timestamp', 'starts off when you reopen export', 'Reduced identifying information',
    'does not add the tag to Copy for AI analysis']) assert.ok(section('export-location').includes(phrase), phrase);
  const product = prose(pages.get('spectra.html'));
  for (const phrase of ['Remember where you started', 'starts off every time', 'Watch captures stay untagged',
    'All JSON formats omit it by default', 'AI copies never include the tag']) assert.ok(product.includes(phrase), phrase);
  const policy = prose(pages.get('spectra-privacy.html'));
  for (const phrase of ['off by default for every new iPhone scan', 'bounded to 12 seconds',
    'Denied access or an unavailable fix never prevents scanning', 'authorizes automatic requests',
    'All JSON formats omit location by default', 'fix timestamp', 'Location tags are excluded from on-device AI evidence',
    'removes it from that saved copy', 'Protected recovery copies']) assert.ok(policy.includes(phrase), phrase);
});

test('Guide setup order and access review match the current application', async () => {
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  assert.deepEqual(guide.articles.filter(a => a.category === 'gettingStarted').map(a => a.content.id),
    ['setup', 'detection', 'travel', 'watch']);
  const setup = guide.articles.find(a => a.content.id === 'setup').content;
  assert.match(setup.steps[0], /\*\*Privacy & storage\*\*/);
  assert.match(setup.steps[0], /\*\*Done\*\*/);
  assert.match(setup.steps[0], /unused measurements do not need to be configured/);
  const support = await readFile(join(root, 'docs/zendesk-getting-started-article.html'), 'utf8');
  assert.match(support, /Settings → Privacy &amp; storage → Measurement access/);
  assert.match(support, /Tap <strong>Done<\/strong> to return/);
});

test('saved maps require explicit opt-in and keep location meaning and privacy clear', async () => {
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const sessions = guide.articles.find(({ content }) => content.id === 'sessions').content;
  const location = guidePlainText(sessions.sections.find(section => section.id === 'location').body);
  for (const phrase of ['Enable map previews', 'Not now', 'Automatic map previews', 'not where detected devices are',
    'does not request your current location', 'only after you enable them']) assert.ok(location.includes(phrase), phrase);
  const fallback = guidePlainText(sessions.sections.find(section => section.id === 'map-preview').body);
  for (const phrase of ['Retry map preview', 'remains enabled', 'caches held by Apple Maps']) assert.ok(fallback.includes(phrase), phrase);
  const policy = prose(pages.get('spectra-privacy.html'));
  for (const phrase of ['Enable map previews', 'Not now', 'Automatic map previews', 'estimated accuracy', 'Apple’s map data practices',
    'not detected devices', 'Open in Maps']) assert.ok(policy.includes(phrase), phrase);
});

test('external finding prompts explain four useful questions without implying model certainty', async () => {
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const sections = guide.articles.flatMap(({ content }) => content.sections.concat(content.technicalSections));
  const copy = guidePlainText(sections.find(section => section.id === 'copy-limits').body);
  for (const phrase of ['what the finding may be', 'what that means', 'how confident', 'practical next checks',
    'Bluetooth, network, or magnetic evidence', 'Unknown remains a valid conclusion', 'not independent proof']) {
    assert.ok(copy.includes(phrase), phrase);
  }
  const product = prose(pages.get('spectra.html'));
  assert.match(product, /what a finding may be, what it means, how confident to be, and what to check next/);
  assert.match(product, /Nothing uploads automatically/);
  assert.match(product, /AI can make mistakes/);
});

test('Spectra result discovery does not imply complete device-category coverage', () => {
  const product = pages.get('spectra.html');
  assert.match(product, /narrow results by recorded measurement or search displayed and broadcast names/);
  assert.match(product, /device type is undetermined/);
  assert.doesNotMatch(product, /No in-app purchases or scan limits/);
  const guide = pages.get('guide.html');
  assert.match(guide, /256 MiB/);
  assert.doesNotMatch(guide, /32 MiB|filter by device category|filter by device type/i);
});

test('launch pricing is explicit but not presented as a live purchase or promotion', () => {
  for (const name of ['index.html', 'spectra.html']) {
    const html = pages.get(name);
    assert.match(html, /Planned U\.S\. price:?\s+(?:<strong>)?\$3\.99/);
    assert.match(html, /One-time purchase/);
    assert.doesNotMatch(html, /\$2\.99|launch discount|introductory price|was \$3\.99/i);
  }
  assert.match(pages.get('spectra.html'), /No subscription/);
  assert.match(pages.get('spectra.html'), /Prices in other regions may vary/);
});

test('NordVPN recommendations preserve the exact approved URL and disclose commissions beside each action', () => {
  for (const [name, disclosureID] of [['index.html', 'home-vpn-disclosure'], ['spectra.html', 'vpn-disclosure']]) {
    const html = pages.get(name);
    const action = html.match(new RegExp(`<div class="affiliate-action">\\s*<p id="${disclosureID}"[\\s\\S]*?</div>`))?.[0];
    assert.ok(action, `${name}: disclosure and action must stay together`);
    assert.match(action, /class="affiliate-disclosure">Arc Signal may earn a commission if you purchase through this link\.<\/p>\s*<a /);
    const link = action.match(/<a\b[^>]+>/)?.[0];
    const href = link?.match(/\shref="([^"]+)"/)?.[1];
    assert.equal(href, nordAffiliateHref, name);
    assert.match(link, /rel="sponsored noreferrer"/);
    assert.match(link, /referrerpolicy="no-referrer"/);
    assert.ok(link.includes(`aria-describedby="${disclosureID}"`), name);
    assert.match(action, /Explore NordVPN plans/);
    assert.doesNotMatch(action, /\shidden(?:\s|=|>)|aria-hidden="true"[^>]*>Arc Signal|<details\b|\btarget=/);
    assert.equal([...html.matchAll(/go\.nordvpn\.net/g)].length, 1, `${name}: one intentional affiliate action`);
    assert.match(html, /data-affiliate-status="active"/);
    assert.match(html, /<p class="eyebrow">Affiliate partner<\/p>/);
    const url = new URL(href.replaceAll('&amp;', '&'));
    assert.equal(url.origin + url.pathname, 'https://go.nordvpn.net/aff_c');
    assert.deepEqual([...url.searchParams], [['offer_id', '15'], ['aff_id', '156788'], ['url_id', '902']]);
    assert.equal(url.hash + url.username + url.password, '');
  }
});

test('NordVPN logo preserves official artwork, local loading, dimensions and partner disclosure', async () => {
  const path = 'assets/images/nordvpn-logo.svg';
  const asset = await readFile(join(root, path));
  assert.equal(createHash('sha256').update(asset).digest('hex'), '6a70962b6559849de9f38899abd70512cee8fc817eaf1396f368ba46d3502108');
  const svg = asset.toString('utf8');
  assert.match(svg, /width="142" height="32" viewBox="0 0 142 32"/);
  assert.doesNotMatch(svg, /<(?:script|image|foreignObject|use|style|animate)\b|\b(?:href|on\w+)\s*=|<!DOCTYPE|<!ENTITY|url\(/i);
  for (const name of ['index.html', 'spectra.html']) {
    const html = pages.get(name);
    assert.equal(html.split(`src="${path}"`).length - 1, 1, name);
    assert.match(html, /<div class="affiliate-brand"><img src="assets\/images\/nordvpn-logo.svg" width="142" height="32" alt="NordVPN" loading="lazy" decoding="async"><p class="eyebrow">Affiliate partner<\/p><\/div>/);
    assert.match(html, /NordVPN and the NordVPN logo are trademarks of Nord Security/);
  }
  assert.match(css, /\.affiliate-brand \{ display: flex; align-items: center; flex-wrap: wrap; gap: 1rem 1\.5rem; \}/);
  assert.match(css, /\.affiliate-brand img \{ width: 10rem; max-width: 100%; height: auto; flex: none; \}/);
});

test('VPN recommendations remain optional, separate from Spectra, and honest about protection', () => {
  const product = pages.get('spectra.html');
  const resource = product.match(/<div class="feature-grid" id="vpn-resource"[\s\S]*?<\/section>/)?.[0];
  assert.ok(resource);
  assert.match(resource, /separate paid service, not included with Spectra and not required to use it/);
  assert.match(resource, /pricing, and renewal terms/);
  assert.match(resource, /cannot detect or prevent nearby recording/);
  assert.match(resource, /routed through its VPN connection/);
  for (const url of editorialLinks) assert.ok(resource.includes(`href="${url}" rel="noreferrer"`), url);
  const home = pages.get('index.html');
  assert.match(home, /optional, separate paid service—not included with Spectra/);
  assert.match(home, /href="spectra.html#vpn-resource">Where a VPN helps/);
  for (const html of [home, product]) {
    assert.doesNotMatch(html, /direct, non-affiliate|receives no commission|data-affiliate-status="inactive"|exclusive discount|VPN included|free NordVPN/i);
  }
  // The app's exported, offline Guide remains educational and provider-neutral.
  assert.doesNotMatch(pages.get('guide.html'), /NordVPN|go\.nordvpn\.net|affiliate partner/i);
});

test('affiliate navigation adds no automatic third-party requests or visitor tracking to our pages', () => {
  for (const [name, html] of pages) {
    for (const [tag, kind] of html.matchAll(/<([a-z][\w-]*)\b[^>]*>/gi)) {
      if (kind.toLowerCase() === 'a' || kind.toLowerCase() === 'meta') continue;
      // Canonical metadata describes this page; it does not fetch a resource.
      if (/^<link rel="canonical" href="https:\/\/arcsignal\.app\/[^"]*">$/.test(tag)) continue;
      assert.doesNotMatch(tag, /\b(?:href|src|srcset|data|action)="(?:https?:)?\/\//i, `${name}: no remote loaded resources`);
    }
    assert.doesNotMatch(html, /\bping\s*=|\brel="[^"]*(?:preconnect|prefetch|dns-prefetch)|http-equiv="refresh"/i, name);
    if (!['index.html', 'spectra.html'].includes(name)) assert.ok(!html.includes(nordAffiliateHref), name);
  }
  assert.match(css, /\.affiliate-action \{ display: grid; justify-items: start; gap: \.75rem; \}/);
  assert.match(css, /\.affiliate-action \.affiliate-disclosure \{ font-size: \.9375rem; line-height: 1\.6; color: var\(--ink\); \}/);
  assert.match(css, /max-width: 100%; gap: \.75rem; overflow-wrap: anywhere/);
});

test('privacy explains post-click referral attribution without weakening app privacy', () => {
  const policy = pages.get('spectra-privacy.html');
  for (const phrase of ['participates in the NordVPN affiliate program', 'We may earn a commission', 'not an identifier generated for you', 'No scan data is attached', 'After you follow the link', 'IP address and browser details', 'cookies or similar technologies', 'report referral activity for commissions', 'does not hide your IP address', 'without visiting NordVPN or buying a VPN']) {
    assert.ok(policy.includes(phrase), phrase);
  }
  assert.ok(policy.includes(`href="${nordPrivacyURL}" rel="noreferrer"`));
  assert.match(policy, /We do not contact NordVPN, Zendesk, or Stripe or load their scripts when you browse our pages/);
  assert.doesNotMatch(policy, /No affiliate links are active|If we later activate|current direct NordVPN link/);
});

test('practical guidance keeps observation, HTTPS, VPNs, and physical safety distinct', () => {
  const html = pages.get('spectra.html');
  for (const phrase of ['Airbnb', 'student housing', 'gyms', 'changing rooms', 'rideshare', 'airport', 'HTTPS', 'trust shifts', 'does not stop nearby recording', 'do not disable a required VPN']) {
    assert.ok(html.includes(phrase), phrase);
  }
  assert.match(html, /Do not confront someone based on a scan/);
  assert.match(pages.get('guide.html'), /Where a VPN helps—and where it does not/);
});

test('policy distinguishes local preparation, explicit clipboard consent, and external copies', () => {
  const policy = prose(pages.get('spectra-privacy.html'));
  for (const phrase of ['Selecting one finding prepares', 'only tapping Copy prompt and finding', 'not anonymous either', 'on-device-only clipboard', 'ten-minute expiration', 'cannot recall', 'under that recipient’s policies']) {
    assert.ok(policy.includes(phrase), phrase);
  }
  assert.doesNotMatch(policy, /Save to Files and Share JSON/);
});

test('backup disclosures distinguish the exclusion request from guarantees and exported copies', async () => {
  for (const name of ['spectra.html', 'spectra-privacy.html', 'guide.html']) {
    const page = pages.get(name);
    assert.ok(page.includes('for exclusion from device backups'), name);
    assert.ok(page.includes('iOS controls backup and restore behavior'), name);
    assert.ok(page.includes('Files you export may be'), name);
    assert.doesNotMatch(page, /\bexcluded from (?:device )?backups?\b/i, name);
  }
  const policy = pages.get('spectra-privacy.html');
  assert.ok(policy.includes('including recovery copies'));
  assert.ok(policy.includes('not a guarantee that sessions can never appear in a backup or on a restored device'));
});
test('Guide and policy distinguish Spectra Settings from iPhone permissions', () => {
  const guide = prose(pages.get('guide.html'));
  const policy = prose(pages.get('spectra-privacy.html'));
  assert.match(guide, /Settings → App icon/);
  assert.match(guide, /Classic, Spectra Blue, Light, or Blue on White/);
  assert.match(guide, /For Access not allowed, change Spectra’s access in iPhone Settings/);
  assert.match(guide, /fresh access check/);
  assert.match(guide, /cannot add unsupported hardware or override an iOS restriction/);
  assert.match(guide, /Spectra Settings/);
  assert.match(policy, /Settings → About Spectra → Privacy policy/);
  assert.match(policy, /Settings → Support information → Copy support information/);
  for (const html of [guide, policy]) {
    assert.doesNotMatch(html, /Guide → (?:About|App icon|Measurement access|Copy support information)/);
    assert.doesNotMatch(html, /(?:Reset Spectra|sessions) in Guide/);
  }
});

test('Settings support and About details have explicit app and support routes', async () => {
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const troubleshooting = articleProse(guide.articles.find(article => article.content.id === 'troubleshooting').content);
  const privacy = articleProse(guide.articles.find(article => article.content.id === 'privacy').content);
  assert.match(troubleshooting, /open Support information and choose Copy support information/);
  assert.match(troubleshooting, /Settings → About Spectra → Arc Signal website/);
  assert.match(privacy, /Settings → About Spectra → Privacy policy/);
  assert.match(privacy, /Privacy & storage guide in Settings/);
  const rendered = prose(await renderGuide());
  assert.match(rendered, /Settings → Support information → Copy support information/);
  const mirror = await readFile(join(root, 'docs/zendesk-troubleshooting-article.html'), 'utf8');
  const mirrorText = mirror.replace(/<strong>([^<>]*)<\/strong>/g, '$1').replace(/\s+/g, ' ');
  assert.match(mirrorText, /Settings, open Support information and choose Copy support information/);
  assert.match(mirrorText, /Settings → About Spectra → Arc Signal website/);
  assert.match(mirrorText, /Watch app’s Settings → About/);
  const supplemental = JSON.parse(await readFile(join(root, 'docs/zendesk-articles.json'), 'utf8'));
  const contact = supplemental.find(article => article.title === 'Contact Arc Signal support');
  const contactText = contact.html.replace(/<strong>([^<>]*)<\/strong>/g, '$1');
  assert.match(contactText, /Settings → Support information → Copy support information/);
  assert.match(contactText, /Settings → About Spectra → Arc Signal website/);
  assert.match(contactText, /Experimental Watch companion, include its Settings → About/);
});

test('Guide and support preserve qualified signals and deliberate non-erasing recovery', async () => {
  const guide = prose(pages.get('guide.html'));
  for (const phrase of ['Observed pattern', 'not identity confidence', 'not physical-device totals',
    'Check ended early marks a foreground interruption', 'Review Coverage', 'separate saved status',
    'Check Availability', 'without starting generation', 'Retry Analysis', 'Retry Loading',
    'without erasing copies']) assert.ok(guide.includes(phrase), phrase);
  const findings = await readFile(join(root, 'docs/zendesk-findings-article.html'), 'utf8');
  assert.match(findings, /strongest relevant member’s evidence tier, not identity confidence/);
  const troubleshooting = await readFile(join(root, 'docs/zendesk-troubleshooting-article.html'), 'utf8');
  assert.match(troubleshooting, /marks a foreground interruption/);
  assert.match(troubleshooting, /never starts analysis automatically/);
  assert.match(troubleshooting, /Unsupported iPhones do not offer a futile availability retry/);
  const watch = await readFile(join(root, 'docs/zendesk-watch-article.html'), 'utf8');
  assert.match(watch, /does not erase copies or resend a capture/);
  assert.match(watch, /different stages when offered/);
});

test('Guide explains specialist export scope and bounded optional analysis', async () => {
  const page = prose(await readFile(join(root, 'guide.html'), 'utf8'));
  assert.ok(page.includes('Scan type sets the scope—not screen filters'));
  assert.ok(page.includes('Unrelated activity is excluded'));
  assert.ok(page.includes('45-second limit'));
  assert.ok(page.includes('select one recorded device or magnetic-event summary'));
  assert.ok(page.includes('up to three strongest retained incident summaries'));
  assert.ok(page.includes('no relevant findings'));
  assert.ok(page.includes('not saved with sessions or included in any JSON export'));
  assert.ok(page.includes('Information to include, choose one format'));
  assert.ok(page.includes('share sheet opens when the file is ready'));
  assert.ok(page.includes('No findings') || page.includes('no matches is not an all-clear'));
  assert.ok(!page.includes('Dense scans are processed in batches'));
});

test('saved-session rechecks keep eligibility, originals, storage and privacy explicit', () => {
  assert.match(pages.get('spectra.html'), /expandable day groups/);
  for (const phrase of ['Find a check by day', 'most recent day starts open',
    'does not deselect', 'Delete Selected shows the total', 'includes closed groups']) {
    assert.ok(prose(pages.get('guide.html')).includes(phrase), phrase);
  }
  const product = prose(pages.get('spectra.html'));
  for (const phrase of ['eligible saved radio evidence', 'blue dot in Sessions',
    'separate numbered interpretation', 'original unchanged', 'better matches are not guaranteed',
    'no Apple Intelligence', 'not separate downloads', 'guide.html#sessions']) {
    assert.ok(product.includes(phrase), phrase);
  }
  assert.ok(pages.get('index.html').includes('Recheck eligible saved sessions'));
  const policy = prose(pages.get('spectra-privacy.html'));
  for (const phrase of ['independent saved copy', 'naming lineage', 'additional local storage',
    'does not delete its independent rechecks', 'explicitly requested recheck',
    'do not start new radio discovery']) assert.ok(policy.includes(phrase), phrase);
  const guide = prose(pages.get('guide.html'));
  for (const phrase of ['Can I recheck after leaving the location?', 'better matches are not guaranteed',
    'automatic saving of completed scans is off', 'Deleting the original does not delete']) {
    assert.ok(guide.includes(phrase), phrase);
  }
});

test('public copy describes temporary single-finding AI, not saved generated reports', () => {
  for (const name of ['index.html', 'spectra.html', 'spectra-privacy.html']) {
    const page = pages.get(name);
    assert.doesNotMatch(page, /saves the analysis with your scan|revisit saved analyses|same evidence used in Analysis JSON/);
    assert.ok(page.includes('one selected finding') || page.includes('one finding'), name);
  }
  const policy = pages.get('spectra-privacy.html');
  assert.ok(policy.includes('not saved with sessions'));
  assert.ok(policy.includes('excluded from every JSON export'));
  assert.ok(policy.includes('does not enable history saving'));
  for (const name of ['spectra-privacy.html', 'guide.html']) {
    const page = pages.get(name);
    assert.ok(page.includes('New on-device AI explanations are temporary'), name);
    assert.ok(page.includes('Older sessions may still contain explanations'), name);
    assert.doesNotMatch(page, /Saved reports, notes, and AI analyses use/);
  }
});
