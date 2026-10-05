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

test('network roles and saved Bluetooth follow-up retain their identity and privacy limits', () => {
  const guide = JSON.parse(readFileSync(new URL('../assets/data/spectra-guide.json', import.meta.url), 'utf8'));
  const section = (article, id) => {
    const content = guide.articles.find(a => a.content.id === article).content;
    return [...content.sections, ...content.technicalSections].find(s => s.id === id).body;
  };
  const roles = section('detection', 'network-roles');
  for (const phrase of ['printing, scanning, file sharing, media, automation',
    'not necessarily a physical device', '**Possible** product or family', 'instead of inventing a model']) {
    assert.ok(roles.includes(phrase), phrase);
  }
  const proximity = section('bluetooth', 'saved-proximity');
  for (const phrase of ['fresh, unsaved listen', 'never reuses an old reading', 'can retain a private reference',
    'Older sessions, imported files, and Watch captures', '**System name**', 'Confirm a suggestion',
    'do not prove it is the same physical device']) assert.ok(proximity.includes(phrase), phrase);
  const identity = section('privacy', 'identity');
  for (const phrase of ['can also retain', 'protected local history', 'no raw Bluetooth framework identifier',
    'never included in JSON, AI copies, or Watch transfers', 'subject to iOS backup behavior',
    'Removing the last non-imported original or recheck copy', 'imported copies cannot keep it',
    '**Undo**', 'clear protected recovery copies']) {
    assert.ok(identity.includes(phrase), phrase);
  }
  const findings = readFileSync(new URL('../docs/zendesk-findings-article.html', import.meta.url), 'utf8');
  assert.ok(findings.includes('A network role without an exact model'));
  assert.ok(findings.includes('can retain'));
  const sessions = readFileSync(new URL('../docs/zendesk-session-article.html', import.meta.url), 'utf8');
  assert.ok(sessions.includes('Follow up with a fresh signal check'));
  const policy = readFileSync(new URL('../spectra-privacy.html', import.meta.url), 'utf8');
  assert.ok(policy.includes('capture-specific'));
  assert.ok(policy.includes('Undo'));
  assert.doesNotMatch(proximity, /guaranteed|authenticated identity|distance estimate/i);
});
