import { readdir, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const supportDocuments = Object.freeze(['support.html',
  'help/getting-started.html', 'help/travel.html', 'help/findings.html', 'help/magnetic-meter.html',
  'help/monitoring.html', 'help/troubleshooting.html', 'help/sessions.html', 'help/apple-watch.html',
  'help/about.html', 'help/contact.html']);
export const documents = ['index.html', 'spectra.html', 'founder.html', 'seamless.html', 'guide.html', 'spectra-privacy.html', '404.html', ...supportDocuments];
const publicFiles = [...documents, 'CNAME', 'robots.txt', 'sitemap.xml'];
// Publishing an asset is a deliberate decision. A supported extension alone
// cannot distinguish our public Guide from a private scan archive or key.
export const publicAssets = Object.freeze([
  'assets/css/guide.css', 'assets/css/site.css',
  'assets/data/spectra-brand.json', 'assets/data/spectra-guide.json', 'assets/data/spectra-screenshots.json',
  'assets/data/spectra-watch-screenshots.json',
  'assets/fonts/Bodoni-Moda-OFL.txt', 'assets/fonts/Inter-OFL.txt',
  'assets/fonts/bodoni-moda-latin.woff2', 'assets/fonts/inter-latin.woff2',
  'assets/images/download-on-the-app-store.svg', 'assets/images/nordvpn-logo.svg',
  'assets/images/seamless-icon.png', 'assets/images/seamless-result.png', 'assets/images/seamless-sequence.png',
  'assets/images/spectra-area-sweep.webp', 'assets/images/spectra-icon.png', 'assets/images/spectra-icon-inverted.png',
  'assets/images/spectra-independent-development.webp',
  'assets/images/spectra-monitor.webp',
  'assets/images/spectra-overview.webp', 'assets/images/spectra-smart-glasses.webp',
  'assets/images/spectra-privacy-illustration.webp', 'assets/images/spectra-travel-illustration.webp',
  'assets/images/spectra-touch-icon.png', 'assets/images/spectra-wordmark.webp',
  'assets/images/spectra-watch-start.webp', 'assets/images/spectra-watch-complete.webp', 'assets/images/spectra-watch-frame.webp',
  'assets/js/site-motion.js', 'assets/js/site-download.js',
]);
const approvedAssets = new Set(publicAssets);
const approvedHelp = new Set(supportDocuments.filter(path => path.startsWith('help/')));

// Resolve against the viewed document, including nested and absolute first-party
// links. The publication manifest, not a hostname prefix, determines existence.
export function resolvePublicReference(document, value, files, idsByDocument) {
  if (typeof value !== 'string' || !value || /[\u0000-\u0020\\]/.test(value) || /&(?!(?:amp;))/i.test(value)) throw new Error('Invalid public reference');
  const origin = 'https://arcsignal.app';
  const url = new URL(value.replaceAll('&amp;', '&'), `${origin}/${document}`);
  if (url.origin !== origin || url.username || url.password) throw new Error(`Unsupported public reference: ${value}`);
  if (/%(?:2f|5c)/i.test(url.pathname)) throw new Error('Encoded public path separator');
  const target = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
  if (!files.includes(target)) throw new Error(`${document}: missing ${target}`);
  if (url.search && !/^\/assets\/(?:images\/spectra-[a-z-]+\.webp|css\/(?:site|guide)\.css|js\/site-(?:motion|download)\.js)$/.test(url.pathname)) throw new Error('Unreviewed public query');
  if (url.search && !/^\?v=[a-f0-9]{12}$/.test(url.search)) throw new Error('Unreviewed public query');
  if (value.includes('#')) {
    const fragment = decodeURIComponent(url.hash.slice(1));
    if (!fragment || !idsByDocument.get(target)?.includes(fragment)) throw new Error(`${document}: missing #${fragment}`);
  }
  return target;
}

// One explicit public surface for validation and export. Never follow symlinks
// or publish Git metadata, development scripts, credentials, or test artifacts.
export async function listPublicFiles(directory = root) {
  const files = [...publicFiles];
  async function walk(relative) {
    const entries = await readdir(join(directory, relative), { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.')) throw new Error(`Hidden asset is not publishable: ${entry.name}`);
      const path = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Asset symlink is not publishable: ${path}`);
      if (entry.isDirectory()) {
        if (!publicAssets.some(asset => asset.startsWith(`${path}/`))) throw new Error(`Unreviewed asset directory: ${path}`);
        await walk(path);
      } else if (entry.isFile()) {
        if (!approvedAssets.has(path)) throw new Error(`Unreviewed asset is not publishable: ${path}`);
        files.push(path);
      }
      else throw new Error(`Unsupported asset type: ${path}`);
    }
  }
  if (!(await lstat(join(directory, 'assets'))).isDirectory()) throw new Error('Expected a real assets directory');
  await walk('assets');
  if (!(await lstat(join(directory, 'help'))).isDirectory()) throw new Error('Expected a real help directory');
  for (const entry of await readdir(join(directory, 'help'), { withFileTypes: true })) {
    const path = `help/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Help symlink is not publishable: ${path}`);
    if (!entry.isFile() || !approvedHelp.has(path)) throw new Error(`Unreviewed help entry is not publishable: ${path}`);
  }
  for (const asset of publicAssets) {
    if (!files.includes(asset)) throw new Error(`Missing reviewed public asset: ${asset}`);
  }
  for (const path of files) {
    if (!(await lstat(join(directory, path))).isFile()) throw new Error(`Expected a regular public file: ${path}`);
  }
  return files;
}
