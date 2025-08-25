"use client";

import type { Chat, Message, User, UserStatus } from "@/lib/types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";

// Define comprehensive state structure based on your test script requirements
export interface ChatState {
  // Authentication state
  currentUser: User | null;
  authToken: string | null;
  isAuthenticated: boolean;

  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  connectionError: string | null;

  // Chat state
  chats: Chat[];
  selectedChat: Chat | null;
  friendsMap: Map<string, string>; // Maps friend username to chat ID
  chatIds: string[];

  // Messages state - Changed from Map to object for React reactivity
  messages: Record<string, Message[]>; // Maps chat ID to messages
  unreadCounts: Record<string, number>; // Maps chat ID to unread count

  // User status tracking
  userStatuses: Record<string, UserStatus>; // Maps username to status

  // Force re-render mechanism
  messageUpdateKey: number; // Force re-render when messages change

  // UI state
  isLoadingHistory: boolean;
  offlineMessages: Array<{
    partitionKey: string;
    count: number;
    messageType: "ONE_TO_ONE" | "GROUP";
    from?: string;
    groupName?: string;
  }>;

  // WebSocket state
  chatWebSocket: WebSocket | null;
  presenceWebSocket: WebSocket | null;
  presenceConnected: boolean;
}

// Action types based on your test script functionality
export type ChatAction =
  // Authentication actions
  | { type: "SET_CURRENT_USER"; payload: User }
  | { type: "SET_AUTH_TOKEN"; payload: string }
  | { type: "LOGOUT" }

  // Connection actions
  | { type: "SET_CONNECTING"; payload: boolean }
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "SET_INITIALIZED"; payload: boolean }
  | { type: "SET_CONNECTION_ERROR"; payload: string | null }

  // Chat actions
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "ADD_CHAT"; payload: Chat }
  | { type: "UPDATE_CHAT"; payload: { chatId: string; updates: Partial<Chat> } }
  | { type: "SELECT_CHAT"; payload: Chat | null }
  | { type: "SET_FRIENDS_MAP"; payload: Map<string, string> }
  | { type: "ADD_FRIEND"; payload: { username: string; chatId: string } }

  // Message actions
  | { type: "SET_MESSAGES"; payload: { chatId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: { chatId: string; message: Message } }
  | { type: "MARK_MESSAGES_READ"; payload: string } // chatId

  // User status actions
  | { type: "UPDATE_USER_STATUS"; payload: UserStatus }
  | {
      type: "UPDATE_USER_STATUS_FROM_HISTORY";
      payload: { username: string; isOnline: boolean; lastSeenTime?: string };
    }

  // Init data action (from your WebSocket INIT_DATA message)
  | {
      type: "HANDLE_INIT_DATA";
      payload: {
        chatIds: string[];
        groups?: number[];
        offlineMessages?: Array<{
          partitionKey: string;
          count: number;
          messageType: "ONE_TO_ONE" | "GROUP";
          from?: string;
          groupName?: string;
        }>;
      };
    }

  // WebSocket actions
  | { type: "SET_CHAT_WEBSOCKET"; payload: WebSocket | null }
  | { type: "SET_PRESENCE_WEBSOCKET"; payload: WebSocket | null }
  | { type: "SET_PRESENCE_CONNECTED"; payload: boolean }

  // UI actions
  | { type: "SET_LOADING_HISTORY"; payload: boolean }
  | { type: "SET_OFFLINE_MESSAGES"; payload: ChatState["offlineMessages"] };

// Initial state
const initialState: ChatState = {
  currentUser: null,
  authToken: null,
  isAuthenticated: false,
  isConnected: false,
  isConnecting: false,
  isInitialized: false,
  connectionError: null,
  chats: [],
  selectedChat: null,
  friendsMap: new Map(),
  chatIds: [],
  messages: {},
  unreadCounts: {},
  userStatuses: {},
  messageUpdateKey: 0,
  isLoadingHistory: false,
  offlineMessages: [],
  chatWebSocket: null,
  presenceWebSocket: null,
  presenceConnected: false,
};

// Reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_CURRENT_USER":
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: true,
      };

    case "SET_AUTH_TOKEN":
      return {
        ...state,
        authToken: action.payload,
        isAuthenticated: true,
      };

    case "LOGOUT":
      return {
        ...initialState,
      };

    case "SET_CONNECTING":
      return {
        ...state,
        isConnecting: action.payload,
        connectionError: action.payload ? null : state.connectionError,
      };

    case "SET_CONNECTED":
      return {
        ...state,
        isConnected: action.payload,
        connectionError: action.payload ? null : state.connectionError,
      };

    case "SET_INITIALIZED":
      return {
        ...state,
        isInitialized: action.payload,
      };

    case "SET_CONNECTION_ERROR":
      return {
        ...state,
        connectionError: action.payload,
        isConnecting: false,
        isConnected: false,
      };

    case "SET_CHATS":
      return {
        ...state,
        chats: action.payload,
      };

    case "ADD_CHAT":
      const existingChatIndex = state.chats.findIndex(
        (chat) => chat.id === action.payload.id
      );
      if (existingChatIndex >= 0) {
        const updatedChats = [...state.chats];
        updatedChats[existingChatIndex] = action.payload;
        return {
          ...state,
          chats: updatedChats,
        };
      }
      return {
        ...state,
        chats: [...state.chats, action.payload],
      };

    case "UPDATE_CHAT":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload.chatId
            ? { ...chat, ...action.payload.updates }
            : chat
        ),
        selectedChat:
          state.selectedChat?.id === action.payload.chatId
            ? { ...state.selectedChat, ...action.payload.updates }
            : state.selectedChat,
      };

    case "SELECT_CHAT":
      return {
        ...state,
        selectedChat: action.payload,
      };

    case "SET_FRIENDS_MAP":
      return {
        ...state,
        friendsMap: action.payload,
      };

    case "ADD_FRIEND":
      const newFriendsMap = new Map(state.friendsMap);
      newFriendsMap.set(action.payload.username, action.payload.chatId);

      // Check if this chat already exists
      const existingChat = state.chats.find(
        (chat) => chat.id === action.payload.chatId
      );
      let newChats = state.chats;

      if (!existingChat && state.currentUser) {
        // Create a new Chat object for the new friend
        const newChat: Chat = {
          id: action.payload.chatId,
          users: [
            state.currentUser,
            {
              id: action.payload.username,
              name: action.payload.username,
              avatar: `https://placehold.co/100x100.png`, // Default avatar
            },
          ],
          lastMessage: "Chat established",
          lastMessageTimestamp: new Date().toLocaleString(),
          unreadCount: 0,
        };
        newChats = [...state.chats, newChat];
      }

      return {
        ...state,
        friendsMap: newFriendsMap,
        chats: newChats,
        chatIds: state.chatIds.includes(action.payload.chatId)
          ? state.chatIds
          : [...state.chatIds, action.payload.chatId],
      };

    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages,
        },
        messageUpdateKey: state.messageUpdateKey + 1,
      };

    case "ADD_MESSAGE":
      const currentMessages = state.messages[action.payload.chatId] || [];

      // Check if this exact message already exists (prevent duplicates)
      const existingMessageIndex = currentMessages.findIndex(
        (msg) => msg.id === action.payload.message.id
      );

      let newMessages;
      if (existingMessageIndex >= 0) {
        // Update existing message
        newMessages = [...currentMessages];
        newMessages[existingMessageIndex] = {
          ...action.payload.message,
          status: "sent" as const, // Always mark as sent
        };
      } else {
        // Add new message
        newMessages = [
          ...currentMessages,
          {
            ...action.payload.message,
            status: "sent" as const, // Always mark as sent
          },
        ];
      }

      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: newMessages,
        },
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.chatId]:
            state.selectedChat?.id !== action.payload.chatId &&
            action.payload.message.senderId !== "currentUser"
              ? (state.unreadCounts[action.payload.chatId] || 0) + 1
              : state.unreadCounts[action.payload.chatId],
        },
        messageUpdateKey: state.messageUpdateKey + 1,
        chats: state.chats.map((chat) =>
          chat.id === action.payload.chatId
            ? {
                ...chat,
                lastMessage: action.payload.message.content,
                lastMessageTimestamp: new Date(
                  action.payload.message.timestamp
                ).toLocaleString(),
                unreadCount:
                  state.selectedChat?.id !== action.payload.chatId &&
                  action.payload.message.senderId !== "currentUser"
                    ? (chat.unreadCount || 0) + 1
                    : chat.unreadCount,
              }
            : chat
        ),
      };

    case "MARK_MESSAGES_READ":
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload]: 0,
        },
        chats: state.chats.map((chat) =>
          chat.id === action.payload ? { ...chat, unreadCount: 0 } : chat
        ),
      };

    case "HANDLE_INIT_DATA":
      // Extract friend usernames from chat IDs (matching your test script logic)
      const friendsMap = new Map<string, string>();
      const chats: Chat[] = [];

      if (action.payload.chatIds && state.currentUser) {
        action.payload.chatIds.forEach((chatId: string) => {
          const parts = chatId.split("-");
          if (parts.length === 2) {
            const friend =
              parts[0] === state.currentUser?.name ? parts[1] : parts[0];
            friendsMap.set(friend, chatId);

            // Create a Chat object for each friendship
            const chat: Chat = {
              id: chatId,
              users: [
                state.currentUser!,
                {
                  id: friend,
                  name: friend,
                  avatar: `https://placehold.co/100x100.png`, // Default avatar
                },
              ],
              lastMessage: "",
              lastMessageTimestamp: "",
              unreadCount: 0,
            };
            chats.push(chat);
          }
        });
      }

      return {
        ...state,
        chatIds: action.payload.chatIds || [],
        friendsMap,
        chats, // Set the actual chat objects
        offlineMessages: action.payload.offlineMessages || [],
        isInitialized: true,
      };

    case "SET_CHAT_WEBSOCKET":
      return {
        ...state,
        chatWebSocket: action.payload,
      };

    case "SET_PRESENCE_WEBSOCKET":
      return {
        ...state,
        presenceWebSocket: action.payload,
      };

    case "SET_PRESENCE_CONNECTED":
      return {
        ...state,
        presenceConnected: action.payload,
      };

    case "SET_LOADING_HISTORY":
      return {
        ...state,
        isLoadingHistory: action.payload,
      };

    case "SET_OFFLINE_MESSAGES":
      return {
        ...state,
        offlineMessages: action.payload,
      };

    case "UPDATE_USER_STATUS":
      return {
        ...state,
        userStatuses: {
          ...state.userStatuses,
          [action.payload.username]: action.payload,
        },
        // Update the user status in chats as well
        chats: state.chats.map((chat) => ({
          ...chat,
          users: chat.users.map((user) =>
            user.name === action.payload.username
              ? {
                  ...user,
                  isOnline: action.payload.isOnline,
                  lastSeen: action.payload.lastSeen,
                }
              : user
          ),
        })),
        selectedChat: state.selectedChat
          ? {
              ...state.selectedChat,
              users: state.selectedChat.users.map((user) =>
                user.name === action.payload.username
                  ? {
                      ...user,
                      isOnline: action.payload.isOnline,
                      lastSeen: action.payload.lastSeen,
                    }
                  : user
              ),
            }
          : null,
      };

    case "UPDATE_USER_STATUS_FROM_HISTORY":
      const existingStatus = state.userStatuses[action.payload.username];
      const historyTimestamp =
        action.payload.lastSeenTime || new Date().toISOString();

      // Only update if we don't have existing status or the history is newer
      const shouldUpdate =
        !existingStatus ||
        new Date(historyTimestamp) > new Date(existingStatus.updatedAt);

      if (!shouldUpdate) {
        return state;
      }

      const newStatus: UserStatus = {
        username: action.payload.username,
        isOnline: action.payload.isOnline,
        lastSeen: action.payload.lastSeenTime,
        updatedAt: historyTimestamp,
      };

      return {
        ...state,
        userStatuses: {
          ...state.userStatuses,
          [action.payload.username]: newStatus,
        },
        // Update the user status in chats as well
        chats: state.chats.map((chat) => ({
          ...chat,
          users: chat.users.map((user) =>
            user.name === action.payload.username
              ? {
                  ...user,
                  isOnline: action.payload.isOnline,
                  lastSeen: action.payload.lastSeenTime,
                }
              : user
          ),
        })),
        selectedChat: state.selectedChat
          ? {
              ...state.selectedChat,
              users: state.selectedChat.users.map((user) =>
                user.name === action.payload.username
                  ? {
                      ...user,
                      isOnline: action.payload.isOnline,
                      lastSeen: action.payload.lastSeenTime,
                    }
                  : user
              ),
            }
          : null,
      };

    default:
      return state;
  }
}

// Context
interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;

  // Convenience action creators
  setCurrentUser: (user: User) => void;
  selectChat: (chat: Chat | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  markMessagesRead: (chatId: string) => void;
  logout: () => void;
  handleInitData: (data: {
    chatIds: string[];
    groups?: number[];
    offlineMessages?: Array<{
      partitionKey: string;
      count: number;
      messageType: "ONE_TO_ONE" | "GROUP";
      from?: string;
      groupName?: string;
    }>;
  }) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Convenience action creators
  const setCurrentUser = useCallback((user: User) => {
    dispatch({ type: "SET_CURRENT_USER", payload: user });
  }, []);

  const selectChat = useCallback((chat: Chat | null) => {
    dispatch({ type: "SELECT_CHAT", payload: chat });
    if (chat) {
      dispatch({ type: "MARK_MESSAGES_READ", payload: chat.id });
    }
  }, []);

  const addMessage = useCallback((chatId: string, message: Message) => {
    dispatch({ type: "ADD_MESSAGE", payload: { chatId, message } });
  }, []);

  const markMessagesRead = useCallback((chatId: string) => {
    dispatch({ type: "MARK_MESSAGES_READ", payload: chatId });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
  }, []);

  const handleInitData = useCallback(
    (data: {
      chatIds: string[];
      groups?: number[];
      offlineMessages?: Array<{
        partitionKey: string;
        count: number;
        messageType: "ONE_TO_ONE" | "GROUP";
        from?: string;
        groupName?: string;
      }>;
    }) => {
      dispatch({ type: "HANDLE_INIT_DATA", payload: data });
    },
    []
  );

  const contextValue: ChatContextType = {
    state,
    dispatch,
    setCurrentUser,
    selectChat,
    addMessage,
    markMessagesRead,
    logout,
    handleInitData,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

// Custom hook to use the chat context
export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
