/**
 * سكريبت تهيئة وتأسيس قاعدة بيانات فايربيز (Database Seeding Script)
 * دقة متناهية متوافقة مئة بالمئة مع إصدار Firebase SDK v9+ (Modular)
 * 
 * طريقة الاستخدام:
 * 1. قم بملء كائن (firebaseConfig) أدناه ببيانات الاتصال بمشروعك في فايربيز.
 * 2. يمكنك تشغيل هذا السكريبت في بيئة Node.js أو نسخ محتواه لتشغيله في متصفح الويب.
 */

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";

// ─── كائن التكوين الفارغ ليتم تعبئته ببيانات مشروعك ───
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// تهيفة التطبيق وتدشين قاعدة البيانات
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
  console.log("⏳ جاري بدء زرع هياكل وقوائم البيانات الأساسية في Firestore...");

  try {
    // 1️⃣ زرع مجموعة system_alerts بالوثيقة الثابتة (popup)
    console.log("💡 جاري تأسيس تنبيهات النظام وثيقة 'popup'...");
    const popupDocRef = doc(db, "system_alerts", "popup");
    await setDoc(popupDocRef, {
      isActive: false,
      title: "",
      message: ""
    });
    console.log("✓ تم زرع وثيقة الـ popup بنجاح!");

    // 2️⃣ زرع مجموعة series مع وثيقة تجريبية بالهيكل الكامل والمنظم
    console.log("🎬 جاري تأسيس جدول المسلسلات وثيقة تجريبية أولى...");
    const seriesColRef = collection(db, "series");
    await addDoc(seriesColRef, {
      title: "مسلسل الاختيار 3",
      subTitle: "القرار وتحرير الذاكرة",
      poster: "https://example.com/selection3-poster.jpg",
      genre: "دراما / تاريخي / تشويق",
      country: "مصر",
      status: "مكتمل",
      ageRating: "PG-15",
      year: 2022,
      sorting_date: serverTimestamp(),
      episodes: [
        {
          id: "ep_1",
          title: "الحلقة 1: البداية الصعبة",
          links: [
            {
              id: "link_1",
              name: "سيرفر البث الإمبراطوري 1080p",
              url: "https://example.com/stream/ep1.m3u8",
              quality: "1080p FHD"
            },
            {
              id: "link_2",
              name: "سيرفر مشاهدة سريع 720p",
              url: "https://example.com/stream/ep1_720.m3u8",
              quality: "720p HD"
            }
          ]
        }
      ]
    });
    console.log("✓ تم زرع المسلسل التجريبي الإرشادي بنجاح!");

    // 3️⃣ زرع مجموعة channels مع وثيقة تجريبية لقناة IPTV
    console.log("📡 جاري تأسيس قنوات البث المباشر IPTV وثيقة تجريبية أولى...");
    const channelsColRef = collection(db, "channels");
    await addDoc(channelsColRef, {
      name: "beIN Sports 1 HD",
      category: "رياضة",
      abbr: "BS",  // أول حرفين من اسم القناة
      color: "#00A896", // تدرج لوني متناسق مع هوية Imperial Teal كخلفية للبطاقة
      streamUrl: "https://stream.example.com/live/bein1/index.m3u8"
    });
    console.log("✓ تم زرع القناة التلفزيونية التجريبية بنجاح!");

    // 4️⃣ زرع مجموعة matches لمباريات اليوم
    console.log("⚽ جاري تأسيس جدول وبطاقات مباريات اليوم وثيقة تجريبية أولى...");
    const matchesColRef = collection(db, "matches");
    await addDoc(matchesColRef, {
      id: "match_demo_992",
      teamA: "الأهلي",
      logoA: "https://example.com/logos/ahly_sc.png",
      teamB: "الزمالك",
      logoB: "https://example.com/logos/zamalek_sc.png",
      time: "21:00",
      score: "0-0",
      status: "قادمة",
      streamUrl: "" // فارغ افتراضياً كما هو مطلوب بدقة
    });
    console.log("✓ تم زرع المباراة الرياضية التجريبية بنجاح!");

    console.log("🎉✨ تهانينا! تمت عملية زرع وتثبيت كامل هيكل قاعدة البيانات بنجاح تام!");
  } catch (error) {
    console.error("❌ حدث خطأ مفاجئ أثناء زرع البيانات:", error);
  }
}

// استدعاء دالة البذر
seedDatabase();
