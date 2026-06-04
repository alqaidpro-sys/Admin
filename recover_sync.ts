import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc
} from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// استيراد البيانات الافتراضية والاحتياطية من مجلد الأدوات
import { 
  DEFAULT_SERIES, 
  DEFAULT_CHANNELS, 
  DEFAULT_MATCHES, 
  DEFAULT_BANNERS, 
  DEFAULT_SETTINGS 
} from "./src/utils/mockData";

// مسار ملف النسخ الاحتياطي المحلي
const BACKUP_FILE_PATH = path.resolve("./firestore_backup.json");
const CONFIG_FILE_PATH = path.resolve("./firebase-applet-config.json");

// قائمة المجموعات (Collections) التي يجب حمايتها وتتبعها
const COLLECTIONS_TO_SYNC = ["series", "channels", "matches", "banners", "settings", "system_alerts"];

async function run() {
  console.log("=================================================");
  console.log("🇸🇦  نظام الاسترداد والنسخ الاحتياطي التلقائي لـ Firestore  🇸🇦");
  console.log("=================================================");

  // 1. قراءة تهيئة Firebase
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    throw new Error(`لم يتم العثور على ملف الإعدادات في المسار: ${CONFIG_FILE_PATH}`);
  }
  
  const firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"));
  console.log(`🔌 الاتصال بقاعدة البيانات للمشروع: ${firebaseConfig.projectId}`);
  console.log(`📂 معرف قاعدة البيانات الفرعي: ${firebaseConfig.firestoreDatabaseId || "(default)"}`);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  // تحليل خيارات التشغيل من موجه الأوامر (Command Line Arguments)
  const args = process.argv.slice(2);
  const isBackupMode = args.includes("--backup") || args.includes("-b");
  const isRestoreMode = args.includes("--restore") || args.includes("-r");
  const isClearMode = args.includes("--clear") || args.includes("-c");

  if (isBackupMode) {
    await performBackup(db);
  } else if (isRestoreMode) {
    await performRestore(db);
  } else if (isClearMode) {
    await performClear(db);
  } else {
    // الوضع التلقائي الذكي (Smart Autopilot Modality)
    console.log("\n🤖 [وضع الاسترداد التلقائي الذكي]:");
    console.log("1. جاري أخذ نسخة احتياطية سريعة مما هو موجود للحماية...");
    await performBackup(db, path.resolve("./firestore_backup_autopilot_temp.json"), true);
    
    console.log("\n2. جاري فحص بنية وهيكل الجداول وقاعدة البيانات وتغذيتها التلقائية...");
    await healDatabaseStructure(db);
  }
}

/**
 * دالة استرداد وتصدير كافة البيانات من Firestore إلى ملف محلي
 */
async function performBackup(db: any, customPath?: string, silent = false) {
  const targetPath = customPath || BACKUP_FILE_PATH;
  if (!silent) {
    console.log(`\n⏳ جاري استرداد البيانات وتصدير النسخة الاحتياطية إلى: ${targetPath}`);
  }

  try {
    const backupData: Record<string, any[]> = {};

    for (const colName of COLLECTIONS_TO_SYNC) {
      if (!silent) console.log(`   - جلب مستندات المجموعة: [${colName}]...`);
      const snapshot = await getDocs(collection(db, colName));
      
      const documents: any[] = [];
      snapshot.forEach((docSnap) => {
        documents.push({
          _doc_id: docSnap.id,
          ...docSnap.data()
        });
      });
      
      backupData[colName] = documents;
    }

    // حفظ البيانات في ملف منسق بصيغة JSON
    fs.writeFileSync(targetPath, JSON.stringify(backupData, null, 2), "utf-8");
    console.log(`\n✅ تم تصدير واسترداد البيانات بنجاح تام! عدد السجلات الإجمالي المصدرة:`);
    Object.entries(backupData).forEach(([col, docs]) => {
      console.log(`   🔸 ${col}: ${docs.length} وثيقة/مستند`);
    });
  } catch (error: any) {
    console.error("❌ فشل تصدير واسترداد البيانات من Firestore:", error.message || error);
  }
}

/**
 * دالة استرجاع وإعادة البيانات من الملف المحلي أو البيانات الافتراضية إلى Firestore
 */
async function performRestore(db: any) {
  console.log("\n⏳ جاري استرجاع وإعادة بناء قاعدة البيانات من النسخة الاحتياطية...");

  let sourceData: Record<string, any[]> = {};

  if (fs.existsSync(BACKUP_FILE_PATH)) {
    console.log(`📦 تم العثور على ملف النسخة الاحتياطية المحلي: ${BACKUP_FILE_PATH}`);
    try {
      sourceData = JSON.parse(fs.readFileSync(BACKUP_FILE_PATH, "utf-8"));
    } catch (e: any) {
      console.error("❌ خطأ في معالجة وقراءة ملف JSON:", e.message);
      console.log("⚠️ سيتم التراجع لاستخدام البيانات الافتراضية للتعافي.");
      sourceData = getFallbackMockMap();
    }
  } else {
    console.log("⚠️ لم يتم العثور على ملف احتياطي محلي 'firestore_backup.json'.");
    console.log("💡 سيتم استرجاع قاعدة البيانات تلقائياً باستخدام حزمة البيانات الافتراضية (Mock Data Fallbacks)...");
    sourceData = getFallbackMockMap();
  }

  try {
    for (const [colName, docs] of Object.entries(sourceData)) {
      console.log(`🚀 جاري حقن مستندات المجموعة: [${colName}]...`);
      for (const item of docs) {
        const docId = item._doc_id || item.id;
        if (!docId) {
          console.warn(`      ⚠️ تم تخطي مستند بدون معرف فريد (Document ID) في مجموعة: ${colName}`);
          continue;
        }

        // إزالة الحقل التعريفي المصنع للنظام المؤقت قبل الرفع
        const cleanItem = { ...item };
        delete cleanItem._doc_id;

        const docRef = doc(db, colName, docId);
        await setDoc(docRef, cleanItem);
      }
      console.log(`   ✓ تم استرجاع ${docs.length} مستند كلياً!`);
    }
    console.log("\n✨🎉 تمت عملية الاستعادة والاسترجاع التام بنجاح خارق وبدقة عالية!");
  } catch (error: any) {
    console.error("❌ فشل إعادة بناء واسترجاع البيانات المستهدفة:", error.message || error);
  }
}

/**
 * تنظيف ومسح كافة البيانات من Firestore بالكامل (مخصصة للاختبار والتطهير المطور)
 */
async function performClear(db: any) {
  console.log("\n🚨🚨 تحذير: جاري مسح كافة السجلات الحالية بجميع المجموعات بقاعدة البيانات...");
  try {
    for (const colName of COLLECTIONS_TO_SYNC) {
      const snapshot = await getDocs(collection(db, colName));
      console.log(`🗑️ جاري حذف سجلات المجموعة: [${colName}]...`);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, colName, docSnap.id));
      }
    }
    console.log("\n🧹 تم تطهير ومسح قاعدة البيانات بالكامل!");
  } catch (e: any) {
    console.error("❌ خطأ أثناء مسح قاعدة البيانات:", e.message);
  }
}

/**
 * دالة الفحص الذاتي والتشخيص ومداواة الجداول الفارغة لمنع انهيار تطبيق المستخدم
 */
async function healDatabaseStructure(db: any) {
  console.log("🔍 فحص بنية المجموعات وعقد الاتصال الحية...");
  try {
    // 1. فحص الإعداداتsettings/appSettings
    const settingsSnap = await getDocs(collection(db, "settings"));
    if (settingsSnap.empty) {
      console.log("🔧 [مفقود] لم يتم العثور على إعدادات التطبيق العامة. جاري الزرع الفوري...");
      await setDoc(doc(db, "settings", "appSettings"), DEFAULT_SETTINGS);
      console.log("   ✓ تم حقن إعدادات المنصة والهوية بنجاح.");
    } else {
      console.log(`   ✓ مجموعة الإعدادات [settings]: نشطة (تحتوي على مستندات).`);
    }

    // 2. فحص التنبيهات المنبثقة
    const alertSnap = await getDocs(collection(db, "system_alerts"));
    if (alertSnap.empty) {
      console.log("📢 [مفقود] لم يتم العثور على مستند تنبيهات النظام الثابت. جاري الزرع الفوري...");
      await setDoc(doc(db, "system_alerts", "popup"), {
        isActive: false,
        title: "",
        message: ""
      });
      console.log("   ✓ تم حقن إعداد التنبيه الافتراضي.");
    } else {
      console.log(`   ✓ مجموعة التنبيهات [system_alerts]: نشطة.`);
    }

    // 3. فحص البنرات الإعلانية
    const bannersSnap = await getDocs(collection(db, "banners"));
    if (bannersSnap.empty) {
      console.log("📢 [مفقود] مجموعة البنرات فارغة تماماً. جاري تهيئتها بالبنر الافتراضي للتطبيق...");
      for (const banner of DEFAULT_BANNERS) {
        await setDoc(doc(db, "banners", banner.id), banner);
      }
      console.log("   ✓ تم حقن البنرات التسويقية.");
    } else {
      console.log(`   ✓ مجموعة البنرات [banners]: نشطة وتحتوي على ${bannersSnap.size} بنرات.`);
    }

    // 4. فحص القنوات
    const channelsSnap = await getDocs(collection(db, "channels"));
    if (channelsSnap.empty) {
      console.log("📡 [مفقود] لا توجد أي قنوات IPTV بث مباشر. جاري إعادة الرفع التلقائي كـ Fallback...");
      for (const ch of DEFAULT_CHANNELS) {
        await setDoc(doc(db, "channels", ch.id), ch);
      }
      console.log("   ✓ تم زرع قنوات البث المباشر الافتراضية.");
    } else {
      console.log(`   ✓ مجموعة القنوات [channels]: نشطة وتحتوي على ${channelsSnap.size} ملاك بث.`);
    }

    // 5. فحص المباريات الرياضية
    const matchesSnap = await getDocs(collection(db, "matches"));
    if (matchesSnap.empty) {
      console.log("⚽ [مفقود] جدول مباريات اليوم فارغ بالكامل. جاري إدخال المباريات النموذجية الحية...");
      for (const match of DEFAULT_MATCHES) {
        await setDoc(doc(db, "matches", match.id), match);
      }
      console.log("   ✓ تم زرع مباريات اليوم الافتراضية بنجاح.");
    } else {
      console.log(`   ✓ مجموعة المباريات [matches]: نشطة وتحتوي على ${matchesSnap.size} لقاءات.`);
    }

    // 6. فحص المسلسلات الحصرية
    const seriesSnap = await getDocs(collection(db, "series"));
    if (seriesSnap.empty) {
      console.log("🎬 [مفقود] مكتبة المسلسلات والأعمال فارغة. جاري تجهيز السلسلة النموذجية...");
      for (const s of DEFAULT_SERIES) {
        await setDoc(doc(db, "series", s.id), s);
      }
      console.log("   ✓ تم زرع المسلسلات المرجعية النموذجية.");
    } else {
      console.log(`   ✓ مجموعة المسلسلات [series]: نشطة وتحتوي على ${seriesSnap.size} تصنيفات عمل.`);
    }

    console.log("\n🌟 [اكتمل الفحص والتشخيص الذاتي]: كافة مجموعات Firestore تملك وثائق نشطة وجزء احتياطي كامل وتتم مزامنتها بسلاسة تامة مع لوحة التحكم!");
  } catch (err: any) {
    console.error("❌ حدث خطأ غير متوقع أثناء الفحص ومداواة الخادم السحابي الذاتي:", err.message || err);
  }
}

/**
 * تحويل البيانات الافتراضية إلى خريطة مجموعات لتتوافق مع نظام الاستعادة الموحد
 */
function getFallbackMockMap(): Record<string, any[]> {
  return {
    settings: [{ _doc_id: "appSettings", ...DEFAULT_SETTINGS }],
    system_alerts: [{ _doc_id: "popup", isActive: false, title: "", message: "" }],
    banners: DEFAULT_BANNERS.map(b => ({ _doc_id: b.id, ...b })),
    channels: DEFAULT_CHANNELS.map(c => ({ _doc_id: c.id, ...c })),
    matches: DEFAULT_MATCHES.map(m => ({ _doc_id: m.id, ...m })),
    series: DEFAULT_SERIES.map(s => ({ _doc_id: s.id, ...s }))
  };
}

run().catch((error) => {
  console.error("🚨 خطأ قاتل في نظام الاسترداد التلقائي الذكي:", error);
  process.exit(1);
});
