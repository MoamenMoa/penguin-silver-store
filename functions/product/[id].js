const PROJECT_ID = 'penguin-silver-store';
const FIREBASE_API_KEY = 'AIzaSyDG0SKgjL5brawM0thEKZaAuQJU2YGkows';

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
function absoluteUrl(value, origin) {
  if (!value) return new URL('/assets/logo.png', origin).href;
  try { return new URL(String(value).trim(), origin).href; }
  catch { return new URL('/assets/logo.png', origin).href; }
}
function cleanCanonical(requestUrl) {
  const u = new URL(requestUrl.href);
  u.search = '';
  u.hash = '';
  return u.href;
}

export async function onRequest(context) {
  const id = String(context.params.id || '').trim();
  const requestUrl = new URL(context.request.url);
  const home = new URL('/', requestUrl.origin);

  // Always serve the normal storefront HTML; only its social metadata changes.
  const baseResponse = await context.env.ASSETS.fetch(new Request(home, context.request));
  let html = await baseResponse.text();

  try {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid product id');

    // API key is public Firebase web configuration. Firestore Rules still enforce access.
    const api = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products/${encodeURIComponent(id)}?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
    const r = await fetch(api, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(`Firestore ${r.status}`);

    const doc = await r.json();
    const p = decodeFields(doc.fields || {});
    if (p.active === false) throw new Error('Inactive product');

    const title = label(p,'name') || 'فضيات البطريق';
    const desc = label(p,'desc') || `شاهد ${title} على متجر فضيات البطريق`;
    const image = absoluteUrl(firstImage(p), requestUrl.origin);
    const canonical = cleanCanonical(requestUrl);

    const tags = `
  <title>${esc(title)} | فضيات البطريق</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="product">
  <meta property="og:locale" content="ar_AR">
  <meta property="og:site_name" content="فضيات البطريق">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:image:secure_url" content="${esc(image)}">
  <meta property="og:image:alt" content="${esc(title)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${esc(image)}">`;

    html = html
      .replace(/<title>[\s\S]*?<\/title>/i,'')
      .replace(/\s*<link rel="canonical"[^>]*>/gi,'')
      .replace(/\s*<meta name="description"[^>]*>/gi,'')
      .replace(/\s*<meta property="og:[^"]+"[^>]*>/gi,'')
      .replace(/\s*<meta name="twitter:[^"]+"[^>]*>/gi,'')
      .replace('</head>', tags + '\n</head>');

    return new Response(html, {
      status: 200,
      headers: {
        'content-type':'text/html; charset=UTF-8',
        'cache-control':'public, max-age=60, s-maxage=300',
        'x-robots-tag':'index, follow'
      }
    });
  } catch (e) {
    // Keep the storefront usable even if metadata lookup has a temporary problem.
    return new Response(html, {
      status: 200,
      headers:{'content-type':'text/html; charset=UTF-8','cache-control':'no-cache'}
    });
  }
}
