import React, { useState } from "react";
import { updatePassword } from "firebase/auth";
import { auth } from "../firebase";
import { AdminUser } from "../types";
import { C } from "../styles";

interface SupervisorsProps {
  admins: AdminUser[];
  user: any;
  onCreate: (admin: Partial<AdminUser>, pass: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const SCATS = [
  { k: "arabic_drama", icon: "🎭", label: "مسلسلات عربية" },
  { k: "arabic_classic", icon: "📺", label: "عربية كلاسيكية" },
  { k: "english", icon: "🇺🇸", label: "مسلسلات إنجليزية" },
  { k: "turkish", icon: "🇹🇷", label: "مسلسلات تركية" },
  { k: "korean", icon: "🇰🇷", label: "مسلسلات كورية" },
  { k: "anime", icon: "🎌", label: "أنمي ومسلسلات أولاد" },
  { k: "movies", icon: "🎬", label: "أفلام حصرية" },
  { k: "ramadan", icon: "🌙", label: "رمضانيات وباقات" },
  { k: "shows", icon: "🎙️", label: "برامج تلفزيونية" },
  { k: "kids", icon: "🧒", label: "أطفال ومسلسلات نتورك" },
  { k: "docs", icon: "🔭", label: "وثائقيات مستمرة" },
];

const ASECS = [
  ...SCATS,
  { k: "channels", icon: "📡", label: "قنوات التلفزيون IPTV" },
  { k: "matches", icon: "⚽", label: "مباريات اليوم والرياضة" },
  { k: "banners", icon: "🎯", label: "البانرات والترويج" },
  { k: "settings", icon: "⚙️", label: "الإعدادات العامة لميم" }
];

const uid = () => Math.random().toString(36).slice(2, 9);

export default function Supervisors({ admins, user, onCreate, onDelete }: SupervisorsProps) {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSecs, setSelectedSecs] = useState<string[]>([]);
  const [newSuperPass, setNewSuperPass] = useState("");
  const [updatingSuperPass, setUpdatingSuperPass] = useState(false);
  const [superPassMsg, setSuperPassMsg] = useState("");

  const handleUpdateSuperPassword = async () => {
    if (!newSuperPass || newSuperPass.length < 6) {
      alert("يجب أن تكون كلمة المرور 6 خانات على الأقل لضمان الأمن والحماية.");
      return;
    }
    setUpdatingSuperPass(true);
    setSuperPassMsg("");
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newSuperPass);
        setSuperPassMsg("✅ تم تحديث كلمة مرور حسابك (Super Admin) بنجاح!");
        setNewSuperPass("");
        alert("تم تحديث كلمة مرور حساب المالك والمدير العام بنجاح!");
      } else {
        setSuperPassMsg("❌ خطأ: لم يتم الكشف عن جلسة تسجيل الدخول المباشرة.");
      }
    } catch (err: any) {
      console.error(err);
      setSuperPassMsg("❌ فشل تحديث كلمة المرور: " + (err.message || err));
    } finally {
      setUpdatingSuperPass(false);
    }
  };

  const handleToggleSec = (k: string) => {
    if (selectedSecs.includes(k)) {
      setSelectedSecs(selectedSecs.filter(x => x !== k));
    } else {
      setSelectedSecs([...selectedSecs, k]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("جميع الحقول (الاسم، البريد الإلكتروني، كلمة المرور) مطلوبة!");
      return;
    }
    if (password.length < 6) {
      alert("يجب أن تتألف كلمة المرور من 6 أحرف على الأقل لحماية الحساب!");
      return;
    }
    if (selectedSecs.length === 0) {
      alert("يجب تعيين وتحديد قسم واحد على الأقل للمشرف للتحكم به!");
      return;
    }

    const newAdminObj: Partial<AdminUser> = {
      uid: uid(),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: "moderator",
      sections: [...selectedSecs],
      createdAt: new Date().toISOString().slice(0, 10)
    };

    try {
      await onCreate(newAdminObj, password);
      setIsOpenForm(false);
      setName("");
      setEmail("");
      setPassword("");
      setSelectedSecs([]);
    } catch (err: any) {
      alert("خطأ أثناء إنشاء حساب المشرف: " + err.message);
    }
  };

  const handleDelete = async (targetId: string) => {
    if (window.confirm("هل أنت متأكد من رغبتك في سحب الصلاحيات وحذف حساب هذا المشرف؟")) {
      await onDelete(targetId);
    }
  };

  // Only superadmins can see this page
  if (user.role !== "superadmin") {
    return (
      <div className="pc" style={{ textAlign: "center", padding: "100px 20px" }}>
        <div style={{ fontSize: 60, marginBottom: 20 }}>🚫</div>
        <h2 style={{ fontSize: 22, fontWeight: 900 }}>عذراً، الوصول غير مصرح به</h2>
        <p style={{ color: C.textSec, marginTop: 10 }}>هذه الصفحة مخصصة لمدير المنصة العام لتعيين ومساءلة المشرفين فقط.</p>
      </div>
    );
  }

  const moderators = admins.filter(a => a.role !== "superadmin");

  return (
    <div className="pc">
      <div className="ph">
        <div>
          <h1 className="pt">👥 إدارة المشرفين والصلاحيات</h1>
          <p className="ps">{admins.length} حساب مشرف مسجل في النظام للتحكم بالمنصة</p>
        </div>
        <button className="btn btn-p" onClick={() => setIsOpenForm(true)}>
          ➕ إضافة مشرف فرعي جديد
        </button>
      </div>

      {/* Primary Owner / superadmin Card */}
      <div style={{
        background: "linear-gradient(135deg, var(--gold-dim), rgba(0, 168, 150, 0.06))",
        border: "1px solid rgba(212, 163, 115, 0.33)",
        borderRadius: 12,
        padding: "20px",
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 30 }}>👑</span>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>المدير العام للمنصة (Super Admin)</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textSec }}>
              البريد الإلكتروني: {admins.find(a => a.role === "superadmin")?.email || "alqaidpro@gmail.com"}
            </p>
          </div>
          <span className="badge" style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid rgba(212,163,115,.3)", whiteSpace: "nowrap" }}>
            صلاحية مطلقة شاملة (ALL)
          </span>
        </div>

        {/* Password Reset Feature */}
        <div style={{
          borderTop: "1px solid rgba(212, 163, 115, 0.15)",
          paddingTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: "bold", color: "var(--gold)" }}>
            🔑 هل تريد تعيين أو تحديث كلمة المرور الخاصة بحسابك المشرف (alqaidpro@gmail.com)؟
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="password"
              placeholder="أدخل كلمة المرور الجديدة (6 أحرف فأكثر)"
              value={newSuperPass}
              onChange={(e) => setNewSuperPass(e.target.value)}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "8px 12px",
                background: C.bg,
                border: "1px solid rgba(212, 163, 115, 0.3)",
                borderRadius: "6px",
                color: C.text,
                fontSize: "13px",
                outline: "none"
              }}
            />
            <button
              onClick={handleUpdateSuperPassword}
              disabled={updatingSuperPass}
              style={{
                padding: "8px 16px",
                background: "var(--gold)",
                color: "#16161a",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              {updatingSuperPass ? "⏳ جاري التحديث..." : "💾 حفظ كلمة المرور الجديدة"}
            </button>
          </div>
          {superPassMsg && (
            <p style={{ margin: 0, fontSize: 12, color: superPassMsg.startsWith("✅") ? C.live : C.red, fontWeight: "bold" }}>
              {superPassMsg}
            </p>
          )}
        </div>
      </div>

      {/* Moderators List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {moderators.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: C.textSec }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>👥</div>
            <p style={{ fontSize: 15, fontWeight: 700 }}>لم يتم تعيين أي مشرفين فرعيين حتى الآن.</p>
          </div>
        ) : (
          moderators.map(m => (
            <div className="card" key={m.uid}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: C.tealDim,
                  border: `1px solid rgba(0, 168, 150, 0.33)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0
                }}>
                  👤
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{m.name}</p>
                  <p style={{ margin: "2px 0 6px", fontSize: 12, color: C.textSec, direction: "ltr", textAlign: "right" }}>
                    {m.email}
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {m.sections.map(secKey => {
                      const secObj = ASECS.find(x => x.k === secKey);
                      return secObj ? (
                        <span className="tag" key={secKey}>
                          {secObj.icon || "📁"} {secObj.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <span className="badge" style={{ background: C.tealDim, color: C.teal, border: `1px solid rgba(0, 168, 150, 0.3)` }}>
                    مشرف ومسؤول قسم
                  </span>
                  <span style={{ fontSize: 10, color: C.textDim }}>تم الإنشاء: {m.createdAt}</span>
                  {m.uid !== user.uid && (
                    <button className="btn btn-ds" onClick={() => handleDelete(m.uid)}>
                      🗑️ حذف وسحب الترخيص
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Moderator Form Modal */}
      {isOpenForm && (
        <div className="modal-ov">
          <div className="modal-box" style={{ maxWidth: 640 }}>
            <div className="modal-head">
              <h3>➕ تعيين حساب مشرف جديد في المنصة</h3>
              <button className="btn btn-g" style={{ padding: "4px 10px" }} onClick={() => setIsOpenForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="lbl">الاسم الكامل للمشرف *</label>
                <input
                  className="inp"
                  placeholder="مثال: يوسف القائد"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="lbl">البريد الإلكتروني للإدارة وتسجيل الدخول *</label>
                <input
                  className="inp"
                  placeholder="مثال: custom_mod@mimplus.com"
                  dir="ltr"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="lbl">تعيين كلمة المرور الافتراضية *</label>
                <input
                  className="inp"
                  placeholder="لا تقل عن 6 خانات"
                  dir="ltr"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="lbl" style={{ marginBottom: 8 }}>الأقسام المخول له إداراتها في المنصة *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 180, overflowY: "auto", padding: 4, scrollbarWidth: "thin" }}>
                  {ASECS.map(s => {
                    const isSelected = selectedSecs.includes(s.k);
                    return (
                      <div
                        id={`asec-${s.k}`}
                        key={s.k}
                        onClick={() => handleToggleSec(s.k)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: isSelected ? "var(--teal-dim)" : "var(--card2)",
                          border: `1px solid ${isSelected ? "rgba(0,168,150,.4)" : "var(--border)"}`,
                          borderRadius: 8,
                          padding: "8px 12px",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{s.icon || "📁"}</span>
                        <span style={{ fontSize: 12, color: isSelected ? "var(--teal)" : C.text, fontWeight: isSelected ? "700" : "400" }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="divider"></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-p" onClick={handleCreate}>
                  ✓ تأكيد إنشاء الحساب وتخويل الصلاحية
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
