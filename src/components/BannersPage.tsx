import React, { useState } from "react";
import { Banner } from "../types";
import { C } from "../styles";

interface BannersPageProps {
  banners: Banner[];
  onSave: (banner: Banner) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const BT = {
  telegram: { label: "تيليجرام 📡", color: "#2AABEE" },
  vip: { label: "أعمال مميزة VIP 👑", color: "#D4A373" },
  anime: { label: "أنمي ومسلسلات 🎌", color: "#F97316" },
  promo: { label: "عرض ترويجي 🎯", color: "#7C3AED" },
  custom: { label: "مخصص 💡", color: "#708D81" }
};

const uid = () => Math.random().toString(36).slice(2, 9);

export default function BannersPage({ banners, onSave, onDelete }: BannersPageProps) {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);

  const sortedBanners = [...banners].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleOpenForm = (b: Banner | null) => {
    if (b) {
      setEditingBanner({ ...b });
    } else {
      setEditingBanner({
        id: uid(),
        type: "custom",
        title: "",
        subtitle: "",
        url: "",
        active: true,
        icon: "📢",
        bgColor: "#0D2E28",
        order: banners.length
      });
    }
    setIsOpenForm(true);
  };

  const handleSaveForm = async () => {
    if (!editingBanner?.title?.trim()) {
      alert("عنوان البانر مطلوب!");
      return;
    }
    await onSave(editingBanner as Banner);
    setIsOpenForm(false);
    setEditingBanner(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا البانر؟")) {
      await onDelete(id);
    }
  };

  const handleToggleActive = async (b: Banner) => {
    const updated = { ...b, active: !b.active };
    await onSave(updated);
  };

  return (
    <div className="pc">
      <div className="ph">
        <div>
          <h1 className="pt">🎯 إدارة البانرات والترويج</h1>
          <p className="ps">البانرات النشطة التي تظهر في الواجهة الرئيسية للتطبيق لتبليغ المستخدمين</p>
        </div>
        <button className="btn btn-p" onClick={() => handleOpenForm(null)}>
          ➕ إضافة بانر جديد
        </button>
      </div>

      <div className="ibox">
        <span style={{ color: C.teal }}>ℹ️</span>
        <p style={{ margin: 0, fontSize: 12, color: C.textSec }}>
          يتم ترتيب ظهور البانرات تلقائياً اعتماداً على حقل (الترتيب). القيمة الرقمية الأصغر تظهر أولاً في واجهة العميل.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sortedBanners.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: C.textSec }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>🎯</div>
            <p style={{ fontSize: 15, fontWeight: 700 }}>لا توجد بانرات ترويجية نشطة حالياً.</p>
          </div>
        ) : (
          sortedBanners.map(b => {
            const typeObj = BT[b.type as keyof typeof BT] || BT.custom;
            return (
              <div className="card" style={{ opacity: b.active ? 1 : 0.55 }} key={b.id}>
                <div style={{
                  background: b.bgColor || "var(--card2)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 12,
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14
                }}>
                  <span style={{ fontSize: 28 }}>{b.icon || "📢"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{b.title || "عنوان البانر"}</p>
                    {b.subtitle && (
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textSec }}>{b.subtitle}</p>
                    )}
                  </div>
                  <span className="badge" style={{ background: "rgba(112, 141, 129, 0.12)", color: C.textSec, border: `1px solid ${C.border}` }}>
                    ترتيب: #{b.order || 0}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="badge" style={{ background: `${typeObj.color}15`, color: typeObj.color, border: `1px solid ${typeObj.color}33` }}>
                      {typeObj.label}
                    </span>
                    <button
                      type="button"
                      className="toggle"
                      style={{ background: b.active ? "var(--teal)" : "var(--border)" }}
                      onClick={() => handleToggleActive(b)}
                    >
                      <div className="tknob" style={{ left: b.active ? 23 : 3 }}></div>
                    </button>
                    <span style={{ fontSize: 12, color: b.active ? "var(--teal)" : C.textSec }}>
                      {b.active ? "ظاهر الآن" : "مخفي في التطبيق"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-s" onClick={() => handleOpenForm(b)}>
                      ✏️ تعديل
                    </button>
                    <button className="btn btn-ds" onClick={() => handleDelete(b.id)}>
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isOpenForm && editingBanner && (
        <div className="modal-ov">
          <div className="modal-box">
            <div className="modal-head">
              <h3>{editingBanner.title ? "✏️ تعديل تفاصيل البانر" : "➕ إضافة بانر إعلان جديد"}</h3>
              <button className="btn btn-g" style={{ padding: "4px 10px" }} onClick={() => setIsOpenForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="field">
                  <label className="lbl">نوع البانر</label>
                  <select
                    className="inp"
                    value={editingBanner.type || "custom"}
                    onChange={e => setEditingBanner({ ...editingBanner, type: e.target.value })}
                  >
                    {Object.entries(BT).map(([k, v]) => (
                      <option value={k} key={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="lbl">الأيقونة (Emoji)</label>
                  <input
                    className="inp"
                    value={editingBanner.icon || "📢"}
                    onChange={e => setEditingBanner({ ...editingBanner, icon: e.target.value })}
                    placeholder="مثال: 📢 أو 🚨"
                  />
                </div>

                <div className="field">
                  <label className="lbl">رقم الترتيب</label>
                  <input
                    className="inp"
                    type="number"
                    value={editingBanner.order || 0}
                    onChange={e => setEditingBanner({ ...editingBanner, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="lbl">العنوان الأساسي للبانر *</label>
                <input
                  className="inp"
                  placeholder="مثال: انضم الآن لقناة التيليجرام الرسمية"
                  value={editingBanner.title || ""}
                  onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="lbl">الوصف أو العنوان الفرعي</label>
                <input
                  className="inp"
                  placeholder="مثال: لمتابعة كواليس المسلسلات والأفلام الحصرية أولاً بأول..."
                  value={editingBanner.subtitle || ""}
                  onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="lbl">الرابط الموجه (Action URL)</label>
                <input
                  className="inp"
                  placeholder="https://t.me/mimplus"
                  value={editingBanner.url || ""}
                  dir="ltr"
                  onChange={e => setEditingBanner({ ...editingBanner, url: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="lbl">لون الخلفية التفاعلي للبطاقة</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="color"
                    value={editingBanner.bgColor || "#0D2E28"}
                    onChange={e => setEditingBanner({ ...editingBanner, bgColor: e.target.value })}
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
                  <span style={{ fontSize: 13, color: C.textSec, fontStyle: "mono" }}>
                    {editingBanner.bgColor || "#0D2E28"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 14px" }}>
                <span style={{ fontSize: 13, fontWeight: "700" }}>تفعيل البانر مباشرة في الصفحة الرئيسية</span>
                <button
                  type="button"
                  className="toggle"
                  style={{ background: editingBanner.active ? "var(--teal)" : "var(--border)" }}
                  onClick={() => setEditingBanner({ ...editingBanner, active: !editingBanner.active })}
                >
                  <div className="tknob" style={{ left: editingBanner.active ? 23 : 3 }}></div>
                </button>
              </div>

              {/* Real-time preview panel */}
              <div style={{ marginTop: 20 }}>
                <label className="lbl">👀 معاينة حية تفاعلية للبانر:</label>
                <div style={{
                  background: editingBanner.bgColor || "#0D2E28",
                  borderRadius: 10,
                  padding: "12px 16px",
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14
                }}>
                  <span style={{ fontSize: 28 }}>{editingBanner.icon || "📢"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{editingBanner.title || "عنوان الإعلان يظهر هنا..."}</p>
                    {editingBanner.subtitle && (
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textSec }}>{editingBanner.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="divider"></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-p" onClick={handleSaveForm}>
                  💾 حفظ البانر الإعلاني
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
