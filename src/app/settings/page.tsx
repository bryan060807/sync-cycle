"use client";

import React from "react";
import { MobileNav } from "@/components/mobile-nav";
import { User, Bell, Shield, Smartphone, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: <User className="h-5 w-5" />, label: "Profile Information", type: "nav" },
        { icon: <Bell className="h-5 w-5" />, label: "Notifications", type: "toggle", default: true },
        { icon: <Shield className="h-5 w-5" />, label: "Security & Privacy", type: "nav" },
      ]
    },
    {
      title: "App Settings",
      items: [
        { icon: <Smartphone className="h-5 w-5" />, label: "Offline Mode", type: "toggle", default: false },
        { icon: <HelpCircle className="h-5 w-5" />, label: "Help & Support", type: "nav" },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 pt-8 pb-6 border-b bg-white">
        <h1 className="text-2xl font-bold font-headline mb-6">Settings</h1>
        
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src="https://picsum.photos/seed/user/200/200" />
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-bold text-lg">Alex Johnson</h2>
            <p className="text-xs text-muted-foreground">alex.j@example.com</p>
            <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-none text-[10px]">
              Pro Member
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-8 px-6 pt-6 pb-24 overflow-y-auto">
        {settingsGroups.map((group, i) => (
          <div key={i} className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
              {group.title}
            </h3>
            <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
              {group.items.map((item, j) => (
                <div key={j}>
                  <div className="flex items-center justify-between p-4 active:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">{item.icon}</div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {item.type === "nav" ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Switch defaultChecked={item.default} />
                    )}
                  </div>
                  {j < group.items.length - 1 && <Separator className="mx-4" />}
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full h-12 text-destructive border-destructive/20 hover:bg-destructive/5 font-bold">
          <LogOut className="mr-2 h-5 w-5" /> Sign Out
        </Button>

        <div className="text-center text-[10px] text-muted-foreground py-4">
          CycleSync Mobile v1.0.2 • Made with ❤️ for productivity
        </div>
      </div>

      <MobileNav activeTab="settings" />
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full font-semibold", className)}>
      {children}
    </span>
  );
}