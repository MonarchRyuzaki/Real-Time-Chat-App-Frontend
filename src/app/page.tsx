"use client";

import { Button } from "@/components/ui/button";
import { getCurrentUser, isAuthenticated, logout } from "@/lib/auth";
import { LogOut, MessageSquare, Users, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const user = getCurrentUser();

      setIsLoggedIn(authenticated);
      setUsername(user?.username || null);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsLoggedIn(false);
      setUsername(null);
      // Optionally redirect or show a success message
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleGoToChat = () => {
    router.push("/chat");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">ChatWave</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {isLoading ? (
              // Show loading state
              <div className="flex items-center gap-2">
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              </div>
            ) : isLoggedIn ? (
              // Show authenticated user options
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Welcome, {username}
                </span>
                <Button variant="ghost" onClick={handleGoToChat}>
                  Go to Chat
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              // Show default sign in/register options
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center gap-8 px-4 py-24 text-center md:px-6 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl">
              {isLoggedIn
                ? `Welcome back, ${username}!`
                : "Seamless Communication, Effortless Collaboration"}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              {isLoggedIn
                ? "Ready to continue your conversations? Jump back into your chats or explore new features."
                : "ChatWave is the modern chat application designed for teams that move fast. Secure, reliable, and built for productivity."}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            {isLoggedIn ? (
              <>
                <Button size="lg" onClick={handleGoToChat}>
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Go to Chat
                </Button>
                <Button size="lg" variant="outline" onClick={handleLogout}>
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/register">Get Started for Free</Link>
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </>
            )}
          </div>
          <div className="mt-8 w-full max-w-4xl">
            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="ChatWave application dashboard"
              width={1200}
              height={600}
              className="rounded-lg border shadow-2xl"
              data-ai-hint="app dashboard"
            />
          </div>
        </section>

        <section id="features" className="w-full bg-muted py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">
                Features Built for Modern Teams
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Everything you need to stay connected and productive, in one
                place.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Real-time Chat</h3>
                <p className="mt-2 text-muted-foreground">
                  Instant messaging with rich media support to keep your
                  conversations flowing.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Group Channels</h3>
                <p className="mt-2 text-muted-foreground">
                  Organize discussions by project, team, or topic with public
                  and private channels.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Powerful Integrations</h3>
                <p className="mt-2 text-muted-foreground">
                  Connect your favorite tools and services to streamline your
                  workflow.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row md:px-6">
          <p className="text-sm text-muted-foreground">
            © 2024 ChatWave. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
