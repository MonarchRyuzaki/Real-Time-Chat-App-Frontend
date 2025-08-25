export type User = {
  id: string;
  name: string;
  avatar: string;
  isOnline?: boolean;
  lastSeen?: string;
};

export interface UserStatus {
  username: string;
  isOnline: boolean;
  lastSeen?: string;
  updatedAt: string; // To track when this status was last updated
}

export type Message = {
  id: string;
  content: string; // Changed from 'text' to 'content'
  senderId: string; // Changed from 'sender: User' to 'senderId: string'
  timestamp: string;
  status?: "sending" | "sent" | "delivered" | "read"; // Added status field
};

export type Chat = {
  id: string;
  users: User[];
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
};
