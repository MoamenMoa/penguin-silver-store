export const departments=[
 {id:'men',ar:'رجالي',en:'Men',children:[['men-ring','خاتم','Rings'],['men-band','دبلة','Bands'],['men-bracelet','انسيال','Bracelets'],['men-chain','سلسلة','Chains']]},
 {id:'women',ar:'حريمي',en:'Women',children:[['women-chain','سلسلة','Chains'],['women-bracelet','انسيال','Bracelets'],['women-ring','خاتم','Rings'],['women-earrings','حلق','Earrings'],['women-anklet','خلخال','Anklets']]},
 {id:'metals',ar:'الستانلس والتنجستن',en:'Stainless steel & tungsten',children:[['stainless','ستانلس','Stainless steel'],['tungsten','تنجستن','Tungsten']]}
];
export const categoryIds=departments.flatMap(d=>d.children.map(c=>c[0]));
export const legacyIds=['rings','chains','bracelets','accessories'];
export function matchesCategory(product,department,child){if(department==='all')return product.showOnHome!==false;const d=departments.find(d=>d.id===department);return !!d&&d.children.some(c=>c[0]===product.category)&&(child==='all'||product.category===child);}
export function categoryName(id){for(const d of departments){const c=d.children.find(c=>c[0]===id);if(c)return d.ar+' / '+c[1];}return 'تصنيف سابق — اختر القسم المناسب عند التعديل';}
