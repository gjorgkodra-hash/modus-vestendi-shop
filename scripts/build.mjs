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
const IMG = {}; // product id -> signed first photo (1 year)
for (const p of P){
  let img = SITE + '/icons/icon-512.png';
  if (p.photos?.[0]){
    const r = await fetch(`${SB}/storage/v1/object/sign/foto/${p.photos[0].split('/').map(encodeURIComponent).join('/')}`, {method: 'POST', headers: H, body: JSON.stringify({expiresIn: 60 * 60 * 24 * 365})});
    if (r.ok){ const j = await r.json(); if (j.signedURL) img = SB + '/storage/v1' + j.signedURL; }
  }
  IMG[p.id] = img;
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
// ---------- blog: one real, indexable page per published article (/blog/<slug>/) + /blog/ ----------
const sign = async path => { const r = await fetch(`${SB}/storage/v1/object/sign/foto/${path.split('/').map(encodeURIComponent).join('/')}`, {method: 'POST', headers: H, body: JSON.stringify({expiresIn: 60 * 60 * 24 * 365})}); if (!r.ok) return null; const j = await r.json(); return j.signedURL ? SB + '/storage/v1' + j.signedURL : null; };
const rb = await fetch(SB + '/rest/v1/rpc/shop_blog', {method: 'POST', headers: H, body: '{}'});
const BLOG = rb.ok ? await rb.json() : [];
if (!rb.ok) console.error('blog error', rb.status, await rb.text());
const WA = '393760336650';
const SOC = {ig:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none"/></svg>', wa:'<svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>', fb:'<svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M14 8h2.5V4.5H14A4 4 0 0 0 10 8.5V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.8c0-.5.2-.8.5-.8z"/></svg>'};
const CAT = {trend:'Trendet', guida_taglie:'Udhëzues masash', stile:'Si ta vishni', brand:'Historia e markës', cura:'Kujdesi për veshjet', novita:'Të reja'};
const sqDate = d => d ? new Date(d).toLocaleDateString('sq-AL', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome'}) : '';
const eur = v => new Intl.NumberFormat('it-IT', {style: 'currency', currency: 'EUR'}).format(v);
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const byId = new Map(P.map(p => [p.id, p]));
const priceOf = p => { const av = p.variants.filter(v => v.available > 0); return Math.min(...(av.length ? av : p.variants).map(v => Number(v.price))); };
const pcard = p => { const pr = priceOf(p), sale = Number(p.list_price) > pr + .5, out = !p.variants.some(v => v.available > 0);
  return `<a class="pc" href="/p/${p.id}/"><img src="${esc(IMG[p.id] || '')}" alt="${esc((p.brand || '') + ' ' + p.name)}" loading="lazy"><b>${esc(p.brand || '')}</b><span>${esc(p.name)}</span><span class="${sale ? 'sale' : ''}">${eur(pr)}${sale ? ` <s>${eur(Number(p.list_price))}</s>` : ''}${out ? ' · e shitur' : ''}</span></a>`; };
const CSS = `*{box-sizing:border-box}body{margin:0;font:16.5px/1.7 Inter,system-ui,sans-serif;color:#1a1a1a;background:#fff}a{color:inherit}
header{border-bottom:1px solid #e6e1da;background:#fff;position:sticky;top:0;z-index:5}header .w{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;max-width:1100px;margin:0 auto}
.lg{display:flex;align-items:center;gap:10px;text-decoration:none;font:400 20px Jost,sans-serif;letter-spacing:.12em}.lg img{height:34px}nav a{margin-left:16px;font-size:14px;text-decoration:none;font-weight:600}
main{max-width:720px;margin:0 auto;padding:0 16px 40px;overflow-wrap:anywhere}.cv{width:100%;aspect-ratio:4/5;max-height:72vh;object-fit:cover;border-radius:8px;margin:16px 0 4px;background:#f5f2ee}
.kk{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;color:#4c2f2a;margin-top:12px}h1{font:400 32px/1.15 Jost,sans-serif;margin:6px 0}h2{font:500 22px/1.3 Jost,sans-serif;margin:28px 0 6px}h3{font:500 19px Jost,sans-serif;margin:28px 0 12px}
.mt{font-size:13px;color:#6b6b6b}.lead{font-size:18px;color:#4a403c}.tip{background:#f5f2ee;border-radius:8px;padding:12px 14px;margin:16px 0}
blockquote{border-left:3px solid #deb598;margin:18px 0;padding:4px 0 4px 16px;font:400 20px/1.45 Jost,sans-serif}cite{display:block;font:13px Inter,sans-serif;color:#6b6b6b;margin-top:6px;font-style:normal}
.tw{overflow-x:auto}table{border-collapse:collapse;font-size:14px;min-width:100%}th,td{border-bottom:1px solid #e6e1da;padding:7px 9px;text-align:left;white-space:nowrap}th{background:#f5f2ee}
.g{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}@media(min-width:620px){.g{grid-template-columns:repeat(3,1fr)}}.pc{display:flex;flex-direction:column;font-size:13.5px;line-height:1.4;text-decoration:none}.pc img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:6px;background:#f5f2ee;margin-bottom:6px}.pc .sale{color:#c8102e}.pc s{color:#6b6b6b}
.src{margin-top:28px;padding:12px 14px;border:1px solid #e6e1da;border-radius:8px;font-size:13.5px;color:#4a403c}.shr{display:flex;gap:14px;flex-wrap:wrap;margin:22px 0 8px;font-size:14px}.ask{background:#f5f2ee;border-radius:8px;padding:12px 14px;font-size:14px}
.bl{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-top:16px}.bc{text-decoration:none}.bc img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:8px;background:#f5f2ee}.bc b{display:block;font:500 17px/1.3 Jost,sans-serif;margin:4px 0}
.soc{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.soc a{width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;flex:none}.soc .ig{background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285aeb 90%)}.soc .wa{background:#25d366}.soc .fb{background:#1877f2}.soc .lk{background:#4c2f2a}.soc-t{font-size:14px;color:#4a403c;margin-right:2px}
footer{border-top:1px solid #e6e1da;padding:18px 16px;text-align:center;font-size:13px;color:#6b6b6b}`;
const shell = (head, main) => `<!doctype html><html lang="sq"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}
<link rel="icon" href="/icons/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Jost:wght@400;500&display=swap" rel="stylesheet"><style>${CSS}</style></head>
<body><header><div class="w"><a class="lg" href="/"><img src="/icons/mv-mark.png" alt="MV">modus vestendi</a><nav><a href="/">Dyqani</a><a href="/blog/">Blog</a></nav></div></header><main>${main}</main>
<footer>Modus Vestendi · veshje origjinale italiane · pagesë në dorëzim në Shqipëri, Kosovë e Maqedoni të Veriut · <a href="https://www.instagram.com/modus.vestendi/">Instagram</a></footer></body></html>`;
const urls = [SITE + '/', SITE + '/blog/', ...P.map(p => `${SITE}/p/${p.id}/`)];
const cover = {};
for (const b of BLOG) if (b.cover) cover[b.id] = await sign(b.cover);
for (const b of BLOG){
  const url = `${SITE}/blog/${b.slug}/`; urls.push(url);
  const img = cover[b.id] || SITE + '/icons/icon-512.png';
  const inBody = new Set((b.body || []).filter(x => x.t === 'products').flatMap(x => (x.ids || []).map(Number)));
  const extra = (b.products || []).map(Number).filter(id => !inBody.has(id)).map(id => byId.get(id)).filter(Boolean);
  const body = (b.body || []).map(x => x.t === 'h' ? `<h2>${md(x.text || '')}</h2>` : x.t === 'p' ? `<p>${md(x.text || '')}</p>` : x.t === 'tip' ? `<div class="tip">💡 ${md(x.text || '')}</div>`
    : x.t === 'quote' ? `<blockquote>«${md(x.text || '')}»${x.cite ? `<cite>— ${esc(x.cite)}</cite>` : ''}</blockquote>` : x.t === 'list' ? `<ul>${(x.items || []).map(i => `<li>${md(i)}</li>`).join('')}</ul>`
    : x.t === 'table' && (x.rows || []).length ? `<div class="tw"><table>${x.rows.map((r, i) => `<tr>${r.map(c => i ? `<td>${esc(c)}</td>` : `<th>${esc(c)}</th>`).join('')}</tr>`).join('')}</table></div>`
    : x.t === 'products' ? (() => { const ps = (x.ids || []).map(id => byId.get(Number(id))).filter(Boolean); return ps.length ? `<h3>🛍 ${esc(x.title || 'Bli trendin')}</h3><div class="g">${ps.map(pcard).join('')}</div>` : ''; })() : '').join('');
  const ld = {'@context': 'https://schema.org', '@type': 'BlogPosting', headline: b.title, description: b.seo_desc || b.excerpt || '', image: [img], datePublished: b.published_at, dateModified: b.updated_at || b.published_at,
    inLanguage: 'sq', mainEntityOfPage: url, author: {'@type': 'Organization', name: 'Modus Vestendi', url: SITE + '/'}, publisher: {'@type': 'Organization', name: 'Modus Vestendi', logo: {'@type': 'ImageObject', url: SITE + '/icons/icon-512.png'}},
    ...(b.source?.url ? {isBasedOn: b.source.url} : {})};
  const msg = encodeURIComponent(`${b.title} ${url}`);
  const head = `<title>${esc(b.seo_title || b.title)} · Modus Vestendi</title><meta name="description" content="${esc(b.seo_desc || b.excerpt || '')}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Modus Vestendi"><meta property="og:locale" content="sq_AL">
<meta property="og:title" content="${esc(b.title)}"><meta property="og:description" content="${esc(b.excerpt || b.seo_desc || '')}"><meta property="og:image" content="${esc(img)}"><meta property="og:url" content="${esc(url)}">
<meta property="article:published_time" content="${esc(b.published_at)}"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${esc(url)}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  const main = `${cover[b.id] ? `<img class="cv" src="${esc(img)}" alt="${esc(b.title)}">` : ''}<div class="kk">${esc(CAT[b.category] || '')}</div><h1>${esc(b.title)}</h1>
<div class="mt">${sqDate(b.published_at)} · ${b.reading_min || 1} min lexim</div>${b.excerpt ? `<p class="lead">${esc(b.excerpt)}</p>` : ''}${body}
${extra.length ? `<h3>🛍 Produktet e artikullit</h3><div class="g">${extra.map(pcard).join('')}</div>` : ''}
${b.source?.url ? `<div class="src">📰 <b>Burimi:</b> ${esc(b.source.name || '')}${b.source.author ? ', ' + esc(b.source.author) : ''}${b.source.date ? ', ' + sqDate(b.source.date) : ''} — <a href="${esc(b.source.url)}" target="_blank" rel="noopener nofollow">“${esc(b.source.title || 'artikulli origjinal')}”</a>. Artikull i shkruar nga Modus Vestendi, i frymëzuar nga ky burim.</div>` : ''}
<div class="shr soc"><span class="soc-t">Shpërndajeni:</span><a class="wa" href="https://wa.me/?text=${msg}" aria-label="WhatsApp" title="WhatsApp">${SOC.wa}</a><a class="fb" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" aria-label="Facebook" title="Facebook">${SOC.fb}</a></div>
<div class="ask soc"><span style="flex:1;min-width:180px">💬 Keni pyetje për masën? Na shkruani:</span><a class="ig" href="https://ig.me/m/modus.vestendi" aria-label="Instagram" title="Instagram">${SOC.ig}</a><a class="wa" href="https://wa.me/${WA}" aria-label="WhatsApp" title="WhatsApp">${SOC.wa}</a></div>
<p style="margin-top:14px"><a href="/" style="font-weight:600">Shikoni dyqanin →</a></p>
${BLOG.length > 1 ? `<h2>Lexoni edhe</h2><div class="bl">${BLOG.filter(x => x.id !== b.id).slice(0, 3).map(x => `<a class="bc" href="/blog/${esc(x.slug)}/">${cover[x.id] ? `<img src="${esc(cover[x.id])}" alt="" loading="lazy">` : ''}<div class="kk">${esc(CAT[x.category] || '')}</div><b>${esc(x.title)}</b></a>`).join('')}</div>` : ''}`;
  mkdirSync(`_site/blog/${b.slug}`, {recursive: true}); writeFileSync(`_site/blog/${b.slug}/index.html`, shell(head, main));
}
mkdirSync('_site/blog', {recursive: true});
writeFileSync('_site/blog/index.html', shell(`<title>Blog · Modus Vestendi</title><meta name="description" content="Udhëzues masash, trende dhe këshilla stili nga Modus Vestendi."><meta property="og:title" content="Blog · Modus Vestendi"><meta property="og:type" content="website"><link rel="canonical" href="${SITE}/blog/">`,
  `<h1 style="margin-top:22px">Blog</h1><p class="mt">Udhëzues masash, trende dhe këshilla stili nga Modus Vestendi.</p>${BLOG.length ? `<div class="bl">${BLOG.map(x => `<a class="bc" href="/blog/${esc(x.slug)}/">${cover[x.id] ? `<img src="${esc(cover[x.id])}" alt="" loading="lazy">` : ''}<div class="kk">${esc(CAT[x.category] || '')}</div><b>${esc(x.title)}</b><span class="mt">${sqDate(x.published_at)} · ${x.reading_min || 1} min lexim</span></a>`).join('')}</div>` : '<p>Së shpejti.</p>'}`));
writeFileSync('_site/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${esc(u)}</loc></url>`).join('')}</urlset>`);
writeFileSync('_site/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log('blog pages:', BLOG.length);
// products and articles published after the last build fall back to the 404 page, which opens them in the shop app
writeFileSync('_site/404.html', `<!doctype html><html><head><meta charset="utf-8"><title>Modus Vestendi</title><script>
var m = location.pathname.match(/\\/p\\/(\\d+)/), b = location.pathname.match(/\\/blog\\/([^/]+)/); location.replace('/' + (m ? '#/p/' + m[1] : b ? '#/blog/' + b[1] : location.pathname.indexOf('/blog') === 0 ? '#/blog' : ''));</script></head><body></body></html>`);
console.log('share pages:', n);
