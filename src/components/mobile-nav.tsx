
"use client";

import React from "react";
import { LayoutGrid, CheckSquare, Settings, Sparkles, Home, Target, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MobileNavProps {
  activeTab: "home" | "tasks" | "ai" | "settings";
}

export function MobileNav({ activeTab }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex items-center justify-around px-4 mobile-nav-shadow z-50">
      <Link href="/" className="flex flex-col items-center gap-1 w-16">
        <div className={cn(
          "p-2 rounded-xl transition-colors",
          activeTab === "home" ? "bg-primary/10 text-primary" : "text-muted-foreground"
        )}>
          <Home className="h-6 w-6" />
        </div>
        <span className={cn("text-[10px] font-medium", activeTab === "home" ? "text-primary" : "text-muted-foreground")}>Home</span>
      </Link>

      <Link href="/bpd-tracker" className="flex flex-col items-center gap-1 w-16">
        <div className={cn(
          "p-2 rounded-xl transition-colors",
          activeTab === "tasks" ? "bg-red-500/10 text-red-500" : "text-muted-foreground"
        )}>
          <Heart className="h-6 w-6" />
        </div>
        <span className={cn("text-[10px] font-medium", activeTab === "tasks" ? "text-red-500" : "text-muted-foreground")}>Pulse</span>
      </Link>

      <Link href="/ai-tools" className="flex flex-col items-center gap-1 w-16">
        <div className={cn(
          "p-2 rounded-xl transition-colors",
          activeTab === "ai" ? "bg-primary/10 text-primary" : "text-muted-foreground"
        )}>
          <Sparkles className="h-6 w-6" />
        </div>
        <span className={cn("text-[10px] font-medium", activeTab === "ai" ? "text-primary" : "text-muted-foreground")}>AI</span>
      </Link>

      <Link href="/settings" className="flex flex-col items-center gap-1 w-16">
        <div className={cn(
          "p-2 rounded-xl transition-colors",
          activeTab === "settings" ? "bg-primary/10 text-primary" : "text-muted-foreground"
        )}>
          <Settings className="h-6 w-6" />
        </div>
        <span className={cn("text-[10px] font-medium", activeTab === "settings" ? "text-primary" : "text-muted-foreground")}>Settings</span>
      </Link>
    </nav>
  );
}
