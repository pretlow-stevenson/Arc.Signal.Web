import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root} from '../scripts/site-files.mjs';

const text = file => readFile(join(root, file), 'utf8');
const guide = JSON.parse(await text('assets/data/spectra-guide.json'));
const troubleshooting = await text('docs/zendesk-troubleshooting-article.html');
const product = await text('spectra.html');

test('live count guidance distinguishes recognized signal identities and explicit saved rechecks', () => {
  const counts = guide.articles.find(({content}) => content.id === 'troubleshooting')
    ?.content.sections.find(({id}) => id === 'live-counts')?.body;
  assert.ok(counts);
  for (const body of [counts, troubleshooting]) {
    for (const phrase of ['same recognition rules', 'not every nearby wearable',
      'without a supported match', 'One physical device can broadcast several identities',
      'Opening a saved session keeps its recorded interpretation', 'separate copy',
      'without changing the original']) assert.ok(body.includes(phrase), phrase);
  }
  assert.match(troubleshooting, /<h2 id="live-category-counts">/);
  assert.match(troubleshooting, /Company codes and generic services alone do not identify a watch or ring/);
  const liveSection = troubleshooting.split('<h2 id="live-category-counts">')[1]?.split('<h2')[0];
  assert.match(liveSection, /without changing the original/);
  assert.doesNotMatch(liveSection, /Some observations were not retained/);
  assert.match(troubleshooting, /<h2 id="observation-handling">Does an observation notice mean storage is full\?<\/h2>\s*<p><strong>Some observations were not retained/);
});

test('product count explanation links to canonical guidance without promising complete detection', () => {
  assert.match(product, /Do live counts show every nearby device\?/);
  assert.match(product, /signal identities, not physical devices/);
  assert.match(product, /other signals may remain unclassified/);
  assert.match(product, /href="guide.html#troubleshooting"/);
});
