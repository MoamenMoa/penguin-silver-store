export function discountPercent(p){const old=Number(p.oldPrice),price=Number(p.price);return Number.isFinite(old)&&Number.isFinite(price)&&old>price&&old>0&&price>=0?Math.round((old-price)/old*100):0;}
export function saleBadge(p,lang='ar'){
  const percent=discountPercent(p);if(!percent&&!p.onSale)return null;
  const badge=document.createElement('span');badge.className='badge sale-badge';badge.textContent=percent?(lang==='ar'?'خصم '+percent+'%':percent+'% OFF'):(lang==='ar'?'عرض':'SALE');return badge;
}
export function ratingNode(p,lang='ar'){
  const value=Number(p.ratingStars);if(p.ratingEnabled!==true||!Number.isFinite(value)||value<0.5||value>5)return null;
  const box=document.createElement('div');box.className='store-rating';const stars=document.createElement('span');stars.className='rating-stars';stars.setAttribute('aria-hidden','true');
  for(let i=1;i<=5;i++){const star=document.createElement('span');star.className=value>=i?'star full':value>=i-0.5?'star half':'star empty';star.textContent='★';stars.append(star);}
  const label=document.createElement('small');label.textContent=(lang==='ar'?'تقييم المتجر: ':'Store rating: ')+value+'/5';box.append(stars,label);
  if(typeof p.ratingText==='string'&&p.ratingText.trim()){const text=document.createElement('p');text.textContent=p.ratingText.slice(0,400);box.append(text);}return box;
}
