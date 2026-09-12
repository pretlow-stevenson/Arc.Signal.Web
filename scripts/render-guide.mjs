import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './site-files.mjs';

// Input is generated from Spectra's native Guide, never visitor-supplied HTML.
// Escape every value anyway: native help and public HTML have different contexts.
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
export async function renderGuide() {
  const document = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const product = await readFile(join(root, 'spectra.html'), 'utf8');
  const header = product.match(/<header\b[\s\S]*?<\/header>/)?.[0];
  const footer = product.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
  if (!header || !footer || document.schemaVersion !== 1 || !Array.isArray(document.articles)) throw new Error('Invalid guide source or site shell');
  const articles = document.articles;
  const seen = new Set();
  for (const { content: article } of articles) {
    if (!/^[a-z]+$/.test(article.id) || seen.has(article.id)) throw new Error('Invalid or duplicate topic');
    seen.add(article.id);
  }
  const sections = items => items.map(item => `<section><h3>${escape(item.title)}</h3><p>${escape(item.body)}</p></section>`).join('\n');
  const html = `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spectra Guide &amp; Support — Arc Signal</title>
  <meta name="description" content="Learn to use Spectra: permissions, Bluetooth, magnetic readings, Monitor baselines, saved sessions, JSON exports, privacy and troubleshooting.">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <link rel="canonical" href="https://arcsignal.app/guide.html">
  <link rel="stylesheet" href="assets/css/site.css">
  <link rel="stylesheet" href="assets/css/guide.css">
  <link rel="icon" href="assets/images/spectra-icon.png" type="image/png">
</head><body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${header.replace('href="spectra.html" aria-current="page"', 'href="spectra.html"').replace('href="guide.html"', 'href="guide.html" aria-current="page"')}
  <main id="main" tabindex="-1" class="shell guide-page">
    <div class="guide-intro"><p class="eyebrow">Spectra / Guide &amp; support</p><h1>Understand what<br>you’re <em>seeing.</em></h1>
    <p class="lead">Choose a topic for practical steps, clear explanations, and the limits that matter.</p>
    <p class="caption">Release ${escape(document.appVersion)} · Build ${escape(document.buildIdentifier)} · Also available offline in the app.</p>
    <p class="caption">${escape(document.supportedHardware)} · ${escape(document.minimumOS)}</p></div>
    <div class="guide-layout"><nav class="guide-contents" aria-label="Guide topics">
      <h2>Find an answer</h2>
      ${[...new Set(articles.map(a => a.category))].map(category => {
        const matching = articles.filter(a => a.category === category);
        return `<p class="eyebrow">${escape(matching[0].categoryTitle)}</p><ul>${matching.map(({ content: a }) => `<li><a href="#${escape(a.id)}">${escape(a.title)}</a></li>`).join('')}</ul>`;
      }).join('\n')}
      <a class="text-link" href="#support">Contact support</a>
    </nav><div class="guide-articles">
      ${articles.map(({ content: article }) => `<article id="${escape(article.id)}" class="guide-topic">
        <h2>${escape(article.title)}</h2><p class="guide-takeaway">${escape(article.takeaway)}</p>
        ${sections(article.sections)}
        <aside class="guide-important"><strong>Keep in mind</strong><p>${escape(article.important)}</p></aside>
        <section><h3>How to use it</h3><ol>${article.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol></section>
        <details><summary>More detail</summary>${sections(article.technicalSections)}</details>
        <a class="text-link" href="#main">Back to topics ↑</a>
      </article>`).join('\n')}
      <section id="support" class="guide-topic"><p class="eyebrow">A person can help</p><h2>Still have a question?</h2>
        <p>Email <a href="mailto:${escape(document.supportEmail)}">${escape(document.supportEmail)}</a>. Include the scan mode, selected measurements, what happened, and what you expected.</p>
        <p>In Spectra, choose Guide → Copy support information for the version, build, iOS, hardware model, and catalog revision. It contains no scan data. Review screenshots and exports for personal information before sharing.</p>
        <p>Nothing is attached or sent automatically. For a credible security threat, use a trusted security contact rather than relying on a phone scan or waiting for product support.</p>
      </section>
    </div></div>
  </main>${footer}
</body></html>\n`;
  return html;
}

if (process.argv.includes('--check')) {
  if (await readFile(join(root, 'guide.html'), 'utf8') !== await renderGuide()) throw new Error('Guide HTML is stale. Run npm run guide.');
} else if (process.argv[1]?.endsWith('render-guide.mjs')) {
  await writeFile(join(root, 'guide.html'), await renderGuide());
}
