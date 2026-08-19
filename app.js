import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app-check.js";
import { firebaseConfig, storeSettings } from "./firebase-config.js";

const demoProducts = [
  {id:"demo1",nameAr:"خاتم فضة كلاسيك",nameEn:"Classic Silver Ring",descAr:"تصميم يومي أنيق",descEn:"Elegant everyday design",price:780,oldPrice:0,category:"rings",featured:true,isNew:true,onSale:false,active:true,stock:6,sku:"PS-R001",material:"Sterling Silver",karat:"925",sizes:["17","18","19","20"],weight:5.2,image:"assets/ring.svg"},
  {id:"demo2",nameAr:"سلسلة فضة ناعمة",nameEn:"Minimal Silver Chain",descAr:"شكل بسيط ولمعة هادئة",descEn:"Clean design with a soft shine",price:1150,oldPrice:1290,category:"chains",featured:true,isNew:false,onSale:true,active:true,stock:4,sku:"PS-C001",material:"Sterling Silver",karat:"925",sizes:["45 cm","50 cm"],weight:8.1,image:"assets/chain.svg"},
  {id:"demo3",nameAr:"أسورة فضة",nameEn:"Silver Bracelet",descAr:"قفل متين وتصميم مريح",descEn:"Secure clasp and comfortable design",price:990,oldPrice:0,category:"bracelets",featured:false,isNew:true,onSale:false,active:true,stock:3,sku:"PS-B001",material:"Sterling Silver",karat:"925",sizes:["18 cm","20 cm"],weight:7.6,image:"assets/bracelet.svg"},
  {id:"demo4",nameAr:"تعليقة فضة مميزة",nameEn:"Signature Silver Pendant",descAr:"قطعة بسيطة بلمسة مميزة",descEn:"Minimal piece with a signature touch",price:620,oldPrice:760,category:"accessories",featured:true,isNew:false,onSale:true,active:true,stock:8,sku:"PS-A001",material:"Sterling Silver",karat:"925",sizes:[],weight:3.8,image:"assets/pendant.svg"}
];

const T={
  ar:{announcement:"فضيات البطريق • شحن لجميع المحافظات • تواصل مباشر عبر واتساب",brand:"فضيات البطريق",home:"الرئيسية",products:"المنتجات",about:"من نحن",policies:"السياسات",contact:"تواصل معنا",eyebrow:"فضة بتفاصيل تستحق الاقتناء",heroTitle:"فضة لها حضور.<br>وتفاصيل تفرق.",heroDesc:"تشكيلة فضية مختارة بعناية من الخواتم والسلاسل والأساور والإكسسوارات، مع عرض الوزن والعيار بوضوح لكل قطعة.",shopNow:"تسوق الآن",knowUs:"اعرف عنا",clearKarat:"العيار واضح",clearWeight:"الوزن واضح",fastSupport:"دعم سريع",sterling:"Sterling Silver",collections:"التصنيفات",browse:"اختار القطعة المناسبة ليك",rings:"خواتم",chains:"سلاسل",bracelets:"أساور",accessories:"إكسسوارات",ourProducts:"منتجاتنا",bestPieces:"قطع مختارة بعناية",all:"الكل",featured:"المميزة",newest:"الأحدث",sale:"عروض",loading:"لا توجد منتجات مطابقة.",searchPlaceholder:"ابحث عن منتج...",sortNewest:"الأحدث",sortLow:"السعر: الأقل أولاً",sortHigh:"السعر: الأعلى أولاً",aboutBrand:"عن فضيات البطريق",aboutTitle:"ستايل فضة مميز، بسيط، وواضح.",aboutText:"بنركز على تجربة شراء سهلة ومباشرة: صورة واضحة، سعر، وزن، عيار، ومقاس القطعة قبل ما تطلب.",storeInfo:"معلومات المتجر",policiesTitle:"تفاصيل واضحة قبل الطلب",karatTitle:"العيار",karatText:"نوع عيار الفضة موضح على بطاقة كل منتج وفي صفحة التفاصيل.",weightTitle:"الوزن",weightText:"وزن القطعة بالجرام ظاهر بوضوح لمقارنة أفضل قبل الشراء.",returnsTitle:"الاستبدال والاسترجاع",returnsText:"يتم تأكيد شروط الاستبدال والاسترجاع قبل إتمام الطلب.",privacyTitle:"الخصوصية",privacyText:"لا يحتاج العميل لإنشاء حساب، ولوحة الإدارة منفصلة ومحمية.",needHelp:"محتاج مساعدة في اختيار القطعة؟",contactText:"تواصل معنا مباشرة على",whatsapp:"واتساب",footerText:"متجر فضة عربي / إنجليزي سريع ومتجاوب على الموبايل والتابلت والكمبيوتر.",footerSecurity:"التصفح بدون حساب • الإدارة محمية بشكل منفصل",cart:"سلة التسوق",total:"الإجمالي",continueOrder:"استكمال الطلب",orderWhatsApp:"إرسال الطلب على واتساب",add:"أضف للسلة",emptyCart:"السلة فارغة",outOfStock:"غير متوفر",inStock:"متوفر",details:"التفاصيل",sku:"كود المنتج",material:"الخامة",karat:"العيار",weight:"الوزن",size:"المقاس",chooseSize:"اختر المقاس",checkoutTitle:"إتمام الطلب",checkoutDesc:"لا تحتاج لإنشاء حساب. اختر طريقة الدفع ثم أرسل الطلب عبر واتساب.",customerName:"الاسم",customerPhone:"رقم الهاتف",governorate:"المحافظة",address:"العنوان",notes:"ملاحظات",paymentMethod:"طريقة الدفع",cashWallet:"محفظة كاش",cod:"الدفع عند الاستلام",codNote:"حسب التوفر وتأكيد الطلب",walletNote:"عند التحويل على المحفظة، احتفظ بإيصال التحويل وأرسله لنا على واتساب لتأكيد الطلب."},
  en:{announcement:"Penguin Silver • Nationwide shipping • Direct WhatsApp support",brand:"Penguin Silver",home:"Home",products:"Products",about:"About",policies:"Policies",contact:"Contact",eyebrow:"Silver details worth owning",heroTitle:"Silver with presence.<br>Details that matter.",heroDesc:"A curated selection of rings, chains, bracelets and silver accessories with clear weight and purity details for every piece.",shopNow:"Shop now",knowUs:"About us",clearKarat:"Purity shown",clearWeight:"Weight shown",fastSupport:"Fast support",sterling:"Sterling Silver",collections:"Collections",browse:"Choose your piece",rings:"Rings",chains:"Chains",bracelets:"Bracelets",accessories:"Accessories",ourProducts:"Our products",bestPieces:"Carefully selected pieces",all:"All",featured:"Featured",newest:"Newest",sale:"On sale",loading:"No matching products.",searchPlaceholder:"Search products...",sortNewest:"Newest",sortLow:"Price: low to high",sortHigh:"Price: high to low",aboutBrand:"About Penguin Silver",aboutTitle:"Distinctive, simple and transparent silver shopping.",aboutText:"We focus on a direct shopping experience: clear images, price, weight, purity and size before you order.",storeInfo:"Store information",policiesTitle:"Clear details before ordering",karatTitle:"Purity",karatText:"Silver purity is clearly shown on every product card and detail view.",weightTitle:"Weight",weightText:"Piece weight in grams is displayed clearly for easier comparison.",returnsTitle:"Returns & exchanges",returnsText:"Return and exchange terms are confirmed before completing the order.",privacyTitle:"Privacy",privacyText:"Customers do not need accounts and admin access is separate and protected.",needHelp:"Need help choosing a piece?",contactText:"Contact us directly at",whatsapp:"WhatsApp",footerText:"A fast bilingual silver store built for mobile, tablet and desktop.",footerSecurity:"No customer account required • Admin access is separately protected",cart:"Shopping cart",total:"Total",continueOrder:"Continue order",orderWhatsApp:"Send order on WhatsApp",add:"Add to cart",emptyCart:"Your cart is empty",outOfStock:"Out of stock",inStock:"In stock",details:"Details",sku:"SKU",material:"Material",karat:"Purity",weight:"Weight",size:"Size",chooseSize:"Choose size",checkoutTitle:"Complete order",checkoutDesc:"No account is required. Choose a payment method, then send your order on WhatsApp.",customerName:"Name",customerPhone:"Phone",governorate:"Governorate",address:"Address",notes:"Notes",paymentMethod:"Payment method",cashWallet:"Cash Wallet",cod:"Cash on delivery",codNote:"Subject to availability and order confirmation",walletNote:"After transferring to the wallet, keep the transfer receipt and send it to us on WhatsApp to confirm the order."}
};

let lang=localStorage.getItem("lang")==="en"?"en":"ar",products=[...demoProducts],filter="all",category="all",search="",sort="newest",cart=safeCart();
const $=s=>document.querySelector(s);
const money=v=>`${Number(v||0).toLocaleString(lang==='ar'?'ar-EG':'en-US')} ${storeSettings.currency}`;
const configured=!firebaseConfig.apiKey.startsWith("PASTE")&&!firebaseConfig.projectId.startsWith("YOUR_");

function safeCart(){try{const v=JSON.parse(localStorage.getItem("cart")||"[]");return Array.isArray(v)?v.filter(i=>i&&typeof i.id==='string'&&Number.isInteger(i.qty)&&i.qty>0).slice(0,100):[]}catch{return []}}
function persistCart(){localStorage.setItem("cart",JSON.stringify(cart.slice(0,100)))}
function safeUrl(url){try{const u=new URL(url,location.href);return ['http:','https:'].includes(u.protocol)||u.origin===location.origin?u.href:'assets/placeholder.svg'}catch{return 'assets/placeholder.svg'}}
function label(p,key){return String(lang==='ar'?(p[key+'Ar']||p[key+'En']||''):(p[key+'En']||p[key+'Ar']||''))}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function purity(p){return String(p.karat||'925').replace(/[^0-9A-Za-z .-]/g,'').slice(0,20)||'925'}
function weightText(p){const w=Number(p.weight||0);return `${w.toLocaleString(lang==='ar'?'ar-EG':'en-US',{maximumFractionDigits:2})} ${lang==='ar'?'جم':'g'}`}
function whatsappUrl(message=''){return `https://wa.me/${storeSettings.whatsappNumber}${message?`?text=${encodeURIComponent(message)}`:''}`}

function applyLang(){
  document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.body.dir=document.documentElement.dir;
  document.querySelectorAll('[data-i18n]').forEach(n=>{const k=n.dataset.i18n;if(T[lang][k])n.innerHTML=T[lang][k]});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(n=>n.placeholder=T[lang][n.dataset.i18nPlaceholder]||'');
  $('#langBtn').textContent=lang==='ar'?'EN':'ع';
  renderProducts();renderCart();
  const msg=lang==='ar'?'مرحباً، أريد الاستفسار عن منتجات فضيات البطريق.':'Hello, I would like to ask about Penguin Silver products.';
  $('#whatsappLink').href=whatsappUrl(msg);$('#floatingWhatsapp').href=whatsappUrl(msg);
}

function filteredProducts(){
  let list=products.filter(p=>p.active!==false).filter(p=>category==='all'||p.category===category).filter(p=>filter==='all'||(filter==='featured'&&p.featured)||(filter==='new'&&p.isNew)||(filter==='sale'&&p.onSale));
  if(search){const q=search.toLowerCase();list=list.filter(p=>`${p.nameAr||''} ${p.nameEn||''} ${p.descAr||''} ${p.descEn||''} ${p.sku||''} ${p.karat||''}`.toLowerCase().includes(q))}
  if(sort==='priceAsc')list.sort((a,b)=>Number(a.price)-Number(b.price));else if(sort==='priceDesc')list.sort((a,b)=>Number(b.price)-Number(a.price));else list.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  return list;
}

function renderProducts(){
  const grid=$('#productGrid'),list=filteredProducts();grid.replaceChildren();$('#loadingProducts').style.display=list.length?'none':'block';$('#loadingProducts').textContent=T[lang].loading;
  for(const p of list){
    const card=el('article','product-card');
    const image=el('button','product-image');image.type='button';image.dataset.open=p.id;
    const img=document.createElement('img');img.src=safeUrl(p.image||'assets/placeholder.svg');img.alt=label(p,'name');img.loading='lazy';image.append(img);
    image.append(el('span','badge',p.onSale?(lang==='ar'?'عرض':'Sale'):`Ag ${purity(p)}`));
    const info=el('div','product-info');info.append(el('h3','',label(p,'name')));
    const meta=el('div','product-meta');meta.append(el('span','',`${T[lang].weight}: ${weightText(p)}`),el('span','',`${T[lang].karat}: ${purity(p)}`));info.append(meta);
    const stock=el('small',Number(p.stock)===0?'stock out':'stock',Number(p.stock)===0?T[lang].outOfStock:T[lang].inStock);info.append(stock);
    const row=el('div','price-row');const price=el('div','price');price.append(el('strong','',money(p.price)));if(Number(p.oldPrice)>Number(p.price))price.append(el('span','old-price',money(p.oldPrice)));
    const add=el('button','add-btn','＋');add.type='button';add.dataset.add=p.id;add.title=T[lang].add;add.disabled=Number(p.stock)===0;row.append(price,add);info.append(row);card.append(image,info);grid.append(card);
  }
  grid.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addToCart(b.dataset.add));grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openProduct(b.dataset.open));
}

function addToCart(id,size=''){
  const p=products.find(x=>x.id===id);if(!p||Number(p.stock)===0)return;
  const chosen=size||((Array.isArray(p.sizes)&&p.sizes.length===1)?p.sizes[0]:'');
  if(Array.isArray(p.sizes)&&p.sizes.length>1&&!chosen){openProduct(id,true);return}
  const key=`${id}::${chosen}`;const existing=cart.find(i=>i.key===key);const max=Math.max(1,Number(p.stock)||1);
  if(existing)existing.qty=Math.min(existing.qty+1,max);else cart.push({key,id,size:chosen,qty:1});persistCart();renderCart();openCart();
}

function renderCart(){
  const wrap=$('#cartItems');wrap.replaceChildren();let total=0,count=0;
  for(const item of cart){const p=products.find(x=>x.id===item.id);if(!p)continue;const qty=Math.max(1,Math.min(Number(item.qty)||1,Number(p.stock)||1));item.qty=qty;total+=Number(p.price||0)*qty;count+=qty;
    const row=el('div','cart-item');const img=document.createElement('img');img.src=safeUrl(p.image||'assets/placeholder.svg');img.alt='';const body=el('div','');body.append(el('h4','',label(p,'name')));body.append(el('small','',`${money(p.price)} · ${T[lang].weight}: ${weightText(p)} · ${T[lang].karat}: ${purity(p)}${item.size?` · ${T[lang].size}: ${item.size}`:''}`));
    const qtyWrap=el('div','qty-control');const minus=el('button','','−');minus.type='button';minus.onclick=()=>changeQty(item.key,-1);const q=el('span','',String(qty));const plus=el('button','','+');plus.type='button';plus.onclick=()=>changeQty(item.key,1);qtyWrap.append(minus,q,plus);body.append(qtyWrap);
    const remove=el('button','remove-btn','×');remove.type='button';remove.onclick=()=>removeCart(item.key);row.append(img,body,remove);wrap.append(row);
  }
  if(!count)wrap.append(el('div','empty-state',T[lang].emptyCart));$('#cartCount').textContent=String(count);$('#cartTotal').textContent=money(total);$('#checkoutBtn').disabled=!count;persistCart();
}
function changeQty(key,delta){const i=cart.find(x=>x.key===key);if(!i)return;const p=products.find(x=>x.id===i.id);if(!p)return;i.qty=Math.max(1,Math.min(i.qty+delta,Number(p.stock)||1));renderCart()}
function removeCart(key){cart=cart.filter(i=>i.key!==key);renderCart()}

function openProduct(id,focusSize=false){
  const p=products.find(x=>x.id===id);if(!p)return;const box=$('#productModalContent');box.replaceChildren();
  const grid=el('div','product-detail-grid');const img=document.createElement('img');img.className='detail-image';img.src=safeUrl(p.image||'assets/placeholder.svg');img.alt=label(p,'name');
  const copy=el('div','product-detail-copy');copy.append(el('span','detail-kicker',`${T[lang].karat}: ${purity(p)} · ${T[lang].weight}: ${weightText(p)}`),el('h2','',label(p,'name')));if(label(p,'desc'))copy.append(el('p','',label(p,'desc')));copy.append(el('div','detail-price',money(p.price)));
  const specs=el('div','spec-list');specs.append(el('span','',`${T[lang].sku}: ${p.sku||'—'}`),el('span','',`${T[lang].material}: ${p.material||'Silver'}`),el('span','',`${T[lang].karat}: ${purity(p)}`),el('span','',`${T[lang].weight}: ${weightText(p)}`));copy.append(specs);
  let sizeSelect=null;if(Array.isArray(p.sizes)&&p.sizes.length){const field=el('label','size-field');field.append(el('span','',T[lang].chooseSize));sizeSelect=document.createElement('select');for(const s of p.sizes){const o=document.createElement('option');o.value=String(s);o.textContent=String(s);sizeSelect.append(o)}field.append(sizeSelect);copy.append(field)}
  const add=el('button','primary-btn full',T[lang].add);add.type='button';add.disabled=Number(p.stock)===0;add.onclick=()=>{addToCart(p.id,sizeSelect?.value||'');closeModal('#productModal')};copy.append(add);grid.append(img,copy);box.append(grid);openModal('#productModal');if(focusSize&&sizeSelect)setTimeout(()=>sizeSelect.focus(),50);
}

function openCart(){$('#cartDrawer').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false');$('#overlay').classList.add('open')}
function closeCart(){$('#cartDrawer').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true');$('#overlay').classList.remove('open')}
function openModal(sel){const m=$(sel);m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll')}
function closeModal(sel){const m=$(sel);m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll')}

function checkoutMessage(data){
  const lines=[lang==='ar'?'طلب جديد من متجر فضيات البطريق':'New order from Penguin Silver',''];let total=0;
  cart.forEach((item,idx)=>{const p=products.find(x=>x.id===item.id);if(!p)return;const line=Number(p.price||0)*item.qty;total+=line;lines.push(`${idx+1}) ${label(p,'name')} × ${item.qty}${item.size?` | ${T[lang].size}: ${item.size}`:''} | ${T[lang].weight}: ${weightText(p)} | ${T[lang].karat}: ${purity(p)} | ${money(line)}`)});
  const payment=data.payment==='cash-wallet'?(lang==='ar'?`محفظة كاش: ${storeSettings.cashWalletNumber}`:`Cash Wallet: ${storeSettings.cashWalletNumber}`):(lang==='ar'?'الدفع عند الاستلام':'Cash on delivery');
  lines.push('',`${T[lang].total}: ${money(total)}`,`${T[lang].customerName}: ${data.name}`,`${T[lang].customerPhone}: ${data.phone}`,`${T[lang].governorate}: ${data.gov}`,`${T[lang].address}: ${data.address}`,`${T[lang].paymentMethod}: ${payment}`);if(data.notes)lines.push(`${T[lang].notes}: ${data.notes}`);return lines.join('\n');
}

async function loadFirebaseProducts(){
  if(!configured)return;
  try{const app=initializeApp(firebaseConfig);if(storeSettings.appCheckSiteKey)initializeAppCheck(app,{provider:new ReCaptchaV3Provider(storeSettings.appCheckSiteKey),isTokenAutoRefreshEnabled:true});const db=getFirestore(app);const snap=await getDocs(query(collection(db,'products'),where('active','==',true)));const list=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));if(list.length){products=list;cart=cart.filter(i=>products.some(p=>p.id===i.id));renderProducts();renderCart()}}catch(err){console.warn('Using demo products because Firebase products could not be loaded.',err)}
}

$('#langBtn').onclick=()=>{lang=lang==='ar'?'en':'ar';localStorage.setItem('lang',lang);applyLang()};
$('#menuBtn').onclick=()=>$('#mobileMenu').classList.toggle('open');document.querySelectorAll('#mobileMenu a').forEach(a=>a.onclick=()=>$('#mobileMenu').classList.remove('open'));
$('#cartBtn').onclick=openCart;$('#closeCart').onclick=closeCart;$('#overlay').onclick=closeCart;
$('#closeProductModal').onclick=()=>closeModal('#productModal');$('#closeCheckoutModal').onclick=()=>closeModal('#checkoutModal');
$('#searchInput').oninput=e=>{search=e.target.value.trim();renderProducts()};$('#sortSelect').onchange=e=>{sort=e.target.value;renderProducts()};
document.querySelectorAll('.filter-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;renderProducts()});
document.querySelectorAll('.category-card').forEach(b=>b.onclick=()=>{category=b.dataset.category;filter='all';document.querySelectorAll('.filter-btn').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));document.querySelector('#products').scrollIntoView({behavior:'smooth'});renderProducts()});
$('#checkoutBtn').onclick=()=>{closeCart();openModal('#checkoutModal')};
$('#checkoutForm').onsubmit=e=>{e.preventDefault();if(!cart.length)return;const payment=document.querySelector('input[name="paymentMethod"]:checked')?.value||'cash-wallet';const data={name:$('#customerName').value.trim(),phone:$('#customerPhone').value.trim(),gov:$('#governorate').value.trim(),address:$('#address').value.trim(),notes:$('#notes').value.trim(),payment};if(!data.name||!data.phone||!data.gov||!data.address)return;window.open(whatsappUrl(checkoutMessage(data)),'_blank','noopener,noreferrer')};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeModal('#productModal');closeModal('#checkoutModal')}});

applyLang();loadFirebaseProducts();
