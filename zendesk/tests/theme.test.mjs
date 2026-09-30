import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { themeRoot, packageFiles } from '../scripts/package.mjs';
import { listPublicFiles } from '../../scripts/site-files.mjs';

const read = path => readFile(join(themeRoot, path), 'utf8');

test('hero retains native search behavior, one semantic H1, and an independent icon wrapper', async () => {
  const html = await read('templates/home_page.hbs');
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<h1 class="arc-support-heading">How can we help\?<\/h1>/);
  assert.match(html, /id="main-content"/);
  assert.match(html, /class="arc-support-search"[\s\S]*class="search-icon"/);
  assert.match(html, /\{\{search submit=false instant=settings.instant_search class='search search-full'\}\}/);
  assert.match(html, /\{\{#if help_center.community_enabled\}\}/);
  assert.doesNotMatch(html, /autofocus|<script|onclick=/);
});

test('footer retains native destinations and copyright is ordinary accessible text', async () => {
  const html = await read('templates/footer.hbs');
  assert.match(html, /\{\{#link 'help_center'\}\}\{\{help_center.name\}\}\{\{\/link\}\}/);
  assert.match(html, /© 2026 Arc Signal LLC\. All rights reserved\./);
  assert.match(html, /\{\{#if alternative_locales\}\}/);
  assert.doesNotMatch(html, /<script|onclick=|target="_blank"/);
});

test('presentation allows reflow and adds no scripting or remote assets', async () => {
  const head = await read('templates/document_head.hbs');
  const css = head.match(/<style>([\s\S]*?)<\/style>/)?.[1];
  assert.ok(css);
  assert.match(css, /min-height: 300px/);
  assert.match(css, /height: auto/);
  assert.match(css, /flex-wrap: wrap/);
  assert.match(css, /forced-colors: active/);
  const heading = css.match(/\.arc-support-heading\s*\{([^}]+)\}/)?.[1];
  assert.match(heading, /font-family: inherit/);
  assert.match(heading, /font-weight: 400/);
  assert.doesNotMatch(css, /url\(|@import|animation|!important|overflow:\s*hidden/);
  // Four script elements plus the upstream polyfill's document.write string.
  assert.equal((head.match(/<script\b/g) || []).length, 5);
  for (const [, asset] of head.matchAll(/\{\{asset '([^']+)'\}\}/g)) {
    assert.ok((await readFile(join(themeRoot, 'assets', asset))).length > 0);
  }
});

test('upstream generated CSS and JavaScript remain unmodified', async () => {
  for (const [file, hash] of Object.entries({
    'script.js': '0cc0a9ab5e82474635a216ff6881eac867c453c2ebc2c3b1f48bdde9fe883741',
    'style.css': '57b04d70fb254df5ec4de17f335807bc2fb0dc9496581e0e78a8b3ee34182b5e',
  })) assert.equal(createHash('sha256').update(await readFile(join(themeRoot, file))).digest('hex'), hash);
});

test('native brand defaults and visibility match the reviewed configuration', async () => {
  const manifest = JSON.parse(await read('manifest.json'));
  const settings = Object.fromEntries(manifest.settings.flatMap(group => group.variables.map(v => [v.identifier, v.value])));
  assert.equal(manifest.api_version, 4);
  assert.equal(manifest.version, '4.51.1');
  assert.equal(settings.brand_color, '#075bb5');
  assert.equal(settings.link_color, '#075bb5');
  assert.equal(settings.hover_link_color, '#06478d');
  assert.equal(settings.instant_search, true);
  for (const key of ['show_recent_activity', 'show_article_author', 'show_article_comments', 'show_follow_article', 'show_article_sharing']) assert.equal(settings[key], false, key);
});

test('package contains runtime files only and is excluded from corporate publishing', async () => {
  const files = await packageFiles();
  assert.ok(files.includes('templates/home_page.hbs'));
  assert.ok(files.includes('assets/new-request-form-bundle.js'));
  assert.ok(files.includes('settings/homepage_background_image.jpg'));
  assert.ok(files.every(f => !/(?:^|\/)(?:\.git|node_modules|src|tests|docs)(?:\/|$)/.test(f)));
  assert.ok(!files.includes('package.json'));
  assert.ok((await listPublicFiles()).every(f => !f.startsWith('zendesk/') && !f.startsWith('docs/')));
  const config = await readFile(new URL('../../_config.yml', import.meta.url), 'utf8');
  assert.match(config, /^  - zendesk$/m);
  assert.match(config, /^  - docs$/m);
});

test('package rejects symlinks, hidden files and unsupported asset types', async t => {
  const root = await mkdtemp(join(tmpdir(), 'arc-theme-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ['assets', 'settings', 'templates', 'translations']) await mkdir(join(root, dir));
  for (const file of ['manifest.json', 'script.js', 'style.css', 'thumbnail.png', 'LICENSE']) await writeFile(join(root, file), 'fixture');
  await packageFiles(root);
  await symlink(join(root, 'manifest.json'), join(root, 'assets', 'linked.json'));
  await assert.rejects(packageFiles(root), /Unsafe theme entry/);
  await rm(join(root, 'assets', 'linked.json'));
  await writeFile(join(root, 'assets', '.env'), 'fixture');
  await assert.rejects(packageFiles(root), /Unsafe theme entry/);
  await rm(join(root, 'assets', '.env'));
  await writeFile(join(root, 'assets', 'key.p8'), 'fixture');
  await assert.rejects(packageFiles(root), /Unsupported theme entry/);
});
