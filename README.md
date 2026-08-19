# فضيات البطريق — Penguin Silver

متجر فضيات عربي/إنجليزي متجاوب بالكامل، يعمل للزوار بدون حساب، مع لوحة إدارة منفصلة ومحمية بواسطة Firebase Authentication + Firestore Security Rules.

## أهم ما في النسخة الحالية

- شعار فضيات البطريق مدمج في الهيدر والواجهة ولوحة الإدارة.
- رقم التواصل وWhatsApp: `+201207800721`.
- زر WhatsApp ثابت في جميع صفحات المتجر.
- كل منتج يحتوي على: السعر، الوزن بالجرام، العيار، المخزون، SKU، المقاسات، الخامة، الصور، الخصم والتصنيف.
- الدفع يعرض محفظة كاش على الرقم `+201207800721` مع خيار الدفع عند الاستلام، ثم يتم إرسال الطلب كاملًا على WhatsApp.
- العملاء لا يسجلون حسابات.
- لوحة الإدارة فقط تستخدم Firebase Authentication.
- قواعد Firestore تمنع أي زائر من تعديل المنتجات أو صلاحيات الإدارة.
- قواعد Storage تمنع رفع الملفات إلا للـ Admin، وتسمح فقط JPG/PNG/WebP حتى 5MB.
- Content Security Policy وإعدادات Referrer موجودة في صفحات المتجر والإدارة.

## ملفات المشروع

- `index.html` واجهة المتجر.
- `app.js` منطق المنتجات والسلة والطلب واللغات.
- `styles.css` تصميم المتجر Responsive.
- `admin.html` لوحة الإدارة.
- `admin.js` إدارة المنتجات والصور.
- `firebase-config.js` إعدادات Firebase ورقم المتجر.
- `firestore.rules` قواعد حماية قاعدة البيانات.
- `storage.rules` قواعد حماية الصور.
- `assets/logo.png` شعار المتجر.

## إعداد Firebase

1. أنشئ Firebase Project.
2. فعّل **Authentication > Email/Password** وأنشئ حساب Admin قويًا.
3. أنشئ **Cloud Firestore** في Production mode.
4. أنشئ **Storage**.
5. أنشئ Web App وانسخ إعدادات Firebase إلى `firebase-config.js`.
6. من Firestore Console أنشئ document في `users` باسم UID الخاص بحساب الإدارة، وأضف field: `role = admin`.
7. انشر `firestore.rules` و `storage.rules` الموجودة في المشروع.
8. فعّل **Firebase App Check** للموقع وأضف site key إلى `appCheckSiteKey` ثم فعّل enforcement لخدمات Firestore/Storage المدعومة من Firebase Console.
9. أضف دومين GitHub Pages أو الدومين المخصص إلى **Authentication > Settings > Authorized domains**.

## تنبيهات أمان مهمة

- لا تجعل Firestore Rules أو Storage Rules بصيغة `allow read, write: if true`.
- لا تضع كلمة مرور المدير داخل HTML أو JavaScript.
- Firebase Web API key ظاهر بطبيعته في المتصفح؛ الحماية تعتمد على Security Rules وApp Check وصلاحيات المستخدمين.
- استخدم كلمة مرور Admin طويلة وفريدة وفعّل MFA لحساب Google/Firebase الذي يدير المشروع.
- راجع Firebase Usage وAuthentication logs دوريًا.
- GitHub Pages موقع static؛ للمدفوعات البنكية/بطاقات الائتمان استخدم مزود دفع رسمي مع Backend/Cloud Functions ولا تخزن بيانات البطاقات داخل الموقع.

## GitHub Pages

ارفع محتويات مجلد المشروع إلى Repository، ثم من `Settings > Pages` اختر Deploy from branch وحدد `main` و `/root`.
