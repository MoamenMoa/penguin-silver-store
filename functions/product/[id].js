const PROJECT_ID = 'penguin-silver-store';

function decodeValue(v={}) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return '';
}
function decodeFields(fields={}) { return Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,decodeValue(v)])); }
function esc(s='') { return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function firstImage(p) { return (Array.isArray(p.images)&&p.images.find(Boolean)) || p.image || ''; }
function label(p,key) { return p[`${key}Ar`] || p[key] || p[`${key}En`] || ''; }

export async function onRequest(context) {
  const id = context.params.id;
  const requestUrl = new URL(context.request.url);
  const home = new URL('/', requestUrl.origin);
  const baseResponse = await context.env.ASSETS.fetch(new Request(home, context.request));
  let html = await baseResponse.text();
  try {
    const api = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products/${encodeURIComponent(id)}`;
    const r = await fetch(api);
    if (!r.ok) return new Response(html,{status:404,headers:{'content-type':'text/html; charset=UTF-8'}});
    const doc = await r.json();
    const p = decodeFields(doc.fields || {});
    if (p.active === false) return new Response(html,{status:404,headers:{'content-type':'text/html; charset=UTF-8'}});
    const title = label(p,'name') || 'فضيات البطريق';
    const desc = label(p,'desc') || `شاهد ${title} على متجر فضيات البطريق`;
    const image = firstImage(p);
    const canonical = requestUrl.href;
    const tags = `\n  <title>${esc(title)} | Elbtrik</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${esc(canonical)}">\n  <meta property="og:type" content="product">\n  <meta property="og:title" content="${esc(title)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${esc(canonical)}">\n  ${image?`<meta property="og:image" content="${esc(image)}">`:''}\n  <meta property="og:site_name" content="Elbtrik">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${esc(title)}">\n  <meta name="twitter:description" content="${esc(desc)}">\n  ${image?`<meta name="twitter:image" content="${esc(image)}">`:''}`;
    html = html.replace(/<title>[\s\S]*?<\/title>/i,'').replace(/\s*<meta property="og:[^"]+"[^>]*>/gi,'').replace(/\s*<meta name="twitter:[^"]+"[^>]*>/gi,'').replace('</head>',tags+'\n</head>');
    return new Response(html,{headers:{'content-type':'text/html; charset=UTF-8','cache-control':'public, max-age=300'}});
  } catch (e) {
    return new Response(html,{headers:{'content-type':'text/html; charset=UTF-8'}});
  }
}
