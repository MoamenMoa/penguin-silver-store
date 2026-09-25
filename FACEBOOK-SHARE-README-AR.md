# مشاركة المنتجات على فيسبوك

تمت إضافة Cloudflare Pages Function في `functions/product/[id].js`.

عند فتح رابط مثل `/product/PRODUCT_ID` تقوم الدالة بقراءة بيانات المنتج من Firestore ثم تضيف Open Graph tags الخاصة باسم المنتج ووصفه وصورته، مع إبقاء واجهة المتجر الحالية كما هي.

## النشر
ارفع محتويات المشروع كما هي إلى GitHub المتصل بـ Cloudflare Pages. يجب أن يكون مجلد `functions` في جذر المشروع بجوار `index.html`. لا يلزم تعديل Firebase أو بيانات المنتجات.
