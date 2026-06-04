import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { C } from "../styles";
import { 
  DEFAULT_SERIES, 
  DEFAULT_CHANNELS, 
  DEFAULT_MATCHES, 
  DEFAULT_BANNERS, 
  DEFAULT_SETTINGS 
} from "../utils/mockData";

const getDocWithTimeout = (docRef: any, timeoutMs: number = 6000) => {
  return Promise.race([
    getDoc(docRef),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("استغرق خادم قاعدة البيانات لقراءة الصلاحيات وقتاً طويلاً. يرجى التأكد من تفعيل Firestore في كونسول Firebase.")), timeoutMs)
    )
  ]);
};

const setDocWithTimeout = (docRef: any, data: any, timeoutMs: number = 6000) => {
  return Promise.race([
    setDoc(docRef, data),
    new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error("استغرقت كتابة بيانات المشرف وقتاً طويلاً. يرجى مراجعة إعدادات Firestore وقواعد القراءة/الكتابة.")), timeoutMs)
    )
  ]);
};

interface LoginProps {
  onSuccess: (user: any) => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  const handleForgotPassword = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMsg("الرجاء كتابة البريد الإلكتروني أولاً في حقل الإدخال ليتم إرسال رابط إعادة تعيين كلمة المرور إليه.");
      return;
    }
    setResetting(true);
    setResetSuccess("");
    setErrorMsg("");
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetSuccess(`تم إرسال رابط إعادة تعيين كلمة المرور بنجاح إلى البريد الإلكتروني: ${targetEmail}. يرجى مراجعة البريد (ووارد السبام) لتغيير كلمتك.`);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        setErrorMsg("عذراً، هذا البريد غير مرن ببريد مسجل في النظام بعد.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("صيغة البريد الإلكتروني المدخلة غير صالحة.");
      } else {
        setErrorMsg("فشل إرسال رابط إعادة تعيين كلمة المرور: " + (err.message || err));
      }
    } finally {
      setResetting(false);
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setErrorMsg("");
    try {
      // 1. AppSettings
      await setDoc(doc(db, "settings", "appSettings"), DEFAULT_SETTINGS);

      // 2. Series
      for (const item of DEFAULT_SERIES) {
        await setDoc(doc(db, "series", item.id), item);
      }

      // 3. Channels
      for (const item of DEFAULT_CHANNELS) {
        await setDoc(doc(db, "channels", item.id), item);
      }

      // 4. Matches
      for (const item of DEFAULT_MATCHES) {
        await setDoc(doc(db, "matches", item.id), item);
      }

      // 5. Banners
      for (const item of DEFAULT_BANNERS) {
        await setDoc(doc(db, "banners", item.id), item);
      }

      // 6. System Alerts
      await setDoc(doc(db, "system_alerts", "popup"), {
        isActive: false,
        title: "",
        message: ""
      });

      setSeedSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("حدث خطأ أثناء تأسيس قاعدة البيانات: " + (err.message || err));
    } finally {
      setSeeding(false);
    }
  };



  const executeGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const targetEmail = userCredential.user.email?.trim().toLowerCase();
      const uid = userCredential.user.uid;

      if (!targetEmail) {
        throw new Error("لم نتمكن من الحصول على البريد الإلكتروني من حساب Google الخاص بك.");
      }

      const adminDocRef = doc(db, "admins", uid);
      const adminSnap = await getDocWithTimeout(adminDocRef);

      let adminData: any = null;

      if (adminSnap.exists()) {
        adminData = adminSnap.data();
      } else {
        if (targetEmail === "alqaidpro@gmail.com") {
          adminData = {
            uid,
            email: targetEmail,
            name: "المدير العام",
            role: "superadmin",
            sections: ["all"],
            createdAt: new Date().toISOString().slice(0, 10)
          };
          await setDocWithTimeout(adminDocRef, adminData);
        } else {
          setErrorMsg("عذراً، هذا الحساب (" + targetEmail + ") ليس لديه صلاحيات الإشراف في لوحة التحكم.");
          setLoading(false);
          await auth.signOut();
          return;
        }
      }

      if (adminData.role === "moderator" && (!adminData.sections || adminData.sections.length === 0)) {
        setErrorMsg("عذراً، هذا الحساب لم يتم تعيين أي أقسام له حتى الآن.");
        setLoading(false);
        await auth.signOut();
        return;
      }

      onSuccess(adminData);
    } catch (err: any) {
      console.error("Google Auth Error: ", err);
      // Nice error feedback
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("تم إغلاق نافذة تسجيل الدخول بـ Google قبل اكتمال العملية.");
      } else {
        setErrorMsg("فشل الدخول عبر Google: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  const executeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("الرجاء إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const targetEmail = email.trim().toLowerCase();

    try {
      let userCredential;
      try {
        // 1. Try to sign in the user
        userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      } catch (authErr: any) {
        // If it's the master email alqaidpro@gmail.com, and user-not-found, auto-create it safely!
        if (targetEmail === "alqaidpro@gmail.com" && (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential")) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, targetEmail, password);
          } catch (createErr: any) {
            throw authErr; // throw original
          }
        } else {
          throw authErr;
        }
      }

      const uid = userCredential.user.uid;

      // 2. Fetch/Integrate Admins row
      const adminDocRef = doc(db, "admins", uid);
      const adminSnap = await getDocWithTimeout(adminDocRef);

      let adminData: any = null;

      if (adminSnap.exists()) {
        adminData = adminSnap.data();
      } else {
        // If master admin alqaidpro@gmail.com logs in but is not registered in Firestore, register them!
        if (targetEmail === "alqaidpro@gmail.com") {
          adminData = {
            uid,
            email: targetEmail,
            name: "المدير العام",
            role: "superadmin",
            sections: ["all"],
            createdAt: new Date().toISOString().slice(0, 10)
          };
          await setDocWithTimeout(adminDocRef, adminData);
        } else {
          // Normal user without permission
          setErrorMsg("عذراً، هذا الحساب ليس لديه صلاحيات الإشراف في لوحة التحكم.");
          setLoading(false);
          return;
        }
      }

      // Check if user is moderator but has empty sections
      if (adminData.role === "moderator" && (!adminData.sections || adminData.sections.length === 0)) {
        setErrorMsg("عذراً، هذا الحساب لم يتم تعيين أي أقسام له حتى الآن.");
        setLoading(false);
        return;
      }

      onSuccess(adminData);
    } catch (err: any) {
      console.error("Authentication Error: ", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setErrorMsg("بيانات الدخول غير صحيحة. الرجاء التأكد من البريد وكلمة المرور.");
      } else if (err.code === "auth/user-not-found") {
        setErrorMsg("حساب المستخدم غير مسجل في النظام.");
      } else if (err.code === "auth/operation-not-allowed") {
        setErrorMsg(
          "عذراً، خيار 'البريد وكلمة المرور' (Email/Password) معطل حالياً في مشروع Firebase الخاص بك. يرجى استخدام زر 'الدخول السريع بحساب Google' الموصى به أدناه، أو تفعيل خيار البريد من كونسول Firebase لو رغبت بالدخول اليدوي."
        );
      } else {
        setErrorMsg("حدث خطأ أثناء الاتصال بالخادم: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-pg">
      <div className="lg1"></div>
      <div className="lg2"></div>
      <div className="lbox">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="lic">م</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text }}>MiM Plus</h1>
          <p style={{ marginTop: 6, fontSize: 13, color: C.textSec }}>لوحة الإدارة الاحترافية</p>
        </div>

        <h2 style={{ textAlign: "center", fontSize: 17, marginBottom: 20, color: C.text }}>🔐 تسجيل الدخول للإدارة</h2>

        {/* 🆘 مساعد تسجيل الدخول وفك إعاقات النوافذ */}
        <div style={{
          background: "rgba(0,168,150,0.06)",
          border: `1px solid ${C.teal}33`,
          borderRadius: 12,
          padding: "16px",
          marginBottom: 20,
          textAlign: "right",
          fontSize: 13,
          direction: "rtl",
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)"
        }}>
          <p style={{ margin: "0 0 12px", lineHeight: "1.6", fontWeight: "bold", color: C.text }}>
            🛑 هل تواجه صعوبة في تسجيل الدخول بـ Google؟
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* خيار الخروج من الإطار لحل حظر النوافذ المنبثقة من قوقل */}
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "rgba(255, 255, 255, 0.05)",
                color: C.text,
                padding: "10px 14px",
                borderRadius: 8,
                fontWeight: "bold",
                textDecoration: "none",
                textAlign: "center",
                fontSize: "12px",
                border: `1px solid ${C.border}`,
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = C.teal;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = C.border;
              }}
            >
              🌐 فتح اللوحة في نافذة كاملة جديدة (لحل مشكلة حظر جوجل)
            </a>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: C.redDim,
            border: `1px solid ${C.red}44`,
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            color: C.red,
            fontSize: 13,
            textAlign: "right"
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {resetSuccess && (
          <div style={{
            background: "rgba(79,119,45,0.1)",
            border: `1px solid ${C.live}44`,
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            color: C.live,
            fontSize: 13,
            textAlign: "right"
          }}>
            ✅ {resetSuccess}
          </div>
        )}

        {/* Dynamic & Easy Google Sign On */}
        <button
          type="button"
          onClick={executeGoogleLogin}
          disabled={loading}
          className="btn"
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            background: "#fff",
            color: "#1f2937",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all .15s",
            boxShadow: "0 4px 14px rgba(255,255,255,0.15)",
            marginBottom: "20px"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15 .5 12 .5 7.4.5 3.48 3.13 1.62 7l3.87 3a6.97 6.97 0 0 1 6.51-4.96z"/>
            <path fill="#4285F4" d="M23.45 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.43a5.5 5.5 0 0 1-2.39 3.61v3h3.85c2.25-2.07 3.56-5.12 3.56-8.8z"/>
            <path fill="#FBBC05" d="M5.49 14.5a6.92 6.92 0 0 1 0-5c-1.25-.97-2.62-2.03-3.87-3a11.95 11.95 0 0 0 0 11l3.87-3z"/>
            <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.07 7.96-2.91l-3.85-3c-1.1.74-2.52 1.18-4.11 1.18-3.1 0-5.74-2.09-6.68-4.96l-3.87 3C3.48 20.87 7.4 23.5 12 23.5z"/>
          </svg>
          {loading ? "جاري الاتصال بـ Google..." : "الدخول السريع بحساب Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: C.border }}></div>
          <span style={{ fontSize: 11, color: C.textDim, fontWeight: 700 }}>أو باستخدام البريد الإلكتروني</span>
          <div style={{ flex: 1, height: 1, backgroundColor: C.border }}></div>
        </div>

        <form onSubmit={executeLogin}>
          <div className="field">
            <label className="lbl">البريد الإلكتروني</label>
            <input
              type="email"
              className="inp"
              placeholder="admin@mimplus.com"
              dir="ltr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field" style={{ position: "relative" }}>
            <label className="lbl">كلمة المرور</label>
            <input
              type={showPass ? "text" : "password"}
              className="inp"
              placeholder="••••••••"
              dir="ltr"
              style={{ paddingLeft: 40 }}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: "absolute",
                left: 10,
                bottom: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.textSec,
                fontSize: 15
              }}
            >
              {showPass ? "👁️" : "🙈"}
            </button>
          </div>

          <div style={{ textAlign: "left", marginTop: "-12px", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetting}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.teal,
                fontSize: "12px",
                fontWeight: "bold",
                padding: "4px 8px",
                borderRadius: "4px",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              {resetting ? "⏳ جاري إرسال الرابط..." : "🔑 نسيت كلمة المرور؟ أرسل رابط إعادة التعيين"}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-p"
            disabled={loading}
            style={{ width: "100%", padding: 12, fontSize: 15, marginTop: 4 }}
          >
            {loading ? "جاري التحقق والدخول..." : "🚀 دخول بالبريد"}
          </button>

          <button
            type="button"
            onClick={handleSeedDatabase}
            disabled={seeding}
            style={{
              width: "100%",
              padding: "11px",
              fontSize: "13px",
              background: seedSuccess ? "rgba(79,119,45,.08)" : "rgba(0,168,150,.08)",
              color: seedSuccess ? C.live : C.teal,
              border: seedSuccess ? `1px solid ${C.live}33` : `1px solid ${C.teal}33`,
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: "12px",
              transition: "all .15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {seedSuccess ? "✅ تم تأسيس المجموعات بالكامل!" : seeding ? "⏳ جاري زرع هيكل البيانات وقنوات السيرفر..." : "🌱 ضغطة واحدة لتأسيس المجموعات والبيانات السحابية"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 10, color: C.textDim, marginTop: 14 }}>هذه اللوحة للإدارة الحصرية فقط</p>
      </div>
    </div>
  );
}
