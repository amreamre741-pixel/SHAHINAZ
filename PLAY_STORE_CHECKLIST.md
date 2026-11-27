# دليل رفع تطبيق SHAHINAZ على Google Play Store (بدون رفض)

## 1. نشر الـ Backend مجاناً (Render.com)
1. ادخل إلى [render.com](https://render.com) بحساب GitHub (`amreamre741-pixel`).
2. اضغط **New + → Blueprint** واختر مستودع **`SHAHINAZ`**.
3. أضف رابط `DATABASE_URL` الخاص بـ Neon في متغيرات البيئة.
4. انسخ رابط الـ API الذي يعطيك إياه Render (مثلاً: `https://shahinaz-api.onrender.com`).

## 2. تفعيل رابط سياسة الخصوصية (إلزامي لـ Google Play)
1. في GitHub افتح مستودع **`SHAHINAZ` ← Settings ← Pages**.
2. اختر Branch: `main` والمجلد `/docs` ثم اضغط **Save**.
3. سيصبح رابط سياسة الخصوصية جاهزاً:
   `https://amreamre741-pixel.github.io/SHAHINAZ/privacy.html`

## 3. بناء ملف الأندرويد الرسمي (.aab)
من جهاز الكمبيوتر داخل مجلد `SHAHINAZ`:
```bash
npm install
npx eas login
npm run build:android
```
سيعطيك Expo رابط تنزيل ملف **`.aab`** الجاهز للرفع على Google Play Console!

## 4. إعدادات Google Play Console المهمة (لتجنب الرفض)
- **Privacy Policy:** ضع رابط `https://amreamre741-pixel.github.io/SHAHINAZ/privacy.html`.
- **Account Deletion (حذف الحساب):** التطبيق يحتوي بالفعل على زر «حذف الحساب نهائياً» في `حسابي ← الإعدادات`.
- **User-Generated Content (UGC):** التطبيق يحتوي بالفعل على **الإبلاغ (Report)** و**الحظر (Block)** والموافقة على الشروط عند التسجيل.
- **Target Audience:** اختر **13 سنة فما فوق (13+)** (لا تختر الأطفال دون 13 لتجنب متطلبات العائلات المعقدة).
