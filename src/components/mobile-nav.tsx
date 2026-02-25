"use client";

import React from "react";
import { Sparkles, Home, Target, Heart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileNav({ activeTab }: { activeTab?: string }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: Home, href: "/", id: "home" },
    { label: "Pulse", icon: Heart, href: "/bpd-tracker", id: "tasks" },
    { label: "AI", icon: Sparkles, href: "/ai-tools", id: "ai" },
    { label: "Settings", icon: Settings, href: "/settings", id: "settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 mobile-nav-shadow z-50">
      {navItems.map((item) => {
        const isActive = activeTab === item.id || pathname === item.href;
        return (
          <Link 
            key={item.id} 
            href={item.href} 
            className="flex flex-col items-center gap-1 w-16 group active:scale-90 transition-transform"
          >
            <div className={cn(
              "p-2 rounded-2xl transition-all duration-300",
              isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-muted-foreground group-hover:text-foreground"
            )}>
              <item.icon className="h-6 w-6" />
            </div>
            <span className={cn(
              "text-[10px] font-bold tracking-tight transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}