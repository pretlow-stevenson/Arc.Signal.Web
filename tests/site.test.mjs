import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { root, documents, listPublicFiles } from '../scripts/site-files.mjs';

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

test('App Store availability is explicit and cannot navigate to a fabricated listing', () => {
  const html = pages.get('index.html');
  assert.match(html, /<button\b[^>]*disabled[^>]*>App Store · Coming soon<\/button>/);
  assert.match(html, /isn’t available to download yet/);
  assert.doesNotMatch(html, /apps\.apple\.com|itunes\.apple\.com|Download now|Get it now/i);
});

test('marketing retains the important measurement and identity limits', () => {
  const html = pages.get('index.html');
  for (const text of ['Arc Signal LLC', 'joined Wi-Fi network', 'not an exact distance or direction', 'cannot guarantee', 'Foreground', 'possible or probable', 'without pairing with or connecting']) {
    assert.ok(html.includes(text), `Missing qualification: ${text}`);
  }
  assert.match(html, /<summary>Can Spectra tell me a room is safe\?<\/summary><p>No\./);
});

test('keyboard access, reduced motion, responsive layouts and image dimensions remain present', () => {
  assert.match(pages.get('index.html'), /class="skip-link" href="#main"/);
  for (const html of pages.values()) {
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
  for (const [foreground, background] of [['535a65', 'f7f7f5'], ['535a65', 'e1ecf8'], ['075bb5', 'eef2f6'], ['b6c4d4', '111820'], ['ffffff', '075bb5']]) {
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
  const html = pages.get('index.html');
  assert.match(html, /Readings are simulated examples, not evidence of nearby devices/);
  for (const name of ['spectra-home', 'spectra-magnetic']) {
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
  assert.ok(bytes.reduce((sum, value) => sum + value, 0) < 2_000_000, 'Public assets exceed the 2 MB budget');
  assert.equal((await readFile(join(root, 'CNAME'), 'utf8')).trim(), 'arcsignal.app');
  assert.match(await readFile(join(root, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/arcsignal\.app\/<\/loc>/);
});
