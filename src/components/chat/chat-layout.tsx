"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useChatContext } from "@/contexts/ChatContext";
import { getCurrentUser, isAuthenticated, logout } from "@/lib/auth";
import type { Chat } from "@/lib/types";
import { ChatWebSocketService } from "@/services/ChatWebSocketService";
import { LogOut, MoreVertical, Plus, Search, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatList } from "./chat-list";
import { ChatLoading } from "./chat-loading";
import { ChatMessages } from "./chat-messages";

export function ChatLayout() {
  const { state, dispatch, setCurrentUser, selectChat } = useChatContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatUsername, setNewChatUsername] = useState("");
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const router = useRouter();
  const webSocketServiceRef = useRef<ChatWebSocketService | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      const user = getCurrentUser();
      if (user) {
        // Set user in centralized state
        setCurrentUser({
          id: user.username, // Use username as id since there's no userId
          name: user.username,
          avatar: `https://placehold.co/100x100.png`,
        });

        // Initialize WebSocket service
        if (!webSocketServiceRef.current && user.token) {
          webSocketServiceRef.current = new ChatWebSocketService(
            dispatch,
            user.username,
            user.token
          );

          // Connect to WebSockets
          connectToWebSockets();
        }
      }
    }
  }, [router, setCurrentUser, dispatch]);

  const connectToWebSockets = async () => {
    if (!webSocketServiceRef.current) return;

    try {
      // Connect to chat WebSocket
      await webSocketServiceRef.current.connectToChatWebSocket();
      console.log("Connected to chat WebSocket");

      // Connect to presence WebSocket
      try {
        await webSocketServiceRef.current.connectToPresenceWebSocket();
        console.log("Connected to presence WebSocket");
      } catch (presenceError) {
        console.warn("Could not connect to presence WebSocket:", presenceError);
        // Continue without presence - it's not critical
      }
    } catch (error) {
      console.error("Failed to connect to chat WebSocket:", error);
      dispatch({
        type: "SET_CONNECTION_ERROR",
        payload: "Failed to connect to chat service",
      });
    }
  };

  const handleLogout = async () => {
    // Disconnect WebSockets
    if (webSocketServiceRef.current) {
      webSocketServiceRef.current.disconnect();
      webSocketServiceRef.current = null;
    }

    // Clear state and logout
    dispatch({ type: "LOGOUT" });
    await logout();
    router.push("/login");
  };

  const handleSelectChat = (chat: Chat) => {
    selectChat(chat);

    // Load chat history if WebSocket is connected
    if (webSocketServiceRef.current && state.currentUser) {
      const otherUser = chat.users.find(
        (user) => user.id !== state.currentUser?.id
      );
      if (otherUser) {
        webSocketServiceRef.current.requestChatHistory(otherUser.name, chat.id);
      }
    }
  };

  const handleStartNewChat = () => {
    if (!newChatUsername.trim()) {
      return;
    }

    if (newChatUsername.trim() === state.currentUser?.name) {
      alert("You cannot start a chat with yourself!");
      return;
    }

    // Check if chat already exists
    const existingChat = state.chats.find((chat) => {
      const otherUser = chat.users.find(
        (user) => user.id !== state.currentUser?.id
      );
      return otherUser?.name === newChatUsername.trim();
    });

    if (existingChat) {
      alert("You already have a chat with this user!");
      selectChat(existingChat);
      setIsNewChatDialogOpen(false);
      setNewChatUsername("");
      return;
    }

    // Start new chat via WebSocket
    if (webSocketServiceRef.current) {
      webSocketServiceRef.current.startNewChat(newChatUsername.trim());
      setIsNewChatDialogOpen(false);
      setNewChatUsername("");
    }
  };

  const getOtherUser = (chat: Chat) => {
    if (!state.currentUser) return null;
    return chat.users.find((user) => user.id !== state.currentUser!.id);
  };

  const otherUser = state.selectedChat
    ? getOtherUser(state.selectedChat)
    : null;

  // Filter chats based on search query
  const filteredChats = state.chats.filter((chat) => {
    const otherUser = getOtherUser(chat);
    return (
      otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Get messages for selected chat from centralized state
  const chatMessages = state.selectedChat
    ? state.messages[state.selectedChat.id] || []
    : [];

  // Show loading page during initialization
  if (!state.currentUser || !state.isInitialized) {
    return <ChatLoading />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar side="left" collapsible="icon" className="h-full">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {state.currentUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="relative group-data-[collapsible=icon]:hidden">
                <h2 className="text-lg font-semibold">
                  {state.currentUser.name}
                </h2>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      state.isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {state.isConnected ? "Online" : "Offline"}
                  {state.isConnecting && (
                    <span className="ml-1">(Connecting...)</span>
                  )}
                </div>
              </div>
            </div>
            <div className="px-4 pb-2 group-data-[collapsible=icon]:hidden">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Dialog
                open={isNewChatDialogOpen}
                onOpenChange={setIsNewChatDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Chat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start New Chat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="username" className="text-sm font-medium">
                        Username
                      </label>
                      <Input
                        id="username"
                        placeholder="Enter username..."
                        value={newChatUsername}
                        onChange={(e) => setNewChatUsername(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleStartNewChat();
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsNewChatDialogOpen(false);
                          setNewChatUsername("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleStartNewChat}>Start Chat</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <div className="px-2">
              {state.connectionError && (
                <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  {state.connectionError}
                </div>
              )}
              <ChatList
                chats={filteredChats}
                selectedChat={state.selectedChat}
                onSelectChat={handleSelectChat}
                currentUser={state.currentUser}
              />
            </div>
          </SidebarContent>

          <SidebarFooter className="group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between p-2">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
                <span className="ml-2">Settings</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="ml-2">Logout</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="flex flex-col h-full">
            {state.selectedChat && otherUser ? (
              <>
                <div className="border-b p-4 flex items-center gap-3">
                  <SidebarTrigger className="md:hidden" />
                  <Avatar>
                    <AvatarFallback>
                      {otherUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{otherUser.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {otherUser.isOnline ? (
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Online
                        </span>
                      ) : otherUser.lastSeen ? (
                        `Last seen ${new Date(
                          otherUser.lastSeen
                        ).toLocaleString()}`
                      ) : (
                        "Last seen recently"
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <ChatMessages
                  key={`${state.selectedChat.id}-${state.messageUpdateKey}`}
                  messages={chatMessages}
                  currentUser={state.currentUser}
                  chat={state.selectedChat}
                  isLoading={state.isLoadingHistory}
                  webSocketService={webSocketServiceRef.current}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">Welcome to Chat</h3>
                  <p className="text-sm">
                    {state.chats.length === 0
                      ? "No chats available. Start a new conversation!"
                      : "Select a chat to start messaging"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
