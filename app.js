import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app-check.js";
import { firebaseConfig, storeSettings } from "./firebase-config.js";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (tag, cls='', text) => { const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=text; return n; };
const configured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE');
let lang = localStorage.getItem('lang') === 'en' ? 'en' : 'ar';
let products=[], cart=JSON.parse(localStorage.getItem('penguinCart')||'[]'), filter='all', category='all', search='', sort='newest';

const T={
  ar:{home:'الرئيسية',products:'المنتجات',about:'عن المتجر',eyebrow:'اختيارات فضة بتفاصيل واضحة',heroTitle:'ستايل أسود × فضي|ولمسة صفراء مميزة.',heroDesc:'خواتم، سلاسل، أساور وإكسسوارات فضة. السعر والوزن والعيار واضحين قبل الطلب.',shopNow:'شوف المنتجات',knowUs:'عن المتجر',clearWeight:'الوزن واضح',noAccount:'بدون حساب للعميل',collections:'التصنيفات',browse:'اختار نوع القطعة',rings:'خواتم',chains:'سلاسل',bracelets:'أساور',accessories:'إكسسوارات',ourProducts:'المنتجات',bestPieces:'أحدث القطع',weight:'الوزن',karat:'العيار',inStock:'متوفر',outOfStock:'غير متوفر',emptyCart:'السلة فاضية',add:'أضف للسلة',chooseSize:'اختر المقاس',size:'المقاس',sku:'الكود',material:'الخامة'},
  en:{home:'Home',products:'Products',about:'About',eyebrow:'Silver pieces with clear details',heroTitle:'Black × Silver style|with a bold yellow accent.',heroDesc:'Rings, chains, bracelets and silver accessories. Price, weight and purity are clear before ordering.',shopNow:'Shop now',knowUs:'About us',clearWeight:'Clear weight',noAccount:'No customer account',collections:'Collections',browse:'Choose a category',rings:'Rings',chains:'Chains',bracelets:'Bracelets',accessories:'Accessories',ourProducts:'Products',bestPieces:'Latest pieces',weight:'Weight',karat:'Purity',inStock:'In stock',outOfStock:'Out of stock',emptyCart:'Your cart is empty',add:'Add to cart',chooseSize:'Choose size',size:'Size',sku:'SKU',material:'Material'}
};

function safeUrl(url){ try{ if(!url)return 'assets/logo.png'; if(url.startsWith('assets/'))return url; const u=new URL(url,location.href); return u.protocol==='https:'||u.origin===location.origin?u.href:'assets/logo.png'; }catch{return 'assets/logo.png';} }
function productImages(p){ const arr=Array.isArray(p.images)?p.images.filter(x=>typeof x==='string'&&x.trim()):[]; if(!arr.length&&p.image)arr.push(p.image); return arr.length?arr:['assets/logo.png']; }
function label(p,key){ return lang==='ar'?(p[`${key}Ar`]||p[`${key}En`]||''):(p[`${key}En`]||p[`${key}Ar`]||''); }
function money(v){ return `${Number(v||0).toLocaleString(lang==='ar'?'ar-EG':'en-US',{maximumFractionDigits:2})} ${storeSettings.currency}`; }
function purity(p){ return p.karat||'925'; }
function weightText(p){ return `${Number(p.weight||0).toLocaleString()} g`; }
function whatsappUrl(message=''){ return `https://wa.me/${storeSettings.whatsappNumber}${message?`?text=${encodeURIComponent(message)}`:''}`; }
function persistCart(){ localStorage.setItem('penguinCart',JSON.stringify(cart)); }

function applyLang(){
  document.documentElement.lang=lang; document.documentElement.dir=lang==='ar'?'rtl':'ltr'; $('#langBtn').textContent=lang==='ar'?'EN':'AR';
  $$('[data-i18n]').forEach(n=>{const k=n.dataset.i18n;if(T[lang][k]){if(k==='heroTitle'){const [a,b]=T[lang][k].split('|');n.innerHTML='';n.append(document.createTextNode(a),document.createElement('br'));const m=document.createElement('mark');m.textContent=b;n.append(m);}else n.textContent=T[lang][k];}});
  renderProducts(); renderCart();
}

function filteredProducts(){
  let list=products.filter(p=>category==='all'||p.category===category);
  if(filter==='featured')list=list.filter(p=>p.featured); if(filter==='new')list=list.filter(p=>p.isNew); if(filter==='sale')list=list.filter(p=>p.onSale);
  const q=search.toLowerCase(); if(q)list=list.filter(p=>`${p.nameAr||''} ${p.nameEn||''} ${p.sku||''} ${p.karat||''}`.toLowerCase().includes(q));
  if(sort==='priceAsc')list.sort((a,b)=>Number(a.price)-Number(b.price)); else if(sort==='priceDesc')list.sort((a,b)=>Number(b.price)-Number(a.price)); else list.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  return list;
}

function renderProducts(){
  const grid=$('#productGrid'); if(!grid)return; const list=filteredProducts(); grid.replaceChildren(); $('#loadingProducts').style.display=list.length?'none':'block';
  for(const p of list){
    const card=el('article','product-card'); const image=el('button','product-image'); image.type='button'; image.dataset.open=p.id;
    const imgs=productImages(p); const img=document.createElement('img'); img.src=safeUrl(imgs[0]); img.alt=label(p,'name'); img.loading='lazy'; img.onerror=()=>img.src='assets/logo.png'; image.append(img);
    if(imgs.length>1)image.append(el('span','gallery-count',`+${imgs.length-1}`));
    if(p.onSale)image.append(el('span','badge',lang==='ar'?'عرض':'Sale'));
    const info=el('div','product-info'); info.append(el('h3','',label(p,'name')));
    const meta=el('div','product-meta'); meta.append(el('span','',`${T[lang].weight}: ${weightText(p)}`),el('span','',`${T[lang].karat}: ${purity(p)}`)); info.append(meta);
    info.append(el('small',Number(p.stock)===0?'stock out':'stock',Number(p.stock)===0?T[lang].outOfStock:T[lang].inStock));
    const row=el('div','price-row'); const price=el('div','price'); price.append(el('strong','',money(p.price))); if(Number(p.oldPrice)>Number(p.price))price.append(el('span','old-price',money(p.oldPrice)));
    const add=el('button','add-btn','＋'); add.type='button'; add.dataset.add=p.id; add.disabled=Number(p.stock)===0; row.append(price,add); info.append(row); card.append(image,info); grid.append(card);
  }
  $$('[data-add]').forEach(b=>b.onclick=()=>addToCart(b.dataset.add)); $$('[data-open]').forEach(b=>b.onclick=()=>openProduct(b.dataset.open));
}

function addToCart(id,size=''){
  const p=products.find(x=>x.id===id); if(!p||Number(p.stock)===0)return; const chosen=size||((Array.isArray(p.sizes)&&p.sizes.length===1)?p.sizes[0]:'');
  if(Array.isArray(p.sizes)&&p.sizes.length>1&&!chosen){openProduct(id,true);return}
  const key=`${id}::${chosen}`; const existing=cart.find(i=>i.key===key); const max=Math.max(1,Number(p.stock)||1); if(existing)existing.qty=Math.min(existing.qty+1,max); else cart.push({key,id,size:chosen,qty:1}); persistCart(); renderCart(); openCart();
}

function renderCart(){
  const wrap=$('#cartItems'); if(!wrap)return; wrap.replaceChildren(); let total=0,count=0;
  for(const item of cart){const p=products.find(x=>x.id===item.id);if(!p)continue;const qty=Math.max(1,Math.min(Number(item.qty)||1,Number(p.stock)||1));item.qty=qty;total+=Number(p.price||0)*qty;count+=qty;
    const row=el('div','cart-item');const img=document.createElement('img');img.src=safeUrl(productImages(p)[0]);img.alt='';const body=el('div','');body.append(el('h4','',label(p,'name')));body.append(el('small','',`${money(p.price)} · ${T[lang].weight}: ${weightText(p)} · ${T[lang].karat}: ${purity(p)}${item.size?` · ${T[lang].size}: ${item.size}`:''}`));
    const qtyWrap=el('div','qty-control');const minus=el('button','','−');minus.onclick=()=>changeQty(item.key,-1);const q=el('span','',String(qty));const plus=el('button','','+');plus.onclick=()=>changeQty(item.key,1);qtyWrap.append(minus,q,plus);body.append(qtyWrap);const remove=el('button','remove-btn','×');remove.onclick=()=>removeCart(item.key);row.append(img,body,remove);wrap.append(row);
  }
  if(!count)wrap.append(el('div','empty-state',T[lang].emptyCart)); $('#cartCount').textContent=String(count); $('#mobileCartCount').textContent=String(count); $('#cartTotal').textContent=money(total); $('#checkoutBtn').disabled=!count; persistCart();
}
function changeQty(key,delta){const i=cart.find(x=>x.key===key);if(!i)return;const p=products.find(x=>x.id===i.id);if(!p)return;i.qty=Math.max(1,Math.min(i.qty+delta,Number(p.stock)||1));renderCart();}
function removeCart(key){cart=cart.filter(i=>i.key!==key);renderCart();}

function openProduct(id,focusSize=false){
  const p=products.find(x=>x.id===id); if(!p)return; const box=$('#productModalContent'); box.replaceChildren(); const imgs=productImages(p); let current=0;
  const grid=el('div','product-detail-grid'); const gallery=el('div','gallery'); const stage=el('div','gallery-stage'); const main=document.createElement('img'); main.className='detail-image'; main.src=safeUrl(imgs[0]); main.alt=label(p,'name'); stage.append(main);
  const prev=el('button','gallery-arrow prev','‹'); const next=el('button','gallery-arrow next','›'); prev.type=next.type='button'; if(imgs.length<2){prev.hidden=next.hidden=true;} stage.append(prev,next); gallery.append(stage);
  const thumbs=el('div','gallery-thumbs'); const thumbEls=[]; imgs.forEach((src,i)=>{const b=el('button',i===0?'active':'');b.type='button';const im=document.createElement('img');im.src=safeUrl(src);im.alt='';b.append(im);b.onclick=()=>show(i);thumbs.append(b);thumbEls.push(b);}); gallery.append(thumbs);
  function show(i){current=(i+imgs.length)%imgs.length;main.src=safeUrl(imgs[current]);thumbEls.forEach((b,x)=>b.classList.toggle('active',x===current));}
  prev.onclick=()=>show(current-1); next.onclick=()=>show(current+1); let startX=0; stage.addEventListener('touchstart',e=>startX=e.touches[0].clientX,{passive:true});stage.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-startX;if(Math.abs(d)>40)show(current+(d<0?1:-1));},{passive:true});
  const copy=el('div','product-detail-copy'); copy.append(el('span','detail-kicker',`${T[lang].karat}: ${purity(p)} · ${T[lang].weight}: ${weightText(p)}`),el('h2','',label(p,'name'))); if(label(p,'desc'))copy.append(el('p','',label(p,'desc'))); copy.append(el('div','detail-price',money(p.price)));
  const specs=el('div','spec-list'); specs.append(el('span','',`${T[lang].sku}: ${p.sku||'—'}`),el('span','',`${T[lang].material}: ${p.material||'Silver'}`),el('span','',`${T[lang].karat}: ${purity(p)}`),el('span','',`${T[lang].weight}: ${weightText(p)}`)); copy.append(specs);
  let sizeSelect=null;if(Array.isArray(p.sizes)&&p.sizes.length){const field=el('label','size-field');field.append(el('span','',T[lang].chooseSize));sizeSelect=document.createElement('select');for(const s of p.sizes){const o=document.createElement('option');o.value=String(s);o.textContent=String(s);sizeSelect.append(o)}field.append(sizeSelect);copy.append(field)}
  const add=el('button','primary-btn full',T[lang].add);add.type='button';add.disabled=Number(p.stock)===0;add.onclick=()=>{addToCart(p.id,sizeSelect?.value||'');closeModal('#productModal')};copy.append(add);grid.append(gallery,copy);box.append(grid);openModal('#productModal');if(focusSize&&sizeSelect)setTimeout(()=>sizeSelect.focus(),50);
}

function openCart(){$('#cartDrawer').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false');$('#overlay').classList.add('open');}
function closeCart(){$('#cartDrawer').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true');$('#overlay').classList.remove('open');}
function openModal(sel){const m=$(sel);m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll');}
function closeModal(sel){const m=$(sel);m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll');}

function checkoutMessage(data){
  const lines=[lang==='ar'?'طلب جديد من متجر فضيات البطريق':'New order from Penguin Silver',''];let total=0;
  cart.forEach((item,idx)=>{const p=products.find(x=>x.id===item.id);if(!p)return;const line=Number(p.price||0)*item.qty;total+=line;lines.push(`${idx+1}) ${label(p,'name')} × ${item.qty}${item.size?` | ${T[lang].size}: ${item.size}`:''} | ${T[lang].weight}: ${weightText(p)} | ${T[lang].karat}: ${purity(p)} | ${money(line)}`)});
  const payment=data.payment==='cash-wallet'?`محفظة كاش: ${storeSettings.cashWalletNumber}`:'الدفع عند الاستلام'; lines.push('',`الإجمالي: ${money(total)}`,`الاسم: ${data.name}`,`الهاتف: ${data.phone}`,`المحافظة: ${data.gov}`,`العنوان: ${data.address}`,`الدفع: ${payment}`);if(data.notes)lines.push(`ملاحظات: ${data.notes}`);return lines.join('\n');
}

async function loadFirebaseProducts(){
  if(!configured)return; try{const app=initializeApp(firebaseConfig);if(storeSettings.appCheckSiteKey)initializeAppCheck(app,{provider:new ReCaptchaV3Provider(storeSettings.appCheckSiteKey),isTokenAutoRefreshEnabled:true});const db=getFirestore(app);const snap=await getDocs(query(collection(db,'products'),where('active','==',true)));products=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));cart=cart.filter(i=>products.some(p=>p.id===i.id));renderProducts();renderCart();}catch(err){console.error('Firebase load failed',err);$('#loadingProducts').textContent='تعذر تحميل المنتجات. حاول مرة أخرى.';}
}

$('#langBtn').onclick=()=>{lang=lang==='ar'?'en':'ar';localStorage.setItem('lang',lang);applyLang();};
$('#cartBtn').onclick=openCart;$('#closeCart').onclick=closeCart;$('#overlay').onclick=closeCart;$('#closeProductModal').onclick=()=>closeModal('#productModal');$('#closeCheckoutModal').onclick=()=>closeModal('#checkoutModal');
$('#searchInput').oninput=e=>{search=e.target.value.trim();renderProducts();};$('#sortSelect').onchange=e=>{sort=e.target.value;renderProducts();};
$$('.filter-btn').forEach(b=>b.onclick=()=>{$$('.filter-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;renderProducts();});
$$('.category-card').forEach(b=>b.onclick=()=>{category=b.dataset.category;filter='all';$$('.filter-btn').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));$('#products').scrollIntoView({behavior:'smooth'});renderProducts();});
$('#checkoutBtn').onclick=()=>{closeCart();openModal('#checkoutModal');};
$('#checkoutForm').onsubmit=e=>{e.preventDefault();if(!cart.length)return;const payment=$('input[name="paymentMethod"]:checked')?.value||'cash-wallet';const data={name:$('#customerName').value.trim(),phone:$('#customerPhone').value.trim(),gov:$('#governorate').value.trim(),address:$('#address').value.trim(),notes:$('#notes').value.trim(),payment};if(!data.name||!data.phone||!data.gov||!data.address)return;window.open(whatsappUrl(checkoutMessage(data)),'_blank','noopener,noreferrer');};
$$('[data-mobile-nav]').forEach(b=>b.onclick=()=>{const a=b.dataset.mobileNav;if(a==='home')$('#home').scrollIntoView({behavior:'smooth'});if(a==='categories')$('#categories').scrollIntoView({behavior:'smooth'});if(a==='search'){ $('#products').scrollIntoView({behavior:'smooth'});setTimeout(()=>$('#searchInput').focus(),400);}if(a==='cart')openCart();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeModal('#productModal');closeModal('#checkoutModal');}});
$('#whatsappLink').href=whatsappUrl();$('#floatingWhatsapp').href=whatsappUrl();
applyLang();loadFirebaseProducts();
