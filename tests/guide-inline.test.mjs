import test from 'node:test';
import assert from 'node:assert/strict';
import { guideRuns, guidePlainText, renderGuideInline, escapeHTML } from '../scripts/guide-inline.mjs';

test('explicit UI labels preserve Unicode, spaces and reading order', () => {
  const source = 'Choose **Settings** → **About**, then read **Δ Reference**.';
  assert.equal(guidePlainText(source), 'Choose Settings → About, then read Δ Reference.');
  assert.deepEqual(guideRuns('**Not recently seen** means no recent observation.'), [
    { text: 'Not recently seen', emphasized: true },
    { text: ' means no recent observation.', emphasized: false },
  ]);
  assert.equal(renderGuideInline('Use **Storage & transfer**.'), 'Use <b class="ui-label">Storage &amp; transfer</b>.');
  assert.equal(guidePlainText('A\n **B**  C'), 'A\n B  C');
});

test('unsupported or malformed markup remains wholly literal', () => {
  for (const value of ['plain', '', '**open', '***triple***', '** leading**', '**trailing **',
    '****', '**line\nbreak**', '**line\rbreak**', '**line\u0085break**', '**line\u2028break**',
    '**ok** and **open', '`**code**`', '\\**escaped**', '**x***', '***x**',
    '**vertical\vtab**', '**form\ffeed**', '**\u200Bhidden**', '**hidden\u200B**']) {
    assert.equal(guidePlainText(value), value, value);
    assert.equal(renderGuideInline(value), escapeHTML(value), value);
  }
});

test('HTML and links never become executable or interactive', () => {
  for (const value of ['<script>alert(1)</script>', '**<img src=x onerror=alert(1)>**',
    '**[label](javascript:alert(1))**', 'https://example.invalid', '&lt;script&gt;',
    'Use **<a href="x">name</a>**', '**" onclick="alert(1)**']) {
    const html = renderGuideInline(value);
    assert.doesNotMatch(html, /<(?:script|img|a)\b/i);
    assert.equal(html.replace(/<b class="ui-label">|<\/b>/g, ''), escapeHTML(guidePlainText(value)));
  }
});

test('Foundation boundary whitespace differs from JavaScript trim', () => {
  assert.equal(guidePlainText('**\uFEFFlabel**'), '\uFEFFlabel');
  for (const space of ['\t', '\u0085', '\u00A0', '\u1680', '\u2000', '\u200B', '\u202F', '\u205F', '\u3000']) {
    const text = `**${space}label**`;
    assert.equal(guidePlainText(text), text);
  }
});
