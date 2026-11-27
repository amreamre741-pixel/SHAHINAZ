import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../services/api";
import type {
  AdminLogItem,
  AudioRoom,
  ChatThread,
  CodOrder,
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
  accentColor: string;
  followingUserIds: string[];
  blockedUserIds: string[];
  reportedPostIds: string[];
  reports: ReportItem[];
  announcement: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  marketEnabled: boolean;
  audioRoomsEnabled: boolean;
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
  setAccentColor: (color: string) => void;
  toggleFollowUser: (userId: string) => void;
  toggleLike: (postId: string) => void;
  setReaction: (postId: string, emoji: ReactionEmoji) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  createPost: (content: string, imageUri?: string, location?: string, bgColor?: string, pollOptions?: string[]) => void;
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
  sendMessage: (chatId: string, text: string, imageUri?: string) => void;
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
  const [accentColor, setAccentColor] = useState<string>("#8b5cf6");
  const [followingUserIds, setFollowingUserIds] = useState<string[]>(["u_1", "u_2"]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [reportedPostIds, setReportedPostIds] = useState<string[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [announcement, setAnnouncement] = useState<string>("");
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [allowRegistration, setAllowRegistration] = useState<boolean>(true);
  const [marketEnabled, setMarketEnabled] = useState<boolean>(true);
  const [audioRoomsEnabled, setAudioRoomsEnabled] = useState<boolean>(true);
  const [adminPin, setAdminPin] = useState<string>("1994");
  const [bannedWords, setBannedWords] = useState<string[]>(["احتيال", "سبام"]);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(DEFAULT_ROLE_PERMISSIONS);
  const [adminLogs, setAdminLogs] = useState<AdminLogItem[]>([
    { id: "lg_1", action: "تشغيل نظام إدارة SHAHINAZ Super-Admin", time: "اليوم" },
  ]);
  const adminLoadedRef = useRef(false);

  function pushAdminLog(action: string) {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setAdminLogs((prev) => [{ id: `lg_${Date.now()}`, action, time: t }, ...prev.slice(0, 39)]);
  }

  async function refreshPosts(activeToken?: string | null) {
    const t = activeToken ?? token;
    if (!t) return;
    try {
      const apiPosts = await apiFetch<any[]>("/api/posts", t);
      if (Array.isArray(apiPosts) && apiPosts.length > 0) {
        const mapped: Post[] = apiPosts.map((p) => ({
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
          location: p.location || undefined,
          likes: p._count?.likes ?? 0,
          likedByMe: Array.isArray(p.likes) && p.likes.length > 0,
          savedByMe: false,
          comments: [],
          createdAt: new Date(p.createdAt).toLocaleDateString("ar-DZ"),
        }));
        setPosts(mapped);
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
        bannedWords,
        rolePermissions,
      })
    ).catch(() => {});
  }, [announcement, maintenanceMode, allowRegistration, marketEnabled, audioRoomsEnabled, bannedWords, rolePermissions]);

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
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }

  function toggleSave(postId: string) {
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

  function createPost(content: string, imageUri?: string, location?: string, bgColor?: string, pollOptions?: string[]) {
    if (!currentUser || (!content.trim() && !imageUri)) return;
    if (token) {
      apiFetch("/api/posts", token, {
        method: "POST",
        body: JSON.stringify({ content: content.trim(), imageUrl: imageUri || "", location: location?.trim() || "" }),
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
      location: location?.trim() || undefined,
      bgColor: !imageUri ? bgColor : undefined,
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

  function sendMessage(chatId: string, text: string, imageUri?: string) {
    const clean = text.trim();
    if (!clean && !imageUri) return;
    setChats((prev) =>
      prev.map((ch) =>
        ch.id === chatId
          ? {
              ...ch,
              lastMessage: imageUri ? "📷 صورة" : clean,
              time: "الآن",
              unread: 0,
              messages: [
                ...ch.messages,
                { id: `m_${Date.now()}`, fromMe: true, text: clean, imageUri, time: "الآن" },
              ],
            }
          : ch
      )
    );
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

  function adminClearLogs() {
    setAdminLogs([{ id: `lg_${Date.now()}`, action: "تم مسح سجل النشاط السابق", time: "الآن" }]);
  }

  function adminResetSystemSettings() {
    setMaintenanceMode(false);
    setAllowRegistration(true);
    setMarketEnabled(true);
    setAudioRoomsEnabled(true);
    setAnnouncement("");
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    pushAdminLog("إعادة ضبط إعدادات النظام للوضع الافتراضي 🔄");
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
        accentColor,
        followingUserIds,
        blockedUserIds,
        reportedPostIds,
        reports,
        announcement,
        maintenanceMode,
        allowRegistration,
        marketEnabled,
        audioRoomsEnabled,
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
        setAccentColor,
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
