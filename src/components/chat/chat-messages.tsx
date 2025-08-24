'use client';

import type { Message, User, Chat } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageInput } from './message-input';
import React from 'react';

interface ChatMessagesProps {
  messages: Message[];
  currentUser: User;
  chat: Chat;
}

export function ChatMessages({ messages: initialMessages, currentUser, chat }: ChatMessagesProps) {
  const [messages, setMessages] = React.useState(initialMessages);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('div');
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: `msg${Date.now()}`,
      chatId: chat.id,
      sender: currentUser,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-6">
          {messages.map((message) => {
            const isCurrentUser = message.sender.id === currentUser.id;
            return (
              <div
                key={message.id}
                className={cn('flex items-end gap-3', isCurrentUser ? 'justify-end' : 'justify-start')}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.avatar} alt={message.sender.name} data-ai-hint="profile picture" />
                    <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl shadow-sm',
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-card border rounded-bl-none'
                  )}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={cn(
                    "text-xs mt-1 text-right",
                    isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {message.timestamp}
                  </p>
                </div>
                {isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint="profile picture"/>
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-card">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
