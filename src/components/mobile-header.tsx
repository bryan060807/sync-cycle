
"use client";

import React from "react";
import { Menu, Heart, Pill, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutGrid, User, Activity, Shield, MessageSquare, Star, Calendar, Folder, HeartPulse, Users } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";

export function MobileHeader() {
  const { user } = useUser();
  const db = useFirestore();

  const menuItems = [
    { icon: <LayoutGrid />, label: "Dashboard", href: "/" },
    { icon: <User />, label: "Profile", href: "/settings" },
    { icon: <Activity />, label: "Emotional Check-in", href: "/wellness" },
    { icon: <HeartPulse />, label: "Health", href: "/health" },
    { icon: <Pill />, label: "Medications", href: "/meds" },
    { icon: <Shield />, label: "Crisis Plan", href: "/crisis" },
    { icon: <Users />, label: "Community Forums", href: "/forums" },
    { icon: <MessageSquare />, label: "Gratitude", href: "/gratitude" },
    { icon: <Star />, label: "Goals", href: "/goals" },
    { icon: <Calendar />, label: "Schedule", href: "/retro" },
    { icon: <Folder />, label: "Collections", href: "/lists" },
  ];

  const unreadQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false),
      limit(1)
    );
  }, [db, user]);

  const { data: unreadNotifications } = useCollection(unreadQuery);
  const hasUnread = unreadNotifications && unreadNotifications.length > 0;

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
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user/100"} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user?.displayName || "User"}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 text-center">
        <h1 className="text-lg font-bold tracking-tight text-white">SyncCycle</h1>
      </div>

      <Link href="/notifications">
        <Button variant="ghost" size="icon" className="text-white relative">
          <Bell className="h-6 w-6" />
          {hasUnread && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#0f1117]" />
          )}
        </Button>
      </Link>
    </header>
  );
}
