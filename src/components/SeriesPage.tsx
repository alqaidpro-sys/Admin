import React, { useState } from "react";
import { Series, Episode, Actor, WatchLink } from "../types";
import { C } from "../styles";

interface SeriesPageProps {
  series: Series[];
  user: any;
  onSave: (item: Series) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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

const COUNTRIES = [
  "مصر", "السعودية", "الإمارات", "لبنان", "الكويت", "الأردن", "سوريا", "العراق", "المغرب", "تونس", "تركيا", "كوريا", "اليابان", "أمريكا", "المملكة المتحدة", "فرنسا", "إسبانيا", "إيطاليا", "ألمانيا", "الصين"
];
const GENRES = ["دراما", "أكشن", "كوميديا", "تشويق", "جريمة", "رومانسي", "وثائقي", "تاريخي", "حرب", "فانتازيا", "خيال علمي", "أطفال", "أنمي", "رعب"];
const STATUSES = ["يعرض الآن", "جاري العرض", "مكتمل", "قريباً", "توقف", "حصري"];
const BADGES = ["مترجم", "أصلي", "مدبلج", "مترجم ومدبلج"];
const AGES = ["+7", "+13", "+16", "+18", "للجميع"];
const QUALS = ["4K", "1080p", "720p", "480p", "360p"];

const uid = () => Math.random().toString(36).slice(2, 9);

export default function SeriesPage({ series, user, onSave, onDelete }: SeriesPageProps) {
  // Enforce Section Filtering: Determine categories representing permitted scopes
  const isSuper = user.role === "superadmin" || (user.sections && user.sections.includes("all"));
  const allowedCats = isSuper ? SCATS : SCATS.filter(c => user.sections && user.sections.includes(c.k));

  // Initialize selected category based on permissions
  const [activeCat, setActiveCat] = useState<string>(allowedCats[0]?.k || "arabic_drama");
  const [search, setSearch] = useState("");

  // Editor Modal States
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [formTab, setFormTab] = useState<"info" | "eps" | "act">("info");
  const [editingSeries, setEditingSeries] = useState<Partial<Series> | null>(null);

  // Deep structural lists inside series editor
  const [nestedEps, setNestedEps] = useState<Episode[]>([]);
  const [nestedActors, setNestedActors] = useState<Actor[]>([]);
  const [openEpIdx, setOpenEpIdx] = useState<number | null>(null);

  const currentCatObj = SCATS.find(c => c.k === activeCat) || SCATS[0];
  const catItems = series.filter(s => s.cat === activeCat);

  const filteredItems = catItems.filter(s => {
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || (s.subTitle || "").toLowerCase().includes(q) || s.country.includes(q);
  });

  const handleOpenForm = (item: Series | null) => {
    if (item) {
      setEditingSeries({ ...item });
      setNestedEps(item.episodes ? JSON.parse(JSON.stringify(item.episodes)) : []);
      setNestedActors(item.actors ? JSON.parse(JSON.stringify(item.actors)) : []);
    } else {
      setEditingSeries({
        id: uid(),
        title: "",
        subTitle: "",
        cat: activeCat,
        country: "مصر",
        genre: "دراما",
        year: 2026,
        status: "يعرض الآن",
        badge: "مترجم",
        age: "+16",
        poster: "",
        story: "",
        col: "#0D2E28",
        views: 0,
        tmdbId: "",
        featured: false
      });
      setNestedEps([]);
      setNestedActors([]);
    }
    setFormTab("info");
    setOpenEpIdx(null);
    setIsOpenForm(true);
  };

  const handleSaveForm = async () => {
    if (!editingSeries?.title?.trim()) {
      alert("عنوان العمل مطلوب!");
      return;
    }
    const mergedObj: Series = {
      ...(editingSeries as Series),
      episodes: nestedEps,
      actors: nestedActors
    };
    await onSave(mergedObj);
    setIsOpenForm(false);
    setEditingSeries(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العمل الفني وجميع حلقاته نهائياً؟")) {
      await onDelete(id);
    }
  };

  const handleToggleFeatured = async (item: Series) => {
    const updated = { ...item, featured: !item.featured };
    await onSave(updated);
  };

  // Episode Nested Helpers
  const handleAddEp = () => {
    const newEp: Episode = {
      id: uid(),
      epNum: nestedEps.length + 1,
      date: new Date().toISOString().slice(0, 10),
      duration: "45:00",
      thumb: "",
      links: []
    };
    setNestedEps([...nestedEps, newEp]);
  };

  const handleRemoveEp = (idx: number) => {
    setNestedEps(nestedEps.filter((_, i) => i !== idx));
    if (openEpIdx === idx) setOpenEpIdx(null);
  };

  const handleEpChange = (idx: number, key: keyof Episode, value: any) => {
    const updated = [...nestedEps];
    updated[idx] = { ...updated[idx], [key]: value };
    setNestedEps(updated);
  };

  // Episode Links Helpers
  const handleAddEpLink = (epIdx: number) => {
    const updated = [...nestedEps];
    const originalLinks = updated[epIdx].links || [];
    updated[epIdx].links = [...originalLinks, { quality: "1080p", server: "سيرفر البث الإمبراطوري", url: "" }];
    setNestedEps(updated);
  };

  const handleRemoveEpLink = (epIdx: number, linkIdx: number) => {
    const updated = [...nestedEps];
    updated[epIdx].links = updated[epIdx].links.filter((_, i) => i !== linkIdx);
    setNestedEps(updated);
  };

  const handleEpLinkChange = (epIdx: number, linkIdx: number, key: keyof WatchLink, value: string) => {
    const updated = [...nestedEps];
    const updatedLinks = [...updated[epIdx].links];
    updatedLinks[linkIdx] = { ...updatedLinks[linkIdx], [key]: value };
    updated[epIdx].links = updatedLinks;
    setNestedEps(updated);
  };

  // Actor Nested Helpers
  const handleAddActor = () => {
    const newActor: Actor = {
      id: uid(),
      name: "",
      role: "",
      photo: ""
    };
    setNestedActors([...nestedActors, newActor]);
  };

  const handleRemoveActor = (idx: number) => {
    setNestedActors(nestedActors.filter((_, i) => i !== idx));
  };

  const handleActorChange = (idx: number, key: keyof Actor, value: string) => {
    const updated = [...nestedActors];
    updated[idx] = { ...updated[idx], [key]: value };
    setNestedActors(updated);
  };

  return (
    <div className="pc">
      <div className="ph">
        <div>
          <h1 className="pt">📚 إدارة الأعمال الفنية والمسلسلات</h1>
          <p className="ps">تصنيفات كتالوج الفيديو ومجموعات الأعمال الحصرية للأجهزة والويب</p>
        </div>
      </div>

      <div className="ctabs">
        {allowedCats.map(c => {
          const count = series.filter(x => x.cat === c.k).length;
          const isAct = activeCat === c.k;
          return (
            <button
              className={`ctab ${isAct ? "act" : ""}`}
              onClick={() => {
                setActiveCat(c.k);
                setSearch("");
              }}
              style={isAct ? { background: `${c.color}18`, color: c.color, borderColor: `${c.color}44` } : {}}
              key={c.k}
            >
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              {c.label}
              <span style={{
                background: isAct ? `${c.color}25` : "rgba(255, 255, 255, .06)",
                color: isAct ? c.color : "var(--text-sec)",
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 10,
                fontWeight: 700,
                marginRight: 6
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {currentCatObj && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: `${currentCatObj.color}18`,
                border: `2px solid ${currentCatObj.color}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26
              }}>
                {currentCatObj.icon}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{currentCatObj.label}</h2>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: C.textSec }}>
                  {catItems.length} عمل • {catItems.reduce((acc, y) => acc + (y.episodes?.length || 0), 0)} حلقة إجمالية
                </p>
              </div>
            </div>
            <button className="btn btn-p" onClick={() => handleOpenForm(null)}>
              ➕ إضافة عمل فني جديد لهذا القسم
            </button>
          </div>

          <div className="sb">
            <span style={{ color: C.teal }}>🔍</span>
            <input
              placeholder={`بحث باسم المحتوى أو البلد في قسم ${currentCatObj.label}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={{ background: "none", border: "none", cursor: "pointer", color: C.textSec }} onClick={() => setSearch("")}>
                ✕
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.textSec }}>
                <div style={{ fontSize: 42, marginBottom: 10 }}>{currentCatObj.icon}</div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>لا توجد أعمال لعرضها ضمن هذا التصفية حالياً.</p>
              </div>
            ) : (
              filteredItems.map(s => (
                <div className="cc" key={s.id}>
                  <div className="poster" style={{ background: `linear-gradient(145deg, ${s.col || "#0D2E28"}, #080F0D)` }}>
                    {s.poster ? (
                      <img src={s.poster} referrerPolicy="no-referrer" alt="" />
                    ) : (
                      <span>{currentCatObj.icon}</span>
                    )}
                    {s.featured && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 11 }}>⭐</span>}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800 }}>{s.title}</span>
                      {s.subTitle && (
                        <span style={{ fontSize: 11, color: C.textSec, direction: "ltr" }}>({s.subTitle})</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      <span className="badge" style={{ background: C.tealDim, color: C.teal, border: `1px solid rgba(0,168,150,.3)` }}>{s.badge}</span>
                      <span className="badge" style={{ background: C.liveDim, color: C.live, border: `1px solid rgba(79,119,45,.3)` }}>{s.status}</span>
                      <span className="badge" style={{ background: C.redDim, color: C.red, border: `1px solid rgba(217,79,79,.3)` }}>{s.age}</span>
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: C.textSec }}>{s.country} • {s.genre} • {s.year}</p>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.textDim }}>
                      <span>📺 {s.episodes?.length || 0} حلقة مضافة</span>
                      <span>👥 {s.actors?.length || 0} ممثل مدرج</span>
                      <span>👁️ {(s.views || 0).toLocaleString()} مشاهدة</span>
                      {s.tmdbId && <span style={{ color: currentCatObj.color }}>🎬 TMDB: {s.tmdbId}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-s" onClick={() => handleOpenForm(s)}>
                      ✏️ تعديل العمل
                    </button>
                    <button className="btn btn-w" onClick={() => handleToggleFeatured(s)}>
                      {s.featured ? "⭐ عمل مميز" : "☆ تمييز الإدراج"}
                    </button>
                    <button className="btn btn-ds" onClick={() => handleDelete(s.id)}>
                      🗑️ حذف بالكامل
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Complex Series Editor Overlay */}
      {isOpenForm && editingSeries && (
        <div className="modal-ov">
          <div className="modal-box wide">
            <div className="modal-head">
              <h3>{editingSeries.title ? `✏️ تعديل كود العمل: ${editingSeries.title}` : "➕ إضافة عمل فني جديد للكتالوج"}</h3>
              <button className="btn btn-g" style={{ padding: "4px 10px" }} onClick={() => setIsOpenForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Nested Navigation controls inside Modal */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                <button
                  type="button"
                  className={`btn ${formTab === "info" ? "btn-p" : "btn-g"}`}
                  style={{ borderRadius: 20, padding: "6px 18px" }}
                  onClick={() => setFormTab("info")}
                >
                  📄 المعلومات العامة
                </button>
                <button
                  type="button"
                  className={`btn ${formTab === "eps" ? "btn-p" : "btn-g"}`}
                  style={{ borderRadius: 20, padding: "6px 18px" }}
                  onClick={() => setFormTab("eps")}
                >
                  📺 دليل الحلقات ({nestedEps.length})
                </button>
                <button
                  type="button"
                  className={`btn ${formTab === "act" ? "btn-p" : "btn-g"}`}
                  style={{ borderRadius: 20, padding: "6px 18px" }}
                  onClick={() => setFormTab("act")}
                >
                  👥 نجوم العمل ({nestedActors.length})
                </button>
              </div>

              {/* TAB 1: General Info */}
              {formTab === "info" && (
                <div id="modal-tab-info">
                  <div className="row">
                    <div className="field">
                      <label className="lbl">اسم العمل بالعربية *</label>
                      <input
                        className="inp"
                        placeholder="مثال: جعفر العمدة"
                        value={editingSeries.title || ""}
                        onChange={e => setEditingSeries({ ...editingSeries, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="lbl">الاسم باللاتينية أو الأجنبي</label>
                      <input
                        className="inp"
                        placeholder="English name"
                        value={editingSeries.subTitle || ""}
                        dir="ltr"
                        onChange={e => setEditingSeries({ ...editingSeries, subTitle: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="field">
                      <label className="lbl">القسم والتصنيف</label>
                      <select
                        className="inp"
                        value={editingSeries.cat || activeCat}
                        onChange={e => setEditingSeries({ ...editingSeries, cat: e.target.value })}
                      >
                        {allowedCats.map(c => (
                          <option value={c.k} key={c.k}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="lbl">بلد الإنتاج</label>
                      <select
                        className="inp"
                        value={editingSeries.country || "مصر"}
                        onChange={e => setEditingSeries({ ...editingSeries, country: e.target.value })}
                      >
                        {COUNTRIES.map(co => (
                          <option value={co} key={co}>{co}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="lbl">نوع المحتوى الرئيسي</label>
                      <select
                        className="inp"
                        value={editingSeries.genre || "دراما"}
                        onChange={e => setEditingSeries({ ...editingSeries, genre: e.target.value })}
                      >
                        {GENRES.map(g => (
                          <option value={g} key={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="field">
                      <label className="lbl">سنة الإصدار</label>
                      <input
                        className="inp"
                        type="number"
                        value={editingSeries.year || 2026}
                        onChange={e => setEditingSeries({ ...editingSeries, year: parseInt(e.target.value) || 2026 })}
                      />
                    </div>

                    <div className="field">
                      <label className="lbl">الحالة الفنية</label>
                      <select
                        className="inp"
                        value={editingSeries.status || "يعرض الآن"}
                        onChange={e => setEditingSeries({ ...editingSeries, status: e.target.value })}
                      >
                        {STATUSES.map(s => (
                          <option value={s} key={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="lbl">نوع الترجمة</label>
                      <select
                        className="inp"
                        value={editingSeries.badge || "مترجم"}
                        onChange={e => setEditingSeries({ ...editingSeries, badge: e.target.value })}
                      >
                        {BADGES.map(b => (
                          <option value={b} key={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="lbl">التصنيف العمرى</label>
                      <select
                        className="inp"
                        value={editingSeries.age || "+16"}
                        onChange={e => setEditingSeries({ ...editingSeries, age: e.target.value })}
                      >
                        {AGES.map(a => (
                          <option value={a} key={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="field">
                      <label className="lbl">رقم معرف السينما TMDB ID</label>
                      <input
                        className="inp"
                        placeholder="مثال: 12345"
                        dir="ltr"
                        value={editingSeries.tmdbId || ""}
                        onChange={e => setEditingSeries({ ...editingSeries, tmdbId: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label className="lbl">قراءات المشاهدات الافتراضية</label>
                      <input
                        className="inp"
                        type="number"
                        value={editingSeries.views || 0}
                        onChange={e => setEditingSeries({ ...editingSeries, views: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="lbl">رابط صورة البوستر الأساسي</label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        className="inp"
                        placeholder="https://example.com/poster.jpg"
                        value={editingSeries.poster || ""}
                        dir="ltr"
                        style={{ flex: 1 }}
                        onChange={e => setEditingSeries({ ...editingSeries, poster: e.target.value })}
                      />
                      {editingSeries.poster && (
                        <img
                          src={editingSeries.poster}
                          style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.border}` }}
                          referrerPolicy="no-referrer"
                          alt=""
                        />
                      )}
                    </div>
                  </div>

                  <div className="field">
                    <label className="lbl">لون بطاقة العرض التفاعلية</label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="color"
                        value={editingSeries.col || "#0D2E28"}
                        onChange={e => setEditingSeries({ ...editingSeries, col: e.target.value })}
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
                      <span style={{ fontSize: 13, color: C.textSec }}>
                        {editingSeries.col || "#0D2E28"}
                      </span>
                    </div>
                  </div>

                  <div className="field">
                    <label className="lbl">قصة العمل الفني والوصف العام</label>
                    <textarea
                      className="inp"
                      placeholder="اكتب قصة العمل هنا..."
                      style={{ minHeight: 100 }}
                      value={editingSeries.story || ""}
                      onChange={e => setEditingSeries({ ...editingSeries, story: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Episodes */}
              {formTab === "eps" && (
                <div id="modal-tab-eps">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 14 }}>حلقات هذا العمل</h4>
                    <button className="btn btn-p" onClick={handleAddEp}>
                      ➕ إضافة حلقة جديدة للعمل
                    </button>
                  </div>

                  <div id="modal-episodes-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {nestedEps.length === 0 ? (
                      <p style={{ textAlign: "center", color: C.textDim, padding: 30 }}>
                        لا توجد حلقات مضافة حالياً. يرجى الضغط على زر إضافة حلقة في الأعلى لبناء الكتالوج.
                      </p>
                    ) : (
                      nestedEps.map((ep, epIdx) => {
                        const isEpOpen = openEpIdx === epIdx;
                        return (
                          <div className="eph" key={ep.id || epIdx}>
                            <div className="ephd" onClick={() => setOpenEpIdx(isEpOpen ? null : epIdx)}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 15, fontWeight: 900, color: "var(--teal)" }}>#{ep.epNum}</span>
                                <span style={{ fontSize: 13, color: C.text }}>الحلقة رقم {ep.epNum}</span>
                                <span className="badge" style={{ background: C.tealDim, color: C.teal }}>
                                  {ep.links?.length || 0} سيرفرات بث
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <span style={{ fontSize: 11, color: C.textSec }}>{ep.date}</span>
                                <span style={{ color: C.textSec, fontSize: 12 }}>{isEpOpen ? "▲" : "▼"}</span>
                                <button
                                  type="button"
                                  className="btn btn-ds"
                                  style={{ padding: "3px 6px" }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleRemoveEp(epIdx);
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {/* Expanded Episode Editor Panel */}
                            {isEpOpen && (
                              <div className="epb" style={{ display: "block" }}>
                                <div style={{ height: 10 }}></div>
                                <div className="row">
                                  <div className="field">
                                    <label className="lbl">رقم الحلقة</label>
                                    <input
                                      className="inp"
                                      type="number"
                                      value={ep.epNum}
                                      onChange={e => handleEpChange(epIdx, "epNum", parseInt(e.target.value) || (epIdx + 1))}
                                    />
                                  </div>
                                  <div className="field">
                                    <label className="lbl">تاريخ الرفع</label>
                                    <input
                                      className="inp"
                                      type="date"
                                      value={ep.date}
                                      onChange={e => handleEpChange(epIdx, "date", e.target.value)}
                                    />
                                  </div>
                                  <div className="field">
                                    <label className="lbl">المدة المتوقعة (دقائق)</label>
                                    <input
                                      className="inp"
                                      value={ep.duration}
                                      onChange={e => handleEpChange(epIdx, "duration", e.target.value)}
                                      placeholder="مثال: 45:00"
                                      dir="ltr"
                                    />
                                  </div>
                                </div>

                                <div className="field">
                                  <label className="lbl">صورة مصغرة للحلقة (اختيارى)</label>
                                  <input
                                    className="inp"
                                    placeholder="https://example.com/episode_thumb.jpg"
                                    value={ep.thumb || ""}
                                    dir="ltr"
                                    onChange={e => handleEpChange(epIdx, "thumb", e.target.value)}
                                  />
                                </div>

                                {/* Deep Episode Server Links List */}
                                <div style={{ marginTop: 12 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                    <label className="lbl" style={{ margin: 0 }}>🔗 سيرفرات البث وشاشات العرض</label>
                                    <button
                                      type="button"
                                      className="btn btn-s"
                                      style={{ padding: "3px 8px" }}
                                      onClick={() => handleAddEpLink(epIdx)}
                                    >
                                      ➕ إضافة شاشة بث
                                    </button>
                                  </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {(ep.links || []).length === 0 ? (
                                      <p style={{ color: C.textDim, fontSize: 11, textAlign: "center", padding: "8px 0" }}>
                                        بث الحلقة فارغ. يرجى إضافة روابط سيرفرات البث.
                                      </p>
                                    ) : (
                                      ep.links.map((link, linkIdx) => (
                                        <div className="lrow" style={{ margin: 0 }} key={linkIdx}>
                                          <select
                                            className="inp"
                                            value={link.quality || "1080p"}
                                            onChange={e => handleEpLinkChange(epIdx, linkIdx, "quality", e.target.value)}
                                          >
                                            {QUALS.map(q => (
                                              <option value={q} key={q}>{q}</option>
                                            ))}
                                          </select>
                                          <input
                                            className="inp"
                                            value={link.server || ""}
                                            onChange={e => handleEpLinkChange(epIdx, linkIdx, "server", e.target.value)}
                                            placeholder="السيرفر (سيرفر مباشر)"
                                          />
                                          <input
                                            className="inp"
                                            value={link.url || ""}
                                            onChange={e => handleEpLinkChange(epIdx, linkIdx, "url", e.target.value)}
                                            dir="ltr"
                                            placeholder="رابط مصدر الفيديو (m3u8 أو mp4 أو يوتيوب)"
                                          />
                                          <button
                                            type="button"
                                            className="btn btn-ds"
                                            style={{ padding: "5px 8px", borderRadius: 6 }}
                                            onClick={() => handleRemoveEpLink(epIdx, linkIdx)}
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Actors */}
              {formTab === "act" && (
                <div id="modal-tab-act">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 14 }}>طاقم تمثيل ونجوم العمل</h4>
                    <button className="btn btn-s" onClick={handleAddActor}>
                      ➕ إضافة ممثل جديد
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {nestedActors.length === 0 ? (
                      <p style={{ textAlign: "center", color: C.textDim, padding: 20 }}>
                        لم يتم ربط أي ممثلين بهذا العمل بعد.
                      </p>
                    ) : (
                      nestedActors.map((actor, actIdx) => (
                        <div className="lrow" style={{ gridTemplateColumns: "1fr 1fr 1fr 34px" }} key={actor.id || actIdx}>
                          <input
                            className="inp"
                            placeholder="اسم الممثل العربي"
                            value={actor.name}
                            onChange={e => handleActorChange(actIdx, "name", e.target.value)}
                          />
                          <input
                            className="inp"
                            placeholder="الدور في العمل"
                            value={actor.role}
                            onChange={e => handleActorChange(actIdx, "role", e.target.value)}
                          />
                          <input
                            className="inp"
                            placeholder="رابط الصورة الشخصية للممثل"
                            value={actor.photo}
                            dir="ltr"
                            onChange={e => handleActorChange(actIdx, "photo", e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-ds"
                            style={{ padding: "5px 8px", borderRadius: 6 }}
                            onClick={() => handleRemoveActor(actIdx)}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="divider"></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-p" onClick={handleSaveForm}>
                  💾 حفظ وتثبيت العمل الفني
                </button>
                <button className="btn btn-g" onClick={() => setIsOpenForm(false)}>
                  إلغاء وتراجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
