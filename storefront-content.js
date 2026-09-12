import {saleBadge,ratingNode} from './product-decor.js';
import {defaults,cleanContent,bindImage} from './content.js';
let settings=cleanContent(),items=[],language='ar',openItem=()=>{},timer=null,manualPause=false,hover=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const $=s=>document.querySelector(s);
export function updateShowcase(products,lang,open){items=products.filter(p=>p.showOnHome!==false);language=lang;openItem=open;render();}
export function applyContent(data){settings=cleanContent(data);render();}
function render(){
  const announcement=$('#announcement');announcement.hidden=!settings.announcementEnabled;
  $('#announcementText').textContent=settings.announcementText;
  const section=$('#showcase'),track=$('#showcaseTrack');track.replaceChildren();
  const selected=settings.carouselIds.length?settings.carouselIds.map(id=>items.find(p=>p.id===id)).filter(Boolean):items.filter(p=>p.featured);
  section.hidden=!settings.carouselEnabled||!selected.length;
  $('#showcaseTitle').textContent=settings.carouselTitle;
  for(const p of selected){
    const card=document.createElement('article');card.className='showcase-card';
    const button=document.createElement('button');button.type='button';button.className='showcase-product';
    const img=document.createElement('img');img.alt=language==='ar'?(p.nameAr||p.nameEn):(p.nameEn||p.nameAr);img.loading='lazy';bindImage(img,p.images?.[0]||p.image);
    const name=document.createElement('strong');name.textContent=img.alt;
    const price=document.createElement('span');price.textContent=Number(p.price||0).toLocaleString(language==='ar'?'ar-EG':'en-US')+' EGP';
    button.append(img,name,price);if(Number(p.oldPrice)>Number(p.price)){const old=document.createElement('span');old.className='old-price';old.textContent=Number(p.oldPrice).toLocaleString()+' EGP';button.append(old);}const badge=saleBadge(p,language);if(badge)button.append(badge);const rating=ratingNode(p,language);if(rating)button.append(rating);button.onclick=()=>openItem(p.id);card.append(button);track.append(card);
  }
  $('#showcasePause').hidden=!settings.carouselAutoplay||reduced.matches;
  updatePause();start();
}
function move(direction){const track=$('#showcaseTrack'),max=track.scrollWidth-track.clientWidth;if(max<2)return;const step=(track.firstElementChild?.getBoundingClientRect().width||250)+16;
  let next=track.scrollLeft+direction*step;if(next>max+2)next=0;else if(next<-2)next=max;
  track.scrollTo({left:next,behavior:reduced.matches?'instant':'smooth'});
}
function start(){clearInterval(timer);timer=null;if(!settings.carouselAutoplay||reduced.matches||manualPause||$('#showcase').hidden)return;
  timer=setInterval(()=>{const r=$('#showcase').getBoundingClientRect();if(!document.hidden&&!hover&&!$('#showcase').contains(document.activeElement)&&!document.querySelector('.modal.open,.cart-drawer.open')&&r.top<innerHeight&&r.bottom>0)move(settings.carouselDirection==='left'?-1:1);},4500);
}
function updatePause(){const b=$('#showcasePause');b.textContent=manualPause?'تشغيل الحركة':'إيقاف الحركة';b.setAttribute('aria-pressed',String(manualPause));}
$('#showcaseLeft').onclick=()=>{manualPause=true;updatePause();start();move(-1);};
$('#showcaseRight').onclick=()=>{manualPause=true;updatePause();start();move(1);};
$('#showcasePause').onclick=()=>{manualPause=!manualPause;updatePause();start();};
$('#showcaseTrack').addEventListener('pointerdown',()=>{manualPause=true;updatePause();start();});
$('#showcase').onmouseenter=()=>hover=true;$('#showcase').onmouseleave=()=>hover=false;
reduced.addEventListener('change',()=>render());
$('#announcementPause').onclick=()=>{const wrap=$('#announcement');const paused=wrap.classList.toggle('paused');$('#announcementPause').textContent=paused?'تشغيل':'إيقاف';$('#announcementPause').setAttribute('aria-pressed',String(paused));};
applyContent(defaults);
