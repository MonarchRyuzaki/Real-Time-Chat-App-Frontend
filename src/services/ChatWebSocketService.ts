"use client";

import { ChatAction } from "@/contexts/ChatContext";
import type { Message } from "@/lib/types";

// WebSocket message types based on your test script
interface BaseMessage {
  type: string;
}

interface InitDataMessage extends BaseMessage {
  type: "INIT_DATA";
  chatIds: string[];
  groups: number[];
  offlineMessages?: Array<{
    partitionKey: string;
    count: number;
    messageType: "ONE_TO_ONE" | "GROUP";
    from?: string;
    groupName?: string;
  }>;
}

interface MessageResponse extends BaseMessage {
  type: "MESSAGE";
  from: string;
  content: string;
  chatId: string;
  timestamp?: string;
}

interface OneToOneChatHistoryResponse extends BaseMessage {
  type: "ONE_TO_ONE_CHAT_HISTORY";
  messages: Array<{
    messageId: string;
    from: string;
    to: string;
    text: string;
    timestamp: string;
  }>;
  isOnline: boolean;
  lastSeenTime?: string;
}

interface NewOneToOneChatApprovalResponse extends BaseMessage {
  type: "NEW_ONE_TO_ONE_CHAT_AP";
  from?: string;
  to?: string;
  msg?: string;
  chatId?: string;
}

interface ErrorResponse extends BaseMessage {
  type: "ERROR";
  msg: string;
}

interface InfoResponse extends BaseMessage {
  type: "INFO";
  msg: string;
}

interface SuccessResponse extends BaseMessage {
  type: "SUCCESS";
  msg: string;
}

interface StatusChangeMessage extends BaseMessage {
  type: "STATUS_CHANGE";
  username: string;
  status: "ONLINE" | "OFFLINE";
}

type WebSocketMessage =
  | InitDataMessage
  | MessageResponse
  | OneToOneChatHistoryResponse
  | NewOneToOneChatApprovalResponse
  | ErrorResponse
  | InfoResponse
  | SuccessResponse
  | StatusChangeMessage;

export class ChatWebSocketService {
  private chatWebSocket: WebSocket | null = null;
  private presenceWebSocket: WebSocket | null = null;
  private dispatch: React.Dispatch<ChatAction>;
  private currentUser: string;
  private authToken: string;
  private portNumber: number;

  constructor(
    dispatch: React.Dispatch<ChatAction>,
    currentUser: string,
    authToken: string,
    portNumber: number = 4000
  ) {
    this.dispatch = dispatch;
    this.currentUser = currentUser;
    this.authToken = authToken;
    this.portNumber = portNumber;
  }

  // Helper function to generate chat ID matching backend logic
  private generateChatId(user1: string, user2: string): string {
    if (!user1 || !user2) {
      throw new Error("Both users are required to generate a chat ID");
    }
    const sortedUsers = [user1, user2].sort();
    return `${sortedUsers[0]}-${sortedUsers[1]}`;
  }

  // Connect to chat WebSocket
  async connectToChatWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dispatch({ type: "SET_CONNECTING", payload: true });

      // Encode auth token in the URL for browser WebSocket authentication
      const wsUrl = `ws://localhost:${
        this.portNumber
      }/?username=${encodeURIComponent(
        this.currentUser
      )}&authToken=${encodeURIComponent(this.authToken)}`;

      const ws = new WebSocket(wsUrl);

      const connectionTimeout = setTimeout(() => {
        ws.close();
        reject(new Error("Chat WebSocket connection timeout"));
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this.dispatch({ type: "SET_CONNECTING", payload: false });
        this.dispatch({ type: "SET_CONNECTED", payload: true });
        this.dispatch({ type: "SET_CHAT_WEBSOCKET", payload: ws });
        this.chatWebSocket = ws;

        // Send INIT_DATA message to trigger server initialization
        ws.send(JSON.stringify({ type: "INIT_DATA" }));
        resolve();
      };

      ws.onmessage = (event) => {
        console.log(event.data);
        this.handleIncomingMessage(event.data);
      };

      ws.onclose = () => {
        this.dispatch({ type: "SET_CONNECTED", payload: false });
        this.dispatch({ type: "SET_CHAT_WEBSOCKET", payload: null });
        this.chatWebSocket = null;
      };

      ws.onerror = (error: any) => {
        clearTimeout(connectionTimeout);
        this.dispatch({ type: "SET_CONNECTING", payload: false });
        this.dispatch({
          type: "SET_CONNECTION_ERROR",
          payload: error.message || "Connection failed",
        });
        reject(error);
      };
    });
  }

  // Connect to presence WebSocket
  async connectToPresenceWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Encode auth token in the URL for browser WebSocket authentication
      const wsUrl = `ws://localhost:5000/?username=${encodeURIComponent(
        this.currentUser
      )}&authToken=${encodeURIComponent(this.authToken)}`;

      const ws = new WebSocket(wsUrl);

      const connectionTimeout = setTimeout(() => {
        ws.close();
        reject(new Error("Presence WebSocket connection timeout"));
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this.dispatch({ type: "SET_PRESENCE_CONNECTED", payload: true });
        this.dispatch({ type: "SET_PRESENCE_WEBSOCKET", payload: ws });
        this.presenceWebSocket = ws;
        resolve();
      };

      ws.onmessage = (event) => {
        // Handle presence-specific messages
        console.log("Presence server message:", event.data);
        this.handlePresenceMessage(event.data);
      };

      ws.onclose = (event) => {
        this.dispatch({ type: "SET_PRESENCE_CONNECTED", payload: false });
        this.dispatch({ type: "SET_PRESENCE_WEBSOCKET", payload: null });
        this.presenceWebSocket = null;
      };

      ws.onerror = (error: any) => {
        clearTimeout(connectionTimeout);
        this.dispatch({ type: "SET_PRESENCE_CONNECTED", payload: false });
        reject(error);
      };
    });
  }

  // Handle incoming WebSocket messages
  private handleIncomingMessage(data: string) {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      console.log("Received WebSocket message:", message);

      switch (message.type) {
        case "INIT_DATA":
          this.handleInitData(message);
          break;

        case "MESSAGE":
          console.log("Handling incoming MESSAGE:", message);
          this.handleMessage(message);
          break;

        case "ONE_TO_ONE_CHAT_HISTORY":
          console.log("Handling chat history:", message);
          this.handleChatHistory(message);
          break;

        case "NEW_ONE_TO_ONE_CHAT_AP":
          this.handleNewChatApproval(message);
          break;

        case "INFO":
        case "SUCCESS":
        case "ERROR":
          this.handleStatusMessage(message);
          break;

        default:
          console.log(
            `Unknown message type: ${(message as any).type}`,
            message
          );
      }
    } catch (error) {
      console.error("Error parsing message:", error, "Raw data:", data);
    }
  }

  private handleInitData(message: InitDataMessage) {
    this.dispatch({
      type: "HANDLE_INIT_DATA",
      payload: {
        chatIds: message.chatIds,
        groups: message.groups,
        offlineMessages: message.offlineMessages,
      },
    });

    // Automatically acknowledge offline messages if present
    if (message.offlineMessages && message.offlineMessages.length > 0) {
      setTimeout(() => {
        if (this.chatWebSocket) {
          this.chatWebSocket.send(
            JSON.stringify({ type: "OFFLINE_MESSAGES_ACK" })
          );
        }
      }, 1000);
    }
  }

  private handleMessage(message: MessageResponse) {
    // Just create a new message from the server response
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      content: message.content,
      senderId:
        message.from === this.currentUser ? "currentUser" : message.from,
      timestamp: message.timestamp || new Date().toISOString(),
      status: "sent",
    };

    this.dispatch({
      type: "ADD_MESSAGE",
      payload: {
        chatId: message.chatId,
        message: newMessage,
      },
    });
  }

  private handleChatHistory(message: OneToOneChatHistoryResponse) {
    if (message.messages && message.messages.length > 0) {
      const chatId = this.generateChatId(
        message.messages[0].from,
        message.messages[0].to
      );
      const formattedMessages: Message[] = message.messages.map((msg) => ({
        id: msg.messageId,
        content: msg.text, // Map text to content
        senderId: msg.from === this.currentUser ? "currentUser" : msg.from,
        timestamp: msg.timestamp,
        status: "sent",
      }));

      this.dispatch({
        type: "SET_MESSAGES",
        payload: {
          chatId,
          messages: formattedMessages,
        },
      });

      // Update user status from history data
      const otherUser =
        message.messages[0].from === this.currentUser
          ? message.messages[0].to
          : message.messages[0].from;

      this.dispatch({
        type: "UPDATE_USER_STATUS_FROM_HISTORY",
        payload: {
          username: otherUser,
          isOnline: message.isOnline,
          lastSeenTime: message.lastSeenTime,
        },
      });
    }

    this.dispatch({ type: "SET_LOADING_HISTORY", payload: false });
  }

  private handleNewChatApproval(message: NewOneToOneChatApprovalResponse) {
    if (message.from && message.chatId) {
      // Incoming chat request
      this.dispatch({
        type: "ADD_FRIEND",
        payload: {
          username: message.from,
          chatId: message.chatId,
        },
      });
    } else if (message.to && message.chatId) {
      // Outgoing chat confirmation
      this.dispatch({
        type: "ADD_FRIEND",
        payload: {
          username: message.to,
          chatId: message.chatId,
        },
      });
    }
  }

  private handleStatusMessage(
    message: InfoResponse | SuccessResponse | ErrorResponse
  ) {
    // You can implement toast notifications or status updates here
    console.log(`${message.type}: ${message.msg}`);
  }

  // Handle presence WebSocket messages
  private handlePresenceMessage(data: string) {
    try {
      const message = JSON.parse(data);
      console.log("Parsed presence message:", message);

      if (message.type === "STATUS_CHANGE") {
        const statusMessage = message as StatusChangeMessage;
        this.dispatch({
          type: "UPDATE_USER_STATUS",
          payload: {
            username: statusMessage.username,
            isOnline: statusMessage.status === "ONLINE",
            lastSeen:
              statusMessage.status === "OFFLINE"
                ? new Date().toISOString()
                : undefined,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error(
        "Error parsing presence message:",
        error,
        "Raw data:",
        data
      );
    }
  }

  // Send a message
  sendMessage(to: string, content: string, chatId: string) {
    if (!this.chatWebSocket) {
      throw new Error("Chat WebSocket not connected");
    }

    // Create message and mark it as sent immediately
    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      content,
      senderId: "currentUser",
      timestamp: new Date().toISOString(),
      status: "sent", // Just mark as sent immediately
    };

    // Add message to UI immediately
    this.dispatch({
      type: "ADD_MESSAGE",
      payload: {
        chatId,
        message,
      },
    });

    // Send message to server
    this.chatWebSocket.send(
      JSON.stringify({
        type: "ONE_TO_ONE_CHAT",
        from: this.currentUser,
        to,
        content,
        chatId,
      })
    );

    console.log("Sent message:", {
      type: "ONE_TO_ONE_CHAT",
      from: this.currentUser,
      to,
      content,
      chatId,
    });
  }

  // Request chat history
  requestChatHistory(friendUsername: string, chatId: string) {
    if (!this.chatWebSocket) {
      throw new Error("Chat WebSocket not connected");
    }

    this.dispatch({ type: "SET_LOADING_HISTORY", payload: true });

    this.chatWebSocket.send(
      JSON.stringify({
        type: "GET_ONE_TO_ONE_HISTORY",
        from: this.currentUser,
        to: friendUsername,
        chatId,
      })
    );
  }

  // Start a new chat
  startNewChat(friendUsername: string) {
    if (!this.chatWebSocket) {
      throw new Error("Chat WebSocket not connected");
    }

    this.chatWebSocket.send(
      JSON.stringify({
        type: "NEW_ONE_TO_ONE_CHAT",
        from: this.currentUser,
        to: friendUsername,
      })
    );
  }

  // Disconnect
  disconnect() {
    if (this.chatWebSocket) {
      this.chatWebSocket.send(JSON.stringify({ type: "DISCONNECT" }));
      this.chatWebSocket.close();
    }
    if (this.presenceWebSocket) {
      this.presenceWebSocket.close();
    }
  }
}
