import React, { createContext, useContext, useState } from "react";
import type { ChatThread, MarketItem, NotificationItem, Post, Story, User } from "../types";

export interface ReportItem {
  id: string;
  postId: string;
  reason: string;
  createdAt: string;
}

interface AppContextValue {
  currentUser: User | null;
  posts: Post[];
  allPosts: Post[];
  allUsers: User[];
  stories: Story[];
  notifications: NotificationItem[];
  marketItems: MarketItem[];
  chats: ChatThread[];
  blockedUserIds: string[];
  reportedPostIds: string[];
  reports: ReportItem[];
  announcement: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  login: (name: string, username: string) => void;
  logout: () => void;
  deleteAccount: () => void;
  updateProfile: (name: string, bio: string, avatarUri?: string) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  createPost: (content: string, imageUri?: string, location?: string) => void;
  addStory: (text: string, imageUri?: string) => void;
  markStorySeen: (storyId: string) => void;
  markAllNotificationsRead: () => void;
  addMarketItem: (item: Omit<MarketItem, "id" | "sellerName" | "createdAt">) => void;
  reportPost: (postId: string, reason: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  sendMessage: (chatId: string, text: string) => void;
  adminDeletePost: (postId: string) => void;
  adminDismissReport: (reportId: string) => void;
  adminToggleVerify: (userId: string) => void;
  adminSetAnnouncement: (text: string) => void;
  adminToggleMaintenance: () => void;
  adminToggleRegistration: () => void;
}

const DEMO_USERS: User[] = [
  { id: "u_1", name: "ياسين بن علي", username: "yassine_dz", bio: "مصمم ومصور من الجزائر العاصمة 📸", avatarEmoji: "🧔🏻", verified: true, followers: 1420, following: 210 },
  { id: "u_2", name: "سارة منصوري", username: "sara_style", bio: "يوميات، سفر، وأفكار إبداعية ✨", avatarEmoji: "👩🏻‍🎨", verified: true, followers: 3850, following: 185 },
  { id: "u_3", name: "كريم تكنولوجي", username: "karim_tech", bio: "تقنية وتجارة إلكترونية في الجزائر 🚀", avatarEmoji: "👨🏻‍💻", verified: false, followers: 960, following: 320 },
];

const INITIAL_STORIES: Story[] = [
  { id: "st_2", userName: "ياسين", avatarEmoji: "🧔🏻", text: "مرحباً بالجميع في SHAHINAZ! 🔥🇩🇿", seen: false },
  { id: "st_3", userName: "سارة", avatarEmoji: "👩🏻‍🎨", text: "أجواء جميلة اليوم في وهران 🌊✨", seen: false },
  { id: "st_4", userName: "كريم", avatarEmoji: "👨🏻‍💻", text: "جديد التجارة الإلكترونية قريباً 🚀", seen: true },
];

const INITIAL_NOTIFS: NotificationItem[] = [
  { id: "n_1", emoji: "❤️", text: "أعجبت سارة منصوري بمنشورك", time: "منذ 5 د", read: false },
  { id: "n_2", emoji: "💬", text: "علّق ياسين بن علي: تطبيق رائع بالتوفيق!", time: "منذ 15 د", read: false },
  { id: "n_3", emoji: "👤", text: "بدأ كريم تكنولوجي بمتابعتك", time: "منذ ساعة", read: true },
];

const INITIAL_MARKET: MarketItem[] = [
  { id: "mk_1", title: "هاتف Samsung A55 جديد", priceDzd: 58000, city: "الجزائر العاصمة", sellerName: "كريم تكنولوجي", phone: "0550123456", emoji: "📱", createdAt: "اليوم" },
  { id: "mk_2", title: "ساعة ذكية أصلية مقاومة للماء", priceDzd: 6500, city: "سطيف", sellerName: "ياسين بن علي", phone: "0661234567", emoji: "⌚", createdAt: "أمس" },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "p_1",
    author: DEMO_USERS[0],
    content: "أهلاً بكم في منصة SHAHINAZ الجديدة! ✨ تجربة تجمع بين سلاسة إنستغرام وتفاعل فيسبوك بتصميم عصري وسريع.",
    location: "الجزائر العاصمة 🇩🇿",
    likes: 128,
    likedByMe: false,
    savedByMe: false,
    comments: [
      { id: "c_1", userId: "u_2", userName: "سارة منصوري", text: "تطبيق رائع جداً! بالتوفيق 🔥", createdAt: "منذ 10 د" },
    ],
    createdAt: "منذ 25 دقيقة",
  },
  {
    id: "p_2",
    author: DEMO_USERS[1],
    content: "صباح الخير للجميع ☕ ما هي أهدافكم لهذا الأسبوع؟ شاركونا في التعليقات!",
    location: "وهران",
    likes: 84,
    likedByMe: true,
    savedByMe: true,
    comments: [],
    createdAt: "منذ ساعتين",
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

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFS);
  const [marketItems, setMarketItems] = useState<MarketItem[]>(INITIAL_MARKET);
  const [chats, setChats] = useState<ChatThread[]>(INITIAL_CHATS);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [reportedPostIds, setReportedPostIds] = useState<string[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [announcement, setAnnouncement] = useState<string>("");
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [allowRegistration, setAllowRegistration] = useState<boolean>(true);

  function login(name: string, username: string) {
    setCurrentUser({
      id: "me",
      name: name.trim() || "مستخدم SHAHINAZ",
      username: username.trim().replace(/^@/, "") || "shahinaz_user",
      bio: "عضو جديد في مجتمع SHAHINAZ ✨",
      avatarEmoji: "🌟",
      verified: true,
      followers: 12,
      following: 24,
    });
  }

  function logout() {
    setCurrentUser(null);
  }

  function deleteAccount() {
    setCurrentUser(null);
    setPosts(INITIAL_POSTS);
    setBlockedUserIds([]);
    setReportedPostIds([]);
    setReports([]);
  }

  function updateProfile(name: string, bio: string, avatarUri?: string) {
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            name: name.trim() || prev.name,
            bio: bio.trim(),
            avatarUri: avatarUri ?? prev.avatarUri,
          }
        : prev
    );
  }

  function toggleLike(postId: string) {
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

  function createPost(content: string, imageUri?: string, location?: string) {
    if (!currentUser || (!content.trim() && !imageUri)) return;
    const newPost: Post = {
      id: `p_${Date.now()}`,
      author: currentUser,
      content: content.trim(),
      imageUri,
      location: location?.trim() || undefined,
      likes: 0,
      likedByMe: false,
      savedByMe: false,
      comments: [],
      createdAt: "الآن",
    };
    setPosts((prev) => [newPost, ...prev]);
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

  function sendMessage(chatId: string, text: string) {
    if (!text.trim()) return;
    setChats((prev) =>
      prev.map((ch) =>
        ch.id === chatId
          ? {
              ...ch,
              lastMessage: text.trim(),
              time: "الآن",
              unread: 0,
              messages: [...ch.messages, { id: `m_${Date.now()}`, fromMe: true, text: text.trim(), time: "الآن" }],
            }
          : ch
      )
    );
  }

  function adminDeletePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setReports((prev) => prev.filter((r) => r.postId !== postId));
    setReportedPostIds((prev) => prev.filter((id) => id !== postId));
  }

  function adminDismissReport(reportId: string) {
    const rep = reports.find((r) => r.id === reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    if (rep) setReportedPostIds((prev) => prev.filter((id) => id !== rep.postId));
  }

  function adminToggleVerify(userId: string) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, verified: !u.verified } : u)));
    setPosts((prev) =>
      prev.map((p) =>
        p.author.id === userId ? { ...p, author: { ...p.author, verified: !p.author.verified } } : p
      )
    );
  }

  function adminSetAnnouncement(text: string) {
    setAnnouncement(text.trim());
  }

  function adminToggleMaintenance() {
    setMaintenanceMode((v) => !v);
  }

  function adminToggleRegistration() {
    setAllowRegistration((v) => !v);
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        posts: posts.filter((p) => !blockedUserIds.includes(p.author.id) && !reportedPostIds.includes(p.id)),
        allPosts: posts,
        allUsers: users,
        stories,
        notifications,
        marketItems,
        chats: chats.filter((c) => !blockedUserIds.includes(c.user.id)),
        blockedUserIds,
        reportedPostIds,
        reports,
        announcement,
        maintenanceMode,
        allowRegistration,
        login,
        logout,
        deleteAccount,
        updateProfile,
        toggleLike,
        toggleSave,
        addComment,
        createPost,
        addStory,
        markStorySeen,
        markAllNotificationsRead,
        addMarketItem,
        reportPost,
        blockUser,
        unblockUser,
        sendMessage,
        adminDeletePost,
        adminDismissReport,
        adminToggleVerify,
        adminSetAnnouncement,
        adminToggleMaintenance,
        adminToggleRegistration,
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
