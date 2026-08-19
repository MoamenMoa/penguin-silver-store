# فضيات البطريق — Penguin Silver V4

نسخة تحديث كاملة لمتجر GitHub Pages + Firebase، مع تصميم أسود/أصفر، واجهة موبايل أقرب للتطبيق، ولوجو جديد، ودعم عدة صور لكل منتج باستخدام روابط ImageKit.

## رفع التحديث على GitHub

ارفع **محتويات هذا المجلد** إلى جذر Repository `penguin-silver-store` مع استبدال الملفات القديمة، ثم Commit على `main`.

## مهم جدًا: Firestore Rules

ملف `firestore.rules` في GitHub لا يُنشر تلقائيًا إلى Firebase Console. بعد رفع الملفات:

1. Firebase Console → Firestore Database → Rules.
2. انسخ محتوى `firestore.rules` بالكامل.
3. Replace للكود الحالي ثم Publish.

بدون الخطوة دي، لوحة الإدارة قد ترفض حفظ المنتجات الجديدة لأن المنتج أصبح يحتوي حقل `images`.

## ImageKit

Endpoint الحالي محفوظ في `firebase-config.js`:

`https://ik.imagekit.io/hgogt2pg1`

في لوحة الإدارة، أضف من 1 إلى 8 روابط HTTPS، **كل رابط في سطر منفصل**. أول رابط هو الصورة الرئيسية.

مثال:

- `https://ik.imagekit.io/hgogt2pg1/Black%20ring/golden-wedding-rings-with-diamonds-vma-111%20(1).jpg?updatedAt=1787154553349`
- `https://ik.imagekit.io/hgogt2pg1/Black%20ring/golden-wedding-rings-with-diamonds-vma-111.jpg?updatedAt=1787154553253`
- `https://ik.imagekit.io/hgogt2pg1/Black%20ring/golden-wedding-rings-with-diamonds-vma-111%20(2).jpg?updatedAt=1787154553214`

لا يوجد Private Key لـ ImageKit داخل المشروع، ولا يجب إضافته إلى GitHub.

## التوافق مع المنتجات القديمة

المتجر يستطيع قراءة المنتج القديم الذي يحتوي `image` فقط. عند تعديل المنتج من لوحة الإدارة الجديدة وحفظه، سيتم تخزين `image` للصورة الرئيسية و`images` لمعرض الصور.

## تغييرات V4

- لوجو جديد مستخرج بخلفية شفافة من الملف المرسل.
- هوية Black + Yellow.
- Bottom navigation ثابتة على الموبايل: الرئيسية / الأقسام / البحث / السلة.
- Product gallery: thumbnails + أسهم + swipe على الموبايل.
- السعر + الوزن + العيار ظاهرين على بطاقة المنتج.
- دعم حتى 8 صور للمنتج.
- محفظة كاش مرتبطة بالرقم `+201207800721` في Checkout.
- زر WhatsApp ثابت.
- Firebase Storage غير مستخدم.
- Authentication للـ Admin فقط.

## الروابط

المتجر:
`https://moamenmoa.github.io/penguin-silver-store/`

لوحة الإدارة:
`https://moamenmoa.github.io/penguin-silver-store/admin.html`
