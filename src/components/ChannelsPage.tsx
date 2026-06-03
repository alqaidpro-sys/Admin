import React, { useState } from "react";
import { Channel } from "../types";
import { C } from "../styles";

interface ChannelsPageProps {
  channels: Channel[];
  user: any;
  onSave: (channel: Channel) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const CHCATS = [
  { k: "sports", icon: "⚽", label: "رياضة", color: "#4F772D" },
  { k: "general", icon: "📡", label: "عام", color: "#00A896" },
  { k: "movies", icon: "🎬", label: "أفلام", color: "#7C3AED" },
  { k: "news", icon: "📰", label: "أخبار", color: "#3B82F6" },
  { k: "kids", icon: "🧒", label: "أطفال", color: "#22D3EE" },
  { k: "music", icon: "🎵", label: "موسيقى", color: "#D4A373" },
  { k: "religion", icon: "☪", label: "ديني", color: "#00A896" },
  { k: "docs", icon: "🔭", label: "وثائقي", color: "#708D81" },
  { k: "series", icon: "🎭", label: "مسلسلات", color: "#D94F4F" },
];

const COUNTRIES = [
  "مصر", "السعودية", "الإمارات", "لبنان", "الكويت", "الأردن", "سوريا", "العراق", "المغرب", "تونس", "تركيا", "كوريا", "اليابان", "أمريكا", "المملكة المتحدة", "فرنسا", "إسبانيا", "إيطاليا", "ألمانيا", "الصين"
];

const uid = () => Math.random().toString(36).slice(2, 9);

export default function ChannelsPage({ channels, user, onSave, onDelete }: ChannelsPageProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  // Edit/Add Modals State
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingChan, setEditingChan] = useState<Partial<Channel> | null>(null);

  // Quick URL Update Modal State
  const [isOpenQuickUrl, setIsOpenQuickUrl] = useState(false);
  const [quickUrlChan, setQuickUrlChan] = useState<Channel | null>(null);
  const [quickUrlVal, setQuickUrlVal] = useState("");

  const filteredChannels = channels.filter(ch => {
    const matchesTab = activeTab === "all" || ch.cat === activeTab;
    const matchesSearch = ch.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleOpenForm = (ch: Channel | null) => {
    if (ch) {
      setEditingChan({ ...ch });
    } else {
      setEditingChan({
        id: uid(),
        name: "",
        cat: "sports",
        country: "السعودية",
        logo: "",
        streamUrl: "",
        epg: "",
        active: true,
        featured: false
      });
    }
    setIsOpenForm(true);
  };

  const handleSaveForm = async () => {
    if (!editingChan?.name?.trim()) {
      alert("اسم القناة مطلوب!");
      return;
    }
    await onSave(editingChan as Channel);
    setIsOpenForm(false);
    setEditingChan(null);
  };

  const handleQuickUrlOpen = (ch: Channel) => {
    setQuickUrlChan(ch);
    setQuickUrlVal(ch.streamUrl || "");
    setIsOpenQuickUrl(true);
  };

  const handleQuickUrlSave = async () => {
    if (quickUrlChan) {
      const updated = { ...quickUrlChan, streamUrl: quickUrlVal };
      await onSave(updated);
      setIsOpenQuickUrl(false);
      setQuickUrlChan(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه القناة؟")) {
      await onDelete(id);
    }
  };

  const handleToggleState = async (ch: Channel) => {
    const updated = { ...ch, active: !ch.active };
    await onSave(updated);
  };

  return (
    <div className="pc">
      <div className="ph">
        <div>
          <h1 className="pt">📡 إدارة القنوات المباشرة (IPTV)</h1>
          <p className="ps">
            {channels.length} قناة إجمالية • {channels.filter(x => x.active).length} نشطة ومباشرة في التطبيق
          </p>
        </div>
        <button className="btn btn-p" onClick={() => handleOpenForm(null)}>
          ➕ إضافة قناة جديدة
        </button>
      </div>

      <div className="sb">
        <span style={{ color: C.teal }}>🔍</span>
        <input
          placeholder="بحث سريع باسم القناة المباشرة..."
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
        <button className={`ftb ${activeTab === "all" ? "act" : ""}`} onClick={() => setActiveTab("all")}>
          الكل ({channels.length})
        </button>
        {CHCATS.map(cat => {
          const count = channels.filter(x => x.cat === cat.k).length;
          return (
            <button
              className={`ftb ${activeTab === cat.k ? "act" : ""}`}
              onClick={() => setActiveTab(cat.k)}
              key={cat.k}
            >
              {cat.icon} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="chg">
        {filteredChannels.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: C.textSec }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>📺</div>
            <p style={{ fontSize: 15, fontWeight: 700 }}>لم نجد أي قنوات تطابق خيارات التصفية الحالية.</p>
          </div>
        ) : (
          filteredChannels.map(ch => {
            const categoryObj = CHCATS.find(x => x.k === ch.cat) || CHCATS[0];
            return (
              <div className="chc" style={{ opacity: ch.active ? 1 : 0.55 }} key={ch.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: "var(--card2)",
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    overflow: "hidden",
                    flexShrink: 0
                  }}>
                    {ch.logo ? (
                      <img src={ch.logo} style={{ width: "100%", height: "100%", objectFit: "contain" }} referrerPolicy="no-referrer" alt="" />
                    ) : (
                      categoryObj.icon
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ch.name}
                      </p>
                      {ch.featured && <span>⭐</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: C.textSec }}>
                      {categoryObj.label} • {ch.country}
                    </p>
                  </div>

                  {/* Toggle State of Channel */}
                  <button
                    type="button"
                    className="toggle"
                    style={{ background: ch.active ? "var(--teal)" : "var(--border)" }}
                    onClick={() => handleToggleState(ch)}
                  >
                    <div className="tknob" style={{ left: ch.active ? 23 : 3 }}></div>
                  </button>
                </div>

                <div style={{ fontSize: 11, marginBottom: 10 }}>
                  {ch.streamUrl ? (
                    <span style={{ color: "var(--teal)", marginRight: 4 }}>🔗 رابط البث متاح ورسمي</span>
                  ) : (
                    <span style={{ color: "var(--red)", marginRight: 4 }}>⚠️ لا يوجد رابط بث مباشر حالياً</span>
                  )}
                  {ch.epg && <span style={{ color: "var(--gold)", marginRight: 8 }}>📅 دليل البرامج متاح</span>}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="btn btn-w" onClick={() => handleQuickUrlOpen(ch)}>
                    ⚡ تحديث الرابط
                  </button>
                  <button className="btn btn-s" onClick={() => handleOpenForm(ch)}>
                    ✏️ تعديل
                  </button>
                  <button className="btn btn-ds" onClick={() => handleDelete(ch.id)}>
                    🗑️ حذف
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Stream Link Update Overlay */}
      {isOpenQuickUrl && quickUrlChan && (
        <div className="modal-ov">
          <div className="modal-box">
            <div className="modal-head">
              <h3>⚡ تحديث رابط البث السريع: {quickUrlChan.name}</h3>
              <button className="btn btn-g" style={{ padding: "4px 10px" }} onClick={() => setIsOpenQuickUrl(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="lbl">رابط البث الحيّ المباشر (HLS / m3u8)</label>
                <input
                  className="inp"
                  value={quickUrlVal}
                  onChange={e => setQuickUrlVal(e.target.value)}
                  dir="ltr"
                  placeholder="https://example.com/stream/index.m3u8"
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-p" onClick={handleQuickUrlSave}>
                  ⚡ تحديث وتطبيق الرابط فورياً
                </button>
                <button className="btn btn-g" onClick={() => setIsOpenQuickUrl(false)}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Creator / Editor Form Modal */}
      {isOpenForm && editingChan && (
        <div className="modal-ov">
          <div className="modal-box">
            <div className="modal-head">
              <h3>{editingChan.name ? `✏️ تعديل معلومات القناة: ${editingChan.name}` : "➕ إضافة قناة بث مباشر جديدة"}</h3>
              <button className="btn btn-g" style={{ padding: "4px 10px" }} onClick={() => setIsOpenForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="field">
                  <label className="lbl">اسم القناة ومجموعتها *</label>
                  <input
                    className="inp"
                    placeholder="مثال: beIN Sports 1 Premium"
                    value={editingChan.name || ""}
                    onChange={e => setEditingChan({ ...editingChan, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="lbl">التصنيف</label>
                  <select
                    className="inp"
                    value={editingChan.cat || "sports"}
                    onChange={e => setEditingChan({ ...editingChan, cat: e.target.value })}
                  >
                    {CHCATS.map(cat => (
                      <option value={cat.k} key={cat.k}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label className="lbl">بلد الإنتاج وبث القناة</label>
                  <select
                    className="inp"
                    value={editingChan.country || "السعودية"}
                    onChange={e => setEditingChan({ ...editingChan, country: e.target.value })}
                  >
                    {COUNTRIES.map(co => (
                      <option value={co} key={co}>{co}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="lbl">حالة القناة الفورية</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, height: 36 }}>
                    <button
                      type="button"
                      className="toggle"
                      style={{ background: editingChan.active ? "var(--teal)" : "var(--border)" }}
                      onClick={() => setEditingChan({ ...editingChan, active: !editingChan.active })}
                    >
                      <div className="tknob" style={{ left: editingChan.active ? 23 : 3 }}></div>
                    </button>
                    <span style={{ fontSize: 13, color: editingChan.active ? "var(--teal)" : "var(--text-sec)" }}>
                      {editingChan.active ? "مفعّلة وظاهرة" : "معطّلة ومخفية"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="lbl">شعار القناة (أو رابط أيقونة الصورة)</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="inp"
                    placeholder="https://example.com/bein_logo.png"
                    value={editingChan.logo || ""}
                    dir="ltr"
                    onChange={e => setEditingChan({ ...editingChan, logo: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  {editingChan.logo && (
                    <img
                      src={editingChan.logo}
                      style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6, border: `1px solid ${C.border}` }}
                      referrerPolicy="no-referrer"
                      alt=""
                    />
                  )}
                </div>
              </div>

              <div className="field">
                <label className="lbl">رابط بث القناة الحقيقي (M3U8 / HLS stream URL)</label>
                <input
                  className="inp"
                  placeholder="https://example.com/cdn/bein1.m3u8"
                  value={editingChan.streamUrl || ""}
                  dir="ltr"
                  onChange={e => setEditingChan({ ...editingChan, streamUrl: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="lbl">رابط ملف الدليل التلفزيوني للقناة (EPG XML Link)</label>
                <input
                  className="inp"
                  placeholder="https://epg.domain.com/channels/bein1.xml"
                  value={editingChan.epg || ""}
                  dir="ltr"
                  onChange={e => setEditingChan({ ...editingChan, epg: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 6px" }}>
                <span style={{ fontSize: 13, fontWeight: "700" }}>تمكين كقناة تلفزيونية مميزة (Featured Channel)</span>
                <button
                  type="button"
                  className="toggle"
                  style={{ background: editingChan.featured ? "var(--teal)" : "var(--border)" }}
                  onClick={() => setEditingChan({ ...editingChan, featured: !editingChan.featured })}
                >
                  <div className="tknob" style={{ left: editingChan.featured ? 23 : 3 }}></div>
                </button>
              </div>

              <div className="divider"></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-p" onClick={handleSaveForm}>
                  💾 حفظ القناة التلفزيونية
                </button>
                <button className="btn btn-g" onClick={() => setIsOpenForm(false)}>
                  إلغاء التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
