import React, { useState } from "react";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { C } from "../styles";
import { 
  DEFAULT_SERIES, 
  DEFAULT_CHANNELS, 
  DEFAULT_MATCHES, 
  DEFAULT_BANNERS, 
  DEFAULT_SETTINGS 
} from "../utils/mockData";

export default function SetupFirebase() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [success, setSuccess] = useState<boolean | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const seedDatabase = async () => {
    setLoading(true);
    setSuccess(null);
    setLogs([]);
    addLog("🚀 بدء عملية تأسيس وتهيئة قاعدة بيانات Firestore...");

    try {
      // 1. AppSettings
      addLog("⏳ جاري تهيئة إعدادات المنصة وهويتها (settings)...");
      await setDoc(doc(db, "settings", "appSettings"), {
        ...DEFAULT_SETTINGS,
        updatedAt: serverTimestamp()
      });
      addLog("✅ تم إنشاء إعدادات الهوية الوطنية بنجاح.");

      // 2. System Alerts
      addLog("⏳ جاري إنشاء تنبيه النظام التجريبي (system_alerts)...");
      const alertRef = doc(db, "system_alerts", "popup");
      await setDoc(alertRef, {
        isActive: false,
        title: "تنبيه تجريبي",
        message: "النظام يعمل بشكل صحيح",
        updatedAt: serverTimestamp()
      });
      addLog("✅ تم إنشاء وثيقة التنبيه (popup) بنجاح.");

      // 3. Series
      addLog("⏳ جاري زرع قائمة المسلسلات التلفزيونية والإنتاج الدرامي (series)...");
      for (const item of DEFAULT_SERIES) {
        await setDoc(doc(db, "series", item.id), {
          ...item,
          sorting_date: serverTimestamp()
        });
        addLog(`- تم إنشاء مسلسل: ${item.title}`);
      }
      addLog("✅ تم زرع المسلسلات بنجاح.");

      // 4. Channels
      addLog("⏳ جاري زرع قنوات البث التلفزيوني المباشر (channels)...");
      for (const item of DEFAULT_CHANNELS) {
        await setDoc(doc(db, "channels", item.id), item);
        addLog(`- تمت إضافة قناة: ${item.name}`);
      }
      addLog("✅ تم زرع قنوات البث المباشر بنجاح.");

      // 5. Matches
      addLog("⏳ جاري زرع مباريات دوري أبطال أوروبا والبطولات اليومية (matches)...");
      for (const item of DEFAULT_MATCHES) {
        await setDoc(doc(db, "matches", item.id), item);
        addLog(`- تم إنشاء مباراة: ${item.home} vs ${item.away}`);
      }
      addLog("✅ تم زرع جدول المباريات بنجاح.");

      // 6. Banners
      addLog("⏳ جاري زرع وتصميم البانرات الإعلانية الترويجية (banners)...");
      for (const item of DEFAULT_BANNERS) {
        await setDoc(doc(db, "banners", item.id), item);
        addLog(`- تم تفعيل البانر: ${item.title}`);
      }
      addLog("✅ تم زرع البانرات الإعلانية بنجاح.");

      // Success
      addLog("🎉 تمت تهيئة وتأسيس قاعدة البيانات بالكامل وبنجاح فائق!");
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      addLog(`❌ فشلت العملية: ${err?.message || err}`);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        fontFamily: C.font,
        color: C.text,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <span style={{ fontSize: "24px" }}>🪄</span>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: C.teal }}>المعالج السحري لتهيئة Firebase</h2>
          <p style={{ fontSize: "12px", color: C.textSec, margin: "4px 0 0 0" }}>
            زر لتأسيس وتهيئة الهيكل المبدئي لقاعدة البيانات بضغطة واحدة لأول مرة.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
        <button
          type="button"
          disabled={loading}
          onClick={seedDatabase}
          style={{
            background: loading ? C.border : `linear-gradient(135deg, ${C.teal}, ${C.tealDeep})`,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            boxShadow: `0 4px 12px ${C.tealGlow}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading ? "⚙️ جاري التأسيس والتهيئة الآن..." : "🪄 نقرة سحرية واحدة للتأسيس المبدئي"}
        </button>

        {success === true && (
          <div
            style={{
              background: "rgba(79,119,45,.12)",
              color: "#80c060",
              border: `1px solid rgba(79,119,45,.3)`,
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            💚 تم تأسيس قاعدة البيانات ورفع المستندات الهيكلية بنجاح ومزامنتها!
          </div>
        )}

        {success === false && (
          <div
            style={{
              background: C.redDim,
              color: C.red,
              border: `1px solid ${C.red}33`,
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            🚨 حدث خطأ أثناء التأسيس. يرجى مراجعة صلاحيات وقواعد حماية Firestore وقواعد البيانات.
          </div>
        )}

        {logs.length > 0 && (
          <div
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              padding: "12px",
              maxHeight: "200px",
              overflowY: "auto",
              direction: "rtl",
            }}
          >
            <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: C.textDim, fontWeight: "bold" }}>سجل المعالجة:</p>
            {logs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: "12px",
                  lineHeight: "1.6",
                  color: log.includes("❌") ? C.red : log.includes("✅") ? "#80c060" : C.textSec,
                  marginBottom: "4px",
                  fontFamily: "monospace",
                }}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
