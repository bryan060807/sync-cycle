"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Sparkles, Brain, AlertCircle, Zap, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [signal, setSignal] = useState("green");

  const alertPills = [
    { label: "Crisis", color: "bg-[#f97316]", icon: <ShieldAlert className="h-4 w-4" /> },
    { label: "Mood", color: "bg-[#ef4444]", icon: <AlertCircle className="h-4 w-4" /> },
    { label: "Sync", color: "bg-[#8b5cf6]", icon: <Zap className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-24 space-y-6">
        <div className="pt-4">
          <h2 className="text-3xl font-bold text-white mb-1">Good morning, Alex</h2>
          <p className="text-gray-400 text-sm">How's your signal today?</p>
        </div>

        {/* Signal Selector */}
        <div className="flex items-center gap-3 p-2 bg-[#1f2937] rounded-full border border-[#374151]">
          {["red", "yellow", "green"].map((color) => (
            <button
              key={color}
              onClick={() => setSignal(color)}
              className={cn(
                "h-10 flex-1 rounded-full transition-all flex items-center justify-center",
                signal === color ? (
                  color === "green" ? "bg-[#14b8a6] shadow-lg shadow-[#14b8a6]/20" :
                  color === "yellow" ? "bg-yellow-500 shadow-lg shadow-yellow-500/20" :
                  "bg-red-500 shadow-lg shadow-red-500/20"
                ) : "bg-transparent opacity-30"
              )}
            >
              <div className="h-3 w-3 rounded-full bg-white" />
            </button>
          ))}
        </div>

        {/* Alert Pills */}
        <div className="grid grid-cols-3 gap-3">
          {alertPills.map((pill) => (
            <Button
              key={pill.label}
              className={cn(
                "h-14 rounded-2xl border-none text-white font-bold flex flex-col gap-1 items-center justify-center",
                pill.color
              )}
            >
              {pill.icon}
              <span className="text-[10px] uppercase tracking-widest">{pill.label}</span>
            </Button>
          ))}
        </div>

        {/* Score Card */}
        <Card className="bg-[#1f2937] border-[#374151] rounded-3xl p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="h-32 w-32" />
          </div>
          <CardContent className="p-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Baseline Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-white">8.4</span>
              <span className="text-[#14b8a6] text-sm font-bold">+1.2</span>
            </div>
            <p className="text-gray-400 text-sm mt-4 leading-relaxed">
              Your stability is trending up. Keep using your coping strategies!
            </p>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#1f2937] border-[#374151] rounded-3xl p-4">
            <div className="p-2 bg-[#7c3aed]/20 w-fit rounded-xl mb-3">
              <Brain className="h-5 w-5 text-[#a855f7]" />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1">Coping Use</p>
            <p className="text-xl font-black text-white">12/15</p>
          </Card>
          <Card className="bg-[#1f2937] border-[#374151] rounded-3xl p-4">
            <div className="p-2 bg-[#14b8a6]/20 w-fit rounded-xl mb-3">
              <Zap className="h-5 w-5 text-[#14b8a6]" />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1">Active Cycle</p>
            <p className="text-xl font-black text-white">Day 4</p>
          </Card>
        </div>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}