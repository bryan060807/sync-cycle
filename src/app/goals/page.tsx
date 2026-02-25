
"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Plus, Target, Users, MoreHorizontal, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function Goals() {
  const [tab, setTab] = useState("short");

  const goals = [
    { title: "Daily Meditation", progress: 80, shared: true, category: "Health" },
    { title: "Weekly Budget Sync", progress: 40, shared: true, category: "Finance" },
    { title: "Morning Walk", progress: 100, shared: false, category: "Personal" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-24 space-y-6">
        <div className="pt-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Shared Goals</h2>
          <Button className="btn-gradient h-10 px-4">
            <Plus className="h-4 w-4 mr-2" /> New Goal
          </Button>
        </div>

        {/* Pill Toggle */}
        <div className="flex p-1 bg-[#1f2937] rounded-full border border-[#374151]">
          <button
            onClick={() => setTab("short")}
            className={cn(
              "flex-1 py-2 rounded-full text-xs font-bold transition-all",
              tab === "short" ? "bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20" : "text-gray-500"
            )}
          >
            Short-term
          </button>
          <button
            onClick={() => setTab("long")}
            className={cn(
              "flex-1 py-2 rounded-full text-xs font-bold transition-all",
              tab === "long" ? "bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20" : "text-gray-500"
            )}
          >
            Long-term
          </button>
        </div>

        <div className="space-y-4">
          {goals.map((goal) => (
            <Card key={goal.title} className="bg-[#1f2937] border-[#374151] rounded-3xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{goal.title}</h3>
                      {goal.shared && <Users className="h-3 w-3 text-[#a855f7]" />}
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{goal.category}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-[#a855f7]">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-1.5 bg-[#111827]" />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" className="flex-1 bg-[#111827] text-xs rounded-xl h-9">-10%</Button>
                  <Button variant="secondary" size="sm" className="flex-1 bg-[#111827] text-xs rounded-xl h-9">+10%</Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 bg-[#14b8a6]/10 text-[#14b8a6] rounded-xl">
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}
