import { readdir, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const documents = ['index.html', 'spectra.html', 'seamless.html', 'guide.html', 'spectra-privacy.html', '404.html'];
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
  'assets/images/spectra-area-sweep.webp', 'assets/images/spectra-icon.png', 'assets/images/spectra-monitor.webp',
  'assets/images/spectra-overview.webp', 'assets/images/spectra-smart-glasses.webp',
  'assets/images/spectra-touch-icon.png', 'assets/images/spectra-wordmark.webp',
  'assets/images/spectra-watch-start.webp', 'assets/images/spectra-watch-complete.webp',
  'assets/js/site-motion.js',
]);
const approvedAssets = new Set(publicAssets);

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
  for (const asset of publicAssets) {
    if (!files.includes(asset)) throw new Error(`Missing reviewed public asset: ${asset}`);
  }
  for (const path of files) {
    if (!(await lstat(join(directory, path))).isFile()) throw new Error(`Expected a regular public file: ${path}`);
  }
  return files;
}
