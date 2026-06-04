export interface Actor {
  id: string;
  name: string;
  role: string;
  photo: string;
}

export interface WatchLink {
  quality: string;
  server: string;
  url: string;
}

export interface Episode {
  id: string;
  epNum: number;
  date: string;
  duration: string;
  thumb: string;
  links: WatchLink[];
}

export interface Series {
  id: string;
  title: string;
  subTitle?: string;
  cat: string;
  country: string;
  genre: string;
  year: number;
  status: string;
  badge: string;
  age: string;
  tmdbId?: string;
  views: number;
  poster: string;
  col?: string;
  story: string;
  episodes: Episode[];
  actors: Actor[];
  featured: boolean;
}

export interface Channel {
  id: string;
  name: string;
  cat: string;
  country: string;
  logo: string;
  streamUrl: string;
  epg?: string;
  active: boolean;
  featured: boolean;
}

export interface Match {
  id: string;
  league: string;
  home: string;
  away: string;
  score: string;
  time: string;
  day: string;
  status: string;
  isLive: boolean;
  hFlag: string;
  aFlag: string;
  links: WatchLink[];
  stadium?: string;
  referee?: string;
}

export interface Banner {
  id: string;
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  url: string;
  bgColor: string;
  order: number;
  active: boolean;
}

export interface AppSettings {
  appName: string;
  tagline: string;
  welcomeText?: string;
  primaryColor: string;
  telegram?: string;
  whatsapp?: string;
  email?: string;
  twitter?: string;
  playStore?: string;
  tmdbKey?: string;
  tmdbLang?: string;
  geminiKey?: string;
  firebaseProjectId?: string;
  showTelegramBanner: boolean;
  showAnimeBanner: boolean;
  showSportsSection?: boolean;
  showSeriesSection?: boolean;
  showChannelsSection?: boolean;
  allowRegistration?: boolean;
  maintenance: boolean;
}

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: "superadmin" | "moderator";
  sections: string[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: "create" | "update" | "delete";
  section: string;
  itemId: string;
  itemTitle: string;
  timestamp: string;
}
