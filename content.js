export const defaults = Object.freeze({
  announcementEnabled:true,
  announcementText:'أقوى عروض وتخفيضات تصل لـ30% بمناسبة افتتاح فضيات البطريق',
  carouselEnabled:true, carouselTitle:'اختيارات تستاهل تشوفها', carouselAutoplay:true,
  carouselDirection:'left', carouselIds:[],
  shipping:'يتم توضيح تكلفة الشحن والمدة المتوقعة حسب عنوانك عند تأكيد الطلب على واتساب. إجمالي السلة يخص المنتجات فقط ولا يشمل الشحن. لا تحوّل مبلغًا قبل تأكيد إجمالي الطلب وتوافر القطع مع المتجر.',
  returns:'للاستفسار عن الاستبدال أو الاسترجاع أو الإبلاغ عن عيب، تواصل مع فضيات البطريق على واتساب واذكر بيانات الطلب وصورة المشكلة إن وجدت. حقوقك القانونية المقررة وفق قانون حماية المستهلك المصري محفوظة. استفسر قبل تأكيد الطلب عن الشروط الخاصة بالقطع المعدّلة أو المنقوشة حسب الطلب.',
  privacy:'تُستخدم بيانات الاسم والهاتف والعنوان التي تدخلها لتجهيز رسالة طلب ترسلها بنفسك إلى المتجر عبر واتساب. لا يحفظ نموذج الطلب هذه البيانات في قاعدة بيانات الموقع. تُحفظ السلة واللغة محليًا على جهازك. يستعين الموقع بـFirebase لتشغيل الكتالوج وإدارة المتجر وبخدمات صور خارجية لعرض الصور، وقد تتلقى هذه الخدمات بيانات اتصال تقنية مثل عنوان IP. لمعرفة كيفية التعامل مع بيانات رسائلك أو طلب حذفها، تواصل مع المتجر على واتساب.',
  terms:'إرسال رسالة واتساب هو طلب لتأكيد الشراء، ولا يعني إتمام الدفع أو حجز المخزون تلقائيًا. راجع المقاس والعيار والوزن والسعر الموضح لكل قطعة قبل الطلب. عروض الافتتاح تصل إلى 30% على القطع المشمولة بالعرض؛ السعر المعروض لكل منتج هو المرجع. يتم تأكيد التوافر والتكلفة النهائية مع المتجر قبل الدفع، دون الإخلال بحقوق المستهلك القانونية.'
});
export function cleanContent(data={}){
  const out={...defaults,carouselIds:[]};
  for(const key of ['announcementText','carouselTitle','shipping','returns','privacy','terms'])if(typeof data[key]==='string'&&data[key].trim())out[key]=data[key].slice(0,key==='announcementText'?200:key==='carouselTitle'?100:6000);
  for(const key of ['announcementEnabled','carouselEnabled','carouselAutoplay'])if(typeof data[key]==='boolean')out[key]=data[key];
  if(['left','right'].includes(data.carouselDirection))out.carouselDirection=data.carouselDirection;
  if(Array.isArray(data.carouselIds))out.carouselIds=[...new Set(data.carouselIds.filter(x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(x)))].slice(0,12);
  return out;
}
export function safeImage(url,fallback='assets/logo.png'){
  if(typeof url!=='string'||url.length>1500)return fallback;
  if(/^assets\/[A-Za-z0-9_./-]+$/.test(url)&&!url.includes('..'))return url;
  try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password?u.href:fallback;}catch{return fallback;}
}
export function bindImage(img,url){img.onerror=()=>{img.onerror=null;img.src='assets/logo.png';};img.src=safeImage(url);}
export function localRead(key,fallback=''){try{return localStorage.getItem(key)??fallback;}catch{return fallback;}}
export function localWrite(key,value){try{localStorage.setItem(key,value);}catch{/* Site stays usable when browser storage is blocked. */}}
export function reconcileCart(items,products){
  const remaining=new Map(products.map(p=>[p.id,Math.max(0,Math.floor(Number(p.stock)||0))]));const result=[];
  for(const item of items.slice(0,100)){
    const p=products.find(p=>p.id===item.id);if(!p||p.active===false)continue;
    const size=typeof item.size==='string'?item.size:'';const sizes=Array.isArray(p.sizes)?p.sizes:[];
    if(sizes.length&&!sizes.includes(size))continue;
    const qty=Math.min(Math.max(0,Math.floor(Number(item.qty)||0)),remaining.get(p.id));if(!qty)continue;
    const key=p.id+'::'+size;const existing=result.find(i=>i.key===key);
    if(existing)existing.qty+=qty;else result.push({id:p.id,key,size,qty});remaining.set(p.id,remaining.get(p.id)-qty);
  }
  return result;
}
