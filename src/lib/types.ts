export type User = {
  id: string;
  name: string;
  avatar: string;
};

export type Message = {
  id: string;
  chatId: string;
  sender: User;
  text: string;
  timestamp: string;
};

export type Chat = {
  id: string;
  users: User[];
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
};
