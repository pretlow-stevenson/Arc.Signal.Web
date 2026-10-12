import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from './site-files.mjs';

const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const revision = value => createHash('sha256').update(value).digest('hex').slice(0, 12);
const slots = new Map([
  ['index.html', [['home', 'download', 'app-store-link', true]]],
  ['spectra.html', [['hero', null, 'button primary', false], ['product', 'app-store-download', 'app-store-link', true]]],
]);

export function appStoreDestination(configuration) {
  if (!configuration || Array.isArray(configuration)
    || Object.keys(configuration).length !== 1 || !Object.hasOwn(configuration, 'appStoreURL')) {
    throw new Error('Expected the single reviewed appStoreURL setting');
  }
  const value = configuration.appStoreURL;
  if (value === null) return null;
  if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value)) throw new Error('Invalid App Store URL');
  const url = new URL(value);
  if (url.origin !== 'https://apps.apple.com' || url.username || url.password || url.port || url.hash
    || /%(?:2f|5c|00)/i.test(url.pathname)
    || !/^\/(?:[a-z]{2}\/)?app\/(?:[^/]+\/)?id[1-9][0-9]*\/?$/i.test(url.pathname)) {
    throw new Error('Use a reviewed HTTPS App Store product URL');
  }
  return url.href;
}

export function downloadControl(destination, [slot, id, classes, badge]) {
  const identity = id ? ` id="${id}"` : '';
  const label = badge ? ' aria-label="Download Spectra on the App Store"' : '';
  const content = badge
    ? '<img src="assets/images/download-on-the-app-store.svg" width="180" height="60" alt="Download on the App Store">'
    : 'Get Spectra <span aria-hidden="true">↗</span>';
  const control = destination
    ? `<a class="${classes}"${identity}${label} href="${escape(destination)}" rel="noreferrer" referrerpolicy="no-referrer">${content}</a>`
    : `<button type="button" class="${classes}"${identity}${label} data-app-store-stub disabled>${content}</button><noscript><p class="caption">Releasing Fall 2026</p></noscript>`;
  return `<!-- spectra-download:${slot} -->${control}<!-- /spectra-download:${slot} -->`;
}

export async function renderDownloads(configuration, directory = root) {
  const destination = appStoreDestination(configuration);
  const [css, script] = await Promise.all(['assets/css/site.css', 'assets/js/site-download.js'].map(file => readFile(join(directory, file))));
  const output = new Map();
  for (const [file, controls] of slots) {
    let html = await readFile(join(directory, file), 'utf8');
    for (const specification of controls) {
      const slot = specification[0];
      const pattern = new RegExp(`<!-- spectra-download:${slot} -->[\\s\\S]*?<!-- /spectra-download:${slot} -->`, 'g');
      if ([...html.matchAll(pattern)].length !== 1) throw new Error(`Missing or repeated download slot: ${file}/${slot}`);
      html = html.replace(pattern, downloadControl(destination, specification));
    }
    const styles = /href="assets\/css\/site\.css(?:\?v=[a-f0-9]{12})?"/g;
    const scripts = /<script src="assets\/js\/site-download\.js(?:\?v=[a-f0-9]{12})?" defer><\/script>/g;
    if ([...html.matchAll(styles)].length !== 1 || [...html.matchAll(scripts)].length !== 1) throw new Error(`Invalid download asset references: ${file}`);
    html = html.replace(styles, `href="assets/css/site.css?v=${revision(css)}"`)
      .replace(scripts, `<script src="assets/js/site-download.js?v=${revision(script)}" defer></script>`);
    output.set(file, html);
  }
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length > 1 || (arguments_.length === 1 && arguments_[0] !== '--check')) {
    throw new Error('Use no arguments to generate, or --check to verify without writing');
  }
  const configuration = JSON.parse(await readFile(join(root, 'content/app-store.json'), 'utf8'));
  const output = await renderDownloads(configuration);
  for (const [file, html] of output) {
    if (process.argv.includes('--check')) {
      if (await readFile(join(root, file), 'utf8') !== html) throw new Error(`Stale download controls: ${file}. Run npm run downloads.`);
    } else await writeFile(join(root, file), html);
  }
}
