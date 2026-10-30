// Builds the static site into _site/ and creates one share page per published product
// (/p/<id>/) with Open Graph tags, so WhatsApp/Facebook show the product photo.
import { mkdirSync, cpSync, writeFileSync, existsSync } from 'node:fs';
const SB = 'https://xmdbknlmdzodilvcbpwj.supabase.co', KEY = 'sb_publishable_nJQfqCvShsVCkDknNhfb6w_O5aJLvAL';
const SITE = 'https://shop.modusvestendi.com';
const H = {apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json'};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
mkdirSync('_site', {recursive: true});
for (const f of ['index.html', 'preview.html', 'CNAME', '.nojekyll', 'icons']) if (existsSync(f)) cpSync(f, '_site/' + f, {recursive: true});
const res = await fetch(SB + '/rest/v1/rpc/shop_catalog', {method: 'POST', headers: H, body: '{}'});
const P = res.ok ? await res.json() : [];
if (!res.ok) console.error('catalog error', res.status, await res.text());
let n = 0;
for (const p of P){
  let img = SITE + '/icons/icon-512.png';
  if (p.photos?.[0]){
    const r = await fetch(`${SB}/storage/v1/object/sign/foto/${p.photos[0].split('/').map(encodeURIComponent).join('/')}`, {method: 'POST', headers: H, body: JSON.stringify({expiresIn: 60 * 60 * 24 * 365})});
    if (r.ok){ const j = await r.json(); if (j.signedURL) img = SB + '/storage/v1' + j.signedURL; }
  }
  const prices = p.variants.map(v => Number(v.price)); const min = Math.min(...prices);
  const sale = Number(p.list_price) > min + 0.5;
  const title = `${p.brand || ''} ${p.name}`.trim() + ` · ${min} €` + (sale ? ` (-${Math.round((1 - min / p.list_price) * 100)}%)` : '');
  const sizes = [...new Set(p.variants.map(v => v.size))].join(' · ');
  const desc = [p.category?.sq, sizes && ('Masa: ' + sizes), 'Pagesë në dorëzim · Modus Vestendi'].filter(Boolean).join(' · ');
  const url = `${SITE}/p/${p.id}/`;
  const html = `<!doctype html><html lang="sq"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Modus Vestendi</title><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="product"><meta property="og:site_name" content="Modus Vestendi">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:image:alt" content="${esc(p.brand + ' ' + p.name)}">
<meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image">
<meta property="product:price:amount" content="${min}"><meta property="product:price:currency" content="EUR">
<link rel="canonical" href="${esc(url)}"><link rel="icon" href="/icons/favicon.png">
<script>location.replace('/' + location.search + '#/p/${p.id}');</script>
<meta http-equiv="refresh" content="0; url=/#/p/${p.id}"></head>
<body style="font-family:sans-serif;text-align:center;padding:40px"><a href="/#/p/${p.id}">${esc(title)}</a></body></html>`;
  mkdirSync(`_site/p/${p.id}`, {recursive: true}); writeFileSync(`_site/p/${p.id}/index.html`, html); n++;
}
// products published after the last build: /p/<id>/ falls back to the 404 page, which redirects
writeFileSync('_site/404.html', `<!doctype html><html><head><meta charset="utf-8"><title>Modus Vestendi</title><script>
var m = location.pathname.match(/\\/p\\/(\\d+)/); location.replace('/' + (m ? '#/p/' + m[1] : ''));</script></head><body></body></html>`);
console.log('share pages:', n);
