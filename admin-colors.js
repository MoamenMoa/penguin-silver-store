import {colorsOf} from './colors.js';
const root=document.querySelector('#colorEditor');
export function setColors(p={}){root.replaceChildren();for(const c of colorsOf(p))add(c);}
function add(c={name:'',hex:'#c0c0c0'}){if(root.children.length>=8)return;const row=document.createElement('div');row.className='color-editor-row';const name=document.createElement('input');name.placeholder='اسم اللون مثل فضي';name.setAttribute('aria-label','اسم اللون');name.maxLength=40;name.required=true;name.value=c.name;const hex=document.createElement('input');hex.type='color';hex.value=c.hex;hex.setAttribute('aria-label','درجة اللون');const remove=document.createElement('button');remove.type='button';remove.textContent='حذف اللون';remove.onclick=()=>row.remove();row.append(name,hex,remove);root.append(row);}
export function readColors(){const colors=[...root.children].map(r=>({name:r.children[0].value.trim(),hex:r.children[1].value}));if(colors.some(c=>!c.name)||new Set(colors.map(c=>c.name)).size!==colors.length)throw Error('أدخل اسمًا مختلفًا لكل لون.');return colors;}
document.querySelector('#addColor').onclick=()=>add();
