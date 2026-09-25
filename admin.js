import {setColors,readColors} from './admin-colors.js';
import {loadSpotlightsEditor,refreshSpotlightProducts} from './admin-spotlights.js';
import './admin-navigation.js';
import {loadCollectionsEditor,refreshCollectionProducts} from './admin-collections.js';
import {departments,categoryIds,legacyIds,categoryName} from './categories.js';
import {loadContentEditor,refreshPicker} from './admin-content.js';
import {safeImage} from './content.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app-check.js";
import { firebaseConfig, storeSettings } from "./firebase-config.js";

const configured=firebaseConfig.apiKey&&!firebaseConfig.apiKey.startsWith('PASTE');
const $=s=>document.querySelector(s);const el=(tag,cls='',text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
let auth,db,products=[],loginAttempts=0,lockUntil=0;
function showStatus(target,text,type=''){const n=$(target);if(!n)return;n.textContent=text;n.className=`status ${type}`.trim();}
function safeUrl(url){return safeImage(url);}
function productImages(p){const a=Array.isArray(p.images)?p.images.filter(Boolean):[];if(!a.length&&p.image)a.push(p.image);return a;}
function parseImageUrls(){const raw=$('#imageUrls').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const unique=[...new Set(raw)];if(unique.length>8)throw new Error('الحد الأقصى 8 صور؛ احذف الروابط الزائدة.');for(const url of unique){try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.href.length>1500)throw new Error();}catch{throw new Error('كل رابط صورة يجب أن يبدأ بـ https://');}}if(!unique.length)throw new Error('أضف رابط صورة واحد على الأقل.');return unique.map(url=>new URL(url).href);}
function renderImagePreview(){const box=$('#imagePreview');box.replaceChildren();const urls=$('#imageUrls').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,8);urls.forEach((url,i)=>{const wrap=el('div','preview-thumb');const img=document.createElement('img');img.src=safeUrl(url);img.alt='';img.onerror=()=>wrap.remove();wrap.append(img,el('span','',i===0?'الرئيسية':String(i+1)));box.append(wrap);});}

if(configured){const app=initializeApp(firebaseConfig);if(storeSettings.appCheckSiteKey)initializeAppCheck(app,{provider:new ReCaptchaV3Provider(storeSettings.appCheckSiteKey),isTokenAutoRefreshEnabled:true});auth=getAuth(app);db=getFirestore(app);setPersistence(auth,browserSessionPersistence).catch(()=>{});}else showStatus('#loginStatus','أضف بيانات Firebase داخل firebase-config.js أولاً.','error');
async function isAdmin(uid){const snap=await getDoc(doc(db,'users',uid));return snap.exists()&&snap.data().role==='admin';}
async function login(e){e.preventDefault();if(!configured)return;if(Date.now()<lockUntil){showStatus('#loginStatus','محاولات كثيرة. انتظر دقيقة ثم حاول مرة أخرى.','error');return}try{showStatus('#loginStatus','جاري تسجيل الدخول...');await signInWithEmailAndPassword(auth,$('#email').value.trim(),$('#password').value);loginAttempts=0}catch{loginAttempts++;if(loginAttempts>=5){lockUntil=Date.now()+60000;loginAttempts=0}showStatus('#loginStatus','تعذر تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى.','error')}}
async function loadProducts(){try{const snap=await getDocs(query(collection(db,'products'),orderBy('createdAt','desc')));products=snap.docs.map(d=>({...d.data(),id:d.id}));products.sort(productOrderCompare);renderList();refreshPicker(products);refreshCollectionProducts(products);refreshSpotlightProducts(products);}catch(err){console.error(err);showStatus('#formStatus','تعذر تحميل المنتجات.','error')}}
function productOrderCompare(a,b){const ao=Number.isInteger(a.sortOrder)?a.sortOrder:null,bo=Number.isInteger(b.sortOrder)?b.sortOrder:null;if(ao!==null&&bo!==null)return ao-bo;if(ao!==null)return -1;if(bo!==null)return 1;return (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0);}
async function saveProductOrder(ordered,message){
  const buttons=[...document.querySelectorAll('.order-btn,.order-number')];buttons.forEach(b=>b.disabled=true);
  const randomButton=$('#randomizeProducts');if(randomButton)randomButton.disabled=true;
  showStatus('#orderStatus','جاري حفظ الترتيب...','');
  try{
    for(let offset=0;offset<ordered.length;offset+=450){
      const batch=writeBatch(db);
      ordered.slice(offset,offset+450).forEach((p,i)=>batch.update(doc(db,'products',p.id),{sortOrder:offset+i,updatedAt:serverTimestamp()}));
      await batch.commit();
    }
    await loadProducts();
    showStatus('#orderStatus',message||'تم حفظ ترتيب المنتجات.','success');
  }catch(err){console.error(err);showStatus('#orderStatus','تعذر حفظ ترتيب المنتجات: '+(err.message||'خطأ غير معروف'),'error');}
  finally{buttons.forEach(b=>b.disabled=false);if(randomButton)randomButton.disabled=false;}
}
async function moveProduct(id,direction){const ordered=[...products].sort(productOrderCompare);const current=ordered.findIndex(p=>p.id===id),next=current+direction;if(current<0||next<0||next>=ordered.length)return;[ordered[current],ordered[next]]=[ordered[next],ordered[current]];await saveProductOrder(ordered,'تم تغيير مكان المنتج.');}
async function setProductPosition(id,value){const ordered=[...products].sort(productOrderCompare);const current=ordered.findIndex(p=>p.id===id);if(current<0)return;let target=Math.round(Number(value))-1;if(!Number.isFinite(target))return renderList();target=Math.max(0,Math.min(ordered.length-1,target));if(target===current)return renderList();const [item]=ordered.splice(current,1);ordered.splice(target,0,item);await saveProductOrder(ordered,`تم نقل المنتج إلى الترتيب ${target+1}.`);}
async function randomizeProducts(){if(products.length<2)return;if(!confirm('سيتم توزيع المنتجات بترتيب عشوائي جديد في الرئيسية. متابعة؟'))return;const ordered=[...products].sort(productOrderCompare);for(let i=ordered.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ordered[i],ordered[j]]=[ordered[j],ordered[i]];}await saveProductOrder(ordered,'تم توزيع المنتجات عشوائيًا وحفظ الترتيب الجديد.');}
function renderList(){const wrap=$('#adminProducts'),q=$('#adminSearch').value.trim().toLowerCase();wrap.replaceChildren();const ordered=[...products].sort(productOrderCompare),positionMap=new Map(ordered.map((p,i)=>[p.id,i+1]));const list=ordered.filter(p=>`${p.nameAr||''} ${p.nameEn||''} ${p.sku||''}`.toLowerCase().includes(q));if(!list.length){wrap.append(el('div','empty-state','لا توجد منتجات مطابقة.'));return}for(const p of list){const row=el('div','admin-product');const img=document.createElement('img');img.src=safeUrl(productImages(p)[0]||'assets/logo.png');img.alt='';const body=el('div','');body.append(el('h4','',p.nameAr||p.nameEn||'بدون اسم'),el('small','placement-label',categoryName(p.category)));body.append(el('small','placement-label',p.showOnHome===false?'في القسم فقط':'في القسم والرئيسية'));body.append(el('small','',`${Number(p.price||0).toLocaleString()} EGP · ${Number(p.weight||0).toLocaleString()} g · عيار ${p.karat||'925'} · ${productImages(p).length} صور · مخزون ${Number(p.stock||0)} · ${p.active===false?'مخفي':'ظاهر'}`));const actions=el('div','admin-actions');const orderWrap=el('label','order-number-wrap','الترتيب');const orderInput=document.createElement('input');orderInput.className='order-number';orderInput.type='number';orderInput.min='1';orderInput.max=String(products.length);orderInput.step='1';orderInput.value=String(positionMap.get(p.id)||1);orderInput.title='غيّر الرقم لنقل المنتج إلى هذا المكان';orderInput.setAttribute('aria-label','رقم ترتيب المنتج');orderInput.onchange=()=>setProductPosition(p.id,orderInput.value);orderInput.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();orderInput.blur();}};orderWrap.append(orderInput);const up=el('button','small-btn order-btn','↑');up.type='button';up.title='تحريك المنتج لأعلى';up.setAttribute('aria-label','تحريك المنتج لأعلى');up.disabled=(positionMap.get(p.id)||1)===1;up.onclick=()=>moveProduct(p.id,-1);const down=el('button','small-btn order-btn','↓');down.type='button';down.title='تحريك المنتج لأسفل';down.setAttribute('aria-label','تحريك المنتج لأسفل');down.disabled=(positionMap.get(p.id)||1)===products.length;down.onclick=()=>moveProduct(p.id,1);const edit=el('button','small-btn','تعديل');edit.type='button';edit.onclick=()=>editProduct(p.id);const del=el('button','small-btn danger','حذف');del.type='button';del.onclick=()=>removeProduct(p.id);actions.append(orderWrap,up,down,edit,del);row.append(img,body,actions);wrap.append(row)}}
function editProduct(id){const p=products.find(x=>x.id===id);if(!p)return;setColors(p);$('#productId').value=id;$('#showOnHome').value=String(p.showOnHome!==false);$('#ratingEnabled').checked=p.ratingEnabled===true;$('#ratingStars').value=String(p.ratingStars||5);$('#ratingText').value=p.ratingText||'';for(const k of ['nameAr','nameEn','descAr','descEn','price','oldPrice','stock','sku','material','weight','karat'])$('#'+k).value=p[k]??'';$('#sizes').value=Array.isArray(p.sizes)?p.sizes.join(', '):'';setProductCategory(p.category);$('#imageUrls').value=productImages(p).join('\n');for(const k of ['featured','isNew','onSale','active'])$('#'+k).checked=!!p[k];$('#formTitle').textContent='تعديل المنتج';$('#cancelEdit').classList.add('show');renderImagePreview();window.scrollTo({top:0,behavior:'smooth'});}
function resetForm(){setColors();$('#productForm').reset();setProductCategory('');$('#productId').value='';$('#stock').value='1';$('#weight').value='0';$('#material').value='Sterling Silver';$('#karat').value='925';$('#active').checked=true;$('#formTitle').textContent='إضافة منتج';$('#cancelEdit').classList.remove('show');$('#imagePreview').replaceChildren();}
const PRODUCT_FIELDS=['nameAr','nameEn','descAr','descEn','price','oldPrice','category','image','images','featured','isNew','onSale','active','stock','sku','material','karat','sizes','weight','createdAt','updatedAt','sortOrder','showOnHome','ratingEnabled','ratingStars','ratingText','colors'];
function validateProductData(d){
  const limits={nameAr:120,nameEn:120,descAr:1200,descEn:1200,sku:80,material:120,karat:20,image:1500};
  const names={nameAr:'الاسم العربي',nameEn:'الاسم الإنجليزي',descAr:'الوصف العربي',descEn:'الوصف الإنجليزي',sku:'كود المنتج',material:'الخامة',karat:'العيار',image:'رابط الصورة الرئيسية'};
  for(const [key,max] of Object.entries(limits)){
    if(typeof d[key]!=='string'||d[key].length>max)throw new Error(names[key]+' يجب ألا يتجاوز '+max+' حرفًا.');
    if(['nameAr','nameEn','karat','image'].includes(key)&&!d[key].trim())throw new Error(names[key]+' مطلوب.');
  }
  for(const [key,max,title] of [['price',10000000,'السعر'],['oldPrice',10000000,'السعر قبل الخصم'],['weight',100000,'الوزن'],['stock',100000,'المخزون']]){
    if(!Number.isFinite(d[key])||d[key]<0||d[key]>max)throw new Error(title+' يجب أن يكون بين 0 و'+max+'.');
  }
  if(!Number.isInteger(d.stock))throw new Error('المخزون يجب أن يكون عددًا صحيحًا.');
  if(d.oldPrice!==0&&d.oldPrice<d.price)throw new Error('السعر قبل الخصم يجب أن يساوي السعر الحالي أو يزيد عنه، أو يكون صفرًا.');
  if(!categoryIds.includes(d.category))throw new Error('اختر تصنيف المنتج من القائمة.');
  if(!Array.isArray(d.images)||d.images.length<1||d.images.length>8)throw new Error('أضف من 1 إلى 8 صور.');
  if(!Array.isArray(d.sizes)||d.sizes.length>30||d.sizes.some(x=>typeof x!=='string'||!x.length||x.length>100))throw new Error('الحد الأقصى 30 مقاسًا.');
  for(const key of ['featured','isNew','onSale','active'])if(typeof d[key]!=='boolean')throw new Error('راجع اختيارات ظهور المنتج.');
}
async function saveProduct(e){
  e.preventDefault();const button=$('#productForm button[type="submit"]');if(button.disabled)return;
  button.disabled=true;let stage='validation';
  try{
    const id=$('#productId').value.trim();
    const images=parseImageUrls();
    const sizes=$('#sizes').value.split(/[,،]/).map(x=>x.trim()).filter(Boolean);
    const data={};
    for(const key of ['nameAr','nameEn','descAr','descEn','sku','material','karat'])data[key]=$('#'+key).value.trim();
    for(const key of ['price','oldPrice','stock','weight'])data[key]=Number($('#'+key).value||0);
    for(const key of ['featured','isNew','onSale','active'])data[key]=$('#'+key).checked;
    Object.assign(data,{category:$('#category').value,image:images[0],images,sizes,updatedAt:serverTimestamp()});
    data.showOnHome=$('#showOnHome').value==='true';data.ratingEnabled=$('#ratingEnabled').checked;data.ratingStars=data.ratingEnabled?Number($('#ratingStars').value):0;data.ratingText=data.ratingEnabled?$('#ratingText').value.trim():'';
    if(data.ratingEnabled&&(!Number.isFinite(data.ratingStars)||data.ratingStars<0.5||data.ratingStars>5))throw new Error('اختر تقييمًا بين نصف نجمة وخمس نجوم.');
    if(data.ratingText.length>400)throw new Error('نص التقييم يجب ألا يتجاوز 400 حرف.');
    data.colors=readColors();validateProductData(data);
    showStatus('#formStatus','جاري التحقق والحفظ…');
    stage='session';const user=auth?.currentUser;
    if(!user)throw new Error('انتهت جلسة الدخول. سجّل الخروج وادخل من جديد.');
    await user.getIdToken(true);
    stage='role';if(!await isAdmin(user.uid))throw new Error('الحساب الحالي لا يملك صلاحية admin في مشروع '+firebaseConfig.projectId+'.');
    if(id){
      stage='existing';const snap=await getDoc(doc(db,'products',id));
      if(!snap.exists())throw new Error('المنتج المطلوب تعديله لم يعد موجودًا. اضغط إلغاء التعديل ثم أضفه كمنتج جديد.');
      const existing=snap.data();const extra=Object.keys(existing).filter(k=>!PRODUCT_FIELDS.includes(k));
      if(extra.length)throw new Error('المنتج القديم يحتوي حقولًا لا تسمح بها القواعد: '+extra.join(', ')+'. لم يتم حذفها. أرسل هذه الرسالة لمراجعة ترحيل بيانات المنتج.');
      if(!existing.createdAt||typeof existing.createdAt.toDate!=='function')throw new Error('حقل createdAt في المنتج القديم ليس Timestamp صالحًا. يلزم تصحيح تاريخ إنشاء هذا المنتج في Firebase.');
      stage='write-update';await updateDoc(doc(db,'products',id),data);
    }else{
      stage='write-create';const nextOrder=products.reduce((m,p)=>Number.isInteger(p.sortOrder)?Math.max(m,p.sortOrder):m,-1)+1;await addDoc(collection(db,'products'),{...data,sortOrder:nextOrder,createdAt:serverTimestamp()});
    }
    resetForm();showStatus('#formStatus','تم حفظ المنتج بنجاح.','success');await loadProducts();
  }catch(err){
    console.error('Product save failed',stage,err);
    const denied=String(err.code||'').includes('permission-denied');
    const message=denied?(stage.startsWith('write-')?'Firebase رفض الكتابة رغم نجاح فحص البيانات والتحقق من صلاحية الأدمن. أرسل هذه الرسالة مع صورة بيانات النموذج كاملة.':'Firebase رفض خطوة التحقق من الحساب أو المنتج. سجّل الدخول مجددًا وتأكد من صلاحيات الحساب.'):(err.message||'تعذر حفظ المنتج.');
    showStatus('#formStatus',message+' [SAVE-2 / '+stage+' / '+(err.code||'validation')+' / '+firebaseConfig.projectId+']','error');
  }finally{button.disabled=false;}
}
async function removeProduct(id){const p=products.find(x=>x.id===id);if(!confirm(`متأكد من حذف ${p?.nameAr||'المنتج'}؟`))return;try{await deleteDoc(doc(db,'products',id));await loadProducts();}catch(err){alert('تعذر الحذف: '+err.message)}}
async function logout(){if(auth)await signOut(auth);}

$('#loginForm').onsubmit=login;$('#productForm').onsubmit=saveProduct;$('#cancelEdit').onclick=resetForm;$('#openStore').onclick=()=>location.href='index.html';$('#logoutBtn').onclick=logout;$('#logoutMobile').onclick=logout;$('#adminSearch').oninput=renderList;$('#randomizeProducts').onclick=randomizeProducts;$('#imageUrls').oninput=renderImagePreview;
if(configured)onAuthStateChanged(auth,async user=>{try{if(user&&await isAdmin(user.uid)){$('#loginView').classList.add('admin-hidden');$('#adminView').classList.remove('admin-hidden');await Promise.all([loadProducts(),loadBranding()]);await Promise.all([loadContentEditor(db,products),loadCollectionsEditor(db,products),loadSpotlightsEditor(db,products)])}else{$('#adminView').classList.add('admin-hidden');$('#loginView').classList.remove('admin-hidden');if(user){showStatus('#loginStatus','هذا الحساب غير مصرح له بدخول لوحة الإدارة.','error');await signOut(auth)}}}catch(err){console.error(err);showStatus('#loginStatus','تعذر التحقق من صلاحية الحساب.','error');if(user)await signOut(auth)}});

function brandingUrl(value){const v=value.trim();if(!v)return '';try{const u=new URL(v);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href;}catch{}throw new Error('استخدم رابط صورة مباشر يبدأ بـ https://');}
function previewBranding(){for(const [field,preview] of [['logoUrl','logoPreview'],['heroUrl','heroPreview']]){const img=$('#'+preview);try{img.src=brandingUrl($('#'+field).value)||'assets/logo.png';}catch{img.src='assets/logo.png';}img.onerror=()=>{img.onerror=null;img.src='assets/logo.png';showStatus('#brandingStatus','تعذر عرض الصورة. تأكد أن الرابط مباشر ومتاح للعامة.','error');};}}
async function loadBranding(){try{const snap=await getDoc(doc(db,'settings','branding'));const data=snap.exists()?snap.data():{};$('#logoUrl').value=data.logoUrl||'';$('#heroUrl').value=data.heroUrl||'';previewBranding();$('#saveBranding').disabled=false;}catch{showStatus('#brandingStatus','تعذر تحميل الإعدادات. تأكد من نشر قواعد Firestore المرفقة ثم أعد تحميل الصفحة.','error');}}
$('#logoUrl').oninput=previewBranding;$('#heroUrl').oninput=previewBranding;
$('#brandingForm').onsubmit=async e=>{e.preventDefault();const button=$('#saveBranding');button.disabled=true;try{const data={logoUrl:brandingUrl($('#logoUrl').value),heroUrl:brandingUrl($('#heroUrl').value),updatedAt:serverTimestamp()};await setDoc(doc(db,'settings','branding'),data);showStatus('#brandingStatus','تم الحفظ. ستظهر الصور عند فتح المتجر أو تحديثه.','success');}catch(err){showStatus('#brandingStatus','تعذر الحفظ: '+err.message,'error');}finally{button.disabled=false;}};

function fillSubcategories(value='') {const select=$('#category');select.replaceChildren();const d=departments.find(d=>d.id===$('#department').value);const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=d?'اختر القسم الفرعي':'اختر القسم الرئيسي أولًا';select.append(placeholder);if(d)for(const c of d.children){const o=document.createElement('option');o.value=c[0];o.textContent=c[1];select.append(o);}select.value=value;}
function setProductCategory(value){const d=departments.find(d=>d.children.some(c=>c[0]===value));$('#department').value=d?.id||'';fillSubcategories(d?value:'');if(value&&!d)showStatus('#formStatus','هذا المنتج بتصنيف سابق. اختر قسمًا رئيسيًا وفرعيًا قبل حفظه.');}
$('#department').onchange=()=>fillSubcategories();
