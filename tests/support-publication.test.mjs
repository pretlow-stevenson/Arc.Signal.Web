import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, copyFile, mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { root, supportDocuments, listPublicFiles } from '../scripts/site-files.mjs';
import { renderSupport, supportSources, supportEmail, validateSupportBody } from '../scripts/render-support.mjs';

const text = path => readFile(join(root, path), 'utf8');
const ids = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const legacyIDs = new Map([
  ['getting-started', '56434299423899'], ['travel', '56435630260123'], ['findings', '56434331296923'],
  ['magnetic-meter', '56435559529627'], ['monitoring', '56435605386651'],
  ['troubleshooting', '56434354083227'], ['sessions', '56434367436187'], ['apple-watch', '56434359907227'],
  ['about', '56413781880091'], ['contact', '56435622772379'],
]);

test('all ten canonical manuscripts produce exactly eleven current, indexed first-party pages', async () => {
  const sources = await supportSources();
  const manifest = JSON.parse(await text('content/support/articles.json'));
  assert.deepEqual(manifest.map(article => article.slug), [...legacyIDs.keys()]);
  const supplemental = JSON.parse(await text('content/support/supplemental.json'));
  assert.deepEqual(supplemental.map(article => article.source), ['magnetic', 'monitoring', 'travel,limitations', 'troubleshooting']);
  for (const entry of supplemental) {
    const matches = manifest.filter(article => article.title === entry.title);
    assert.equal(matches.length, 1, entry.title);
    assert.equal(entry.html, (await text(matches[0].file)).trim(), `${entry.title}: stale supplemental mirror`);
  }
  const generated = await renderSupport();
  assert.deepEqual([...generated.keys()], supportDocuments);
  const sitemap = await text('sitemap.xml');
  const files = await listPublicFiles();
  for (const [file, html] of generated) {
    assert.equal(await text(file), html, `Stale generated ${file}`);
    assert.ok(files.includes(file), file);
    assert.ok(sitemap.includes(`<loc>https://arcsignal.app/${file}</loc>`), file);
    assert.ok(html.includes(`<link rel="canonical" href="https://arcsignal.app/${file}">`), file);
    assert.match(html, /href="\/support.html" aria-current="page"/);
    assert.match(html, /href="\/guide.html"/);
    assert.doesNotMatch(html, /<script\b|<form\b|<iframe\b|\b(?:ping|on[a-z]+|style)\s*=|zendesk/i);
    assert.doesNotMatch(html, /rel="(?:preconnect|dns-prefetch|prefetch)"|(?:src|href)="https?:\/\/[^"\s]*(?:zoho|zendesk)/i);
  }
  for (const source of sources) {
    assert.equal(source.legacyArticleID, legacyIDs.get(source.slug));
    assert.equal(source.file, `content/support/${source.slug}.html`);
    const page = generated.get(`help/${source.slug}.html`);
    assert.ok(generated.get('support.html').includes(`href="/help/${source.slug}.html"`), source.slug);
    const article = page.match(/<article id="article" tabindex="-1" class="guide-topic support-article">([\s\S]*?)<a class="text-link" href="#main">/)?.[1];
    assert.ok(article, source.slug);
    // The only manuscript transformation is local URL normalization plus IDs
    // on formerly unanchored headings. No paragraph, warning or image is dropped.
    let generatedHeading = 0;
    const expected = source.html.replace(/<h2>/g, () => `<h2 id="section-${++generatedHeading}">`);
    assert.equal(article, expected, source.slug);
    for (const id of ids(source.html)) assert.ok(ids(page).includes(id), `${source.slug}: lost ${id}`);
    const headings = [...article.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)];
    assert.equal(headings.length, [...source.html.matchAll(/<h2\b/g)].length, source.slug);
    const contents = page.match(/<nav id="article-contents"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(contents);
    assert.deepEqual([...contents.matchAll(/<li><a href="#([^"]+)"/g)].map(match => match[1]), headings.map(match => match[1]));
  }
  const result = spawnSync(process.execPath, ['scripts/render-support.mjs', '--check'], {
    cwd: root, encoding: 'utf8', timeout: 15_000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('support complements all thirteen Guide topics and preserves email-only private-data cautions', async () => {
  assert.equal(supportEmail, 'support@arcsignalllc.zohodesk.com');
  const guide = JSON.parse(await text('assets/data/spectra-guide.json'));
  const guideHTML = await text('guide.html');
  assert.deepEqual(guide.articles.map(({ content }) => content.id), ['setup', 'detection', 'travel', 'watch',
    'bluetooth', 'magnetic', 'grouping', 'monitoring', 'limitations', 'sessions', 'exporting', 'privacy', 'troubleshooting']);
  for (const { content } of guide.articles) assert.ok(ids(guideHTML).includes(content.id), content.id);
  const hub = await text('support.html');
  assert.match(hub, /complete Spectra Guide/);
  assert.match(hub, /Start with a description—not private scan data/);
  assert.match(hub, /Nothing is attached or sent automatically/);
  assert.match(hub, /Zoho Desk handles the information you choose to email/);
  assert.match(hub, /href="\/spectra-privacy.html#support"/);
  assert.match(hub, /href="mailto:support@arcsignalllc.zohodesk.com"/);
  const contact = (await text('content/support/contact.html')).replace(/<strong>([^<>]*)<\/strong>/g, '$1');
  for (const phrase of ['Start without an archive', 'not anonymous', 'excluded from exports by default',
    'share only the relevant session rather than a whole collection', 'Nothing is sent to support automatically',
    'passwords, account recovery codes, or payment-card details', 'cannot certify a location as safe']) {
    assert.ok(contact.includes(phrase), phrase);
  }
  const policy = await text('spectra-privacy.html');
  assert.match(policy, /does not automatically migrate or erase earlier correspondence/);
  assert.match(policy, /expires after ten minutes/);
});

const prefix = `<p>${'Reviewed fixture prose. '.repeat(6)}</p>`;
test('support styles retain complete narrow-screen identity and exact cache fingerprints', async () => {
  const site = await text('assets/css/site.css');
  assert.match(site, /@media \(max-width: 760px\) \{\s*\.brand-mark \{ min-width: 0; max-width: 100%; white-space: normal; \}/);
  assert.match(site, /\.site-header \.brand-mark > span \{ min-width: 0; overflow-wrap: anywhere; \}/);
  const guideStyle = await text('assets/css/guide.css');
  assert.match(guideStyle, /\.guide-contents a \{[^}]*min-width: 0; overflow-wrap: anywhere;/);
  assert.match(guideStyle, /\.guide-layout \{ grid-template-columns: minmax\(0, 1fr\); gap: 2rem; \}/);
  assert.match(guideStyle, /\.guide-intro \.eyebrow \{ overflow-wrap: anywhere; \}/);
  for (const path of ['assets/css/site.css', 'assets/css/guide.css']) {
    const hash = createHash('sha256').update(await readFile(join(root, path))).digest('hex').slice(0, 12);
    for (const file of [...supportDocuments, 'guide.html']) {
      assert.ok((await text(file)).includes(`${path}?v=${hash}`), `${file}: stale stylesheet ${path}`);
    }
  }
});
test('support manuscript validation rejects executable, ambiguous, unbalanced and unreviewed destinations', () => {
  const invalid = [
    '<script>alert(1)</script>', '<iframe src="/guide.html"></iframe>', '<style>p{color:red}</style>',
    '<form></form>', '<base href="/">', '<svg></svg>', '<!-- hidden -->', '<!doctype html>', '<?php test ?>',
    '<p onclick="run()">Bad</p>', '<img onerror="run()" src="/assets/images/spectra-area-sweep.webp">',
    '<p style="color:red">Bad</p>', '<a ping="/tracking" href="/guide.html">Bad</a>',
    '<a href="javascript:alert(1)">Bad</a>', '<a href="data:text/html,test">Bad</a>',
    '<a href="https://arcsignal.app.evil.example/guide.html">Bad</a>',
    '<a href="https://user@arcsignal.app/guide.html">Bad</a>', '<a href="mailto:other@example.com">Bad</a>',
    '<a href="https://arcsignal.zendesk.com">Bad</a>', '<img src="https://remote.example/image.png">',
    '<img src="/content/support/private.html">', '<img src="/assets/images/spectra-area-sweep.webp#private">',
    '<a href="&#106;avascript:alert(1)">Bad</a>', '<a href="&Tab;/guide.html">Bad</a>',
    '<a href="https&colon;&sol;&sol;example.com/">Bad</a>', '<a href="javascript&colon;alert(1)">Bad</a>',
    '<a href="/guide.html&quot;">Bad</a>', '<a href="/guide.html" href="/support.html">Bad</a>',
    '<p id="one" id="two">Bad</p>', '<p id="one">A</p><p id="one">B</p>',
    '<p id="main">Bad</p>', '<p id="article">Bad</p>', '<p id="article-contents">Bad</p>', '<p id="contact">Bad</p>',
    '<p id="bad space">Bad</p>', '<a href=/guide.html>Bad</a>', "<a href='/guide.html'>Bad</a>",
    '<p src="/assets/images/spectra-area-sweep.webp">Bad</p>', '<img href="/guide.html">',
    '<img width="0">', '<img height="-1">', '<img width="10000">',
    '<p>Unclosed', '<p><strong>Wrong closing</p></strong>', '</p>', '<p/>', '</img>', '<p>Text</p id="bad">',
  ];
  for (const body of invalid) assert.throws(() => validateSupportBody(prefix + body), undefined, body);
  for (const body of [null, '', '<p>Short</p>']) assert.throws(() => validateSupportBody(body));
});

test('reviewed body vocabulary accepts preserved anchors, images and explicit destination exceptions', () => {
  const valid = '<h2 id="h_01M3JZ42BV39CYN5ZBR448HHXG">A heading</h2>' +
    '<ul><li><strong>Important</strong> prose</li></ul><ol><li>One</li></ol>' +
    '<figure><a href="/assets/images/spectra-area-sweep.webp?v=64629dead2e2">' +
    '<img src="/assets/images/spectra-area-sweep.webp?v=64629dead2e2" alt="Example data" width="440" height="956"></a><figcaption>Example</figcaption></figure>' +
    '<a href="https://developer.apple.com/download/files/accessories/dimensional-drawings/iphone-17-pro-max.pdf">Apple drawing</a>' +
    '<a href="https://www.apple.com/legal/privacy/data/en/apple-maps/">Apple Maps privacy</a>' +
    `<a href="mailto:${supportEmail}">Email support</a>`;
  assert.equal(validateSupportBody(prefix + valid), prefix + valid);
});

async function rendererFixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'arc-signal-support-renderer-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const manifest = JSON.parse(await text('content/support/articles.json'));
  for (const file of ['scripts/render-support.mjs', 'scripts/site-files.mjs', 'scripts/guide-inline.mjs',
    'assets/css/site.css', 'assets/css/guide.css',
    'spectra.html', 'content/support/articles.json', ...manifest.map(item => item.file), ...supportDocuments]) {
    await mkdir(dirname(join(directory, file)), { recursive: true });
    await copyFile(join(root, file), join(directory, file));
  }
  return { directory, manifest };
}
const checkFixture = directory => spawnSync(process.execPath, ['scripts/render-support.mjs', '--check'], {
  cwd: directory, encoding: 'utf8', timeout: 15_000,
});

test('support check fails closed on missing, duplicate and source-path-substituted inventory entries', async t => {
  const { directory, manifest } = await rendererFixture(t);
  const original = checkFixture(directory);
  assert.equal(original.error, undefined);
  assert.equal(original.status, 0, original.stdout + original.stderr);
  for (const mutate of [
    entries => entries.pop(),
    entries => entries.push({ ...entries[0] }),
    entries => { entries[1] = { ...entries[0] }; },
    entries => { entries[0].file = 'content/support/../../private-note.html'; },
    entries => { entries[0].file = 'docs/zendesk-getting-started-article.html'; },
    entries => { entries[0].slug = 'unreviewed'; entries[0].file = 'content/support/unreviewed.html'; },
    entries => { entries[0].title = ''; },
  ]) {
    const entries = structuredClone(manifest);
    mutate(entries);
    await writeFile(join(directory, 'content/support/articles.json'), JSON.stringify(entries));
    const result = checkFixture(directory);
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Expected all ten support articles|Invalid support inventory/);
  }
});

test('support --check rejects stale generated bytes without rewriting a published page', async t => {
  const { directory } = await rendererFixture(t);
  const stale = '<!doctype html><p>Stale fixture page</p>\n';
  await writeFile(join(directory, 'help/contact.html'), stale);
  const result = checkFixture(directory);
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Stale support page help\/contact.html/);
  assert.equal(await readFile(join(directory, 'help/contact.html'), 'utf8'), stale);
});
