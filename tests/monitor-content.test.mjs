import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from '../scripts/site-files.mjs';
import { renderSupport } from '../scripts/render-support.mjs';
import { guidePlainText } from '../scripts/guide-inline.mjs';
const text = file => readFile(join(root, file), 'utf8');
const plain = value => value.replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').replace(/\s+/g, ' ');

test('public Monitor help follows the native recorded-count and fixed-snapshot contract', async () => {
  const guide = JSON.parse(await text('assets/data/spectra-guide.json'));
  const detection = guide.articles.find(article => article.content.id === 'detection').content;
  const overview = guidePlainText(detection.sections.find(section => section.id === 'monitor').body);
  for (const phrase of ['New identities recorded', 'excluding identities seen earlier in this Monitor session',
    'fixed activity snapshot while Monitor continues', 'close and reopen for later activity',
    'Stop Monitor opens the full retained inventory']) assert.ok(overview.includes(phrase), phrase);
  for (const file of ['content/support/findings.html', 'content/support/monitoring.html']) {
    const body = plain(await text(file));
    for (const phrase of ['New identities recorded', 'earlier in the same Monitor session',
      'View activity & help', 'snapshot', 'close and reopen',
      '40', 'physical devices', 'Stop Monitor', 'full retained inventory']) {
      assert.ok(body.toLowerCase().includes(phrase.toLowerCase()), `${file}: ${phrase}`);
    }
    assert.match(body, /(?:measurement|Monitor) continues/);
    assert.doesNotMatch(body, /three (?:dashboard )?counters|counts? can decrease as older events|must stop Monitor to (?:view|review)/i);
  }
  const monitor = plain(await text('content/support/monitoring.html'));
  for (const phrase of ['independent of the latest 40 retained events', 'fresh baseline, a quiet period, or inventory eviction',
    'fixed snapshot', 'Add 30 seconds to baseline', 'Unavailable, not zero', '45 seconds', 'Bonjour',
    'not required to read the activity snapshot', 'release candidate', 'public App Store version is 1.0.0']) {
    assert.ok(monitor.includes(phrase), phrase);
  }
  const generated = (await renderSupport()).get('help/monitoring.html');
  assert.deepEqual([...generated.matchAll(/<h2 id="(section-\d+)">([^<]+)<\/h2>/g)].map(match => [match[1], match[2]]), [
    ['section-1', 'Establish the starting comparison'], ['section-2', 'Read changes without overinterpreting them'],
    ['section-3', 'Acknowledge or restart intentionally'], ['section-4', 'Finish and review coverage'],
  ]);
});

test('candidate documentation and marketing do not claim 1.1.0 is already public', async () => {
  const publication = JSON.parse(await text('content/guide-publication.json'));
  const guide = JSON.parse(await text('assets/data/spectra-guide.json'));
  assert.equal(publication.documentationVersion, guide.appVersion);
  assert.equal(publication.documentationBuild, guide.build);
  assert.equal(publication.status, 'release-candidate');
  assert.equal(publication.publicVersion, '1.0.0');
  assert.equal(publication.publicBuild, '1079');
  assert.match(await text('guide.html'), /This Guide covers the 1\.1\.0 release candidate\. The public App Store version is 1\.0\.0/);
  const product = plain(await text('spectra.html'));
  for (const phrase of ['New identities recorded', 'excludes identities seen earlier in this Monitor session',
    'fixed snapshot while measurement continues', 'full retained inventory', '1.1.0 release candidate']) {
    assert.ok(product.includes(phrase), phrase);
  }
});
