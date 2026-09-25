import {colorsOf,swatches} from './colors.js';
import {setSpotlights,updateSpotlightProducts} from './spotlights.js';
import {setCollections,updateCollectionProducts} from './collections.js';
import {departments,matchesCategory} from './categories.js';
import {saleBadge,ratingNode,discountPercent} from './product-decor.js';
import {safeImage,localRead,localWrite,reconcileCart} from './content.js';
import {applyContent,updateShowcase} from './storefront-content.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app-check.js";
import { firebaseConfig, storeSettings } from "./firebase-config.js";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (tag, cls='', text) => { const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=text; return n; };
const configured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE');
let lang = localRead('lang') === 'en' ? 'en' : 'ar';
function readCart(){try{const a=JSON.parse(localRead('penguinCart')||'[]');return Array.isArray(a)?a.filter(i=>i&&typeof i.id==='string'&&typeof i.key==='string'&&Number.isInteger(i.qty)&&i.qty>0):[];}catch{return [];}}
let loading=true, loadFailed=false,storeDb=null;
let products=[], cart=readCart(), filter='all', category='all', subcategory='all', search='', sort='newest';

const T={
  ar:{home:'الرئيسية',products:'المنتجات',about:'عن المتجر',eyebrow:'فضيات حريمي ورجالي وإكسسوارات',heroTitle:'فضة تكمّل أناقتك…|تفاصيل تليق بيك وبيكي.',heroDesc:'خواتم، سلاسل، أساور وإكسسوارات فضة. السعر والوزن والعيار واضحين قبل الطلب.',shopNow:'شوف المنتجات',knowUs:'عن المتجر',clearWeight:'الوزن واضح',noAccount:'اختيارات ليك وليها',collections:'التصنيفات',browse:'اختار نوع القطعة',rings:'خواتم',chains:'سلاسل',bracelets:'أساور',accessories:'إكسسوارات',ourProducts:'المنتجات',bestPieces:'أحدث القطع',weight:'الوزن',karat:'العيار',inStock:'متوفر',outOfStock:'غير متوفر',emptyCart:'السلة فاضية',add:'أضف للسلة',chooseSize:'اختر المقاس',size:'المقاس',sku:'الكود',material:'الخامة'},
  en:{home:'Home',products:'Products',about:'About',eyebrow:'Silver jewellery for her & him',heroTitle:'Silver for your style.|Details made for you.',heroDesc:'Rings, chains, bracelets and silver accessories. Price, weight and purity are clear before ordering.',shopNow:'Shop now',knowUs:'About us',clearWeight:'Clear weight',noAccount:'For her & him',collections:'Collections',browse:'Choose a category',rings:'Rings',chains:'Chains',bracelets:'Bracelets',accessories:'Accessories',ourProducts:'Products',bestPieces:'Latest pieces',weight:'Weight',karat:'Purity',inStock:'In stock',outOfStock:'Out of stock',emptyCart:'Your cart is empty',add:'Add to cart',chooseSize:'Choose size',size:'Size',sku:'SKU',material:'Material'}
};

function safeUrl(url){return safeImage(url);}
function productImages(p){ const arr=Array.isArray(p.images)?p.images.filter(x=>typeof x==='string'&&x.trim()):[]; if(!arr.length&&p.image)arr.push(p.image); return arr.length?arr:['assets/logo.png']; }
function label(p,key){ return lang==='ar'?(p[`${key}Ar`]||p[`${key}En`]||''):(p[`${key}En`]||p[`${key}Ar`]||''); }
function money(v){ return `${Number(v||0).toLocaleString(lang==='ar'?'ar-EG':'en-US',{maximumFractionDigits:2})} ${storeSettings.currency}`; }
function purity(p){ return p.karat||'925'; }
function weightText(p){ return `${Number(p.weight||0).toLocaleString()} g`; }
function whatsappUrl(message=''){ return `https://wa.me/${storeSettings.whatsappNumber}${message?`?text=${encodeURIComponent(message)}`:''}`; }
function persistCart(){ localWrite('penguinCart',JSON.stringify(cart)); }

function applyLang(){
  document.documentElement.lang=lang; document.documentElement.dir=lang==='ar'?'rtl':'ltr'; $('#langBtn').textContent=lang==='ar'?'EN':'AR';
  $$('[data-i18n]').forEach(n=>{const k=n.dataset.i18n;if(T[lang][k]){if(k==='heroTitle'){const [a,b]=T[lang][k].split('|');n.innerHTML='';n.append(document.createTextNode(a),document.createElement('br'));const m=document.createElement('mark');m.textContent=b;n.append(m);}else n.textContent=T[lang][k];}});
  renderCategoryNavigation();renderProducts(); renderCart();updateShowcase(products,lang,openProduct);updateCollectionProducts(products,lang,openProduct);updateSpotlightProducts(products,lang,openProduct);
}

function filteredProducts(){
  let list=products.filter(p=>matchesCategory(p,category,subcategory));
  if(filter==='featured')list=list.filter(p=>p.featured); if(filter==='new')list=list.filter(p=>p.isNew); if(filter==='sale')list=list.filter(p=>p.onSale||discountPercent(p)>0);
  const q=search.toLowerCase(); if(q)list=list.filter(p=>`${p.nameAr||''} ${p.nameEn||''} ${p.sku||''} ${p.karat||''}`.toLowerCase().includes(q));
  if(sort==='priceAsc')list.sort((a,b)=>Number(a.price)-Number(b.price)); else if(sort==='priceDesc')list.sort((a,b)=>Number(b.price)-Number(a.price)); else list.sort((a,b)=>{const ao=Number.isInteger(a.sortOrder)?a.sortOrder:null,bo=Number.isInteger(b.sortOrder)?b.sortOrder:null;if(ao!==null&&bo!==null)return ao-bo;if(ao!==null)return -1;if(bo!==null)return 1;return (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0);});
  return list;
}

function renderProducts(){
  const grid=$('#productGrid'); if(!grid)return; const list=filteredProducts(); grid.replaceChildren(); $('#loadingProducts').style.display=list.length?'none':'block'; $('#loadingProducts').textContent=loading?(lang==='ar'?'جاري تحميل المنتجات…':'Loading products…'):loadFailed?(lang==='ar'?'تعذر تحميل المنتجات. أعد تحميل الصفحة للمحاولة مرة أخرى.':'Unable to load products. Please reload to retry.'):(lang==='ar'?'لا توجد منتجات مطابقة حاليًا.':'No matching products.');
  for(const p of list){
    const card=el('article','product-card'); const image=el('button','product-image'); image.type='button'; image.dataset.open=p.id;
    const imgs=productImages(p); const img=document.createElement('img'); img.src=safeUrl(imgs[0]); img.alt=label(p,'name'); img.loading='lazy'; img.onerror=()=>{img.onerror=null;img.src='assets/logo.png';}; image.append(img);
    if(imgs.length>1)image.append(el('span','gallery-count',`+${imgs.length-1}`));
    const badge=saleBadge(p,lang);if(badge)image.append(badge);
    const info=el('div','product-info'); info.append(el('h3','',label(p,'name')));const rating=ratingNode(p,lang);if(rating)info.append(rating);
    const meta=el('div','product-meta'); meta.append(el('span','',`${T[lang].weight}: ${weightText(p)}`),el('span','',`${T[lang].karat}: ${purity(p)}`)); info.append(meta);if(colorsOf(p).length)info.append(swatches(p));
    info.append(el('small',Number(p.stock)===0?'stock out':'stock',Number(p.stock)===0?T[lang].outOfStock:T[lang].inStock));
    const row=el('div','price-row'); const price=el('div','price'); price.append(el('strong','',money(p.price))); if(Number(p.oldPrice)>Number(p.price))price.append(el('span','old-price',money(p.oldPrice)));
    const add=el('button','add-btn','＋'); add.type='button'; add.dataset.add=p.id;add.setAttribute('aria-label',T[lang].add+' '+label(p,'name')); add.disabled=Number(p.stock)===0; row.append(price,add); info.append(row); card.append(image,info); grid.append(card);
  }
  $$('[data-add]').forEach(b=>b.onclick=()=>addToCart(b.dataset.add)); $$('[data-open]').forEach(b=>b.onclick=()=>openProduct(b.dataset.open));
}

function addToCart(id,size='',color=''){
  const p=products.find(x=>x.id===id); if(!p||Number(p.stock)===0)return; const chosen=size||((Array.isArray(p.sizes)&&p.sizes.length===1)?p.sizes[0]:'');
  if(Array.isArray(p.sizes)&&p.sizes.length>1&&!chosen){openProduct(id,true);return}
  if(p.sizes?.length&&!p.sizes.includes(chosen))return;
  const colors=colorsOf(p);if(colors.length&&!color){openProduct(id,true);return;}if(colors.length&&!colors.some(c=>c.name===color))return;
  const key=JSON.stringify([id,chosen,color]);const existing=cart.find(i=>i.key===key);
  const used=cart.filter(i=>i.id===id).reduce((n,i)=>n+i.qty,0);
  if(used>=Number(p.stock)){$('#cartStatus').textContent='وصلت لأقصى كمية متاحة من القطعة.';openCart();return;}
  if(existing)existing.qty++;else cart.push({key,id,size:chosen,color,qty:1});
  $('#cartStatus').textContent='';persistCart();renderCart();openCart();
}

function renderCart(){
  const wrap=$('#cartItems'); if(!wrap)return;if(!loading&&!loadFailed)cart=reconcileCart(cart,products); wrap.replaceChildren(); let total=0,count=0;
  for(const item of cart){const p=products.find(x=>x.id===item.id);if(!p)continue;const qty=Math.max(1,Math.min(Number(item.qty)||1,Number(p.stock)||1));item.qty=qty;total+=Number(p.price||0)*qty;count+=qty;
    const row=el('div','cart-item');const img=document.createElement('img');img.src=safeUrl(productImages(p)[0]);img.alt='';const body=el('div','');body.append(el('h4','',label(p,'name')));body.append(el('small','',`${money(p.price)} · ${T[lang].weight}: ${weightText(p)} · ${T[lang].karat}: ${purity(p)}${item.color?` · ${lang==='ar'?'اللون':'Color'}: ${item.color}`:''}${item.size?` · ${T[lang].size}: ${item.size}`:''}`));
    const qtyWrap=el('div','qty-control');const minus=el('button','','−');minus.onclick=()=>changeQty(item.key,-1);const q=el('span','',String(qty));const plus=el('button','','+');plus.onclick=()=>changeQty(item.key,1);qtyWrap.append(minus,q,plus);body.append(qtyWrap);const remove=el('button','remove-btn','×');remove.onclick=()=>removeCart(item.key);row.append(img,body,remove);wrap.append(row);
  }
  if(!count)wrap.append(el('div','empty-state',T[lang].emptyCart)); $('#cartCount').textContent=String(count); $('#mobileCartCount').textContent=String(count); $('#cartTotal').textContent=money(total); $('#checkoutBtn').disabled=!count; persistCart();
}
function changeQty(key,delta){const i=cart.find(x=>x.key===key);if(!i)return;const p=products.find(x=>x.id===i.id);if(!p)return;const others=cart.filter(x=>x.id===i.id&&x.key!==key).reduce((n,x)=>n+x.qty,0);i.qty=Math.max(1,Math.min(i.qty+delta,Number(p.stock)-others));renderCart();}
function removeCart(key){cart=cart.filter(i=>i.key!==key);renderCart();}

function productIdFromUrl(){
  const m=location.pathname.match(/\/product\/([^/]+)\/?$/);return m?decodeURIComponent(m[1]):null;
}
function setProductUrl(id,replace=false){
  const url=`/product/${encodeURIComponent(id)}`;
  history[replace?'replaceState':'pushState']({productId:id},'',url);
}
function restoreStoreUrl(replace=false){history[replace?'replaceState':'pushState']({},'',location.origin+location.pathname.replace(/\/product\/[^/]+\/?$/,'/')+location.search);}
function openProduct(id,focusSize=false,updateUrl=true){
  const p=products.find(x=>x.id===id); if(!p)return; if(updateUrl&&productIdFromUrl()!==id)setProductUrl(id); const box=$('#productModalContent'); box.replaceChildren(); const imgs=productImages(p); let current=0;
  const grid=el('div','product-detail-grid'); const gallery=el('div','gallery'); const stage=el('div','gallery-stage'); const main=document.createElement('img'); main.className='detail-image'; main.src=safeUrl(imgs[0]); main.alt=label(p,'name'); stage.append(main);
  const prev=el('button','gallery-arrow prev','‹'); const next=el('button','gallery-arrow next','›'); prev.type=next.type='button'; if(imgs.length<2){prev.hidden=next.hidden=true;} stage.append(prev,next); gallery.append(stage);
  const thumbs=el('div','gallery-thumbs'); const thumbEls=[]; imgs.forEach((src,i)=>{const b=el('button',i===0?'active':'');b.type='button';const im=document.createElement('img');im.src=safeUrl(src);im.alt='';b.append(im);b.onclick=()=>show(i);thumbs.append(b);thumbEls.push(b);}); gallery.append(thumbs);
  function show(i){current=(i+imgs.length)%imgs.length;main.src=safeUrl(imgs[current]);thumbEls.forEach((b,x)=>b.classList.toggle('active',x===current));}
  prev.onclick=()=>show(current-1); next.onclick=()=>show(current+1); let startX=0; stage.addEventListener('touchstart',e=>startX=e.touches[0].clientX,{passive:true});stage.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-startX;if(Math.abs(d)>40)show(current+(d<0?1:-1));},{passive:true});
  const copy=el('div','product-detail-copy'); copy.append(el('span','detail-kicker',`${T[lang].karat}: ${purity(p)} · ${T[lang].weight}: ${weightText(p)}`),el('h2','',label(p,'name'))); if(label(p,'desc'))copy.append(el('p','',label(p,'desc'))); const prices=el('div','detail-price',money(p.price));if(Number(p.oldPrice)>Number(p.price))prices.append(el('span','old-price',money(p.oldPrice)));const badge=saleBadge(p,lang);if(badge)copy.append(badge);copy.append(prices);const rating=ratingNode(p,lang);if(rating)copy.append(rating);
  const specs=el('div','spec-list'); specs.append(el('span','',`${T[lang].sku}: ${p.sku||'—'}`),el('span','',`${T[lang].material}: ${p.material||'Silver'}`),el('span','',`${T[lang].karat}: ${purity(p)}`),el('span','',`${T[lang].weight}: ${weightText(p)}`)); copy.append(specs);
  let sizeSelect=null;if(Array.isArray(p.sizes)&&p.sizes.length){const field=el('label','size-field');field.append(el('span','',T[lang].chooseSize));sizeSelect=document.createElement('select');for(const s of p.sizes){const o=document.createElement('option');o.value=String(s);o.textContent=String(s);sizeSelect.append(o)}field.append(sizeSelect);copy.append(field)}
  let selectedColor='';const colors=colorsOf(p);if(colors.length){const title=el('p','','اختر اللون / Choose color');copy.append(title,swatches(p,name=>{selectedColor=name;title.textContent=(lang==='ar'?'اللون: ':'Color: ')+name;}));}
  const add=el('button','primary-btn full',T[lang].add);add.type='button';add.disabled=Number(p.stock)===0;add.onclick=()=>{if(colors.length&&!selectedColor){copy.querySelector('.color-swatches button')?.focus();return;}closeModal('#productModal');addToCart(p.id,sizeSelect?.value||'',selectedColor)};copy.append(add);grid.append(gallery,copy);box.append(grid);openModal('#productModal');if(focusSize&&sizeSelect)setTimeout(()=>sizeSelect.focus(),50);
}

function openCart(){$('#cartDrawer').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false');$('#overlay').classList.add('open');}
function closeCart(){$('#cartDrawer').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true');$('#overlay').classList.remove('open');}
function openModal(sel){const m=$(sel);m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll');}
function closeModal(sel){const m=$(sel);m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll');}

function checkoutMessage(data){
  const lines=[lang==='ar'?'طلب جديد من متجر فضيات البطريق':'New order from Elbtrik',''];let total=0;
  cart.forEach((item,idx)=>{const p=products.find(x=>x.id===item.id);if(!p)return;const line=Number(p.price||0)*item.qty;total+=line;lines.push(`${idx+1}) ${label(p,'name')} × ${item.qty}${item.color?` · ${lang==='ar'?'اللون':'Color'}: ${item.color}`:''}${item.size?` | ${T[lang].size}: ${item.size}`:''} | ${T[lang].weight}: ${weightText(p)} | ${T[lang].karat}: ${purity(p)} | ${money(line)}`)});
  const payment=data.payment==='cash-wallet'?`محفظة كاش: ${storeSettings.cashWalletNumber}`:'الدفع عند الاستلام'; lines.push('',`إجمالي المنتجات (الشحن غير مشمول): ${money(total)}`,`الاسم: ${data.name}`,`الهاتف: ${data.phone}`,`المحافظة: ${data.gov}`,`العنوان: ${data.address}`,`الدفع: ${payment}`);if(data.notes)lines.push(`ملاحظات: ${data.notes}`);return lines.join('\n');
}

async function loadFirebaseProducts(){
  if(!configured){loading=false;loadFailed=true;renderProducts();return;} try{const app=initializeApp(firebaseConfig);if(storeSettings.appCheckSiteKey)initializeAppCheck(app,{provider:new ReCaptchaV3Provider(storeSettings.appCheckSiteKey),isTokenAutoRefreshEnabled:true});const db=getFirestore(app);storeDb=db;loadBranding(db);getDoc(doc(db,'settings','spotlights')).then(s=>{if(s.exists())setSpotlights(s.data());}).catch(()=>{});getDoc(doc(db,'settings','collections')).then(s=>{if(s.exists())setCollections(s.data());}).catch(()=>{});getDoc(doc(db,'settings','content')).then(s=>{if(s.exists())applyContent(s.data());}).catch(()=>{});const snap=await getDocs(query(collection(db,'products'),where('active','==',true)));products=snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>{const ao=Number.isInteger(a.sortOrder)?a.sortOrder:null,bo=Number.isInteger(b.sortOrder)?b.sortOrder:null;if(ao!==null&&bo!==null)return ao-bo;if(ao!==null)return -1;if(bo!==null)return 1;return (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0);});cart=cart.filter(i=>products.some(p=>p.id===i.id&&Number(p.stock)>0));loading=false;loadFailed=false;renderProducts();renderCart();updateShowcase(products,lang,openProduct);updateCollectionProducts(products,lang,openProduct);updateSpotlightProducts(products,lang,openProduct);const linkedProduct=productIdFromUrl();if(linkedProduct)openProduct(linkedProduct,false,false);}catch(err){loading=false;loadFailed=true;renderProducts();console.error('Firebase load failed',err);$('#loadingProducts').textContent='تعذر تحميل المنتجات. حاول مرة أخرى.';}
}

$('#langBtn').onclick=()=>{lang=lang==='ar'?'en':'ar';localWrite('lang',lang);applyLang();};
$('#cartBtn').onclick=openCart;$('#closeCart').onclick=closeCart;$('#overlay').onclick=closeCart;$('#closeProductModal').onclick=()=>{closeModal('#productModal');if(productIdFromUrl())restoreStoreUrl();};$('#closeCheckoutModal').onclick=()=>closeModal('#checkoutModal');
$('#searchInput').oninput=e=>{search=e.target.value.trim();renderProducts();};$('#sortSelect').onchange=e=>{sort=e.target.value;renderProducts();};
function renderCategoryNavigation(){
  for(const b of $$('[data-department]')){const id=b.dataset.department;const d=departments.find(x=>x.id===id);b.querySelector('b').textContent=d?d[lang]:(lang==='ar'?'الرئيسية':'Home');b.classList.toggle('selected',id===category);b.setAttribute('aria-pressed',String(id===category));}
  const nav=$('#subcategoryNav');nav.replaceChildren();const d=departments.find(d=>d.id===category);nav.hidden=!d;if(!d)return;
  for(const c of [['all','الكل','All'],...d.children]){const b=el('button','filter-btn'+(subcategory===c[0]?' active':''),c[lang==='ar'?1:2]);b.type='button';b.dataset.subcategory=c[0];b.setAttribute('aria-pressed',String(subcategory===c[0]));b.onclick=()=>{subcategory=c[0];renderCategoryNavigation();renderProducts();$('#products').scrollIntoView({behavior:'smooth'});};nav.append(b);}
}
$$('.filters .filter-btn').forEach(b=>b.onclick=()=>{$$('.filters .filter-btn').forEach(x=>x.classList.toggle('active',x===b));filter=b.dataset.filter;renderProducts();});
$$('[data-department]').forEach(b=>b.onclick=()=>{category=b.dataset.department;subcategory='all';filter='all';$$('.filters .filter-btn').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));renderCategoryNavigation();renderProducts();if(category==='all')$('#products').scrollIntoView({behavior:'smooth'});else $('#categories').scrollIntoView({behavior:'smooth'});});
$('#checkoutBtn').onclick=async()=>{
  const button=$('#checkoutBtn');button.disabled=true;$('#cartStatus').textContent='جاري مراجعة الأسعار والمخزون…';
  try{if(!storeDb)throw Error();const old=JSON.stringify(cart.map(i=>[i.id,i.size,i.color,i.qty,products.find(p=>p.id===i.id)?.price]));
    const snap=await getDocs(query(collection(storeDb,'products'),where('active','==',true)));products=snap.docs.map(d=>({...d.data(),id:d.id}));cart=reconcileCart(cart,products);renderProducts();renderCart();updateShowcase(products,lang,openProduct);updateCollectionProducts(products,lang,openProduct);updateSpotlightProducts(products,lang,openProduct);
    const current=JSON.stringify(cart.map(i=>[i.id,i.size,i.color,i.qty,products.find(p=>p.id===i.id)?.price]));
    if(old!==current){$('#cartStatus').textContent='تغيّر سعر أو توافر بعض القطع. راجع السلة واضغط استكمال الطلب مرة أخرى.';return;}
    if(!cart.length)return;$('#cartStatus').textContent='';closeCart();openModal('#checkoutModal');
  }catch{$('#cartStatus').textContent='تعذر التحقق من الأسعار والمخزون. حاول مرة أخرى.';}finally{button.disabled=!cart.length;}
};
$('#checkoutForm').onsubmit=e=>{e.preventDefault();if(!cart.length)return;const payment=$('input[name="paymentMethod"]:checked')?.value||'cash-wallet';const data={name:$('#customerName').value.trim(),phone:$('#customerPhone').value.trim(),gov:$('#governorate').value.trim(),address:$('#address').value.trim(),notes:$('#notes').value.trim(),payment};if(!data.name||!data.phone||!data.gov||!data.address)return;if(!/^[+0-9٠-٩\s()-]{8,30}$/.test(data.phone)){alert('راجع رقم الهاتف.');return;}window.open(whatsappUrl(checkoutMessage(data)),'_blank','noopener,noreferrer');};
$$('[data-mobile-nav]').forEach(b=>b.onclick=()=>{const a=b.dataset.mobileNav;if(a==='home')$('#home').scrollIntoView({behavior:'smooth'});if(a==='categories')$('#categories').scrollIntoView({behavior:'smooth'});if(a==='search'){ $('#products').scrollIntoView({behavior:'smooth'});setTimeout(()=>$('#searchInput').focus(),400);}if(a==='cart')openCart();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeModal('#productModal');closeModal('#checkoutModal');}});
$('#whatsappLink').href=whatsappUrl();$('#floatingWhatsapp').href=whatsappUrl();
applyLang();loadFirebaseProducts();

async function loadBranding(db){try{const snap=await getDoc(doc(db,'settings','branding'));if(!snap.exists())return;const data=snap.data();for(const img of $$('.logo-tile img'))setBrandImage(img,data.logoUrl);setBrandImage($('#heroImage'),data.heroUrl);const icon=document.querySelector('link[rel="icon"]');if(data.logoUrl)icon.href=safeUrl(data.logoUrl);}catch(err){console.warn('Brand settings unavailable; using bundled logo.',err);}}
function setBrandImage(img,url){if(!img)return;img.onerror=()=>{img.onerror=null;img.src='assets/logo.png';};img.src=safeUrl(url||'assets/logo.png');}

// Keyboard focus remains in the active dialog; restoring focus keeps navigation usable.
let previousFocus=null;
const dialogObserver=new MutationObserver(()=>{const dialog=document.querySelector('.modal.open,.cart-drawer.open');if(dialog){if(!previousFocus)previousFocus=document.activeElement;if(!dialog.contains(document.activeElement))dialog.querySelector('button,input,select,textarea,a')?.focus();document.body.classList.add('no-scroll');}else{document.body.classList.remove('no-scroll');const target=previousFocus;previousFocus=null;if(target?.isConnected)target.focus();}});
for(const dialog of document.querySelectorAll('.modal,.cart-drawer'))dialogObserver.observe(dialog,{attributes:true,attributeFilter:['class']});
document.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const dialog=document.querySelector('.modal.open,.cart-drawer.open');if(!dialog)return;const focusable=[...dialog.querySelectorAll('button,a[href],input,textarea,select,[tabindex="0"]')].filter(x=>!x.disabled&&x.getClientRects().length);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){e.preventDefault();first.focus();}});
for(const modal of document.querySelectorAll('.modal'))modal.addEventListener('click',e=>{if(e.target===modal){closeModal('#'+modal.id);if(modal.id==='productModal'&&productIdFromUrl())restoreStoreUrl();}});
window.addEventListener('popstate',()=>{const id=productIdFromUrl();if(id)openProduct(id,false,false);else closeModal('#productModal');});
