export interface User {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatarEmoji: string;
  verified?: boolean;
  followers: number;
  following: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUri?: string;
  location?: string;
  likes: number;
  likedByMe: boolean;
  savedByMe: boolean;
  comments: Comment[];
  createdAt: string;
}

export interface Story {
  id: string;
  userName: string;
  avatarEmoji: string;
  seen: boolean;
}

export interface ChatThread {
  id: string;
  user: User;
  lastMessage: string;
  time: string;
  unread: number;
  messages: { id: string; fromMe: boolean; text: string; time: string }[];
}
