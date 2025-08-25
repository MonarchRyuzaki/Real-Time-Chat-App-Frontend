"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Chat, User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  currentUser: User;
}

export function ChatList({
  chats,
  selectedChat,
  onSelectChat,
  currentUser,
}: ChatListProps) {
  const getOtherUser = (chat: Chat) => {
    return chat.users.find((user) => user.id !== currentUser.id);
  };

  return (
    <div className="flex flex-col gap-1">
      {chats.map((chat) => {
        const otherUser = getOtherUser(chat);
        if (!otherUser) return null;

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-colors w-full text-left",
              selectedChat?.id === chat.id ? "bg-primary/20" : "hover:bg-muted",
              "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12"
            )}
          >
            <Avatar className="h-10 w-10 border">
              <AvatarFallback>
                {otherUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate group-data-[collapsible=icon]:hidden">
              <div className="flex items-center justify-between">
                <p className="font-semibold truncate">{otherUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {chat.lastMessageTimestamp}
                </p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-muted-foreground truncate">
                  {chat.lastMessage}
                </p>
                {chat.unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground rounded-full h-5 min-w-5 flex items-center justify-center p-1 text-xs">
                    {chat.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
