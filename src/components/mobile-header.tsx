"use client";

import React from "react";
import { Menu, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, LayoutGrid, User, Activity, Shield, MessageSquare, Star, Calendar, Folder, Settings, HeartPulse } from "lucide-react";
import Link from "next/link";

export function MobileHeader() {
  const menuItems = [
    { icon: <LayoutGrid />, label: "Dashboard", href: "/" },
    { icon: <User />, label: "Profile", href: "/settings" },
    { icon: <Activity />, label: "Wellness", href: "/wellness" },
    { icon: <HeartPulse />, label: "Health", href: "/health" },
    { icon: <Shield />, label: "Crisis Plan", href: "/crisis" },
    { icon: <MessageSquare />, label: "Gratitude", href: "/gratitude" },
    { icon: <Star />, label: "Goals", href: "/goals" },
    { icon: <Calendar />, label: "Schedule", href: "/retro" },
    { icon: <Folder />, label: "Collections", href: "/lists" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#0f1117]/80 backdrop-blur-md border-b border-[#374151] h-16 flex items-center px-4 safe-top">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-[#0f1117] border-r border-[#374151] p-0 w-[280px]">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full pt-10">
            <div className="px-6 mb-8 flex items-center gap-2">
              <div className="p-2 bg-[#7c3aed] rounded-xl">
                <Heart className="h-6 w-6 text-white fill-white" />
              </div>
              <span className="text-xl font-black text-white">SyncCycle</span>
            </div>

            <div className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
              {menuItems.map((item) => (
                <Link key={item.label} href={item.href}>
                  <div className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-[#1f2937] transition-colors text-gray-300">
                    {React.cloneElement(item.icon as React.ReactElement, { className: "h-5 w-5" })}
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="p-6 border-t border-[#374151] bg-[#111827]">
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://picsum.photos/seed/user/100" />
                  <AvatarFallback>AJ</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Alex Johnson</p>
                  <p className="text-[10px] text-gray-500">alex.j@example.com</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-gray-400 p-0 h-auto hover:text-white">
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </Button>
                <Button variant="ghost" className="w-full justify-start text-destructive p-0 h-auto hover:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 text-center">
        <h1 className="text-lg font-bold tracking-tight text-white">SyncCycle</h1>
      </div>

      <div className="w-10" /> {/* Spacer for centering */}
    </header>
  );
}