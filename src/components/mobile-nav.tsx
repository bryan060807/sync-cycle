"use client";

import React from "react";
import { LayoutGrid, Activity, Shield, Settings, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileNav({ activeTab }: { activeTab?: string }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: LayoutGrid, href: "/", id: "home" },
    { label: "Pulse", icon: Activity, href: "/wellness", id: "wellness" },
    { label: "Crisis", icon: Shield, href: "/crisis", id: "crisis" },
    { label: "Goals", icon: Heart, href: "/goals", id: "goals" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#0f1117]/90 backdrop-blur-xl border-t border-[#374151] flex items-center justify-around px-4 safe-bottom z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.id} 
            href={item.href} 
            className="flex flex-col items-center gap-1 w-16 group transition-transform active:scale-90"
          >
            <div className={cn(
              "p-2 rounded-2xl transition-all duration-300",
              isActive 
                ? "bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20" 
                : "text-gray-500 group-hover:text-gray-300"
            )}>
              <item.icon className="h-6 w-6" />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-tight transition-colors",
              isActive ? "text-[#a855f7]" : "text-gray-500"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}