import React from "react";
import { Series, Channel, Match, Banner } from "../types";
import { C } from "../styles";

interface DashboardProps {
  series: Series[];
  channels: Channel[];
  matches: Match[];
  banners: Banner[];
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

export default function DashboardPage({ series, channels, matches, banners }: DashboardProps) {
  const epsCount = series.reduce((total, s) => total + (s.episodes?.length || 0), 0);
  const liveMatches = matches.filter(m => m.isLive);
  const activeChannels = channels.filter(c => c.active);

  const stats = [
    { icon: "📚", label: "إجمالي المحتوى", v: series.length, color: C.teal },
    { icon: "📺", label: "الحلقات الكلية", v: epsCount, color: C.gold },
    { icon: "📡", label: "قنوات نشطة", v: activeChannels.length, color: C.live },
    { icon: "⚽", label: "مباريات اليوم", v: matches.filter(x => x.day === "اليوم").length, color: C.teal },
    { icon: "🔴", label: "مباشر الآن", v: liveMatches.length, color: C.red },
    { icon: "🎯", label: "بانرات نشطة", v: banners.filter(x => x.active).length, color: C.gold },
    { icon: "⭐", label: "محتوى مميز", v: series.filter(x => x.featured).length, color: "#7C3AED" },
    { icon: "🌙", label: "قسم الرمضانيات", v: series.filter(x => x.cat === "ramadan").length, color: "#3B82F6" },
  ];

  return (
    <div className="pc">
      <div className="ph">
        <div>
          <h1 className="pt">📊 لوحة التحكم</h1>
          <p className="ps">نظرة شاملة على وتوزيع بيانات تطبيق MiM Plus</p>
        </div>
      </div>

      <div className="sg">
        {stats.map((st, i) => (
          <div className="sc" key={i}>
            <div className="si" style={{ background: `${st.color}15`, border: `1px solid ${st.color}33` }}>
              {st.icon}
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 900, color: st.color, margin: 0 }}>{st.v}</p>
              <p style={{ fontSize: 11, color: C.textSec, margin: 0 }}>{st.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* Category distribution */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>📚 توزيع المحتوى بالأقسام</h3>
          {series.length === 0 ? (
            <p style={{ color: C.textDim, fontSize: 13 }}>لا توجد أعمال لعرض توزيعها بعد.</p>
          ) : (
            SCATS.map(cat => {
              const count = series.filter(s => s.cat === cat.k).length;
              const pct = series.length ? Math.round((count / series.length) * 100) : 0;
              return (
                <div style={{ marginBottom: 10 }} key={cat.k}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: C.textSec }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="pbar">
                    <div className="pfill" style={{ width: `${pct}%`, backgroundColor: cat.color }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Live Matches */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>⚽ مباشر الآن</h3>
          {liveMatches.length === 0 ? (
            <p style={{ color: C.textDim, fontSize: 13, textAlign: "center", padding: "20px 0" }}>⚠️ لا توجد مباريات جارية مفعّلة للبث المباشر الآن.</p>
          ) : (
            liveMatches.map(m => (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }} key={m.id}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal)", animation: "blink 1s infinite", flexShrink: 0 }}></div>
                <span className="badge" style={{ background: C.tealDim, color: C.teal }}>{m.league}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{m.home} vs {m.away}</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: "var(--teal)" }}>{m.score}</span>
              </div>
            ))
          )}
        </div>

        {/* Latest contents */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🎬 آخر المحتوى المضاف</h3>
          {series.length === 0 ? (
            <p style={{ color: C.textDim, fontSize: 13, textAlign: "center", padding: "20px 0" }}>لا يوجد محتوى بعد.</p>
          ) : (
            series.slice(0, 6).map(s => {
              const cat = SCATS.find(c => c.k === s.cat) || SCATS[0];
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.border}` }} key={s.id}>
                  <div style={{ fontSize: 16 }}>{cat.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, overflow: "hidden", textValue: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.title}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: C.textSec }}>
                      {cat.label} • {s.episodes?.length || 0} حلقة
                    </p>
                  </div>
                  <span className="badge" style={{ background: C.liveDim, color: C.live, border: `1px solid rgba(79,119,45,.3)` }}>
                    {s.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
