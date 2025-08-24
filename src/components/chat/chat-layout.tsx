'use client';

import { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatList } from './chat-list';
import { ChatMessages } from './chat-messages';
import { chats, messages as allMessages } from '@/lib/mock-data';
import type { Chat, User } from '@/lib/types';
import { LogOut, MoreVertical, Search, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout, isAuthenticated, getCurrentUser } from '@/lib/auth';

export function ChatLayout() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(chats[0] || null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      const user = getCurrentUser();
      if (user) {
        // Construct user from stored info, create a placeholder avatar
        setCurrentUser({ 
          id: user.userId, 
          name: user.username,
          avatar: `https://placehold.co/100x100.png`
        });
      }
    }
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const getOtherUser = (chat: Chat) => {
    if (!currentUser) return null;
    return chat.users.find((user) => user.id !== currentUser.id);
  };
  
  const otherUser = selectedChat ? getOtherUser(selectedChat) : null;
  
  if (!currentUser) {
    // You can render a loading spinner here
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="h-full">
        <SidebarHeader>
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint="profile picture"/>
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">{currentUser.name}</span>
            </div>
            <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
               <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
               </Button>
               <Button onClick={handleLogout} variant="ghost" size="icon" className="h-8 w-8">
                  <LogOut className="h-4 w-4" />
               </Button>
            </div>
          </div>
          <div className="relative group-data-[collapsible=icon]:hidden">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search chats..." className="pl-8" />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
            <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={setSelectedChat}
                currentUser={currentUser}
            />
        </SidebarContent>
        <SidebarFooter className="group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-muted-foreground">&copy; 2024 ChatWave</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col h-full bg-background">
        {selectedChat && otherUser ? (
          <>
            <header className="flex items-center justify-between p-3 border-b bg-card">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <Avatar>
                  <AvatarImage src={otherUser.avatar} alt={otherUser.name} data-ai-hint="profile picture" />
                  <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold font-headline">{otherUser.name}</h2>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical />
              </Button>
            </header>
            <ChatMessages
              messages={allMessages.filter((m) => m.chatId === selectedChat.id)}
              currentUser={currentUser}
              chat={selectedChat}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <SidebarTrigger className="md:hidden absolute top-4 left-4" />
             <div className="flex flex-col items-center gap-2">
                <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                </div>
                <h1 className="text-2xl font-bold font-headline">Welcome to ChatWave</h1>
                <p className="text-muted-foreground">Select a chat to start messaging.</p>
             </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
