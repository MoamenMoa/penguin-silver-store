const PROJECT_ID = "penguin-silver-store";

function esc(s='') {
  return String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
}
function value(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(value);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k,x])=>[k,value(x)]));
  return null;
}
function decodeDoc(doc) {
  return Object.fromEntries(Object.entries(doc.fields || {}).map(([k,v]) => [k,value(v)]));
}
function inject(html, meta) {
  const tags = `\n<!-- Dynamic Facebook / Open Graph product preview -->\n`+
    `<meta property="og:type" content="product">\n`+
    `<meta property="og:site_name" content="فضيات البطريق">\n`+
    `<meta property="og:title" content="${esc(meta.title)}">\n`+
    `<meta property="og:description" content="${esc(meta.description)}">\n`+
    `<meta property="og:url" content="${esc(meta.url)}">\n`+
    `<meta property="og:image" content="${esc(meta.image)}">\n`+
    `<meta property="og:image:secure_url" content="${esc(meta.image)}">\n`+
    `<meta name="twitter:card" content="summary_large_image">\n`+
    `<meta name="twitter:title" content="${esc(meta.title)}">\n`+
    `<meta name="twitter:description" content="${esc(meta.description)}">\n`+
    `<meta name="twitter:image" content="${esc(meta.image)}">\n`+
    `<title>${esc(meta.title)} | فضيات البطريق</title>\n`;
  // Remove static OG/Twitter/title tags so crawlers see only the product-specific values.
  html = html.replace(/<meta[^>]+(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, '')
             .replace(/<title>[\s\S]*?<\/title>\s*/i, '');
  return html.replace(/<\/head>/i, tags + '</head>');
}
export async function onRequest(context) {
  const id = context.params.id;
  const reqUrl = new URL(context.request.url);
  const home = new URL('/', reqUrl.origin);
  const asset = await context.env.ASSETS.fetch(new Request(home, context.request));
  if (!asset.ok) return asset;
  let html = await asset.text();
  try {
    const api = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products/${encodeURIComponent(id)}`;
    const r = await fetch(api, {headers:{'Accept':'application/json'}});
    if (r.ok) {
      const p = decodeDoc(await r.json());
      const image = (Array.isArray(p.images) && p.images.find(Boolean)) || p.image || `${reqUrl.origin}/assets/logo.png`;
      const title = p.nameAr || p.nameEn || 'فضيات البطريق';
      const description = p.descAr || p.descEn || `اكتشف ${title} على فضيات البطريق`;
      html = inject(html, {title, description, image, url:reqUrl.href});
    }
  } catch (_) {}
  return new Response(html, {status:200, headers:{'content-type':'text/html; charset=UTF-8','cache-control':'public, max-age=300'}});
}
