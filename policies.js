import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {getFirestore,getDoc,doc} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import {initializeAppCheck,ReCaptchaV3Provider} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app-check.js';
import {firebaseConfig,storeSettings} from './firebase-config.js';
import {cleanContent,bindImage} from './content.js';
function render(data){const value=cleanContent(data);for(const key of ['shipping','returns','privacy','terms'])document.getElementById(key+'Text').textContent=value[key];}
render();document.getElementById('policyContact').href='https://wa.me/'+storeSettings.whatsappNumber;
try{
  const app=initializeApp(firebaseConfig);if(storeSettings.appCheckSiteKey)initializeAppCheck(app,{provider:new ReCaptchaV3Provider(storeSettings.appCheckSiteKey),isTokenAutoRefreshEnabled:true});
  const db=getFirestore(app);
  const results=await Promise.allSettled([getDoc(doc(db,'settings','content')),getDoc(doc(db,'settings','branding'))]);
  const content=results[0];if(content.status==='fulfilled'){if(content.value.exists())render(content.value.data());document.getElementById('policyStatus').textContent='';}else document.getElementById('policyStatus').textContent='تعذر التحقق من آخر تحديث للسياسات. يرجى تأكيد التفاصيل مع المتجر قبل الطلب.';
  const brand=results[1];if(brand.status==='fulfilled'&&brand.value.exists())bindImage(document.getElementById('policyLogo'),brand.value.data().logoUrl);
}catch{document.getElementById('policyStatus').textContent='تعذر تحميل آخر تحديث للسياسات. تواصل مع المتجر لتأكيد التفاصيل.';}
