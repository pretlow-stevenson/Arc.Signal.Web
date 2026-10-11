import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  .replace(/<[^>]*>/g, '').replaceAll('&amp;', '&');
const guide = JSON.parse(readFileSync(new URL('../assets/data/spectra-guide.json', import.meta.url), 'utf8'));
const section = (article, id) => {
  const found = guide.articles.find(value => value.content.id === article)?.content.sections.find(value => value.id === id);
  assert.ok(found, `${article}/${id}`);
  return found.body.replaceAll('**', '');
};

test('local search explains metadata scope and original context is not another selectable match', () => {
  for (const text of [section('sessions', 'search'), page('docs/zendesk-session-article.html')]) {
    for (const phrase of ['Search sessions', 'bottom of the screen', 'notes', 'source information',
      'not device names or raw evidence', 'Original capture · Context',
      'not another match and cannot be selected', 'Search Guide']) assert.ok(text.includes(phrase), phrase);
  }
  assert.match(page('spectra.html'), /Search sessions.*not device names or raw payloads/s);
  assert.match(page('spectra-privacy.html'), /locally, not every device name or payload/);
});

test('one-time saving preserves the preference and completion feedback does not certify results', () => {
  for (const text of [section('sessions', 'saving'), page('docs/zendesk-session-article.html'),
    page('docs/zendesk-getting-started-article.html'), page('spectra-privacy.html'), page('spectra.html')]) {
    assert.match(text, /Save Session/);
    assert.match(text, /without changing your preference/);
  }
  for (const text of [section('setup', 'completion-feedback'), page('docs/zendesk-getting-started-article.html')]) {
    assert.match(text, /Completion haptic/);
    assert.match(text, /off by default/);
    assert.match(text, /separate from the Watch’s setting/);
    assert.match(text, /may suppress feedback/);
    assert.match(text, /does not confirm (?:that the session was saved|saving)/);
    assert.match(text, /coverage/);
    assert.match(text, /safe/);
  }
});

test('selected collection export remains exact, reviewed and location-excluding', () => {
  for (const text of [section('sessions', 'export-selected'), page('docs/zendesk-session-article.html'),
    page('spectra-privacy.html')]) {
    assert.match(text, /Export Selected/);
    assert.match(text, /Search and filters stay fixed/);
    assert.match(text, /privacy review/);
    assert.match(text, /original.*(?:does not|never automatically).*includes? (?:its )?rechecks(?: automatically)?/);
    assert.match(text, /original-capture context cannot be selected/);
    assert.match(text, /Location tags are excluded by default/);
    assert.match(text, /Exporting leaves (?:saved )?history unchanged|exporting leaves saved history unchanged/);
  }
});

test('Watch arrival cue follows saving without altering capture chronology or Experimental scope', () => {
  for (const text of [section('watch', 'handoff'), page('docs/zendesk-watch-article.html'), page('spectra.html')]) {
    assert.match(text, /Watch sweep added/);
    assert.match(text, /View/);
    assert.match(text, /(?:result is saved|after a new result is saved)/);
    assert.match(text, /(?:does not open results automatically or send a notification|Nothing opens automatically and no notification is sent)/);
    assert.match(text, /original capture date/);
  }
  const watch = page('docs/zendesk-watch-article.html');
  assert.match(watch, /Experimental/);
  assert.match(watch, /not a background scanner/);
  assert.match(watch, /Completion haptic is on by default/);
  assert.match(watch, /iPhone’s optional completion haptic is off by default and has a separate setting/);
});
