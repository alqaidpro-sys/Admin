import { Series, Channel, Match, Banner, AdminUser, AppSettings } from "../types";

export const DEFAULT_SERIES: Series[] = [
  {
    id: "series_1",
    title: "مسلسل الاختيار 3",
    subTitle: "القرار وتحرير الذاكرة",
    poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=400",
    genre: "دراما / تاريخي / تشويق",
    country: "مصر",
    cat: "arabic_drama",
    year: 2022,
    status: "مكتمل",
    badge: "حصري",
    age: "PG-15",
    views: 12450,
    story: "ملحمة وطنية تروي أحداثاً حاسمة في تاريخ مصر المعاصر وصراع الأبطال لحماية الوطن.",
    featured: true,
    episodes: [
      {
        id: "ep_1",
        epNum: 1,
        date: "2022-04-01",
        duration: "45 دقيقة",
        thumb: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=400",
        links: [
          { quality: "1080p FHD", server: "سيرفر البث الإمبراطوري 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
          { quality: "720p HD", server: "سيرفر سريع 2", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
        ]
      }
    ],
    actors: [
      { id: "act_1", name: "أحمد السقا", role: "ضابط أمني", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" }
    ]
  },
  {
    id: "series_2",
    title: "مؤسس عثمان",
    subTitle: "الموسم الخامس",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400",
    genre: "تاريخي / أكشن / مغامرة",
    country: "تركيا",
    cat: "turkish",
    year: 2023,
    status: "مستمر",
    badge: "رائج",
    age: "PG-13",
    views: 98120,
    story: "تأسيس الدولة العثمانية وقيام عثمان بن أرطغرل بمواجهة الصعاب لتأمين مستقبل شعبه.",
    featured: true,
    episodes: [
      {
        id: "ep_1",
        epNum: 1,
        date: "2023-10-12",
        duration: "120 دقيقة",
        thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400",
        links: [
          { quality: "1080p", server: "سيرفر تركي سريع", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
        ]
      }
    ],
    actors: [
      { id: "act_1", name: "بوراك أوزجيفيت", role: "عثمان", photo: "" }
    ]
  }
];

export const DEFAULT_CHANNELS: Channel[] = [
  {
    id: "chan_1",
    name: "beIN Sports 1 HD",
    cat: "channels",
    country: "قطر",
    logo: "⚽",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    active: true,
    featured: true
  },
  {
    id: "chan_2",
    name: "MBC 1",
    cat: "channels",
    country: "السعودية",
    logo: "📺",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    active: true,
    featured: true
  }
];

export const DEFAULT_MATCHES: Match[] = [
  {
    id: "match_1",
    league: "دوري أبطال أوروبا",
    home: "ريال مدريد",
    away: "مانشستر سيتي",
    score: "2 - 1",
    time: "21:45",
    day: "اليوم",
    status: "جارية الآن",
    isLive: true,
    hFlag: "🇪🇸",
    aFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    links: [
      { quality: "FHD 1080p", server: "البث الرئيسي VIP", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
    ],
    stadium: "سانتياغو برنابيو",
    referee: "أنتوني تايلور"
  },
  {
    id: "match_2",
    league: "الدوري المصري الممتاز",
    home: "الأهلي",
    away: "الزمالك",
    score: "0 - 0",
    time: "19:00",
    day: "غداً",
    status: "قادمة",
    isLive: false,
    hFlag: "🇪🇬",
    aFlag: "🇪🇬",
    links: [
      { quality: "HD 720p", server: "قناة أون تايم", url: "" }
    ],
    stadium: "ستاد القاهرة الدولي",
    referee: "حكم دولي"
  }
];

export const DEFAULT_BANNERS: Banner[] = [
  {
    id: "banner_1",
    type: "news",
    icon: "📢",
    title: "مرحبًا بكم في النسخة التجريبية والأولى لـ MiM Plus",
    subtitle: "تصفح وتحكم في محتواك الفني مباشرة بكل سهولة",
    url: "https://telegram.me",
    bgColor: "linear-gradient(135deg, #00A896, #08413A)",
    order: 1,
    active: true
  }
];

export const DEFAULT_ADMINS: AdminUser[] = [
  {
    uid: "local-demo-uid",
    email: "alqaidpro@gmail.com",
    name: "المدير العام التجريبي",
    role: "superadmin",
    sections: ["all"],
    createdAt: "2026-06-03"
  },
  {
    uid: "local-drama-uid",
    email: "drama@mim.com",
    name: "مسؤول مسلسلات",
    role: "moderator",
    sections: ["series"],
    createdAt: "2026-06-03"
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  appName: "MiM Plus الإدارية",
  tagline: "قوة الإدارة الرقمية",
  welcomeText: "أهلاً بك في لوحة تحكم المنصة الأكثر مرونة وسرعة",
  primaryColor: "#00A896",
  telegram: "https://t.me/pro",
  whatsapp: "",
  email: "support@mimplus.com",
  twitter: "",
  playStore: "",
  showTelegramBanner: true,
  showAnimeBanner: true,
  showSportsSection: true,
  showSeriesSection: true,
  showChannelsSection: true,
  allowRegistration: false,
  maintenance: false
};
