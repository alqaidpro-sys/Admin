import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection, setDoc, deleteDoc } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import firebaseConfig from "../firebase-applet-config.json";
import { C, btn } from "./styles";
import {
  Series,
  Channel,
  Match,
  Banner,
  AppSettings,
  AdminUser
} from "./types";

// Component imports
import Login from "./components/Login";
import DashboardPage from "./components/DashboardPage";
import SeriesPage from "./components/SeriesPage";
import ChannelsPage from "./components/ChannelsPage";
import MatchesPage from "./components/MatchesPage";
import BannersPage from "./components/BannersPage";
import SettingsPage from "./components/SettingsPage";
import Supervisors from "./components/Supervisors";
import { Toast } from "./components/CommonUI";
import { 
  DEFAULT_SERIES, 
  DEFAULT_CHANNELS, 
  DEFAULT_MATCHES, 
  DEFAULT_BANNERS, 
  DEFAULT_ADMINS, 
  DEFAULT_SETTINGS as DEFAULT_SETTINGS_MOCK
} from "./utils/mockData";

type SectionType = "dashboard" | "series" | "channels" | "matches" | "banners" | "settings" | "supervisors";

// Default configuration constants to initialize empty databases securely
const DEFAULT_SETTINGS: AppSettings = {
  appName: "MiM Plus (مبث)",
  tagline: "البث الذكي المباشر",
  welcomeText: "أهلاً بك في عالم الإمتاع الميّم بلاس",
  primaryColor: "#00A896",
  telegram: "https://t.me/mimplus",
  whatsapp: "https://wa.me/mimplus",
  email: "support@mimplus.com",
  showTelegramBanner: true,
  showAnimeBanner: true,
  showSportsSection: true,
  showSeriesSection: true,
  showChannelsSection: true,
  allowRegistration: false,
  maintenance: false
};

export default function App() {
  // Local Demo Mode tracking state
  const [isLocalMode, setIsLocalMode] = useState(() => localStorage.getItem("use_local_db") === "true");

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Real-time synchronization state variables
  const [series, setSeries] = useState<Series[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Navigation & Toasts
  const [page, setPage] = useState<SectionType>("dashboard");
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "warning" | "danger" } | null>(null);
  const [navItems, setNavItems] = useState<{ k: SectionType; icon: string; label: string }[]>([]);

  // Local Mode state loader effect
  useEffect(() => {
    if (isLocalMode) {
      const loadOrSeed = (key: string, defaultVal: any) => {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (e) {
            return defaultVal;
          }
        }
        localStorage.setItem(key, JSON.stringify(defaultVal));
        return defaultVal;
      };

      setSeries(loadOrSeed("local_series", DEFAULT_SERIES));
      setChannels(loadOrSeed("local_channels", DEFAULT_CHANNELS));
      setMatches(loadOrSeed("local_matches", DEFAULT_MATCHES));
      setBanners(loadOrSeed("local_banners", DEFAULT_BANNERS));
      setSettings(loadOrSeed("local_settings", DEFAULT_SETTINGS_MOCK));
      setAdmins(loadOrSeed("local_admins", DEFAULT_ADMINS));

      setUser({ uid: "local-demo-uid", email: "alqaidpro@gmail.com" } as any);
      const mockProfile: AdminUser = {
        uid: "local-demo-uid",
        email: "alqaidpro@gmail.com",
        name: "المدير العام (طور التجربة)",
        role: "superadmin",
        sections: ["all"],
        createdAt: new Date().toISOString().slice(0, 10)
      };
      setUserProfile(mockProfile);
      setIsAdmin(true);

      setNavItems([
        { k: "dashboard", icon: "📊", label: "لوحة التحكم" },
        { k: "series",    icon: "🎬", label: "المسلسلات"   },
        { k: "channels",  icon: "📺", label: "القنوات وTV" },
        { k: "matches",   icon: "⚽", label: "المباريات"   },
        { k: "banners",   icon: "🎯", label: "البانرات"    },
        { k: "settings",  icon: "⚙",  label: "الإعدادات"  },
        { k: "supervisors", icon: "👥", label: "المشرفين" }
      ]);
      setLoading(false);
    }
  }, [isLocalMode]);

  const showToast = (msg: string, type: "success" | "warning" | "danger" = "success") => {
    setToast({ msg, type });
  };

  // Auth State Listener
  useEffect(() => {
    if (isLocalMode) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setLoadError(null);
      if (currentUser) {
        const emailLower = currentUser.email?.toLowerCase();
        
        // Timeout of 6 seconds to prevent infinite hanging if Firebase or network is down
        const connectionTimeout = setTimeout(() => {
          setLoadError("timeout");
        }, 6000);

        try {
          const docRef = doc(db, "admins", currentUser.uid);
          const docSnap = await getDoc(docRef);
          clearTimeout(connectionTimeout);
          
          if (docSnap.exists()) {
            const profile = docSnap.data() as AdminUser;
            setIsAdmin(profile.role === "superadmin");
            setUserProfile(profile);
            setUser(currentUser);
            
            // Generate customized sidebar tabs considering designated permissions
            const allowed: typeof navItems = [
              { k: "dashboard", icon: "📊", label: "لوحة التحكم" }
            ];
            
            if (profile.role === "superadmin") {
              allowed.push({ k: "series", icon: "🎬", label: "المسلسلات" });
              allowed.push({ k: "channels", icon: "📺", label: "القنوات وTV" });
              allowed.push({ k: "matches", icon: "⚽", label: "المباريات" });
              allowed.push({ k: "banners", icon: "🎯", label: "البانرات" });
              allowed.push({ k: "settings", icon: "⚙", label: "الإعدادات" });
              allowed.push({ k: "supervisors", icon: "👥", label: "المشرفين" });
            } else {
              // Moderation level specific layout allocation
              if (profile.sections.some(s => ["all", "series", "arabic_drama", "arabic_classic", "english", "turkish", "korean", "anime", "movies", "ramadan", "shows", "kids", "docs"].includes(s))) {
                allowed.push({ k: "series", icon: "🎬", label: "المسلسلات" });
              }
              if (profile.sections.includes("channels")) {
                allowed.push({ k: "channels", icon: "📺", label: "القنوات وTV" });
              }
              if (profile.sections.includes("matches")) {
                allowed.push({ k: "matches", icon: "⚽", label: "المباريات" });
              }
              if (profile.sections.includes("banners")) {
                allowed.push({ k: "banners", icon: "🎯", label: "البانرات" });
              }
              if (profile.sections.includes("settings")) {
                allowed.push({ k: "settings", icon: "⚙", label: "الإعدادات" });
              }
            }
            
            setNavItems(allowed);
            setLoading(false);
          } else {
            // Master admin auto-setup logic
            if (emailLower === "alqaidpro@gmail.com") {
              const defaultSuper: AdminUser = {
                uid: currentUser.uid,
                email: emailLower,
                name: "المدير العام",
                role: "superadmin",
                sections: ["all"],
                createdAt: new Date().toISOString().slice(0, 10)
              };
              await setDoc(docRef, defaultSuper);
              setIsAdmin(true);
              setUserProfile(defaultSuper);
              setUser(currentUser);
              
              setNavItems([
                { k: "dashboard", icon: "📊", label: "لوحة التحكم" },
                { k: "series",    icon: "🎬", label: "المسلسلات"   },
                { k: "channels",  icon: "📺", label: "القنوات وTV" },
                { k: "matches",   icon: "⚽", label: "المباريات"   },
                { k: "banners",   icon: "🎯", label: "البانرات"    },
                { k: "settings",  icon: "⚙",  label: "الإعدادات"  },
                { k: "supervisors", icon: "👥", label: "المشرفين" }
              ]);
              setLoading(false);
            } else {
              alert("عذراً، هذا الحساب ليس لديه صلاحيات الإشراف في لوحة التحكم.");
              await signOut(auth);
              setUser(null);
              setUserProfile(null);
              setIsAdmin(false);
              setLoading(false);
            }
          }
        } catch (err: any) {
          clearTimeout(connectionTimeout);
          console.error("Failed to load user permissions: ", err);
          setLoadError(err.message || String(err));
          // keep loading true so they see the diagnostic error rather than getting booted
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoadError(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Database Snapshot Sync
  useEffect(() => {
    if (!user || isLocalMode) return;

    const unsubSeries = onSnapshot(collection(db, "series"), (snap) => {
      const list: Series[] = [];
      snap.forEach(d => list.push(d.data() as Series));
      setSeries(list);
    }, (err) => console.error("Series stream error:", err));

    const unsubChannels = onSnapshot(collection(db, "channels"), (snap) => {
      const list: Channel[] = [];
      snap.forEach(d => list.push(d.data() as Channel));
      setChannels(list);
    }, (err) => console.error("Channels stream error:", err));

    const unsubMatches = onSnapshot(collection(db, "matches"), (snap) => {
      const list: Match[] = [];
      snap.forEach(d => list.push(d.data() as Match));
      setMatches(list);
    }, (err) => console.error("Matches stream error:", err));

    const unsubBanners = onSnapshot(collection(db, "banners"), (snap) => {
      const list: Banner[] = [];
      snap.forEach(d => list.push(d.data() as Banner));
      setBanners(list);
    }, (err) => console.error("Banners stream error:", err));

    const unsubAdmins = onSnapshot(collection(db, "admins"), (snap) => {
      const list: AdminUser[] = [];
      snap.forEach(d => list.push(d.data() as AdminUser));
      setAdmins(list);
    }, (err) => console.error("Admins stream error:", err));

    const unsubSettings = onSnapshot(doc(db, "settings", "appSettings"), async (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      } else {
        if (user.email?.toLowerCase() === "alqaidpro@gmail.com") {
          try {
            await setDoc(doc(db, "settings", "appSettings"), DEFAULT_SETTINGS);
            setSettings(DEFAULT_SETTINGS);
          } catch (err) {
            console.error("Failed to initialize app settings:", err);
          }
        }
      }
    }, (err) => console.error("Settings stream error:", err));

    return () => {
      unsubSeries();
      unsubChannels();
      unsubMatches();
      unsubBanners();
      unsubAdmins();
      unsubSettings();
    };
  }, [user]);

  const handleLogout = async () => {
    setLoading(true);
    if (isLocalMode) {
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    await signOut(auth);
    setLoading(false);
  };

  // Helper integration functions
  const handleSaveSeries = async (item: Series) => {
    if (isLocalMode) {
      const updated = series.some(s => s.id === item.id)
        ? series.map(s => s.id === item.id ? item : s)
        : [...series, item];
      setSeries(updated);
      localStorage.setItem("local_series", JSON.stringify(updated));
      showToast("تم تحديث وحفظ العمل الفني محلياً بنجاح!");
      return;
    }
    try {
      await setDoc(doc(db, "series", item.id), item);
      showToast("تم تحديث وحفظ العمل الفني بنجاح!");
    } catch (err: any) {
      showToast("فشل الحفظ: " + err.message, "danger");
    }
  };

  const handleDeleteSeries = async (id: string) => {
    if (isLocalMode) {
      const updated = series.filter(s => s.id !== id);
      setSeries(updated);
      localStorage.setItem("local_series", JSON.stringify(updated));
      showToast("تم حذف العمل محلياً!");
      return;
    }
    try {
      await deleteDoc(doc(db, "series", id));
      showToast("تم حذف العمل بنجاح!");
    } catch (err: any) {
      showToast("فشل الحذف: " + err.message, "danger");
    }
  };

  const handleSaveChannel = async (item: Channel) => {
    if (isLocalMode) {
      const updated = channels.some(c => c.id === item.id)
        ? channels.map(c => c.id === item.id ? item : c)
        : [...channels, item];
      setChannels(updated);
      localStorage.setItem("local_channels", JSON.stringify(updated));
      showToast("تم تحديث وحفظ بيانات القناة محلياً بنجاح!");
      return;
    }
    try {
      await setDoc(doc(db, "channels", item.id), item);
      showToast("تم تحديث وحفظ بيانات القناة بنجاح!");
    } catch (err: any) {
      showToast("فشل الحفظ: " + err.message, "danger");
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (isLocalMode) {
      const updated = channels.filter(c => c.id !== id);
      setChannels(updated);
      localStorage.setItem("local_channels", JSON.stringify(updated));
      showToast("تم حذف القناة محلياً!");
      return;
    }
    try {
      await deleteDoc(doc(db, "channels", id));
      showToast("تم حذف القناة بنجاح!");
    } catch (err: any) {
      showToast("فشل الحذف: " + err.message, "danger");
    }
  };

  const handleSaveMatch = async (item: Match) => {
    if (isLocalMode) {
      const updated = matches.some(m => m.id === item.id)
        ? matches.map(m => m.id === item.id ? item : m)
        : [...matches, item];
      setMatches(updated);
      localStorage.setItem("local_matches", JSON.stringify(updated));
      showToast("تم تحديث تفاصيل المباراة محلياً وحفظ النتيجة!");
      return;
    }
    try {
      await setDoc(doc(db, "matches", item.id), item);
      showToast("تم تحديث تفاصيل المباراة وحفظ النتيجة!");
    } catch (err: any) {
      showToast("فشل الحفظ: " + err.message, "danger");
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (isLocalMode) {
      const updated = matches.filter(m => m.id !== id);
      setMatches(updated);
      localStorage.setItem("local_matches", JSON.stringify(updated));
      showToast("تم حذف بطاقة المباراة محلياً!");
      return;
    }
    try {
      await deleteDoc(doc(db, "matches", id));
      showToast("تم حذف بطاقة المباراة!");
    } catch (err: any) {
      showToast("فشل الحذف: " + err.message, "danger");
    }
  };

  const handleSaveBanner = async (item: Banner) => {
    if (isLocalMode) {
      const updated = banners.some(b => b.id === item.id)
        ? banners.map(b => b.id === item.id ? item : b)
        : [...banners, item];
      setBanners(updated);
      localStorage.setItem("local_banners", JSON.stringify(updated));
      showToast("تم حفظ وتحديث البانر الإعلاني محلياً!");
      return;
    }
    try {
      await setDoc(doc(db, "banners", item.id), item);
      showToast("تم حفظ وتحديث البانر الإعلاني!");
    } catch (err: any) {
      showToast("فشل الحفظ: " + err.message, "danger");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (isLocalMode) {
      const updated = banners.filter(b => b.id !== id);
      setBanners(updated);
      localStorage.setItem("local_banners", JSON.stringify(updated));
      showToast("تم حذف البانر محلياً!");
      return;
    }
    try {
      await deleteDoc(doc(db, "banners", id));
      showToast("تم حذف البانر بنجاح!");
    } catch (err: any) {
      showToast("فشل الحذف: " + err.message, "danger");
    }
  };

  const handleSaveSettings = async (item: AppSettings) => {
    if (isLocalMode) {
      setSettings(item);
      localStorage.setItem("local_settings", JSON.stringify(item));
      showToast("تم حفظ جميع إعدادات المنصة وهويتها محلياً!");
      return;
    }
    try {
      await setDoc(doc(db, "settings", "appSettings"), item);
      showToast("تم حفظ جميع إعدادات المنصة وهويتها!");
    } catch (err: any) {
      showToast("فشل حفظ الإعدادات: " + err.message, "danger");
    }
  };

  const handleCreateAdmin = async (admin: Partial<AdminUser>, pass: string) => {
    if (isLocalMode) {
      const newUid = "local-uid-" + Math.random().toString(36).slice(2, 9);
      const newAdmin: AdminUser = {
        ...(admin as AdminUser),
        uid: newUid,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      const updated = [...admins, newAdmin];
      setAdmins(updated);
      localStorage.setItem("local_admins", JSON.stringify(updated));
      showToast("تم إنشاء وتفويض حساب المشرف محلياً بنجاح!");
      return;
    }
    const tempApp = initializeApp(firebaseConfig, "temp-auth-app-" + Math.random().toString(36).slice(2, 9));
    const tempAuth = getAuth(tempApp);
    try {
      const userCred = await createUserWithEmailAndPassword(tempAuth, admin.email!, pass);
      const uid = userCred.user.uid;
      const finalAdminObj: AdminUser = {
        ...(admin as AdminUser),
        uid
      };
      await setDoc(doc(db, "admins", uid), finalAdminObj);
      showToast("تم إنشاء وتفويض حساب المشرف الجديد بنجاح!");
    } catch (err: any) {
      throw err;
    } finally {
      await deleteApp(tempApp);
    }
  };

  const handleDeleteAdmin = async (targetId: string) => {
    if (isLocalMode) {
      const updated = admins.filter(a => a.uid !== targetId);
      setAdmins(updated);
      localStorage.setItem("local_admins", JSON.stringify(updated));
      showToast("تم سحب الصلاحية وحذف حساب المشرف محلياً!");
      return;
    }
    try {
      await deleteDoc(doc(db, "admins", targetId));
      showToast("تم سحب الصلاحية وحذف حساب المشرف!");
    } catch (err: any) {
      showToast("فشل حذف المشرف: " + err.message, "danger");
    }
  };

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: C.font }}>
        <div style={{ textAlign: "center", maxWidth: 500, width: "100%", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 24px" }}>
          {!loadError ? (
            <>
              <div style={{ fontSize: 44, marginBottom: 14, animation: "spin 1.2s linear infinite" }}>⚙</div>
              <p style={{ color: C.text, fontSize: 15, fontWeight: "bold", margin: "0 0 8px" }}>جاري تحميل المنصة...</p>
              <p style={{ color: C.textSec, fontSize: 13, margin: "0 0 16px" }}>جاري استرجاع تفويض الحساب وهيكل البيانات وثوانٍ للإطلاق...</p>
              <p style={{ color: C.textDim, fontSize: 11, margin: 0 }}>قيد الاتصال بمشروع Firebase: <strong style={{color: C.teal}}>{(firebaseConfig as any).projectId}</strong></p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 44, marginBottom: 14 }}>⚠️</div>
              <h3 style={{ color: C.red, fontSize: 17, fontWeight: "bold", marginBottom: 10 }}>مشكلة في الاتصال بـ Firebase</h3>
              
              <p style={{ color: C.textSec, fontSize: 13, lineHeight: "1.6", marginBottom: 18, textAlign: "right", direction: "rtl" }}>
                استغرق تحميل الصلاحيات أكثر من 6 ثوانٍ. قد يكون ذلك بسبب أن قاعدة بيانات Firestore غير مفعلة في مشروع Firebase الخاص بك، أو لم يتم تفعيل قواعد الحماية للسماح بالقراءة، أو أن مشروعك لا يحتوي حالياً على Firestore.
              </p>
              
              <div style={{ textAlign: "right", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 12 }}>
                <strong style={{ color: C.text, display: "block", marginBottom: 8, fontSize: 13 }}>💡 خطوات سريعة لحل المشكلة:</strong>
                <ul style={{ margin: 0, paddingRight: 16, color: C.textSec, listStyleType: "decimal", lineHeight: "1.7" }}>
                  <li style={{ marginBottom: 6 }}>
                    توجه إلى <strong><a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{color: C.teal, textDecoration: "underline"}}>Firebase Console</a></strong> وافتح مشروعك <code style={{background: C.bg2, padding: "2px 4px", borderRadius: 4, direction: "ltr", display: "inline-block"}}>{(firebaseConfig as any).projectId}</code>.
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    من القائمة الجانبية اختر <strong>Build</strong> ثم <strong>Firestore Database</strong> واضغط على <strong>Create database</strong> إذا لم تكن قد أنشأتها بعد.
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    من علامة التبويب <strong>Rules (القواعد)</strong>، تأكد من تعديلها لتسمح بالقراءة والكتابة (مثال: تأكد من تفعيل وضع التجربة <code>allow read, write: if true;</code> أو ما يناسب صلاحياتك).
                  </li>
                  <li>
                    تأكد أيضاً من تفعيل <strong>Email/Password</strong> أو <strong>Google</strong> كخيار تسجيل دخول في <strong>Authentication -&gt; Sign-in method</strong>.
                  </li>
                </ul>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
                <button
                  onClick={() => {
                    setLoadError(null);
                    setLoading(true);
                    // Force a clean reload
                    window.location.reload();
                  }}
                  style={{
                    flex: 1, minWidth: 120, padding: "10px 16px", borderRadius: 8, background: C.teal, color: "#fff",
                    border: "none", cursor: "pointer", fontSize: 13, fontWeight: "bold", transition: "all .15s"
                  }}
                >
                  🔄 إعادة المحاولة
                </button>
                
                <button
                  onClick={() => {
                    localStorage.setItem("use_local_db", "true");
                    setIsLocalMode(true);
                    setLoadError(null);
                    setLoading(false);
                    window.location.reload();
                  }}
                  style={{
                    flex: 1, minWidth: 150, padding: "10px 16px", borderRadius: 8, background: "rgba(212,163,115,0.1)", color: C.gold,
                    border: `1px solid ${C.gold}44`, cursor: "pointer", fontSize: 13, fontWeight: "bold", transition: "all .15s"
                  }}
                >
                  ⚡ طور التجربة المحلي
                </button>

                <button
                  onClick={async () => {
                    await signOut(auth);
                    setLoadError(null);
                    setLoading(false);
                    setUser(null);
                    setUserProfile(null);
                  }}
                  style={{
                    flex: 1, minWidth: 120, padding: "10px 16px", borderRadius: 8, background: "rgba(217,79,79,.1)", color: C.red,
                    border: `1px solid rgba(217,79,79,0.3)`, cursor: "pointer", fontSize: 13, fontWeight: "bold", transition: "all .15s"
                  }}
                >
                  🚪 تسجيل الخروج والعودة
                </button>
              </div>
            </>
          )}
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Not logged in -> Show premium Imperial Teal Login
  if (!user || !userProfile) {
    return <Login onSuccess={() => {}} />;
  }

  const roleText = isAdmin ? "المدير العام (المالك)" : `مسؤول: ${userProfile?.name}`;

  return (
    <div dir="rtl" style={{ background: C.bg, minHeight: "100vh", display: "flex", fontFamily: C.font, color: C.text }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* ─── SIDEBAR ─── */}
      <aside style={{
        width: 240, background: C.bg2, borderLeft: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto"
      }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: `linear-gradient(135deg,${C.teal},${C.tealDeep})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 900, boxShadow: `0 4px 14px ${C.tealGlow}`, color: "#fff"
            }}>م</div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: C.text }}>{settings.appName}</p>
              <p style={{ margin: 0, fontSize: 11, color: C.teal }}>لوحة الإدارة الذكية</p>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: "5px 8px", background: C.card, borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, color: C.textSec, textAlign: "center" }}>
            👤 {roleText}
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {navItems.map(n => (
            <button key={n.k} onClick={() => setPage(n.k)} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "11px 14px", borderRadius: 10,
              background: page === n.k ? C.tealDim : "none",
              color: page === n.k ? C.teal : C.textSec,
              border: page === n.k ? `1px solid ${C.teal}33` : "1px solid transparent",
              cursor: "pointer", fontFamily: C.font, fontSize: 14,
              fontWeight: page === n.k ? 700 : 400,
              textAlign: "right", marginBottom: 4, transition: "all .15s",
              boxShadow: page === n.k ? `0 0 12px ${C.tealGlow}` : "none"
            }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              {n.label}
              {n.k === "matches" && matches.filter(m => m.isLive).length > 0 && (
                <span style={{ marginRight: "auto", background: C.live, color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: 8 }}>
                  {matches.filter(m => m.isLive).length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.textDim }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", height: 32, fontSize: 12, fontWeight: 700,
              marginBottom: 12, borderRadius: 6, background: "rgba(217,79,79,.1)", color: C.red,
              border: `1px solid rgba(217,79,79,0.25)`, cursor: "pointer", transition: "all 0.15s"
            }}
          >
            🚪 تسجيل الخروج
          </button>
          <p style={{ margin: 0, textAlign: "center" }}>لوحة MiM Plus v2.12</p>
          <p style={{ margin: "2px 0 0", color: C.teal, textAlign: "center" }}>Imperial Teal Secure UI</p>
        </div>
      </aside>

      {/* ─── CONTENT ─── */}
      <main style={{ flex: 1, padding: "28px 30px", overflowY: "auto", maxHeight: "100vh" }}>
        {isLocalMode && (
          <div style={{
            background: "rgba(212,163,115,.06)",
            border: `1px solid ${C.gold}44`,
            borderRadius: 10,
            padding: "12px 18px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            color: C.gold,
            direction: "rtl",
            gap: 16,
            flexWrap: "wrap"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <span style={{ lineHeight: "1.5" }}>
                <strong>أنت تعمل حالياً في "طور التجربة المحلي" (Local Storage).</strong> التعديلات المحفوظة هنا تُخزن بمتصفحك فقط ولا تؤثر على مشروع Firebase. عند تفعيل Firestore الخاص بك، يمكنك العودة في أي وقت.
              </span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("use_local_db");
                window.location.reload();
              }}
              style={{
                background: C.gold,
                color: "#16161a",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap"
              }}
            >
              🔄 العودة لوضع Firebase
            </button>
          </div>
        )}
        {page === "dashboard"   && (
          <DashboardPage
            series={series}
            channels={channels}
            matches={matches}
            banners={banners}
          />
        )}
        {page === "series"      && (
          <SeriesPage
            series={series}
            user={userProfile}
            onSave={handleSaveSeries}
            onDelete={handleDeleteSeries}
          />
        )}
        {page === "channels"    && (
          <ChannelsPage
            channels={channels}
            user={userProfile}
            onSave={handleSaveChannel}
            onDelete={handleDeleteChannel}
          />
        )}
        {page === "matches"     && (
          <MatchesPage
            matches={matches}
            onSave={handleSaveMatch}
            onDelete={handleDeleteMatch}
          />
        )}
        {page === "banners"     && (
          <BannersPage
            banners={banners}
            onSave={handleSaveBanner}
            onDelete={handleDeleteBanner}
          />
        )}
        {page === "settings"    && (
          <SettingsPage
            settings={settings}
            series={series}
            channels={channels}
            matches={matches}
            banners={banners}
            onSave={handleSaveSettings}
          />
        )}
        {page === "supervisors" && isAdmin && (
          <Supervisors
            admins={admins}
            user={userProfile}
            onCreate={handleCreateAdmin}
            onDelete={handleDeleteAdmin}
          />
        )}
      </main>
    </div>
  );
}
