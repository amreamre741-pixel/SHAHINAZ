import React, { createContext, useContext, useState } from "react";
import type { ChatThread, Post, Story, User } from "../types";

interface AppContextValue {
  currentUser: User | null;
  posts: Post[];
  stories: Story[];
  chats: ChatThread[];
  blockedUserIds: string[];
  reportedPostIds: string[];
  login: (name: string, username: string) => void;
  logout: () => void;
  deleteAccount: () => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  createPost: (content: string, imageUri?: string, location?: string) => void;
  reportPost: (postId: string, reason: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  sendMessage: (chatId: string, text: string) => void;
}

const DEMO_USERS: User[] = [
  { id: "u_1", name: "ياسين بن علي", username: "yassine_dz", bio: "مصمم ومصور من الجزائر العاصمة 📸", avatarEmoji: "🧔🏻", verified: true, followers: 1420, following: 210 },
  { id: "u_2", name: "سارة منصوري", username: "sara_style", bio: "يوميات، سفر، وأفكار إبداعية ✨", avatarEmoji: "👩🏻‍🎨", verified: true, followers: 3850, following: 185 },
  { id: "u_3", name: "كريم تكنولوجي", username: "karim_tech", bio: "تقنية وتجارة إلكترونية في الجزائر 🚀", avatarEmoji: "👨🏻‍💻", followers: 960, following: 320 },
];

const INITIAL_STORIES: Story[] = [
  { id: "st_1", userName: "قصتك", avatarEmoji: "➕", seen: false },
  { id: "st_2", userName: "ياسين", avatarEmoji: "🧔🏻", seen: false },
  { id: "st_3", userName: "سارة", avatarEmoji: "👩🏻‍🎨", seen: false },
  { id: "st_4", userName: "كريم", avatarEmoji: "👨🏻‍💻", seen: true },
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
    messages: [
      { id: "m_1", fromMe: false, text: "مرحباً بك في SHAHINAZ! كيف حالك؟", time: "14:20" },
    ],
  },
  {
    id: "ch_2",
    user: DEMO_USERS[2],
    lastMessage: "التطبيق سريع جداً ما شاء الله 🚀",
    time: "أمس",
    unread: 0,
    messages: [
      { id: "m_2", fromMe: false, text: "التطبيق سريع جداً ما شاء الله 🚀", time: "أمس" },
    ],
  },
];

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [stories] = useState<Story[]>(INITIAL_STORIES);
  const [chats, setChats] = useState<ChatThread[]>(INITIAL_CHATS);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [reportedPostIds, setReportedPostIds] = useState<string[]>([]);

  function login(name: string, username: string) {
    setCurrentUser({
      id: "me",
      name: name.trim() || "مستخدم SHAHINAZ",
      username: username.trim().replace(/^@/, "") || "shahinaz_user",
      bio: "عضو جديد في مجتمع SHAHINAZ ✨",
      avatarEmoji: "🌟",
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

  function reportPost(postId: string, _reason: string) {
    setReportedPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        posts: posts.filter((p) => !blockedUserIds.includes(p.author.id) && !reportedPostIds.includes(p.id)),
        stories,
        chats: chats.filter((c) => !blockedUserIds.includes(c.user.id)),
        blockedUserIds,
        reportedPostIds,
        login,
        logout,
        deleteAccount,
        toggleLike,
        toggleSave,
        addComment,
        createPost,
        reportPost,
        blockUser,
        unblockUser,
        sendMessage,
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
