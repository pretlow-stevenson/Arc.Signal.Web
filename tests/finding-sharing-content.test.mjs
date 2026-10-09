import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root} from '../scripts/site-files.mjs';

const text = file => readFile(join(root, file), 'utf8');
const guide = JSON.parse(await text('assets/data/spectra-guide.json'));
const product = await text('spectra.html');
const policy = await text('spectra-privacy.html');
const support = await text('docs/zendesk-session-article.html');
const troubleshooting = await text('docs/zendesk-troubleshooting-article.html');
const section = (topic, id) => guide.articles.find(({content}) => content.id === topic)
  ?.content.sections.find(item => item.id === id)?.body;

test('one external finding entry consistently identifies prepared instructions and reviewed scope', () => {
  for (const body of [section('exporting', 'copy-finding'), section('privacy', 'external-copy'),
    product, policy, support]) {
    assert.ok(body);
    assert.match(body, /Use Another App/);
    assert.doesNotMatch(body, /Share for Analysis|Copy for Analysis|Copy for AI analysis|Copy prompt and finding/);
  }
  assert.match(section('exporting', 'copy-finding'), /analysis prompt before the selected finding’s evidence/);
  assert.match(support, /analysis prompt followed by one selected finding’s evidence/);
  assert.match(product, /ready-to-use prompt before the selected finding’s evidence/);
  assert.match(policy, /analysis prompt followed by bounded finding evidence locally/);
  assert.match(section('exporting', 'copy-finding'), /choose \*\*Share\*\* or \*\*Copy\*\* on the same screen/);
  assert.match(support, /On that same review screen, choose/);
  assert.match(policy, /offers one optional review before you choose/);
  assert.match(support, /<h2 id="h_01M479WCTMPHQSZM5A2BEE4DPC">Understand one finding<\/h2>/);
});

test('external sharing does not inherit dedicated clipboard lifetime or guarantee recipient behavior', () => {
  for (const body of [policy, support]) {
    assert.match(body, /ten-minute/);
    assert.match(body, /recipient copies|copies made by recipients/);
    assert.match(body, /cannot recall/);
    assert.match(body, /does not share it automatically/);
    assert.match(body, /depend on|depends on/);
    assert.doesNotMatch(body, /shared text expires|guaranteed analysis|all AI apps/);
  }
  assert.match(policy, /This limit applies to that clipboard item, not shared text/);
  assert.match(policy, /Some destinations may send it immediately/);
  assert.match(support, /Some share destinations may send it immediately/);
  assert.match(policy, /location tags, other findings, and generated AI text/);
  assert.match(support, /does not expire shared text or recipient copies/);
  assert.match(troubleshooting, /Sharing or copying for external analysis remains a separate deliberate choice, not an automatic fallback/);
  assert.doesNotMatch(troubleshooting, /External AI copying remains/);
});
