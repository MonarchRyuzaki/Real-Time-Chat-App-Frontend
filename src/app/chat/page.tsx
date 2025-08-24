import { ChatLayout } from "@/components/chat/chat-layout";
import { ChatProvider } from "@/contexts/ChatContext";

export default function Home() {
  return (
    <ChatProvider>
      <main className="h-full">
        <ChatLayout />
      </main>
    </ChatProvider>
  );
}
