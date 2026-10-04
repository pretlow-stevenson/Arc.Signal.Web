import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('included recognition improvements have consistent scope across public content', () => {
  for (const file of ['index.html', 'spectra.html', 'docs/zendesk-getting-started-article.html',
    'docs/zendesk-session-article.html', 'docs/zendesk-about-article.html']) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const phrase of ['device catalog and detection engine', 'App Store updates at no additional charge']) {
      assert.ok(text.includes(phrase), `${file}: ${phrase}`);
    }
    assert.doesNotMatch(text, /lifetime updates|guaranteed recognition|continuous catalog downloads/i);
  }
  const guide = JSON.parse(readFileSync(new URL('../assets/data/spectra-guide.json', import.meta.url), 'utf8'));
  const section = guide.articles.find(a => a.content.id === 'detection').content.sections.find(s => s.id === 'recognition-updates');
  assert.ok(section.body.includes('at no additional charge'));
  assert.ok(section.body.includes('no separate catalog download or subscription'));
  assert.ok(section.body.includes('does not guarantee a match'));
});

test('shared identity guidance separates product knowledge from protocol evidence and physical devices', () => {
  const guide = JSON.parse(readFileSync(new URL('../assets/data/spectra-guide.json', import.meta.url), 'utf8'));
  const technical = guide.articles.find(a => a.content.id === 'detection').content.technicalSections;
  const shared = technical.find(s => s.id === 'sources').body;
  assert.ok(shared.includes('both Bluetooth and local-network observations'));
  assert.ok(shared.includes('does not merge the observations'));
  assert.ok(shared.includes('not removed from ordinary network names'));
  const formats = technical.find(s => s.id === 'service-formats').body;
  for (const phrase of ['Weave setup advertisement', 'Bluetooth Mesh setup advertisement',
    'Bluetooth Mesh proxy advertisement', 'AltBeacon proximity broadcast', 'not the Matter registry',
    'raw bytes', 'review it before sharing']) assert.ok(formats.includes(phrase), phrase);
  const findings = readFileSync(new URL('../docs/zendesk-findings-article.html', import.meta.url), 'utf8');
  const troubleshooting = readFileSync(new URL('../docs/zendesk-troubleshooting-article.html', import.meta.url), 'utf8');
  assert.ok(findings.includes('id="shared-names-separate-sources"'));
  for (const copy of [findings, troubleshooting]) {
    for (const phrase of ['Weave', 'Bluetooth Mesh', 'AltBeacon', 'does not merge']) assert.ok(copy.includes(phrase), phrase);
  }
});
