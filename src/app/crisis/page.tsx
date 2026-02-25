"use client";

import React from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CrisisPlan() {
  const sections = [
    { title: "Warning Signs", count: 3, icon: <AlertTriangle className="text-yellow-500" /> },
    { title: "Internal Coping", count: 5, icon: <ShieldCheck className="text-[#14b8a6]" /> },
    { title: "De-escalation", count: 2, icon: <CheckCircle2 className="text-[#a855f7]" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-24 space-y-6">
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-white">Crisis Plan</h2>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span>Readiness</span>
              <span className="text-[#14b8a6]">85% Complete</span>
            </div>
            <Progress value={85} className="h-2 bg-[#1f2937]" />
          </div>
        </div>

        <div className="bg-[#14b8a6]/10 border border-[#14b8a6]/30 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-[#14b8a6] rounded-xl">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-bold text-white flex-1">Period Rule Active</p>
          <div className="h-2 w-2 rounded-full bg-[#14b8a6]" />
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title} className="bg-[#1f2937] border-[#374151] rounded-3xl p-4">
              <CardContent className="p-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#111827] rounded-2xl">
                    {React.cloneElement(section.icon as React.ReactElement, { className: "h-6 w-6" })}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{section.title}</h3>
                    <p className="text-xs text-gray-500">{section.count} techniques saved</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="rounded-full bg-[#111827] text-white">
                  <Plus className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="pt-4">
          <Button variant="outline" className="w-full h-14 border-[#374151] text-gray-400 font-bold rounded-2xl bg-transparent">
            Share Plan with Partner
          </Button>
        </div>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}