import {getDoc,setDoc,doc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import {cleanCollections} from './collections.js';
let db,items=[],products=[],ready=false;
const $=id=>document.getElementById(id);
function n(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
export async function loadCollectionsEditor(database,list){db=database;products=list;try{const snap=await getDoc(doc(db,'settings','collections'));items=cleanCollections(snap.exists()?snap.data():{});ready=true;$('addCollection').disabled=false;$('saveCollections').disabled=false;render();}catch{$('collectionsStatus').textContent='تعذر تحميل الكولكشنات. انشر قواعد Firestore الجديدة ثم حدّث الصفحة.';}}
export function refreshCollectionProducts(list){products=list;if(ready)render();}
function render(){const box=$('collectionEditor');box.replaceChildren();$('addCollection').disabled=!ready||items.length>=6;
  if(!items.length)box.append(n('p','لا توجد كولكشنات بعد. اضغط إضافة كولكشن للبدء.'));
  items.forEach((c,index)=>{const card=n('section');card.className='collection-editor-card';const title=n('h3','كولكشن '+(index+1));const name=n('input');name.value=c.title;name.maxLength=100;name.required=true;name.setAttribute('aria-label','اسم الكولكشن');name.oninput=()=>c.title=name.value;
    const active=n('input');active.type='checkbox';active.checked=c.enabled;active.onchange=()=>c.enabled=active.checked;const label=n('label');label.append(active,document.createTextNode(' إظهار الكولكشن'));
    const mode=n('select');mode.setAttribute('aria-label','حركة الكولكشن');for(const [v,t] of [['manual','سحب يدوي فقط'],['right','حركة تلقائية يمينًا + سحب يدوي'],['left','حركة تلقائية يسارًا + سحب يدوي']]){const o=n('option',t);o.value=v;mode.append(o);}mode.value=c.mode;mode.onchange=()=>c.mode=mode.value;
    const actions=n('div');actions.className='collection-editor-actions';for(const [d,t] of [[-1,'تقديم الكولكشن'],[1,'تأخير الكولكشن']]){const b=n('button',t);b.type='button';b.disabled=index+d<0||index+d>=items.length;b.onclick=()=>{[items[index],items[index+d]]=[items[index+d],items[index]];render();};actions.append(b);}
    const remove=n('button','حذف الكولكشن');remove.type='button';remove.onclick=()=>{if(confirm('حذف هذا الكولكشن؟ المنتجات نفسها ستبقى محفوظة.')){items.splice(index,1);render();}};actions.append(remove);
    const picker=n('div');picker.className='product-picker';const ids=[...c.productIds,...products.map(p=>p.id).filter(id=>!c.productIds.includes(id))];
    for(const id of ids){const p=products.find(p=>p.id===id),position=c.productIds.indexOf(id);const row=n('div');row.className='picker-row';const cb=n('input');cb.type='checkbox';cb.checked=position>=0;cb.onchange=()=>{if(cb.checked){if(c.productIds.length>=12){cb.checked=false;$('collectionsStatus').textContent='الحد الأقصى 12 منتجًا لكل كولكشن.';return;}c.productIds.push(id);}else c.productIds=c.productIds.filter(x=>x!==id);render();};const pl=n('label');pl.append(cb,document.createTextNode(' '+(position>=0?(position+1)+'. ':'')+(p?.nameAr||'منتج محذوف')+(!p||p.active===false?' (غير ظاهر)':p.showOnHome===false?' (في القسم فقط — لن يظهر هنا)':'')));row.append(pl);
      if(position>=0)for(const [d,t] of [[-1,'↑'],[1,'↓']]){const b=n('button',t);b.type='button';b.setAttribute('aria-label',d<0?'تقديم المنتج':'تأخير المنتج');b.disabled=position+d<0||position+d>=c.productIds.length;b.onclick=()=>{[c.productIds[position],c.productIds[position+d]]=[c.productIds[position+d],c.productIds[position]];render();};row.append(b);}picker.append(row);
    }
    card.append(title,name,label,mode,n('p','اختار المنتجات ورتّبها بالأسهم (حتى 12 منتجًا).'),picker,actions);box.append(card);
  });
}
$('addCollection').onclick=()=>{if(!ready||items.length>=6)return;items.push({id:crypto.randomUUID(),title:'كولكشن جديد',enabled:true,mode:'manual',productIds:[]});render();};
$('collectionsForm').onsubmit=async e=>{e.preventDefault();if(!ready||$('saveCollections').disabled)return;$('saveCollections').disabled=true;try{for(const c of items){c.title=c.title.trim();if(!c.title)throw Error('اكتب اسمًا لكل كولكشن.');}await setDoc(doc(db,'settings','collections'),{items,updatedAt:serverTimestamp()});$('collectionsStatus').textContent='تم حفظ الكولكشنات. حدّث المتجر لرؤية التغييرات.';}catch(err){$('collectionsStatus').textContent='تعذر الحفظ: '+err.message;}finally{$('saveCollections').disabled=false;}};
