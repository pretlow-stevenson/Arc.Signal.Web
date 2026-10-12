import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {root, supportDocuments} from './site-files.mjs';
import {escapeHTML as escape} from './guide-inline.mjs';

export const supportEmail = 'support@arcsignalllc.zohodesk.com';
const origin = 'https://arcsignal.app';
const tags = new Set(['p','h2','strong','ol','li','ul','a','figure','img','figcaption']);
const attributes = new Set(['id','href','src','width','height','alt']);
const appleDrawing = 'https://developer.apple.com/download/files/accessories/dimensional-drawings/iphone-17-pro-max.pdf';
const appleMapsPrivacy = 'https://www.apple.com/legal/privacy/data/en/apple-maps/';

// These are reviewed first-party manuscripts, not uploaded or visitor HTML.
// Fail closed on new executable markup, attributes, destinations or source paths.
export function validateSupportBody(body) {
  if (typeof body !== 'string' || body.length < 100 || /zendesk|\son[a-z]+\s*=|<!--|<!|<\?/i.test(body)) throw new Error('Invalid support manuscript');
  const stack=[];
  for (const [element] of body.matchAll(/<[^>]*>/g)) {
    const name = element.match(/^<\/?([a-z][a-z0-9]*)\b/)?.[1];
    if (!tags.has(name)) throw new Error('Unreviewed support element');
    const pairs = [...element.matchAll(/\s([a-z-]+)="([^"]*)"/g)];
    if (new Set(pairs.map(pair=>pair[1])).size !== pairs.length) throw new Error('Duplicate support attribute');
    if (element.startsWith('</')) {
      if (pairs.length || name === 'img' || stack.pop() !== name) throw new Error('Unbalanced support element');
    } else if (name !== 'img') {
      if (element.endsWith('/>')) throw new Error('Invalid self-closing support element');
      stack.push(name);
    }
    for (const [,key,value] of pairs) {
      if (!attributes.has(key)) throw new Error('Unreviewed support attribute');
      if (!(key === 'id' || (name === 'a' && key === 'href') || (name === 'img' && ['src','width','height','alt'].includes(key)))) throw new Error('Invalid support attribute placement');
      if (key === 'id' && !/^[a-z][a-z0-9_-]*$/i.test(value)) throw new Error('Invalid support anchor');
      if (['width','height'].includes(key) && !/^[1-9][0-9]{0,3}$/.test(value)) throw new Error('Invalid image dimensions');
      if (['href','src'].includes(key)) {
        if (/&(?!(?:amp;))/.test(value)) throw new Error('Encoded support destination');
        const url = new URL(value.replaceAll('&amp;','&'),origin);
        if (url.username || url.password || !(url.origin === origin || (key === 'href' &&
          (url.href === appleDrawing || url.href === appleMapsPrivacy || url.href === `mailto:${supportEmail}`)))) throw new Error('Unreviewed support destination');
        if (key === 'src' && (!url.pathname.startsWith('/assets/images/') || url.hash)) throw new Error('Unreviewed support image');
      }
    }
    if (element.replace(/^<\/?[a-z][a-z0-9]*/,'').replace(/\s[a-z-]+="[^"]*"/g,'').replace(/\/?\s*>$/,'').trim()) throw new Error('Malformed support attributes');
  }
  if (stack.length) throw new Error('Unbalanced support manuscript');
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if (new Set(ids).size !== ids.length || ids.some(id=>['main','article','article-contents','contact'].includes(id))) throw new Error('Duplicate or reserved support anchor');
  return body;
}

export async function supportSources() {
  const manifest = JSON.parse(await readFile(join(root,'content/support/articles.json'),'utf8'));
  if (!Array.isArray(manifest) || manifest.length !== 10) throw new Error('Expected all ten support articles');
  const seen = new Set();
  return Promise.all(manifest.map(async item=>{
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(item.slug) || seen.has(item.slug)
      || item.file !== `content/support/${item.slug}.html`
      || !supportDocuments.includes(`help/${item.slug}.html`)
      || ![item.title,item.section,item.description].every(value=>typeof value === 'string' && value.trim().length > 0)) throw new Error('Invalid support inventory');
    seen.add(item.slug);
    const html = validateSupportBody(await readFile(join(root,item.file),'utf8'));
    // All local resources stay on the currently viewed origin in local previews.
    return {...item,html:html.replaceAll(`${origin}/`,'/')};
  }));
}

function sectionHeadings(body) {
  let index=0;
  const headings=[];
  const html=body.replace(/<h2(?: id="([^"]+)")?>([^<]+)<\/h2>/g,(_,id,title)=>{
    const anchor=id??`section-${++index}`;
    headings.push({id:anchor,title});
    return `<h2 id="${anchor}">${title}</h2>`;
  });
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if (new Set(ids).size!==ids.length) throw new Error('Generated support anchors collide');
  return {html,headings};
}
const plain=value=>value.replace(/<[^>]+>/g,'').replaceAll('&amp;','&');

export async function renderSupport() {
  const articles=await supportSources();
  const styleRevision = async file => createHash('sha256').update(await readFile(join(root,file))).digest('hex').slice(0,12);
  const siteStyle=await styleRevision('assets/css/site.css'), guideStyle=await styleRevision('assets/css/guide.css');
  const product=await readFile(join(root,'spectra.html'),'utf8');
  const header=product.match(/<header\b[\s\S]*?<\/header>/)?.[0];
  const footer=product.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
  if (!header || !footer) throw new Error('Missing support site shell');
  const shell=html=>html.replaceAll('href="spectra.html" aria-current="page"','href="spectra.html"')
    .replaceAll('href="support.html"','href="support.html" aria-current="page"')
    .replace(/\b(href|src)="(?![a-z]+:|\/|#)([^"]+)"/g,'$1="/$2"');
  const page=(title,description,path,body)=>`<!doctype html>\n<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} — Arc Signal</title><meta name="description" content="${escape(description)}">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin"><link rel="canonical" href="${origin}/${path}">
<link rel="stylesheet" href="/assets/css/site.css?v=${siteStyle}"><link rel="stylesheet" href="/assets/css/guide.css?v=${guideStyle}">
<link rel="icon" href="/assets/images/spectra-icon.png" type="image/png">
</head><body><a class="skip-link" href="#main">Skip to content</a>${shell(header)}
<main id="main" tabindex="-1" class="shell guide-page support-page">${body}</main>${shell(footer)}</body></html>\n`;
  const contact=`<section id="contact" class="guide-topic support-contact"><p class="eyebrow">Email support</p><h2>Need a hand?</h2>
<p>Tell us what you tried, what you expected, and what happened. Start with a description—not private scan data.</p>
<a class="button primary" href="mailto:${supportEmail}">Email support</a><p class="support-address">${supportEmail}</p>
<p class="caption">Opens your mail app. Nothing is attached or sent automatically.</p>
<p class="caption">Zoho Desk handles the information you choose to email. Review attachments before sending. See our <a href="/spectra-privacy.html#support">support privacy information</a>.</p>
<a class="text-link" href="/help/contact.html">What to include in a support request</a></section>`;
  const groups=[...new Set(articles.map(a=>a.section))];
  const hub=`<div class="guide-intro"><p class="eyebrow">Arc Signal / Support</p><h1>How can we help?</h1>
<p class="lead">Practical guidance for Spectra, clear answers, and help when you need it.</p>
<p>Explore a topic below, read the <a href="/guide.html">complete Spectra Guide</a>, or <a href="#contact">contact support</a>.</p></div>
<div class="support-groups">${groups.map(group=>`<section class="support-group"><h2>${escape(group)}</h2><ul>${articles.filter(a=>a.section===group).map(a=>`<li><a href="/help/${a.slug}.html">${escape(a.title)}</a><p>${escape(a.description)}</p></li>`).join('')}</ul></section>`).join('')}</div>
${contact}`;
  const output=new Map([['support.html',page('Support','Find Spectra help, troubleshooting, magnetic-meter guidance, Experimental Apple Watch instructions, and email support.','support.html',hub)]]);
  for(const article of articles){
    const {html,headings}=sectionHeadings(article.html);
    const contents=`<nav id="article-contents" class="guide-contents" aria-label="On this page"><h2>On this page</h2><ul>${headings.map(h=>`<li><a href="#${h.id}">${escape(plain(h.title))}</a></li>`).join('')}</ul><a class="text-link" href="/support.html">All support topics</a><a class="text-link" href="/guide.html">Complete Spectra Guide</a></nav>`;
    const body=`<div class="guide-intro"><p class="eyebrow"><a href="/support.html">Support</a> / ${escape(article.section)}</p><h1>${escape(article.title)}</h1><a class="text-link" href="#article">Read article ↓</a></div>
<div class="guide-layout">${contents}<article id="article" tabindex="-1" class="guide-topic support-article">${html}<a class="text-link" href="#main">Back to top ↑</a><p><a href="/support.html#contact">Contact support</a></p></article></div>`;
    output.set(`help/${article.slug}.html`,page(article.title,article.description,`help/${article.slug}.html`,body));
  }
  if (output.size!==11 || [...output.keys()].some(file=>!supportDocuments.includes(file))) throw new Error('Support publication inventory mismatch');
  return output;
}

if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href){
  const pages=await renderSupport();
  if(process.argv.includes('--check')){
    for(const [file,html] of pages) if(await readFile(join(root,file),'utf8')!==html) throw new Error('Stale support page '+file);
  }else{
    await mkdir(join(root,'help'),{recursive:true});
    for(const [file,html] of pages) await writeFile(join(root,file),html);
  }
}
