// Only author-selected **UI labels** have presentation meaning. This is not a
// Markdown or HTML parser. Keep the contract aligned with native GuideInlineText.
export const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
// Match Foundation.whitespacesAndNewlines, not JavaScript trim(): Foundation
// includes zero-width space and excludes BOM. This preserves native/web parity.
const edgeWhitespace = /^[\u0009-\u000D\u0020\u0085\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]|[\u0009-\u000D\u0020\u0085\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]$/u;

export function guideRuns(value) {
  const source = String(value);
  const literal = () => [{ text: source, emphasized: false }];
  if (source.includes('`') || source.includes('\\**')) return literal();
  const parts = source.split('**');
  if (parts.length < 3 || parts.length % 2 === 0) return literal();
  for (let i = 1; i < parts.length; i += 2) {
    const label = parts[i];
    if (!label || edgeWhitespace.test(label) || /[\n\r\v\f\u0085\u2028\u2029]/u.test(label)
        || label.startsWith('*') || label.endsWith('*')
        || parts[i - 1].endsWith('*') || parts[i + 1].startsWith('*')) return literal();
  }
  return parts.map((text, index) => ({ text, emphasized: index % 2 === 1 })).filter(run => run.text.length);
}

export const guidePlainText = value => guideRuns(value).map(run => run.text).join('');
export const renderGuideInline = value => guideRuns(value).map(run => run.emphasized
  ? `<b class="ui-label">${escapeHTML(run.text)}</b>` : escapeHTML(run.text)).join('');
