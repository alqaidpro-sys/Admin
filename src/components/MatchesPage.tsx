import React, { useState } from "react";
import { Match, WatchLink } from "../types";
import { C } from "../styles";

interface MatchesPageProps {
  matches: Match[];
  onSave: (match: Match) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MDAYS = ["أمس", "اليوم", "غداً", "هذا الأسبوع"];
const MSTAT = [
  "لم تبدأ", "مباشر", "الشوط الأول", "نصف الوقت", "الشوط الثاني", "الوقت الإضافي", "ركلات الترجيح", "انتهت", "مؤجلة", "ملغية"
];
const MLEAGUES = [
  "الدوري الإنجليزي", "الدوري الإسباني", "الدوري الإيطالي", "الدوري الألماني", "دوري أبطال أوروبا", "الدوري السعودي", "الدوري المصري", "كأس العالم", "أخرى"
];
const QUALS = ["4K", "1080p", "720p", "480p", "360p"];

const uid = () => Math.random().toString(36).slice(2, 9);

export default function MatchesPage({ matches, onSave, onDelete }: MatchesPageProps) {
  const [activeDay, setActiveDay] = useState("اليوم");
  const [activeLeague, setActiveLeague] = useState("الكل");
  const [search, setSearch] = useState("");

  // Edit / Add Modal state
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Partial<Match> | null>(null);

  // Dynamic streams state inside modal
  const [links, setLinks] = useState<WatchLink[]>([]);

  const filteredMatches = matches.filter(m => {
    const matchesDay = activeDay === "الكل" || m.day === activeDay;
    const matchesLeague = activeLeague === "الكل" || m.league === activeLeague;
    const matchesQuery =
      m.home.toLowerCase().includes(search.toLowerCase()) ||
      m.away.toLowerCase().includes(search.toLowerCase()) ||
      m.league.toLowerCase().includes(search.toLowerCase());
    return matchesDay && matchesLeague && matchesQuery;
  });

  const handleOpenForm = (m: Match | null) => {
    if (m) {
      setEditingMatch({ ...m });
      setLinks(m.links ? [...m.links] : []);
    } else {
      setEditingMatch({
        id: uid(),
        league: "الدوري الإنجليزي",
        home: "",
        away: "",
        score: "0-0",
        time: "21:00",
        day: "اليوم",
        status: "لم تبدأ",
        isLive: false,
        hFlag: "⚽",
        aFlag: "⚽",
        stadium: "",
        referee: ""
      });
      setLinks([]);
    }
    setIsOpenForm(true);
  };

  const handleAddLink = () => {
    setLinks([...links, { quality: "1080p", server: "سيرفر البث الإمبراطوري", url: "" }]);
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const handleLinkChange = (idx: number, key: keyof WatchLink, val: string) => {
    const updated = [...links];
    updated[idx] = { ...updated[idx], [key]: val };
    setLinks(updated);
  };

  const handleSaveForm = async () => {
    if (!editingMatch?.home?.trim() || !editingMatch?.away?.trim()) {
      alert("الرجاء إدخال اسما الفريقين المتنافسين!");
      return;
    }
    const finalMatchObj: Match = {
      ...(editingMatch as Match),
      links: links.filter(l => l.url.trim() !== "")
    };
    await onSave(finalMatchObj);
    setIsOpenForm(false);
    setEditingMatch(null);
  };

  const handleScoreChange = async (match: Match, newScore: string) => {
    const updated = { ...match, score: newScore };
    await onSave(updated);
  };

  const handleToggleLive = async (match: Match) => {
    const updated = { ...match, isLive: !match.isLive };
    await onSave(updated);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف بطاقة المباراة الرياضية هذه؟")) {
      await onDelete(id);
    }
  };

  const leaguesList = ["الكل", ...Array.from(new Set(matches.map(x => x.league)))];

  return (
    <div className="pc">
      <div className="ph">
        <div>
          <h1 className="pt">⚽ إدارة مباريات اليوم والبطولات</h1>
          <p className="ps">
            {matches.length} مباراة مسجلة •{" "}
            <span style={{ color: "var(--teal)" }}>{matches.filter(x => x.isLive).length} مبارات تبث مباشرة الآن</span>
          </p>
        </div>
        <button className="btn btn-p" onClick={() => handleOpenForm(null)}>
          ➕ إضافة مباراة رياضية جديدة
        </button>
      </div>

      <div className="sb">
        <span style={{ color: C.teal }}>🔍</span>
        <input
          placeholder="بحث سريع بـ (اسم الفريق، الدوري، البطولة)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={{ background: "none", border: "none", cursor: "pointer", color: C.textSec }} onClick={() => setSearch("")}>
            ✕
          </button>
        )}
      </div>

      <div className="fb">
        <button className={`ftb ${activeDay === "الكل" ? "act" : ""}`} onClick={() => setActiveDay("all")}>
          الكل ({matches.length})
        </button>
        {MDAYS.map(d => {
          const count = matches.filter(x => x.day === d).length;
          return (
            <button
              className={`ftb ${activeDay === d ? "act" : ""}`}
              onClick={() => setActiveDay(d)}
              key={d}
            >
              {d} <span style={{ background: activeDay === d ? "rgba(255,255,255,.2)" : "var(--teal-dim)", color: activeDay === d ? "#fff" : "var(--teal)", fontSize: 11, padding: "1px 6px", borderRadius: 10, marginRight: 4 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="fb" style={{ marginTop: 6, marginBottom: 20 }}>
        {leaguesList.slice(0, 10).map(l => (
          <button
            className={`ftb ${activeLeague === l ? "act" : ""}`}
            onClick={() => setActiveLeague(l)}
            key={l}
            style={{ fontSize: 11, borderRadius: 15 }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredMatches.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: C.textSec }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>⚽</div>
            <p style={{ fontSize: 15, fontWeight: 700 }}>لم نجد أي مباريات رياضية مطابقة للفلترة والبحث الحالي.</p>
          </div>
        ) : (
          filteredMatches.map(m => (
            <div className="card" key={m.id} style={{ margin: 0 }}>
              <div className="scoreg">
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>{m.hFlag || "🏠"}</div>
                  <p style={{ margin: "5px 0 0", fontSize: 14, fontWeight: 800 }}>{m.home}</p>
                </div>

                <div style={{ textAlign: "center" }}>
                  <input
                    className="sinp"
                    value={m.score}
                    onChange={e => handleScoreChange(m, e.target.value)}
                    style={{
                      background: m.isLive ? "var(--teal-dim)" : "var(--card2)",
                      borderColor: m.isLive ? "var(--teal)" : "var(--border)",
                      color: m.isLive ? "var(--teal)" : "var(--text)"
                    }}
                  />
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
                    <button
                      type="button"
                      className={`btn ${m.isLive ? "btn-lv" : "btn-g"}`}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12 }}
                      onClick={() => handleToggleLive(m)}
                    >
                      {m.isLive ? "⬤ بث مباشر الآن" : "⬤ جدولة كـ مباشر"}
                    </button>
                  </div>
                  {m.time && (
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: C.textDim }}>
                      🕐 توقيت المباراة: {m.time}
                    </p>
                  )}
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>{m.aFlag || "🏠"}</div>
                  <p style={{ margin: "5px 0 0", fontSize: 14, fontWeight: 800 }}>{m.away}</p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className="badge" style={{ background: "rgba(112,141,129,.1)", color: C.textSec, border: `1px solid ${C.border}` }}>
                    🏆 {m.league}
                  </span>
                  <span className="badge" style={{ background: m.day === "اليوم" ? C.tealDim : "rgba(112,141,129,.1)", color: m.day === "اليوم" ? C.teal : C.textSec, border: `1px solid ${C.border}` }}>
                    📅 {m.day}
                  </span>
                  <span className="badge" style={{ background: m.isLive ? "var(--live-dim)" : "rgba(112,141,129,.1)", color: m.isLive ? "var(--live)" : C.textSec, border: `1px solid ${C.border}` }}>
                    {m.isLive ? "⬤ مباشر ومثبت" : m.status}
                  </span>
                  <span className="badge" style={{ background: C.goldDim, color: C.gold, border: `1px solid rgba(212,163,115,.3)` }}>
                    🔗 {m.links?.length || 0} سيرفرات بث
                  </span>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-s" onClick={() => handleOpenForm(m)}>
                    ✏️ تعديل وتخصيص
                  </button>
                  <button className="btn btn-ds" onClick={() => handleDelete(m.id)}>
                    🗑️ حذف
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal Overlay */}
      {isOpenForm && editingMatch && (
        <div className="modal-ov">
          <div className="modal-box wide">
            <div className="modal-head">
              <h3>{editingMatch.home ? `✏️ تعديل مباراة: ${editingMatch.home} vs ${editingMatch.away}` : "➕ إضافة مباراة رياضية جديدة للجدول"}</h3>
              <button className="btn btn-g" style={{ padding: "4px 10px" }} onClick={() => setIsOpenForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="field">
                  <label className="lbl">الدوري أو البطولة *</label>
                  <select
                    className="inp"
                    value={editingMatch.league || "الدوري الإنجليزي"}
                    onChange={e => setEditingMatch({ ...editingMatch, league: e.target.value })}
                  >
                    {MLEAGUES.map(l => (
                      <option value={l} key={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="lbl">توقيت وتاريخ اليوم</label>
                  <select
                    className="inp"
                    value={editingMatch.day || "اليوم"}
                    onChange={e => setEditingMatch({ ...editingMatch, day: e.target.value })}
                  >
                    {MDAYS.map(d => (
                      <option value={d} key={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="lbl">توقيت البداية (🕐)</label>
                  <input
                    className="inp"
                    type="time"
                    value={editingMatch.time || "21:00"}
                    onChange={e => setEditingMatch({ ...editingMatch, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="lbl">حالة وبطاقة العرض</label>
                <select
                  className="inp"
                  value={editingMatch.status || "لم تبدأ"}
                  onChange={e => setEditingMatch({ ...editingMatch, status: e.target.value })}
                >
                  {MSTAT.map(s => (
                    <option value={s} key={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Match Scoreboard inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr", gap: 12, alignItems: "end", margin: "14px 0" }}>
                <div>
                  <div className="field">
                    <label className="lbl">الفريق المستضيف (Home Team) *</label>
                    <input
                      className="inp"
                      placeholder="اسم الفريق الأول"
                      value={editingMatch.home || ""}
                      onChange={e => setEditingMatch({ ...editingMatch, home: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="lbl">شعار / علم الفريق الأول (إيموجي)</label>
                    <input
                      className="inp"
                      placeholder="مثال: 🔴 أو 🔵"
                      value={editingMatch.hFlag || "⚽"}
                      onChange={e => setEditingMatch({ ...editingMatch, hFlag: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="lbl" style={{ textAlign: "center" }}>النتيجة الحالية</label>
                  <input
                    className="inp"
                    placeholder="0-0"
                    style={{ textAlign: "center", fontSize: 22, fontWeight: 900, height: 38 }}
                    value={editingMatch.score || "0-0"}
                    onChange={e => setEditingMatch({ ...editingMatch, score: e.target.value })}
                  />
                </div>

                <div>
                  <div className="field">
                    <label className="lbl">الفريق الضيف (Away Team) *</label>
                    <input
                      className="inp"
                      placeholder="اسم الفريق الثاني"
                      value={editingMatch.away || ""}
                      onChange={e => setEditingMatch({ ...editingMatch, away: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="lbl">شعار / علم الفريق الثاني (إيموجي)</label>
                    <input
                      className="inp"
                      placeholder="مثال: ⚪ أو 🟢"
                      value={editingMatch.aFlag || "⚽"}
                      onChange={e => setEditingMatch({ ...editingMatch, aFlag: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label className="lbl">الملعب (Stadium)</label>
                  <input
                    className="inp"
                    placeholder="استاد الملك فهد الدولي"
                    value={editingMatch.stadium || ""}
                    onChange={e => setEditingMatch({ ...editingMatch, stadium: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="lbl">حكم المباراة (Referee)</label>
                  <input
                    className="inp"
                    placeholder="امين عمر"
                    value={editingMatch.referee || ""}
                    onChange={e => setEditingMatch({ ...editingMatch, referee: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0 14px" }}>
                <input
                  type="checkbox"
                  id="modal-lv"
                  checked={!!editingMatch.isLive}
                  onChange={e => setEditingMatch({ ...editingMatch, isLive: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="modal-lv" style={{ fontSize: 13, color: C.textSec, cursor: "pointer", fontWeight: "700" }}>
                  🟢 مباراة نشطة وتبث في التوقيت الحالي مباشر
                </label>
              </div>

              {/* Streaming Links Nested Component */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label className="lbl" style={{ margin: 0 }}>🔗 روابط وسيرفرات البث الرياضي</label>
                  <button className="btn btn-s" onClick={handleAddLink}>
                    ➕ إضافة سيرفر بث جديد
                  </button>
                </div>

                <div id="links-container">
                  {links.length === 0 ? (
                    <p style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: "10px 0" }}>
                      لا توجد سيرفرات بث مضافة حالياً.
                    </p>
                  ) : (
                    links.map((link, idx) => (
                      <div className="lrow" key={idx}>
                        <select
                          className="inp"
                          value={link.quality || "1080p"}
                          onChange={e => handleLinkChange(idx, "quality", e.target.value)}
                        >
                          {QUALS.map(q => (
                            <option value={q} key={q}>{q}</option>
                          ))}
                        </select>
                        <input
                          className="inp"
                          placeholder="السيرفر (مثال: سيرفر البث الإمبراطوري 1)"
                          value={link.server || ""}
                          onChange={e => handleLinkChange(idx, "server", e.target.value)}
                        />
                        <input
                          className="inp"
                          placeholder="رابط البث (m3u8, mp4, iframe...)"
                          value={link.url || ""}
                          dir="ltr"
                          onChange={e => handleLinkChange(idx, "url", e.target.value)}
                        />
                        <button className="btn btn-ds" style={{ padding: "5px 8px", borderRadius: 6 }} onClick={() => handleRemoveLink(idx)}>
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="divider"></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-p" onClick={handleSaveForm}>
                  💾 حفظ تفاصيل المباراة
                </button>
                <button className="btn btn-g" onClick={() => setIsOpenForm(false)}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
