# دليل ربط تطبيق المستخدمين بلوحة الإدارة (Firebase Dashboard Integration)
هذا الملف صُمم خصيصاً لتقوم بنسخه وإرساله بالكامل إلى الـ **Google AI Studio** الخاص بتطبيق المستخدمين ليقوم بزرع الأكواد والوظائف المطلوبة وجعل التطبيق يقرأ ويكتب لجميع كوليكشنز (Collections) قاعدة البيانات المشتركة بدقة متناهية.

---

## 💡 التوجيه (Prompt) الذي ستعطيه لـ Google AI Studio في تطبيق المستخدمين:
> "أنا أقوم الآن بربط تطبيقي بلوحة الإدارة (Admin Dashboard) عبر قاعدة بيانات Firebase Firestore المشتركة. أريدك أن تقوم بزرع تهيئة Firebase والربط الكامل بجميع الـ Collections المحددة بالأسفل بدلاً من أي بيانات وهمية أو تخزين محلي (Local Storage).
> يرجى استبدال تهيئة Firebase في الكود بالتكوين الحقيقي وإعداد استماع مباشر (Real-time Listener on Snapshot) أو جلب مباشر (async getDocs) لحقول البيانات التالية مع الالتزام بالـ Types الواردة في ملف التعليمات المرفق."

---

## 🛠️ أولاً: ملف تهيئة Firebase في التطبيق الخاص بك
تأكد من زرع أو تحديث ملف `firebase.ts` في تطبيقك ليكون كالتالي. هذا يحفظ استقرار الاتصال وسلاسة القراءة ويمنع مشاكل جدران الحماية:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// ⚠️ استبدل هذه القيم ببيانات مشروع الـ Firebase الخاص بك (يمكنك جلبها من لوحة Firebase console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  // إذا كانت قاعدة البيانات مخصصة ولها ID معين
  firestoreDatabaseId: "(default)" 
};

// تهيئة تطبيق Firebase الأساسي
export const app = initializeApp(firebaseConfig);

// تفعيل ميزة Long Polling لمنع انقطاع الاتصال في البيئات المقيدة والتطبيقات المهجنة
const settings = {
  experimentalForceLongPolling: true
};

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? initializeFirestore(app, settings, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, settings);

export const auth = getAuth(app);
```

---

## 📊 ثانياً: هياكل ومجموعات البيانات (Collections & Types Schema)
لوحة الإدارة تقرأ وتكتب في مجموعات Firestore كالتالي. يجب على تطبيق القنوات والمباريات مطابقة هذه البنية ليتناغم تماماً:

### 1. القنوات التلفزيونية الحرة والبث المباشر (`channels`)
تُخزن القنوات في كولكشن بالاسم: `channels` وكل وثيقة تحتوي على:
```typescript
export interface Channel {
  id: string;        // معرف القناة الفريد
  name: string;      // اسم القناة (مثل: beIN Sports 1)
  cat: string;       // اسم القسم أو الفئة (مثل: رياضية، وثائقية)
  country: string;   // الدولة المصنعة أو الفئة الإقليمية
  logo: string;      // رابط صورة اللوجو للقناة
  streamUrl: string; // رابط البث المباشر (M3U8 أو Dash أو Mp4)
  active: boolean;   // حالة التفعيل (true يعني تظهر في التطبيق، false مخفية)
  featured: boolean; // هل تظهر في الواجهة الرئيسية كقناة مميزة
}
```

### 2. جدول وتفاصيل المباريات اليومية (`matches`)
تُخزن في كولكشن بالاسم: `matches` وكل مباراة تحتوي على:
```typescript
export interface WatchLink {
  quality: string;   // الجودة (SD, HD, FHD)
  server: string;    // اسم السيرفر لتسهيل الاختيار
  url: string;       // رابط التشغيل الفعلي للمباراة
}

export interface Match {
  id: string;        // معرف المباراة الفريد
  league: string;    // اسم البطولة/الدوري (مثل: دوري أبطال أوروبا)
  home: string;      // اسم الفريق المستضيف
  away: string;      // اسم الفريق الضيف
  score: string;     // النتيجة الحالية للمباراة (مثل: 2 - 1)
  time: string;      // توقيت انطلاق المباراة (مثل: 22:00)
  day: string;       // تاريخ اليوم أو تصنيف الزمن (مثل: اليوم، غداً)
  status: string;    // حالة اللقاء (لم تبدأ، جارية، انتهت)
  isLive: boolean;   // هل اللقاء يبث حالياً بشكل حي ومباشر (true/false)
  hFlag: string;     // رابط شعار فريق صاحب الأرض (Home Logo URL)
  aFlag: string;     // رابط شعار فريق الضيف (Away Logo URL)
  links: WatchLink[];// قائمة روابط السيرفرات المتاحة للمشاهدة
  stadium?: string;  // اختياري: اسم الملعب
  referee?: string;  // اختياري: اسم حكم اللقاء
}
```

### 3. المسلسلات والأفلام والأنمي (`series`)
تُخزن في كولكشن بالاسم: `series` وتحتوي على قائمة الحلقات وروابط المشاهدة المرفوعة من لوحة الإدارة:
```typescript
export interface Actor {
  id: string;
  name: string;
  role: string;
  photo: string;
}

export interface Episode {
  id: string;
  epNum: number;      // رقم الحلقة
  date: string;       // تاريخ الرفع أو العرض
  duration: string;   // مدة الحلقة (مثل: 45 دقيقة)
  thumb: string;      // لقطة شاشة مصغرة للحلقة
  links: WatchLink[]; // روابط وسيرفرات تشغيل الحلقة المباشرة
}

export interface Series {
  id: string;         // معرف السلسلة
  title: string;      // العنوان الأساسي باللغة العربية
  subTitle?: string;  // العنوان الإنجليزي أو البديل
  cat: string;        // الفئة (مثل: مسلسلات عربية، أنمي، أفلام)
  country: string;    // البلد
  genre: string;      // التصنيف (أكشن، دراما، كوميدي)
  year: number;       // سنة الإنتاج
  status: string;     // الحالة (مستمر، منتهي، قريباً)
  badge: string;      // وسام مميز (حصري، تريند، رائج)
  age: string;        // الفئة العمرية لحماية الأطفال
  tmdbId?: string;    // رقم مسلسل IMDB/TMDB
  views: number;      // عدد المشاهدات الفعلي
  poster: string;     // بوستر الغلاف العريض أو الطولي
  story: string;      // شرح وقصة العمل بالتفصيل
  episodes: Episode[];// مصفوفة الحلقات المضافة للعمل
  actors: Actor[];    // الممثلين أو طاقم العمل 
  featured: boolean;  // هل يتم عرضه في البانر العلوي المتغير
}
```

### 4. بنرات الإعلانات والتوجيه (`banners`)
تنقل للمستخدمين على كولكشن بالاسم: `banners`
```typescript
export interface Banner {
  id: string;
  type: string;       // نوع البنر (إعلاني، ترويجي، توجيهي لقناة)
  icon: string;       // الأيقونة المصاحبة (عبر lucide-react)
  title: string;      // العنوان العريض للبنر
  subtitle: string;   // النص الفرعي التوضيحي للبنر
  url: string;        // الرابط المستهدف عند النقر عليه
  bgColor: string;    // لون خلفية البانر منسق بالهكس ليتناسب مع تجربة المستخدم
  order: number;      // ترتيب العرض بالأولوية (تصاعدي 1، 2، 3)
  active: boolean;    // نشط ومعروض أم لا
}
```

### 5. إعدادات المنصة والهوية الشاملة (`settings/appSettings`)
مستند منفرد مسار الوصول إليه: `settings/appSettings` (Document ID هو `appSettings` بداخل الـ `settings` Collection) ويحتوي على مفاتيح التحكم السريعة والتحكم بظهور الأقسام:
```typescript
export interface AppSettings {
  appName: string;             // اسم تطبيقك
  tagline: string;             // الشعار السريع (Slogan)
  primaryColor: string;        // كود ثيم التطبيق الملون (مثل: #FF0092)
  telegram?: string;           // رابط قناة تليجرام للدعم الفني
  whatsapp?: string;           // رقم أو رابط واتساب
  email?: string;              // بريد التواصل الرسمي
  maintenance: boolean;        // 🚨 وضع الصيانة (إذا كان true، يجب إغلاق التطبيق بصفحة صيانة فوراً)
  showSportsSection?: boolean;  // هل يظهر قسم الرياضة الحالي
  showSeriesSection?: boolean;  // هل يظهر قسم المسلسلات الحالي
  showChannelsSection?: boolean;// هل يظهر قسم البث المباشر
}
```

---

## 🪟 ثالثاً: أمثلة لكود جلب البيانات والاستماع التلقائي في تطبيق المستخدمين
الـ `Google AI Studio` يستطيع نسخ هذه الأكواد لوضعها في واجهة تطبيق المشاهدين لجلب التحديثات بلحظتها دون الحاجة لتهنيج الصفحة أو كثرة قراءة قاعدة البيانات:

### أ) جلب القنوات الفعالة فقط وعرضها (Live Channels Hook)
```typescript
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Channel } from "../types";

export function useLiveChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // جلب القنوات النشطة فقط التي تم تحديدها كنشطة من لوحة الإدارة
    const q = query(
      collection(db, "channels"), 
      where("active", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveList: Channel[] = [];
      snapshot.forEach((doc) => {
        liveList.push({ id: doc.id, ...doc.data() } as Channel);
      });
      setChannels(liveList);
      setLoading(false);
    }, (error) => {
      console.error("خطأ أثناء جلب القنوات المباشرة:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { channels, loading };
}
```

### ب) جلب المباريات اليومية المفتوحة بث حي (Matches Hook)
```typescript
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { Match } from "../types";

export function useTodayMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "matches"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Match[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Match);
      });
      setMatches(list);
      setLoading(false);
    }, (err) => {
      console.error("فشل جلب جدول المباريات:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { matches, loading };
}
```

### ج) جلب ومراقبة إعدادات التطبيق ووضع الصيانة العام (Global Settings & Maintenance)
ينبغي تفعيل هذا الاستماع في الصفحة الرئيسية للتطبيق أو الـ `App.tsx` لعرض شاشة الصيانة المغلقة فور تفعيلها من لوحة الإدارة:
```typescript
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { AppSettings } from "../types";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const docRef = doc(db, "settings", "appSettings");
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    });

    return () => unsubscribe();
  }, []);

  return settings;
}
```

---

## 🔒 رابعاً: قواعد حماية البيانات الصارمة (Firestore Security Rules)
قواعد الأمان تم تطبيقها ونشرها بالفعل من لوحة الإدارة لحماية التطبيقك من التخريب أو التجسس:
- **للمستخدمين العاديين للتطبيق**: مسموح لهم **بالقراءة فقط** (`read`) للتأكد من تشغيل البث المباشر والمباريات والمسلسلات الحصرية بكل سلاسة وأمان، ولا توجد أي إمكانية لأي متطفل بـ تعديل أو حذف أي ملف على الإطلاق.
- **للمدير العام والمشرفين المعتمدين**: مسموح بالصلاحيات الكاملة للكتابة والتعديل والحذف بناءً على التحقق من هوية تسجيل الدخول في النظام.

---
👍 **انسخ هذا الملف وأعطه لمحرك جوجل للذكاء الاصطناعي الخاص بتطبيق العملاء ليربط الأزرار والشاشات بالـ Collections المشروحة أعلاه.**
