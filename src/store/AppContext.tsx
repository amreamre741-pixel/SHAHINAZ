import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../services/api";
import { THEMES, type AppTheme, type ThemeId } from "../theme";
import type {
  AdminLogItem,
  AudioRoom,
  ChatThread,
  CodOrder,
  DailyMissionState,
  GroupItem,
  MarketItem,
  NoteItem,
  NotificationItem,
  Post,
  ReactionEmoji,
  RolePermissions,
  Story,
  User,
  UserRole,
  WalletTransaction,
} from "../types";

export interface ReportItem {
  id: string;
  postId: string;
  reason: string;
  createdAt: string;
}

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    canPost: true,
    canComment: true,
    canSellMarket: true,
    canCreateAudioRoom: true,
    canBoostPosts: true,
    canModerateContent: true,
  },
  MODERATOR: {
    canPost: true,
    canComment: true,
    canSellMarket: true,
    canCreateAudioRoom: true,
    canBoostPosts: false,
    canModerateContent: true,
  },
  VIP: {
    canPost: true,
    canComment: true,
    canSellMarket: true,
    canCreateAudioRoom: true,
    canBoostPosts: true,
    canModerateContent: false,
  },
  USER: {
    canPost: true,
    canComment: true,
    canSellMarket: true,
    canCreateAudioRoom: true,
    canBoostPosts: false,
    canModerateContent: false,
  },
};

interface AppContextValue {
  currentUser: User | null;
  token: string | null;
  loadingAuth: boolean;
  posts: Post[];
  allPosts: Post[];
  allUsers: User[];
  stories: Story[];
  notifications: NotificationItem[];
  marketItems: MarketItem[];
  groups: GroupItem[];
  notes: NoteItem[];
  audioRooms: AudioRoom[];
  codOrders: CodOrder[];
  chats: ChatThread[];
  themeId: ThemeId;
  theme: AppTheme;
  accentColor: string;
  streakDays: number;
  claimedStreakToday: boolean;
  walletTransactions: WalletTransaction[];
  dailyMissions: DailyMissionState;
  followingUserIds: string[];
  blockedUserIds: string[];
  reportedPostIds: string[];
  reports: ReportItem[];
  announcement: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  marketEnabled: boolean;
  audioRoomsEnabled: boolean;
  devHudEnabled: boolean;
  adminPin: string;
  bannedWords: string[];
  adminLogs: AdminLogItem[];
  rolePermissions: Record<UserRole, RolePermissions>;
  login: (name: string, username: string) => void;
  loginWithApi: (email: string, password: string) => Promise<void>;
  registerWithApi: (name: string, username: string, email: string, password: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
  logout: () => void;
  deleteAccount: () => void;
  updateProfile: (name: string, bio: string, avatarUri?: string) => void;
  togglePrivateAccount: () => void;
  setThemeId: (id: ThemeId) => void;
  setAccentColor: (color: string) => void;
  claimDailyStreak: () => { ok: boolean; reward: number; message: string };
  redeemReward: (kind: "verify" | "vip" | "boost", cost: number) => { ok: boolean; message: string };
  sendPostGift: (postId: string, emoji: string, cost: number) => { ok: boolean; message: string };
  sendLiveGift: (hostName: string, emoji: string, cost: number) => { ok: boolean; message: string };
  transferCoins: (recipientId: string, amount: number) => { ok: boolean; message: string };
  claimMissionReward: (missionId: "likes" | "comments" | "saves") => { ok: boolean; message: string };
  toggleFollowUser: (userId: string) => void;
  toggleLike: (postId: string) => void;
  setReaction: (postId: string, emoji: ReactionEmoji) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  createPost: (
    content: string,
    imageUri?: string,
    location?: string,
    bgColor?: string,
    pollOptions?: string[],
    videoUri?: string
  ) => void;
  deleteMyPost: (postId: string) => void;
  votePoll: (postId: string, optionId: string) => void;
  addStory: (text: string, imageUri?: string) => void;
  markStorySeen: (storyId: string) => void;
  markAllNotificationsRead: () => void;
  addMarketItem: (item: Omit<MarketItem, "id" | "sellerName" | "createdAt">) => void;
  toggleJoinGroup: (groupId: string) => void;
  setMyNote: (text: string) => void;
  createAudioRoom: (title: string, topic: string) => void;
  placeCodOrder: (order: Omit<CodOrder, "id" | "createdAt">) => void;
  reportPost: (postId: string, reason: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  markChatRead: (chatId: string) => void;
  startChatWithUser: (user: User) => string;
  sendMessage: (chatId: string, text: string, imageUri?: string, audioUri?: string, durationSec?: number) => void;
  syncChatWithPeer: (chatId: string, peerId: string) => Promise<void>;
  refreshThreads: () => Promise<void>;
  adminDeletePost: (postId: string) => void;
  adminToggleSponsor: (postId: string) => void;
  adminTogglePinPost: (postId: string) => void;
  adminDismissReport: (reportId: string) => void;
  adminClearAllReports: () => void;
  adminToggleVerify: (userId: string) => void;
  adminSetUserRole: (userId: string, role: UserRole) => void;
  adminGivePoints: (userId: string, delta: number) => void;
  adminUpdateRolePermission: (role: UserRole, key: keyof RolePermissions, value: boolean) => void;
  adminSendGlobalNotification: (text: string) => void;
  adminDeleteMarketItem: (itemId: string) => void;
  adminCloseAudioRoom: (roomId: string) => void;
  adminAddBannedWord: (word: string) => void;
  adminRemoveBannedWord: (word: string) => void;
  adminChangePin: (newPin: string) => void;
  adminSetAnnouncement: (text: string) => void;
  adminToggleMaintenance: () => void;
  adminToggleRegistration: () => void;
  adminToggleMarket: () => void;
  adminToggleAudioRooms: () => void;
  adminToggleDevHud: () => void;
  adminClearLogs: () => void;
  adminResetSystemSettings: () => void;
}

const DEMO_USERS: User[] = [
  {
    id: "u_1",
    name: "ياسين بن علي",
    username: "yassine_dz",
    bio: "مصور ومصمم من الجزائر العاصمة 📸",
    avatarEmoji: "🧔🏻",
    avatarUri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&q=80",
    verified: true,
    followers: 14200,
    following: 210,
  },
  {
    id: "u_2",
    name: "سارة منصوري",
    username: "sara_style",
    bio: "يوميات، سفر، وأفكار إبداعية ✨",
    avatarEmoji: "👩🏻‍🎨",
    avatarUri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80",
    verified: true,
    followers: 38500,
    following: 185,
  },
  {
    id: "u_3",
    name: "كريم تكنولوجي",
    username: "karim_tech",
    bio: "تقنية وتجارة إلكترونية في الجزائر 🚀",
    avatarEmoji: "👨🏻‍💻",
    avatarUri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&q=80",
    verified: true,
    followers: 9600,
    following: 320,
  },
  {
    id: "u_4",
    name: "أمين فوتو",
    username: "amine_shots",
    bio: "الطبيعة والمدن الجزائرية بعدستي 🇩🇿",
    avatarEmoji: "📷",
    avatarUri: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&q=80",
    verified: false,
    followers: 5400,
    following: 140,
  },
];

const INITIAL_STORIES: Story[] = [
  {
    id: "st_2",
    userName: "ياسين",
    avatarEmoji: "🧔🏻",
    avatarUri: DEMO_USERS[0].avatarUri,
    imageUri: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=80",
    text: "ليلة ساحرة تحت النجوم ✨🇩🇿",
    seen: false,
  },
  {
    id: "st_3",
    userName: "سارة",
    avatarEmoji: "👩🏻‍🎨",
    avatarUri: DEMO_USERS[1].avatarUri,
    imageUri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80",
    text: "أجواء البحر في وهران الباهية 🌊☀️",
    seen: false,
  },
  {
    id: "st_4",
    userName: "كريم",
    avatarEmoji: "👨🏻‍💻",
    avatarUri: DEMO_USERS[2].avatarUri,
    imageUri: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80",
    text: "إطلاق تحديث SHAHINAZ Ultra الجديد 🚀🔥",
    seen: false,
  },
  {
    id: "st_5",
    userName: "أمين",
    avatarEmoji: "📷",
    avatarUri: DEMO_USERS[3].avatarUri,
    imageUri: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=80",
    text: "جمال الطبيعة صباح اليوم 🌿",
    seen: true,
  },
];

const INITIAL_NOTIFS: NotificationItem[] = [
  { id: "n_1", emoji: "❤️", text: "أعجبت سارة منصوري بمنشورك", time: "منذ 5 د", read: false },
  { id: "n_2", emoji: "💬", text: "علّق ياسين بن علي: تصميم خرافي بالتوفيق!", time: "منذ 15 د", read: false },
  { id: "n_3", emoji: "👤", text: "بدأ كريم تكنولوجي بمتابعتك", time: "منذ ساعة", read: true },
];

const INITIAL_MARKET: MarketItem[] = [
  {
    id: "mk_1",
    title: "هاتف Samsung A55 5G جديد في العلبة",
    priceDzd: 58000,
    city: "الجزائر العاصمة",
    sellerName: "كريم تكنولوجي",
    phone: "0550123456",
    imageUri: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&q=80",
    emoji: "📱",
    createdAt: "اليوم",
  },
  {
    id: "mk_2",
    title: "ساعة ذكية أصلية مقاومة للماء",
    priceDzd: 6500,
    city: "سطيف",
    sellerName: "ياسين بن علي",
    phone: "0661234567",
    imageUri: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=80",
    emoji: "⌚",
    createdAt: "أمس",
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "p_1",
    author: DEMO_USERS[0],
    content: "أهلاً بكم في SHAHINAZ Ultra ✨ تصميم عصري وسرعة خيالية تجمع بين أناقة إنستغرام وقوة فيسبوك #الجزائر #SHAHINAZ",
    imageUri: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000&q=85",
    location: "الجزائر العاصمة",
    likes: 1248,
    likedByMe: false,
    savedByMe: false,
    comments: [
      { id: "c_1", userId: "u_2", userName: "سارة منصوري", text: "التصميم الجديد عالمي بمعنى الكلمة! 🔥👏", createdAt: "منذ 10 د" },
    ],
    createdAt: "منذ 25 د",
  },
  {
    id: "p_2",
    author: DEMO_USERS[1],
    content: "صباح الأجواء الهادئة من وهران الباهية 🌊☕ ما هي خططكم لنهاية الأسبوع؟ #وهران",
    imageUri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=85",
    location: "وهران",
    likes: 2840,
    likedByMe: true,
    savedByMe: true,
    comments: [],
    createdAt: "منذ ساعتين",
  },
  {
    id: "p_3",
    author: DEMO_USERS[2],
    content: "ما هو المجال الذي تفضلون البدء فيه في التجارة الإلكترونية هذه السنة؟ 👇 #تجارة #تقنية",
    imageUri: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&q=85",
    location: "سطيف",
    poll: {
      options: [
        { id: "po_1", label: "الإلكترونيات وإكسسوارات الهواتف 📱", votes: 64 },
        { id: "po_2", label: "مستلزمات المنزل والمطبخ 🏠", votes: 49 },
        { id: "po_3", label: "الملابس والأزياء 👕", votes: 37 },
      ],
    },
    likes: 915,
    likedByMe: false,
    savedByMe: false,
    comments: [],
    createdAt: "منذ 4 ساعات",
  },
  {
    id: "p_4",
    author: DEMO_USERS[3],
    content: "هدوء الجبال والطبيعة الخلابة عند شروق الشمس 🌄 #الجزائر",
    imageUri: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1000&q=85",
    location: "تيكجدة",
    likes: 3420,
    likedByMe: false,
    savedByMe: false,
    comments: [],
    createdAt: "أمس",
  },
];

const INITIAL_CHATS: ChatThread[] = [
  {
    id: "ch_1",
    user: DEMO_USERS[0],
    lastMessage: "مرحباً بك في SHAHINAZ! كيف حالك؟",
    time: "14:20",
    unread: 1,
    messages: [{ id: "m_1", fromMe: false, text: "مرحباً بك في SHAHINAZ! كيف حالك؟", time: "14:20" }],
  },
  {
    id: "ch_2",
    user: DEMO_USERS[2],
    lastMessage: "التطبيق سريع جداً ما شاء الله 🚀",
    time: "أمس",
    unread: 0,
    messages: [{ id: "m_2", fromMe: false, text: "التطبيق سريع جداً ما شاء الله 🚀", time: "أمس" }],
  },
];

const INITIAL_GROUPS: GroupItem[] = [
  { id: "gr_1", name: "التجارة الإلكترونية في الجزائر", emoji: "🚀", members: 12400, joined: true },
  { id: "gr_2", name: "عشاق السيارات والشاحنات DZ", emoji: "🚗", members: 8900, joined: false },
  { id: "gr_3", name: "تقنية وبرمجة وهواتف", emoji: "💻", members: 6300, joined: false },
  { id: "gr_4", name: "طبخ وحلويات جزائرية", emoji: "🍰", members: 15200, joined: false },
];

const INITIAL_NOTES: NoteItem[] = [
  { id: "nt_1", userId: "u_1", userName: "ياسين", avatarUri: DEMO_USERS[0].avatarUri, avatarEmoji: "🧔🏻", text: "قهوة المساء ☕🇩🇿" },
  { id: "nt_2", userId: "u_2", userName: "سارة", avatarUri: DEMO_USERS[1].avatarUri, avatarEmoji: "👩🏻‍🎨", text: "شكون راه صاحي؟ ✨" },
  { id: "nt_3", userId: "u_3", userName: "كريم", avatarUri: DEMO_USERS[2].avatarUri, avatarEmoji: "👨🏻‍💻", text: "مشروع جديد قريباً 🚀" },
  { id: "nt_4", userId: "u_4", userName: "أمين", avatarUri: DEMO_USERS[3].avatarUri, avatarEmoji: "📷", text: "خارج للتصوير 📸" },
];

const INITIAL_AUDIO_ROOMS: AudioRoom[] = [
  {
    id: "ar_1",
    title: "أسرار التجارة الإلكترونية في 58 ولاية 🚀",
    hostName: "كريم تكنولوجي",
    hostAvatarUri: DEMO_USERS[2].avatarUri,
    topic: "تجارة وأعمال",
    listeners: 148,
    speakers: [
      { name: "كريم", avatarUri: DEMO_USERS[2].avatarUri, speaking: true },
      { name: "ياسين", avatarUri: DEMO_USERS[0].avatarUri, speaking: false },
      { name: "سارة", avatarUri: DEMO_USERS[1].avatarUri, speaking: false },
    ],
  },
  {
    id: "ar_2",
    title: "قعدة وسهرة جزائرية مفتوحة 🎙️☕",
    hostName: "سارة منصوري",
    hostAvatarUri: DEMO_USERS[1].avatarUri,
    topic: "دردشة وتسلية",
    listeners: 94,
    speakers: [
      { name: "سارة", avatarUri: DEMO_USERS[1].avatarUri, speaking: true },
      { name: "أمين", avatarUri: DEMO_USERS[3].avatarUri, speaking: false },
    ],
  },
];

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFS);
  const [marketItems, setMarketItems] = useState<MarketItem[]>(INITIAL_MARKET);
  const [groups, setGroups] = useState<GroupItem[]>(INITIAL_GROUPS);
  const [notes, setNotes] = useState<NoteItem[]>(INITIAL_NOTES);
  const [audioRooms, setAudioRooms] = useState<AudioRoom[]>(INITIAL_AUDIO_ROOMS);
  const [codOrders, setCodOrders] = useState<CodOrder[]>([]);
  const [chats, setChats] = useState<ChatThread[]>(INITIAL_CHATS);
  const [themeId, setThemeIdState] = useState<ThemeId>("obsidian_gold");
  const [accentColor, setAccentColor] = useState<string>(THEMES.obsidian_gold.primary);
  const theme = THEMES[themeId] || THEMES.obsidian_gold;

  function setThemeId(id: ThemeId) {
    if (!THEMES[id]) return;
    setThemeIdState(id);
    setAccentColor(THEMES[id].primary);
  }
  const [streakDays, setStreakDays] = useState<number>(1);
  const [lastStreakDate, setLastStreakDate] = useState<string>("");
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    { id: "tx_welcome", title: "مكافأة الترحيب الملكية في SHAHINAZ", deltaCoins: 150, emoji: "👑", time: "اليوم" },
  ]);
  const [dailyMissions, setDailyMissions] = useState<DailyMissionState>({
    dateKey: new Date().toISOString().slice(0, 10),
    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    claimedIds: [],
  });
  const [followingUserIds, setFollowingUserIds] = useState<string[]>(["u_1", "u_2"]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [reportedPostIds, setReportedPostIds] = useState<string[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [announcement, setAnnouncement] = useState<string>("");
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [allowRegistration, setAllowRegistration] = useState<boolean>(true);
  const [marketEnabled, setMarketEnabled] = useState<boolean>(true);
  const [audioRoomsEnabled, setAudioRoomsEnabled] = useState<boolean>(true);
  const [devHudEnabled, setDevHudEnabled] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>("1994");
  const [bannedWords, setBannedWords] = useState<string[]>(["احتيال", "سبام"]);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(DEFAULT_ROLE_PERMISSIONS);
  const [adminLogs, setAdminLogs] = useState<AdminLogItem[]>([
    { id: "lg_1", action: "تشغيل نظام إدارة SHAHINAZ DevOS v3.0", time: "اليوم" },
  ]);
  const adminLoadedRef = useRef(false);

  function pushAdminLog(action: string) {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setAdminLogs((prev) => [{ id: `lg_${Date.now()}`, action, time: t }, ...prev.slice(0, 39)]);
  }

  function recordWalletTx(title: string, deltaCoins: number, emoji: string) {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setWalletTransactions((prev) => [{ id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, title, deltaCoins, emoji, time: t }, ...prev.slice(0, 29)]);
  }

  async function refreshPosts(activeToken?: string | null) {
    const t = activeToken ?? token;
    if (!t) return;
    try {
      const apiPosts = await apiFetch<any[]>("/api/posts", t);
      if (Array.isArray(apiPosts) && apiPosts.length > 0) {
        const mapped: Post[] = apiPosts
          .filter((p) => Boolean((p.content || "").trim() || p.imageUrl || p.videoUrl))
          .map((p) => ({
            id: p.id,
            author: {
              id: p.author.id,
              name: p.author.name,
              username: p.author.username,
              bio: "",
              avatarEmoji: "👤",
              avatarUri: p.author.avatarUrl || undefined,
              verified: !!p.author.verified,
              followers: 0,
              following: 0,
            },
            content: p.content || "",
            imageUri: p.imageUrl || undefined,
            videoUri: p.videoUrl || undefined,
            location: p.location || undefined,
            likes: p._count?.likes ?? 0,
            likedByMe: Array.isArray(p.likes) && p.likes.length > 0,
            savedByMe: false,
            comments: Array.isArray(p.comments)
              ? p.comments.map((c: any) => ({
                  id: c.id,
                  userId: c.user?.id || c.userId,
                  userName: c.user?.name || "عضو",
                  text: c.text,
                  createdAt: new Date(c.createdAt).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }),
                }))
              : [],
            createdAt: new Date(p.createdAt).toLocaleDateString("ar-DZ"),
          }));
        if (mapped.length > 0) {
          setPosts(mapped.length < 4 ? [...mapped, ...INITIAL_POSTS] : mapped);
        }
      }
    } catch {
      // keep existing posts if offline or Render cold-starting
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser, savedPin, savedConfig] = await Promise.all([
          AsyncStorage.getItem("shahinaz_token"),
          AsyncStorage.getItem("shahinaz_user"),
          AsyncStorage.getItem("shahinaz_admin_pin"),
          AsyncStorage.getItem("shahinaz_admin_config"),
        ]);
        if (savedPin && savedPin.length >= 4) {
          setAdminPin(savedPin);
        }
        if (savedConfig) {
          const cfg = JSON.parse(savedConfig);
          if (typeof cfg.announcement === "string") setAnnouncement(cfg.announcement);
          if (typeof cfg.maintenanceMode === "boolean") setMaintenanceMode(cfg.maintenanceMode);
          if (typeof cfg.allowRegistration === "boolean") setAllowRegistration(cfg.allowRegistration);
          if (typeof cfg.marketEnabled === "boolean") setMarketEnabled(cfg.marketEnabled);
          if (typeof cfg.audioRoomsEnabled === "boolean") setAudioRoomsEnabled(cfg.audioRoomsEnabled);
          if (typeof cfg.devHudEnabled === "boolean") setDevHudEnabled(cfg.devHudEnabled);
          if (typeof cfg.themeId === "string" && cfg.themeId in THEMES) {
            setThemeIdState(cfg.themeId as ThemeId);
            setAccentColor(THEMES[cfg.themeId as ThemeId].primary);
          } else if (typeof cfg.accentColor === "string") {
            setAccentColor(cfg.accentColor);
          }
          if (typeof cfg.streakDays === "number") setStreakDays(cfg.streakDays);
          if (typeof cfg.lastStreakDate === "string") setLastStreakDate(cfg.lastStreakDate);
          if (Array.isArray(cfg.walletTransactions)) setWalletTransactions(cfg.walletTransactions);
          const today = new Date().toISOString().slice(0, 10);
          if (cfg.dailyMissions && cfg.dailyMissions.dateKey === today) {
            setDailyMissions(cfg.dailyMissions);
          }
          if (Array.isArray(cfg.bannedWords)) setBannedWords(cfg.bannedWords);
          if (cfg.rolePermissions) setRolePermissions({ ...DEFAULT_ROLE_PERMISSIONS, ...cfg.rolePermissions });
        }
        if (savedToken && savedUser) {
          setToken(savedToken);
          setCurrentUser(JSON.parse(savedUser));
          refreshPosts(savedToken);
        }
      } catch {
        // ignore storage errors
      } finally {
        adminLoadedRef.current = true;
        setLoadingAuth(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!adminLoadedRef.current) return;
    AsyncStorage.setItem(
      "shahinaz_admin_config",
      JSON.stringify({
        announcement,
        maintenanceMode,
        allowRegistration,
        marketEnabled,
        audioRoomsEnabled,
        devHudEnabled,
        themeId,
        accentColor,
        streakDays,
        lastStreakDate,
        walletTransactions,
        dailyMissions,
        bannedWords,
        rolePermissions,
      })
    ).catch(() => {});
  }, [
    announcement,
    maintenanceMode,
    allowRegistration,
    marketEnabled,
    audioRoomsEnabled,
    devHudEnabled,
    themeId,
    accentColor,
    streakDays,
    lastStreakDate,
    walletTransactions,
    dailyMissions,
    bannedWords,
    rolePermissions,
  ]);

  function login(name: string, username: string) {
    setCurrentUser({
      id: "me",
      name: name.trim() || "مستخدم SHAHINAZ",
      username: username.trim().replace(/^@/, "") || "shahinaz_user",
      bio: "عضو جديد في مجتمع SHAHINAZ ✨",
      avatarEmoji: "🌟",
      verified: true,
      isPrivate: false,
      points: 150,
      followers: 12,
      following: 24,
    });
  }

  async function registerWithApi(name: string, username: string, email: string, password: string) {
    const data = await apiFetch<{ token: string; user: any }>("/api/auth/register", null, {
      method: "POST",
      body: JSON.stringify({ name, username, email, password }),
    });
    const u: User = {
      id: data.user.id,
      name: data.user.name,
      username: data.user.username,
      bio: data.user.bio || "عضو جديد في مجتمع SHAHINAZ ✨",
      avatarEmoji: "🌟",
      avatarUri: data.user.avatarUrl || undefined,
      verified: false,
      isPrivate: false,
      points: 100,
      followers: 0,
      following: 0,
    };
    setToken(data.token);
    setCurrentUser(u);
    await AsyncStorage.setItem("shahinaz_token", data.token);
    await AsyncStorage.setItem("shahinaz_user", JSON.stringify(u));
    await refreshPosts(data.token);
  }

  async function loginWithApi(email: string, password: string) {
    const data = await apiFetch<{ token: string; user: any }>("/api/auth/login", null, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const u: User = {
      id: data.user.id,
      name: data.user.name,
      username: data.user.username,
      bio: data.user.bio || "عضو في مجتمع SHAHINAZ ✨",
      avatarEmoji: "🌟",
      avatarUri: data.user.avatarUrl || undefined,
      verified: false,
      isPrivate: false,
      points: 150,
      followers: 0,
      following: 0,
    };
    setToken(data.token);
    setCurrentUser(u);
    await AsyncStorage.setItem("shahinaz_token", data.token);
    await AsyncStorage.setItem("shahinaz_user", JSON.stringify(u));
    await refreshPosts(data.token);
  }

  function togglePrivateAccount() {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, isPrivate: !prev.isPrivate };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }

  function toggleFollowUser(userId: string) {
    if (!currentUser || userId === currentUser.id) return;
    const already = followingUserIds.includes(userId);
    setFollowingUserIds((prev) => (already ? prev.filter((id) => id !== userId) : [...prev, userId]));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, followers: Math.max(0, u.followers + (already ? -1 : 1)) } : u
      )
    );
    setCurrentUser((prev) =>
      prev ? { ...prev, following: Math.max(0, prev.following + (already ? -1 : 1)) } : prev
    );
  }

  function deleteMyPost(postId: string) {
    if (token && !postId.startsWith("p_")) {
      apiFetch(`/api/posts/${postId}`, token, { method: "DELETE" }).catch(() => {});
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function setReaction(postId: string, emoji: ReactionEmoji) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const same = p.myReaction === emoji;
        return {
          ...p,
          myReaction: same ? null : emoji,
          likedByMe: !same,
          likes: same ? Math.max(0, p.likes - 1) : p.likedByMe ? p.likes : p.likes + 1,
        };
      })
    );
  }

  function toggleJoinGroup(groupId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, joined: !g.joined, members: g.joined ? g.members - 1 : g.members + 1 } : g
      )
    );
  }

  function adminToggleSponsor(postId: string) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isSponsored: !p.isSponsored } : p)));
    pushAdminLog("تبديل حالة ترويج منشور (مموّل) ⭐");
  }

  function logout() {
    setCurrentUser(null);
    setToken(null);
    AsyncStorage.removeItem("shahinaz_token").catch(() => {});
    AsyncStorage.removeItem("shahinaz_user").catch(() => {});
  }

  function deleteAccount() {
    if (token) {
      apiFetch("/api/auth/me", token, { method: "DELETE" }).catch(() => {});
    }
    logout();
    setPosts(INITIAL_POSTS);
    setBlockedUserIds([]);
    setReportedPostIds([]);
    setReports([]);
  }

  function updateProfile(name: string, bio: string, avatarUri?: string) {
    if (token) {
      apiFetch("/api/auth/me", token, {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          ...(avatarUri ? { avatarUrl: avatarUri } : {}),
        }),
      }).catch(() => {});
    }
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        name: name.trim() || prev.name,
        bio: bio.trim(),
        avatarUri: avatarUri ?? prev.avatarUri,
      };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }

  function toggleLike(postId: string) {
    if (token && !postId.startsWith("p_")) {
      apiFetch(`/api/posts/${postId}/like`, token, { method: "POST" }).catch(() => {});
    }
    const target = posts.find((p) => p.id === postId);
    if (target && !target.likedByMe) {
      setDailyMissions((m) => ({ ...m, likesCount: m.likesCount + 1 }));
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }

  function toggleSave(postId: string) {
    const target = posts.find((p) => p.id === postId);
    if (target && !target.savedByMe) {
      setDailyMissions((m) => ({ ...m, savesCount: m.savesCount + 1 }));
    }
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, savedByMe: !p.savedByMe } : p)));
  }

  function addComment(postId: string, text: string) {
    if (!currentUser || !text.trim()) return;
    if (token && !postId.startsWith("p_")) {
      apiFetch(`/api/posts/${postId}/comments`, token, {
        method: "POST",
        body: JSON.stringify({ text: text.trim() }),
      }).catch(() => {});
    }
    setDailyMissions((m) => ({ ...m, commentsCount: m.commentsCount + 1 }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `c_${Date.now()}`,
                  userId: currentUser.id,
                  userName: currentUser.name,
                  text: text.trim(),
                  createdAt: "الآن",
                },
              ],
            }
          : p
      )
    );
  }

  function createPost(
    content: string,
    imageUri?: string,
    location?: string,
    bgColor?: string,
    pollOptions?: string[],
    videoUri?: string
  ) {
    if (!currentUser || (!content.trim() && !imageUri && !videoUri)) return;
    if (token) {
      apiFetch("/api/posts", token, {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: imageUri || "",
          videoUrl: videoUri || "",
          location: location?.trim() || "",
        }),
      })
        .then(() => refreshPosts(token))
        .catch(() => {});
    }
    const cleanOpts = (pollOptions || []).map((o) => o.trim()).filter(Boolean);
    const newPost: Post = {
      id: `p_${Date.now()}`,
      author: currentUser,
      content: content.trim(),
      imageUri,
      videoUri,
      location: location?.trim() || undefined,
      bgColor: !imageUri && !videoUri ? bgColor : undefined,
      poll:
        cleanOpts.length >= 2
          ? {
              options: cleanOpts.map((label, idx) => ({ id: `opt_${idx}_${Date.now()}`, label, votes: 0 })),
            }
          : undefined,
      likes: 0,
      likedByMe: false,
      savedByMe: false,
      comments: [],
      createdAt: "الآن",
    };
    setPosts((prev) => [newPost, ...prev]);
  }

  function votePoll(postId: string, optionId: string) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || !p.poll || p.poll.votedOptionId) return p;
        return {
          ...p,
          poll: {
            votedOptionId: optionId,
            options: p.poll.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
          },
        };
      })
    );
  }

  function addStory(text: string, imageUri?: string) {
    if (!currentUser || (!text.trim() && !imageUri)) return;
    const newStory: Story = {
      id: `st_${Date.now()}`,
      userName: currentUser.name,
      avatarEmoji: currentUser.avatarEmoji,
      text: text.trim() || undefined,
      imageUri,
      seen: false,
    };
    setStories((prev) => [newStory, ...prev]);
  }

  function markStorySeen(storyId: string) {
    setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, seen: true } : s)));
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function addMarketItem(item: Omit<MarketItem, "id" | "sellerName" | "createdAt">) {
    if (!currentUser) return;
    setMarketItems((prev) => [
      {
        ...item,
        id: `mk_${Date.now()}`,
        sellerName: currentUser.name,
        createdAt: "الآن",
      },
      ...prev,
    ]);
  }

  function reportPost(postId: string, reason: string) {
    setReportedPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
    setReports((prev) => [{ id: `rep_${Date.now()}`, postId, reason, createdAt: "الآن" }, ...prev]);
  }

  function blockUser(userId: string) {
    setBlockedUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  }

  function unblockUser(userId: string) {
    setBlockedUserIds((prev) => prev.filter((id) => id !== userId));
  }

  function markChatRead(chatId: string) {
    setChats((prev) => prev.map((ch) => (ch.id === chatId ? { ...ch, unread: 0 } : ch)));
  }

  function startChatWithUser(user: User): string {
    const existing = chats.find((ch) => ch.user.id === user.id);
    if (existing) {
      markChatRead(existing.id);
      return existing.id;
    }
    const newId = `ch_${user.id}_${Date.now()}`;
    const newThread: ChatThread = {
      id: newId,
      user,
      lastMessage: "ابدأ المحادثة الآن...",
      time: "الآن",
      unread: 0,
      messages: [],
    };
    setChats((prev) => [newThread, ...prev]);
    return newId;
  }

  function sendMessage(
    chatId: string,
    text: string,
    imageUri?: string,
    audioUri?: string,
    durationSec?: number
  ) {
    const clean = text.trim();
    if (!clean && !imageUri && !audioUri) return;
    const targetChat = chats.find((c) => c.id === chatId);
    const preview = audioUri
      ? `🎙️ رسالة صوتية (${durationSec || 1}ث)`
      : imageUri
      ? "📷 صورة"
      : clean;

    if (token && targetChat && !targetChat.user.id.startsWith("u_")) {
      apiFetch(`/api/messages/${targetChat.user.id}`, token, {
        method: "POST",
        body: JSON.stringify({
          text: clean,
          imageUrl: imageUri || "",
          audioUrl: audioUri || "",
          durationSec: durationSec || 0,
        }),
      }).catch(() => {});
    }

    setChats((prev) =>
      prev.map((ch) =>
        ch.id === chatId
          ? {
              ...ch,
              lastMessage: preview,
              time: "الآن",
              unread: 0,
              messages: [
                ...ch.messages,
                {
                  id: `m_${Date.now()}`,
                  fromMe: true,
                  text: clean,
                  imageUri,
                  audioUri,
                  durationSec,
                  time: "الآن",
                },
              ],
            }
          : ch
      )
    );
  }

  async function syncChatWithPeer(chatId: string, peerId: string) {
    if (!token || !currentUser || peerId.startsWith("u_")) return;
    try {
      const rows = await apiFetch<any[]>(`/api/messages/${peerId}`, token);
      if (!Array.isArray(rows)) return;
      const mapped = rows.map((m) => ({
        id: m.id,
        fromMe: m.senderId === currentUser.id,
        text: m.text || "",
        imageUri: m.imageUrl || undefined,
        audioUri: m.audioUrl || undefined,
        durationSec: m.durationSec || undefined,
        time: new Date(m.createdAt).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" }),
      }));
      const last = mapped[mapped.length - 1];
      setChats((prev) =>
        prev.map((ch) =>
          ch.id === chatId
            ? {
                ...ch,
                messages: mapped,
                lastMessage: last
                  ? last.audioUri
                    ? `🎙️ رسالة صوتية (${last.durationSec || 1}ث)`
                    : last.imageUri
                    ? "📷 صورة"
                    : last.text
                  : ch.lastMessage,
                time: last ? last.time : ch.time,
              }
            : ch
        )
      );
    } catch {
      // keep local state if offline
    }
  }

  async function refreshThreads() {
    if (!token || !currentUser) return;
    try {
      const apiThreads = await apiFetch<any[]>("/api/messages/threads", token);
      if (!Array.isArray(apiThreads) || apiThreads.length === 0) return;
      setChats((prev) => {
        const next = [...prev];
        for (const t of apiThreads) {
          const peer = t.peer;
          if (!peer?.id) continue;
          const idx = next.findIndex((c) => c.user.id === peer.id);
          const timeStr = new Date(t.lastTime).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
          if (idx >= 0) {
            next[idx] = { ...next[idx], lastMessage: t.lastMessage, time: timeStr };
          } else {
            next.unshift({
              id: `ch_${peer.id}`,
              user: {
                id: peer.id,
                name: peer.name,
                username: peer.username,
                bio: peer.bio || "",
                avatarEmoji: "👤",
                avatarUri: peer.avatarUrl || undefined,
                verified: !!peer.verified,
                followers: 0,
                following: 0,
              },
              lastMessage: t.lastMessage,
              time: timeStr,
              unread: 0,
              messages: [],
            });
          }
        }
        return next;
      });
    } catch {
      // ignore if offline
    }
  }

  function adminDeletePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setReports((prev) => prev.filter((r) => r.postId !== postId));
    setReportedPostIds((prev) => prev.filter((id) => id !== postId));
    pushAdminLog("حذف منشور بواسطة الإدارة 🗑️");
  }

  function adminTogglePinPost(postId: string) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p)));
    pushAdminLog("تبديل تثبيت منشور في أعلى الرئيسية 📌");
  }

  function adminDismissReport(reportId: string) {
    const rep = reports.find((r) => r.id === reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    if (rep) setReportedPostIds((prev) => prev.filter((id) => id !== rep.postId));
    pushAdminLog("تجاهل وإغلاق بلاغ ✓");
  }

  function adminClearAllReports() {
    setReports([]);
    setReportedPostIds([]);
    pushAdminLog("تصفير جميع البلاغات المعلقة");
  }

  function adminToggleVerify(userId: string) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, verified: !u.verified } : u)));
    setCurrentUser((prev) => {
      if (!prev || prev.id !== userId) return prev;
      const updated = { ...prev, verified: !prev.verified };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.author.id === userId ? { ...p, author: { ...p.author, verified: !p.author.verified } } : p
      )
    );
    pushAdminLog("تحديث حالة التوثيق الأزرق لمستخدم ☑️");
  }

  function adminSetAnnouncement(text: string) {
    const clean = text.trim();
    setAnnouncement(clean);
    pushAdminLog(clean ? `بث إعلان عام: ${clean.slice(0, 30)}` : "إيقاف الإعلان العام");
  }

  function adminSendGlobalNotification(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setNotifications((prev) => [
      {
        id: `n_admin_${Date.now()}`,
        emoji: "🛡️",
        text: `إدارة SHAHINAZ: ${clean}`,
        time: "الآن",
        read: false,
      },
      ...prev,
    ]);
    pushAdminLog(`إرسال إشعار فوري للجميع: ${clean.slice(0, 28)}`);
  }

  function adminToggleMaintenance() {
    setMaintenanceMode((v) => !v);
    pushAdminLog("تبديل وضع الصيانة (إيقاف/تفعيل النشر) ⚡");
  }

  function setMyNote(text: string) {
    if (!currentUser) return;
    const clean = text.trim();
    if (!clean) {
      setNotes((prev) => prev.filter((n) => n.userId !== currentUser.id));
      return;
    }
    setNotes((prev) => {
      const withoutMe = prev.filter((n) => n.userId !== currentUser.id);
      return [
        {
          id: `nt_me_${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          avatarUri: currentUser.avatarUri,
          avatarEmoji: currentUser.avatarEmoji,
          text: clean,
        },
        ...withoutMe,
      ];
    });
  }

  function createAudioRoom(title: string, topic: string) {
    if (!currentUser || !title.trim()) return;
    const room: AudioRoom = {
      id: `ar_${Date.now()}`,
      title: title.trim(),
      hostName: currentUser.name,
      hostAvatarUri: currentUser.avatarUri,
      topic: topic.trim() || "دردشة مباشرة",
      listeners: 1,
      speakers: [{ name: currentUser.name, avatarUri: currentUser.avatarUri, speaking: true }],
    };
    setAudioRooms((prev) => [room, ...prev]);
  }

  function placeCodOrder(order: Omit<CodOrder, "id" | "createdAt">) {
    setCodOrders((prev) => [{ ...order, id: `ord_${Date.now()}`, createdAt: "الآن" }, ...prev]);
    setNotifications((prev) => [
      {
        id: `n_ord_${Date.now()}`,
        emoji: "🛍️",
        text: `تم تأكيد طلبك: ${order.productTitle} (التوصيل إلى ${order.wilaya})`,
        time: "الآن",
        read: false,
      },
      ...prev,
    ]);
  }

  function adminSetUserRole(userId: string, role: UserRole) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    setCurrentUser((prev) => {
      if (!prev || prev.id !== userId) return prev;
      const updated = { ...prev, role };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    pushAdminLog(`تغيير صلاحية المستخدم إلى ${role}`);
  }

  function adminGivePoints(userId: string, delta: number) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, points: Math.max(0, (u.points ?? 100) + delta) } : u))
    );
    setCurrentUser((prev) => {
      if (!prev || prev.id !== userId) return prev;
      const updated = { ...prev, points: Math.max(0, (prev.points ?? 100) + delta) };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    pushAdminLog(`${delta >= 0 ? "منح" : "خصم"} ${Math.abs(delta)} نقطة لمستخدم`);
  }

  function adminUpdateRolePermission(role: UserRole, key: keyof RolePermissions, value: boolean) {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [key]: value },
    }));
    pushAdminLog(`تعديل صلاحية ${role}: ${key} = ${value ? "مُفعّل" : "معطّل"}`);
  }

  function adminDeleteMarketItem(itemId: string) {
    setMarketItems((prev) => prev.filter((m) => m.id !== itemId));
    pushAdminLog("حذف منتج من السوق");
  }

  function adminCloseAudioRoom(roomId: string) {
    setAudioRooms((prev) => prev.filter((r) => r.id !== roomId));
    pushAdminLog("إغلاق غرفة صوتية مباشرة");
  }

  function adminAddBannedWord(word: string) {
    const clean = word.trim();
    if (!clean) return;
    setBannedWords((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    pushAdminLog(`إضافة كلمة محظورة: ${clean}`);
  }

  function adminRemoveBannedWord(word: string) {
    setBannedWords((prev) => prev.filter((w) => w !== word));
    pushAdminLog(`إزالة كلمة محظورة: ${word}`);
  }

  function adminChangePin(newPin: string) {
    const clean = newPin.trim();
    if (clean.length < 4) return;
    setAdminPin(clean);
    AsyncStorage.setItem("shahinaz_admin_pin", clean).catch(() => {});
    pushAdminLog("تحديث رمز المطور السري 🔐");
  }

  function adminToggleRegistration() {
    setAllowRegistration((v) => !v);
    pushAdminLog("تغيير حالة التسجيل في التطبيق");
  }

  function adminToggleMarket() {
    setMarketEnabled((v) => !v);
    pushAdminLog("تغيير حالة قسم السوق");
  }

  function adminToggleAudioRooms() {
    setAudioRoomsEnabled((v) => !v);
    pushAdminLog("تغيير حالة الغرف الصوتية");
  }

  function adminToggleDevHud() {
    setDevHudEnabled((v) => !v);
    pushAdminLog("تبديل شريط المراقبة العائم (Dev HUD) 🖥️");
  }

  function adminClearLogs() {
    setAdminLogs([{ id: `lg_${Date.now()}`, action: "تم مسح سجل النشاط السابق", time: "الآن" }]);
  }

  function adminResetSystemSettings() {
    setMaintenanceMode(false);
    setAllowRegistration(true);
    setMarketEnabled(true);
    setAudioRoomsEnabled(true);
    setDevHudEnabled(false);
    setAnnouncement("");
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    pushAdminLog("إعادة ضبط إعدادات النظام للوضع الافتراضي 🔄");
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const claimedStreakToday = lastStreakDate === todayKey;

  function claimDailyStreak() {
    if (!currentUser) return { ok: false, reward: 0, message: "يرجى تسجيل الدخول أولاً." };
    if (claimedStreakToday) {
      return { ok: false, reward: 0, message: "لقد استلمت مكافأة اليوم بالفعل — عد غداً لمضاعفة السلسلة!" };
    }
    const rewards = [50, 75, 100, 150, 200, 300, 500];
    const nextDay = streakDays >= 7 ? 1 : streakDays + 1;
    const reward = rewards[nextDay - 1];
    setStreakDays(nextDay);
    setLastStreakDate(todayKey);
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, points: (prev.points ?? 150) + reward };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setNotifications((prev) => [
      {
        id: `n_str_${Date.now()}`,
        emoji: "🔥",
        text: `تم إضافة +${reward} نقطة من مكافأة الدخول اليومي!`,
        time: "الآن",
        read: false,
      },
      ...prev,
    ]);
    recordWalletTx(`مكافأة الستريك اليومي (يوم ${nextDay})`, reward, "🔥");
    return { ok: true, reward, message: `تمت إضافة +${reward} نقطة 🪙 إلى رصيدك بنجاح!` };
  }

  function redeemReward(kind: "verify" | "vip" | "boost", cost: number) {
    if (!currentUser) return { ok: false, message: "يرجى تسجيل الدخول." };
    const pts = currentUser.points ?? 150;
    if (pts < cost) {
      return { ok: false, message: `تحتاج ${cost} نقطة (رصيدك الحالي ${pts} نقطة). اجمع النقاط من الدخول اليومي!` };
    }
    if (kind === "verify" && currentUser.verified) {
      return { ok: false, message: "حسابك موثّق بالشارة الزرقاء بالفعل ☑️!" };
    }
    if (kind === "vip" && (currentUser.role === "VIP" || currentUser.role === "ADMIN")) {
      return { ok: false, message: "لديك رتبة VIP أو أعلى بالفعل 👑!" };
    }
    if (kind === "boost") {
      const myPost = posts.find((p) => p.author.id === currentUser.id) || posts[0];
      if (!myPost) return { ok: false, message: "انشر منشوراً أولاً لتتمكن من ترويجه." };
      setPosts((prev) =>
        prev.map((p) => (p.id === myPost.id ? { ...p, isSponsored: true, isPinned: true } : p))
      );
    }
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated: User = {
        ...prev,
        points: Math.max(0, (prev.points ?? 150) - cost),
        verified: kind === "verify" ? true : prev.verified,
        role: kind === "vip" ? "VIP" : prev.role,
      };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    if (kind === "verify") {
      setPosts((prev) =>
        prev.map((p) => (p.author.id === currentUser.id ? { ...p, author: { ...p.author, verified: true } } : p))
      );
    }
    const labels = {
      verify: "مبروك! تم تفعيل شارة التوثيق الأزرق ☑️ على حسابك!",
      vip: "مبروك! تمت ترقية حسابك إلى رتبة VIP الذهبية 👑!",
      boost: "تم ترويج وتثبيت أحدث منشور لك بنجاح 🚀⭐!",
    };
    const txNames = { verify: "تفعيل شارة التوثيق الأزرق", vip: "ترقية حساب VIP الذهبي", boost: "ترويج وتثبيت منشور" };
    recordWalletTx(txNames[kind], -cost, "🛍️");
    return { ok: true, message: labels[kind] };
  }

  function sendPostGift(postId: string, emoji: string, cost: number) {
    if (!currentUser) return { ok: false, message: "يرجى تسجيل الدخول." };
    const pts = currentUser.points ?? 150;
    if (pts < cost) {
      return { ok: false, message: `رصيدك (${pts} 🪙) لا يكفي لهذه الهدية (${cost} 🪙).` };
    }
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return { ok: false, message: "المنشور غير موجود." };
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, points: Math.max(0, (prev.points ?? 150) - cost) };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === targetPost.author.id ? { ...u, points: (u.points ?? 100) + cost } : u))
    );
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes: p.likes + 5,
              comments: [
                ...p.comments,
                {
                  id: `g_${Date.now()}`,
                  userId: currentUser.id,
                  userName: currentUser.name,
                  text: `أرسل هدية ${emoji} (${cost} نقطة) 🎁`,
                  createdAt: "الآن",
                },
              ],
            }
          : p
      )
    );
    recordWalletTx(`هدية ${emoji} إلى ${targetPost.author.name}`, -cost, "🎁");
    return { ok: true, message: `تم إرسال هدية ${emoji} إلى ${targetPost.author.name} بنجاح! 🎁` };
  }

  function sendLiveGift(hostName: string, emoji: string, cost: number) {
    if (!currentUser) return { ok: false, message: "يرجى تسجيل الدخول." };
    const pts = currentUser.points ?? 150;
    if (pts < cost) {
      return { ok: false, message: `رصيدك (${pts} 🪙) لا يكفي لهذه الهدية (${cost} 🪙).` };
    }
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, points: Math.max(0, (prev.points ?? 150) - cost) };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    recordWalletTx(`هدية بث مباشر ${emoji} إلى ${hostName}`, -cost, "🔴");
    return { ok: true, message: `تم إرسال هدية ${emoji} في البث المباشر!` };
  }

  function transferCoins(recipientId: string, amount: number) {
    if (!currentUser) return { ok: false, message: "يرجى تسجيل الدخول." };
    const pts = currentUser.points ?? 150;
    if (amount <= 0 || pts < amount) {
      return { ok: false, message: `رصيدك الحالي (${pts} 🪙) لا يكفي لتحويل ${amount} 🪙.` };
    }
    const target = users.find((u) => u.id === recipientId);
    if (!target) return { ok: false, message: "المستخدم غير موجود." };
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, points: Math.max(0, (prev.points ?? 150) - amount) };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === recipientId ? { ...u, points: (u.points ?? 100) + amount } : u))
    );
    recordWalletTx(`تحويل نقاط إلى ${target.name}`, -amount, "💸");
    setNotifications((prev) => [
      {
        id: `n_tx_${Date.now()}`,
        emoji: "💸",
        text: `تم تحويل ${amount} 🪙 بنجاح إلى ${target.name}`,
        time: "الآن",
        read: false,
      },
      ...prev,
    ]);
    return { ok: true, message: `تم تحويل ${amount} 🪙 إلى ${target.name} بنجاح!` };
  }

  function claimMissionReward(missionId: "likes" | "comments" | "saves") {
    if (!currentUser) return { ok: false, message: "يرجى تسجيل الدخول." };
    if (dailyMissions.claimedIds.includes(missionId)) {
      return { ok: false, message: "لقد استلمت مكافأة هذه المهمة اليوم بالفعل!" };
    }
    const config = {
      likes: { cur: dailyMissions.likesCount, target: 3, reward: 40, label: "مهمة الإعجابات اليومية ❤️" },
      comments: { cur: dailyMissions.commentsCount, target: 1, reward: 50, label: "مهمة التعليق اليومي 💬" },
      saves: { cur: dailyMissions.savesCount, target: 1, reward: 30, label: "مهمة حفظ المنشورات 🔖" },
    }[missionId];
    if (config.cur < config.target) {
      return { ok: false, message: `أكمل المهمة أولاً (${config.cur}/${config.target}) ثم استلم +${config.reward} 🪙!` };
    }
    setDailyMissions((m) => ({ ...m, claimedIds: [...m.claimedIds, missionId] }));
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, points: (prev.points ?? 150) + config.reward };
      AsyncStorage.setItem("shahinaz_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    recordWalletTx(config.label, config.reward, "🎯");
    return { ok: true, message: `مبروك! تمت إضافة +${config.reward} 🪙 لمحفظتك من ${config.label}!` };
  }

  const visiblePosts = posts
    .filter((p) => !blockedUserIds.includes(p.author.id) && !reportedPostIds.includes(p.id))
    .sort((a, b) => Number(!!b.isPinned) - Number(!!a.isPinned));

  const mergedAllUsers =
    currentUser && !users.some((u) => u.id === currentUser.id) ? [currentUser, ...users] : users;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        token,
        loadingAuth,
        posts: visiblePosts,
        allPosts: posts,
        allUsers: mergedAllUsers,
        stories,
        notifications,
        marketItems,
        groups,
        notes,
        audioRooms,
        codOrders,
        chats: chats.filter((c) => !blockedUserIds.includes(c.user.id)),
        themeId,
        theme,
        accentColor,
        streakDays,
        claimedStreakToday,
        walletTransactions,
        dailyMissions,
        followingUserIds,
        blockedUserIds,
        reportedPostIds,
        reports,
        announcement,
        maintenanceMode,
        allowRegistration,
        marketEnabled,
        audioRoomsEnabled,
        devHudEnabled,
        adminPin,
        bannedWords,
        adminLogs,
        rolePermissions,
        login,
        loginWithApi,
        registerWithApi,
        refreshPosts,
        logout,
        deleteAccount,
        updateProfile,
        togglePrivateAccount,
        setThemeId,
        setAccentColor,
        claimDailyStreak,
        redeemReward,
        sendPostGift,
        sendLiveGift,
        transferCoins,
        claimMissionReward,
        toggleFollowUser,
        toggleLike,
        setReaction,
        toggleSave,
        addComment,
        createPost,
        deleteMyPost,
        votePoll,
        addStory,
        markStorySeen,
        markAllNotificationsRead,
        addMarketItem,
        toggleJoinGroup,
        setMyNote,
        createAudioRoom,
        placeCodOrder,
        reportPost,
        blockUser,
        unblockUser,
        markChatRead,
        startChatWithUser,
        sendMessage,
        syncChatWithPeer,
        refreshThreads,
        adminDeletePost,
        adminToggleSponsor,
        adminTogglePinPost,
        adminDismissReport,
        adminClearAllReports,
        adminToggleVerify,
        adminSetUserRole,
        adminGivePoints,
        adminUpdateRolePermission,
        adminSendGlobalNotification,
        adminDeleteMarketItem,
        adminCloseAudioRoom,
        adminAddBannedWord,
        adminRemoveBannedWord,
        adminChangePin,
        adminSetAnnouncement,
        adminToggleMaintenance,
        adminToggleRegistration,
        adminToggleMarket,
        adminToggleAudioRooms,
        adminToggleDevHud,
        adminClearLogs,
        adminResetSystemSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
