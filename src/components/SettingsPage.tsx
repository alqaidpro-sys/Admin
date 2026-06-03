import React, { useState, useEffect } from "react";
import { AppSettings, Series, Channel, Match, Banner } from "../types";
import { C } from "../styles";
import SetupFirebase from "./SetupFirebase";

interface SettingsPageProps {
  settings: AppSettings;
  series: Series[];
  channels: Channel[];
  matches: Match[];
  banners: Banner[];
  onSave: (settings: AppSettings) => Promise<void>;
}

const SCATS = [
  { k: "arabic_drama", icon: "🎭", label: "مسلسلات عربية", color: "#00A896" },
  { k: "arabic_classic", icon: "📺", label: "عربية كلاسيكية", color: "#D4A373" },
  { k: "english", icon: "🇺🇸", label: "إنجليزية", color: "#3B82F6" },
  { k: "turkish", icon: "🇹🇷", label: "تركية", color: "#D94F4F" },
  { k: "korean", icon: "🇰🇷", label: "كورية", color: "#7C3AED" },
  { k: "anime", icon: "🎌", label: "أنمي", color: "#F97316" },
  { k: "movies", icon: "🎬", label: "أفلام", color: "#0EA5E9" },
  { k: "ramadan", icon: "🌙", label: "رمضانيات", color: "#D4A373" },
  { k: "shows", icon: "🎙", label: "برامج وشو", color: "#00A896" },
  { k: "kids", icon: "🧒", label: "أطفال وكرتون", color: "#22D3EE" },
  { k: "docs", icon: "🔭", label: "وثائقيات", color: "#708D81" },
];

export default function SettingsPage({ settings, series, channels, matches, banners, onSave }: SettingsPageProps) {
  const [form, setForm] = useState<AppSettings>({ ...settings });

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const handleSave = async () => {
    await onSave(form);
  };

  const totalEpisodes = series.reduce((total, s) => total + (s.episodes?.length || 0), 0);
  const totalStreamingLinks =
    series.reduce((acc, s) => acc + s.episodes?.reduce((epAcc, ep) => epAcc + (ep.links?.length || 0), 0), 0) +
    matches.reduce((acc, m) => acc + (m.links?.length || 0), 0);

  const toggleField = (key: keyof AppSettings) => {
    setForm({ ...form, [key]: !form[key] as any });
  };

  const renderToggleRow = (key: keyof AppSettings, label: string) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }} key={key}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <button
        type="button"
        className="toggle"
        style={{ background: form[key] ? "var(--teal)" : "var(--border)" }}
        onClick={() => toggleField(key)}
      >
        <div className="tknob" style={{ left: form[key] ? 23 : 3 }}></div>
      </button>
    </div>
  );

  return (
    <div className="pc">
      <div className="ph">
        <div>
          <h1 className="pt">⚙️ إعدادات المنصة وهويتها</h1>
          <p className="ps">التحكم في أقسام المنصة، البوابات، وروابط التواصل والـ API</p>
        </div>
        <button className="btn btn-p" onClick={handleSave}>
          💾 حفظ الإعدادات بالكامل
        </button>
      </div>

      <SetupFirebase />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {/* App identity */}
        <div className="card">
          <h3 style={{ fontSize: 15, color: "var(--teal)", marginBottom: 14 }}>📱 هوية التطبيق الأساسية</h3>
          <div className="field">
            <label className="lbl">اسم التطبيق</label>
            <input
              className="inp"
              value={form.appName || ""}
              onChange={e => setForm({ ...form, appName: e.target.value })}
              placeholder="MiM Plus"
            />
          </div>
          <div className="field">
            <label className="lbl">الشعار الفرعي</label>
            <input
              className="inp"
              value={form.tagline || ""}
              onChange={e => setForm({ ...form, tagline: e.target.value })}
              placeholder="البث الذكي"
            />
          </div>
          <div className="field">
            <label className="lbl">رسالة الترحيب</label>
            <input
              className="inp"
              value={form.welcomeText || ""}
              onChange={e => setForm({ ...form, welcomeText: e.target.value })}
              placeholder="أهلاً بك في عالم الإمتاع الميّم بلاس"
            />
          </div>
          <div className="field">
            <label className="lbl">اللون الرئيسي في الواجهة</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="color"
                value={form.primaryColor || "#00A896"}
                onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                style={{
                  width: 44,
                  height: 36,
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  cursor: "pointer",
                  padding: 2,
                  background: "none"
                }}
              />
              <span style={{ fontSize: 13, color: C.textSec, fontFamily: "mono" }}>
                {form.primaryColor || "#00A896"}
              </span>
            </div>
          </div>
        </div>

        {/* Section Switches */}
        <div className="card">
          <h3 style={{ fontSize: 15, color: "var(--teal)", marginBottom: 14 }}>🎛️ تفعيل وتعطيل المحتويات</h3>
          {renderToggleRow("showTelegramBanner", "إظهار بانر الإعلان الخاص بقناة تيليجرام")}
          {renderToggleRow("showAnimeBanner", "تمكين قسم وتصنيفات الأنمي الياباني")}
          {renderToggleRow("showSportsSection", "تمكين وإظهار قسم الرياضة وجداول اليوم")}
          {renderToggleRow("showSeriesSection", "تمكين وإظهار قسم المسلسلات والأفلام")}
          {renderToggleRow("showChannelsSection", "تمكين وإظهار قسم تلفزيون المباشر IPTV")}
          {renderToggleRow("allowRegistration", "السماح للمستخدمين الجدد بالتسجيل مباشرة")}
          {renderToggleRow("maintenance", "تمكين وضع الصيانة وحظر المستخدمين مؤقتاً 🔧")}
        </div>

        {/* Social connections */}
        <div className="card">
          <h3 style={{ fontSize: 15, color: "var(--teal)", marginBottom: 14 }}>🔗 بوابات الدعم وروابط التواصل</h3>
          <div className="field">
            <label className="lbl">رابط قناة تيليجرام</label>
            <input
              className="inp"
              value={form.telegram || ""}
              dir="ltr"
              onChange={e => setForm({ ...form, telegram: e.target.value })}
              placeholder="https://t.me/mimplus_channel"
            />
          </div>
          <div className="field">
            <label className="lbl">رابط شات واتساب</label>
            <input
              className="inp"
              value={form.whatsapp || ""}
              dir="ltr"
              onChange={e => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="https://wa.me/201234567890"
            />
          </div>
          <div className="field">
            <label className="lbl">بريد الدعم والاتصال</label>
            <input
              className="inp"
              value={form.email || ""}
              dir="ltr"
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="support@mimplus.com"
            />
          </div>
          <div className="field">
            <label className="lbl">رابط منصة تويتر / X</label>
            <input
              className="inp"
              value={form.twitter || ""}
              dir="ltr"
              onChange={e => setForm({ ...form, twitter: e.target.value })}
              placeholder="https://x.com/mimplus_app"
            />
          </div>
          <div className="field">
            <label className="lbl">رابط التطبيق على جوجل بلاي</label>
            <input
              className="inp"
              value={form.playStore || ""}
              dir="ltr"
              onChange={e => setForm({ ...form, playStore: e.target.value })}
              placeholder="https://play.google.com/store/apps/details?id=com.mimplus.app"
            />
          </div>
        </div>

        {/* Third Party APIs */}
        <div className="card">
          <h3 style={{ fontSize: 15, color: "var(--teal)", marginBottom: 14 }}>🎬 مفاتيح الـ API ومحركات البحث والتخزين</h3>
          <div className="wbox" style={{ margin: "0 0 14px" }}>
            <p style={{ fontSize: 12, color: "var(--gold)", margin: 0, lineHeight: 1.5 }}>
              ⚠️ يرجى حماية هذه الرموز الحساسة وعدم مشاركتها مع أي جهات تفتقر للثوقية الأمنية التامة.
            </p>
          </div>
          <div className="field">
            <label className="lbl">مفتاح TMDB API Key</label>
            <input
              className="inp"
              value={form.tmdbKey || ""}
              dir="ltr"
              type="password"
              onChange={e => setForm({ ...form, tmdbKey: e.target.value })}
              placeholder="رقم المفتاح المصدري من موقع TMDB"
            />
          </div>
          <div className="field">
            <label className="lbl">لغة جلب بيانات TMDB الافتراضية</label>
            <select
              className="inp"
              value={form.tmdbLang || "ar"}
              onChange={e => setForm({ ...form, tmdbLang: e.target.value })}
            >
              <option value="ar">العربية (Arabic)</option>
              <option value="en">الإنجليزية (English)</option>
              <option value="tr">التركية (Turkish)</option>
              <option value="ko">الكورية (Korean)</option>
              <option value="ja">اليابانية (Japanese)</option>
            </select>
          </div>
          <div className="field">
            <label className="lbl">Gemini AI API Key</label>
            <input
              className="inp"
              value={form.geminiKey || ""}
              dir="ltr"
              type="password"
              onChange={e => setForm({ ...form, geminiKey: e.target.value })}
              placeholder="AIzaSy..."
            />
          </div>
          <div className="field">
            <label className="lbl">Firebase Project ID</label>
            <input
              className="inp"
              value={form.firebaseProjectId || ""}
              dir="ltr"
              onChange={e => setForm({ ...form, firebaseProjectId: e.target.value })}
              placeholder="mimplus-firebase-xxxx"
            />
          </div>
        </div>

        {/* Global Stats Summary */}
        <div className="card">
          <h3 style={{ fontSize: 15, color: "var(--teal)", marginBottom: 14 }}>📊 إحصائيات وقراءات سريعة</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { label: "📚 إجمالي الأعمال التلفزيونية والمسلسلات", val: series.length },
              { label: "📺 الحلقات المسجلة والمسكوبة", val: totalEpisodes },
              { label: "📡 القنوات التلفزيونية الحية المدرجة", val: channels.length },
              { label: "⚽ مباريات اليوم في القوائم", val: matches.length },
              { label: "🎯 البانرات المسجلة ترويجياً في المجموعات", val: banners.length },
              { label: "🔗 إجمالي روابط وسيرفرات البث الفعالة", val: totalStreamingLinks },
              { label: "🔴 المباريات المباشرة الآن في التطبيق", val: matches.filter(m => m.isLive).length },
              { label: "⭐ الأعمال والبوسترات المثبتة كمحتوى مميز", val: series.filter(s => s.featured).length }
            ].map((row, idx) => (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }} key={idx}>
                <span style={{ fontSize: 13, color: C.textSec }}>{row.label}</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: "var(--teal)" }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Series Distribution Summary with bars */}
        <div className="card">
          <h3 style={{ fontSize: 15, color: "var(--teal)", marginBottom: 14 }}>🗃️ توزيع وتوازن المحتوى</h3>
          {series.length === 0 ? (
            <p style={{ color: C.textDim, fontSize: 13, textAlign: "center", padding: "20px 0" }}>لا يوجد أعمال لعرض تصنيفها بعد.</p>
          ) : (
            SCATS.map(c => {
              const count = series.filter(x => x.cat === c.k).length;
              const pct = series.length ? Math.round((count / series.length) * 100) : 0;
              return (
                <div style={{ marginBottom: 10 }} key={c.k}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: C.textSec }}>{c.icon} {c.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{count} ({pct}%)</span>
                  </div>
                  <div className="pbar">
                    <div className="pfill" style={{ width: `${pct}%`, backgroundColor: c.color }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
