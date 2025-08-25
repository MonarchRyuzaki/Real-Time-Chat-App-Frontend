"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chat, Message, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChatWebSocketService } from "@/services/ChatWebSocketService";
import React from "react";
import { MessageInput } from "./message-input";

interface ChatMessagesProps {
  messages: Message[];
  currentUser: User;
  chat: Chat;
  isLoading?: boolean;
  webSocketService: ChatWebSocketService | null;
}

export function ChatMessages({
  messages,
  currentUser,
  chat,
  isLoading = false,
  webSocketService,
}: ChatMessagesProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!webSocketService) {
      console.error("WebSocket service not available");
      return;
    }

    const otherUser = chat.users.find((user) => user.id !== currentUser.id);
    if (!otherUser) {
      console.error("Could not find other user in chat");
      return;
    }

    try {
      webSocketService.sendMessage(otherUser.name, content, chat.id);

      // Optimistically add message to UI (it will be confirmed via WebSocket)
      // The actual message will be added to state via the WebSocket response
    } catch (error) {
      console.error("Failed to send message:", error);
      // You could show a toast notification here
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-6">
          {isLoading && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Loading chat history...</span>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isCurrentUser =
              message.senderId === "currentUser" ||
              message.senderId === currentUser.id;
            const otherUser = chat.users.find(
              (user) => user.id !== currentUser.id
            );
            const displayUser = isCurrentUser ? currentUser : otherUser;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-3",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {!isCurrentUser && displayUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {displayUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl shadow-sm",
                    isCurrentUser
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card border rounded-bl-none"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={cn(
                        "text-xs",
                        isCurrentUser
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {isCurrentUser && (
                      <span
                        className={cn(
                          "text-xs ml-2",
                          isCurrentUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {message.status === "sending" && "⏳"}
                        {message.status === "sent" && "✓"}
                        {message.status === "delivered" && "✓✓"}
                        {message.status === "read" && "✓✓"}
                      </span>
                    )}
                  </div>
                </div>
                {isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-card">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!webSocketService || isLoading}
        />
      </div>
    </div>
  );
}
