import {getDoc,doc,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import {cleanContent} from './content.js';
let database,selected=[],products=[],loaded=false;
const $=id=>document.getElementById(id);
export async function loadContentEditor(db,items){
  database=db;products=items;
  $('saveContent').disabled=true;loaded=false;
  try{const snap=await getDoc(doc(db,'settings','content'));const data=cleanContent(snap.exists()?snap.data():{});selected=data.carouselIds;
    for(const key of ['announcementText','carouselTitle','carouselDirection','shipping','returns','privacy','terms'])$(key).value=data[key];
    for(const key of ['announcementEnabled','carouselEnabled','carouselAutoplay'])$(key).checked=data[key];
    loaded=true;renderPicker();$('saveContent').disabled=false;
  }catch{$('contentStatus').textContent='تعذر تحميل إعدادات المحتوى. انشر قواعد Firestore الجديدة ثم أعد تحميل الصفحة.';}
}
export function refreshPicker(items){products=items;if(loaded)renderPicker();}
function renderPicker(){
  const box=$('carouselPicker');box.replaceChildren();
  const ids=[...selected,...products.map(p=>p.id).filter(id=>!selected.includes(id))];
  if(!ids.length){box.textContent='أضف منتجات أولًا، ثم اختار منها للشريط.';return;}
  ids.forEach(id=>{const p=products.find(p=>p.id===id),index=selected.indexOf(id);const row=document.createElement('div');row.className='picker-row';
    const label=document.createElement('label'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=index>=0;checkbox.setAttribute('aria-label','اختيار '+(p?.nameAr||id));
    checkbox.onchange=()=>{if(checkbox.checked){if(selected.length>=12){checkbox.checked=false;$('contentStatus').textContent='يمكن اختيار 12 منتجًا بحد أقصى.';return;}selected.push(id);}else selected=selected.filter(x=>x!==id);renderPicker();};
    label.append(checkbox,document.createTextNode(' '+(index>=0?(index+1)+'. ':'')+(p?.nameAr||'منتج محذوف')+(p?.active===false?' (مخفي في المتجر)':'')));row.append(label);
    if(index>=0){for(const [delta,text] of [[-1,'↑'],[1,'↓']]){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',delta<0?'تقديم المنتج':'تأخير المنتج');b.disabled=index+delta<0||index+delta>=selected.length;b.onclick=()=>{[selected[index],selected[index+delta]]=[selected[index+delta],selected[index]];renderPicker();};row.append(b);}}
    box.append(row);
  });
}
$('contentForm').onsubmit=async e=>{e.preventDefault();if(!loaded||$('saveContent').disabled)return;$('saveContent').disabled=true;
  try{const data={carouselIds:selected,updatedAt:serverTimestamp()};
    for(const key of ['announcementText','carouselTitle','carouselDirection','shipping','returns','privacy','terms']){data[key]=$(key).value.trim();if(!data[key])throw Error('أكمل نصوص الإعدادات والسياسات قبل الحفظ.');}
    for(const key of ['announcementEnabled','carouselEnabled','carouselAutoplay'])data[key]=$(key).checked;
    await setDoc(doc(database,'settings','content'),data);$('contentStatus').textContent='تم حفظ العروض والمنتجات المختارة والسياسات. حدّث المتجر لعرض التغييرات.';
  }catch(err){$('contentStatus').textContent='تعذر الحفظ: '+err.message;}finally{$('saveContent').disabled=false;}
};
