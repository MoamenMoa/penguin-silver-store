import {bindImage} from './content.js';
import {saleBadge,ratingNode} from './product-decor.js';
export function cleanCollections(data){
  if(!Array.isArray(data?.items))return [];
  return data.items.slice(0,6).filter(c=>c&&typeof c.id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(c.id)).map(c=>({id:c.id,title:typeof c.title==='string'?c.title.slice(0,100):'كولكشن',enabled:c.enabled===true,mode:['manual','left','right'].includes(c.mode)?c.mode:'manual',productIds:Array.isArray(c.productIds)?[...new Set(c.productIds.filter(id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(id)))].slice(0,12):[]}));
}
let data=[],products=[],lang='ar',openProduct=()=>{},timers=[];
export function setCollections(value){data=cleanCollections(value);renderCollections();}
export function updateCollectionProducts(list,language,open){products=list.filter(p=>p.active!==false&&p.showOnHome!==false);lang=language;openProduct=open;renderCollections();}
function node(tag,cls,text){const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function renderCollections(){
  timers.forEach(clearInterval);timers=[];const root=document.getElementById('collectionsRoot');if(!root)return;root.replaceChildren();
  for(const c of data){const selected=c.productIds.map(id=>products.find(p=>p.id===id)).filter(Boolean);if(!c.enabled||!selected.length)continue;
    const section=node('section','container showcase collection-section');section.setAttribute('aria-label',c.title);
    const heading=node('div','section-heading'),title=node('h2','',c.title),controls=node('div','showcase-controls');
    const track=node('div','showcase-track');track.tabIndex=0;track.setAttribute('aria-label',c.title+' — اسحب يمينًا أو يسارًا');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=false,hover=false;
    function move(direction){const max=track.scrollWidth-track.clientWidth;if(max<2)return;const step=(track.firstElementChild?.getBoundingClientRect().width||250)+16;let next=track.scrollLeft+direction*step;if(next>max+2)next=0;if(next<-2)next=max;track.scrollTo({left:next,behavior:reduced.matches?'instant':'smooth'});}
    const pause=node('button','',lang==='ar'?'إيقاف الحركة':'Pause');pause.type='button';pause.hidden=c.mode==='manual'||reduced.matches;
    function stop(value){paused=value;pause.textContent=paused?(lang==='ar'?'تشغيل الحركة':'Play'):(lang==='ar'?'إيقاف الحركة':'Pause');pause.setAttribute('aria-pressed',String(paused));}
    for(const [direction,text] of [[1,'→'],[-1,'←']]){const button=node('button','',text);button.type='button';button.setAttribute('aria-label',direction===1?'تحريك الكولكشن يمينًا':'تحريك الكولكشن يسارًا');button.onclick=()=>{stop(true);move(direction);};controls.append(button);}
    pause.onclick=()=>stop(!paused);pause.setAttribute('aria-pressed','false');controls.append(pause);heading.append(title,controls);
    for(const p of selected){const card=node('article','showcase-card'),button=node('button','showcase-product');button.type='button';const img=document.createElement('img');img.alt=lang==='ar'?(p.nameAr||p.nameEn):(p.nameEn||p.nameAr);img.loading='lazy';bindImage(img,p.images?.[0]||p.image);button.append(img,node('strong','',img.alt),node('span','',Number(p.price||0).toLocaleString()+' EGP'));if(Number(p.oldPrice)>Number(p.price))button.append(node('span','old-price',Number(p.oldPrice).toLocaleString()+' EGP'));const badge=saleBadge(p,lang),rating=ratingNode(p,lang);if(badge)button.append(badge);if(rating)button.append(rating);button.onclick=()=>openProduct(p.id);card.append(button);track.append(card);}
    track.addEventListener('pointerdown',()=>stop(true));section.onmouseenter=()=>hover=true;section.onmouseleave=()=>hover=false;section.append(heading,track);root.append(section);
    if(c.mode!=='manual')timers.push(setInterval(()=>{const bounds=section.getBoundingClientRect();if(!paused&&!hover&&!reduced.matches&&!document.hidden&&!section.contains(document.activeElement)&&!document.querySelector('.modal.open,.cart-drawer.open')&&bounds.top<innerHeight&&bounds.bottom>0)move(c.mode==='left'?-1:1);},4500));
  }
}
