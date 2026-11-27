export interface User {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatarEmoji: string;
  avatarUri?: string;
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

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUri?: string;
  location?: string;
  bgColor?: string;
  poll?: {
    options: PollOption[];
    votedOptionId?: string;
  };
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
  text?: string;
  imageUri?: string;
  seen: boolean;
}

export interface NotificationItem {
  id: string;
  emoji: string;
  text: string;
  time: string;
  read: boolean;
}

export interface MarketItem {
  id: string;
  title: string;
  priceDzd: number;
  city: string;
  sellerName: string;
  phone: string;
  imageUri?: string;
  emoji: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  user: User;
  lastMessage: string;
  time: string;
  unread: number;
  messages: { id: string; fromMe: boolean; text: string; time: string }[];
}
