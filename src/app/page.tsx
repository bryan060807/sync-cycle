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

  const signals = [
    { id: "green", label: "Feeling Stable", color: "bg-[#14b8a6]" },
    { id: "orange", label: "Feeling Sensitive", color: "bg-[#f97316]" },
    { id: "red", label: "In Crisis / Need Space", color: "bg-[#ef4444]" },
  ];

  const alertPills = [
    { label: "Crisis", color: "bg-[#f97316]", icon: <ShieldAlert className="h-4 w-4" /> },
    { label: "Mood", color: "bg-[#ef4444]", icon: <AlertCircle className="h-4 w-4" /> },
    { label: "Sync", color: "bg-[#8b5cf6]", icon: <Zap className="h-4 w-4" /> },
  ];

  const activeSignal = signals.find((s) => s.id === signal);

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-24 space-y-6">
        <div className="pt-4">
          <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">Good morning, Alex</h2>
          <p className="text-gray-500 text-sm font-medium">How's your signal today?</p>
        </div>

        {/* Signal Selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-1.5 bg-[#1f2937] rounded-full border border-[#374151] shadow-inner">
            {signals.map((s) => (
              <button
                key={s.id}
                onClick={() => setSignal(s.id)}
                className={cn(
                  "h-11 flex-1 rounded-full transition-all duration-300 flex items-center justify-center",
                  signal === s.id ? (
                    cn(s.color, "shadow-lg shadow-black/40 scale-[1.02]")
                  ) : "bg-transparent opacity-30 hover:opacity-50"
                )}
              >
                <div className="h-3 w-3 rounded-full bg-white" />
              </button>
            ))}
          </div>
          <div className="text-center px-4">
            <span className={cn(
              "text-xs font-black uppercase tracking-[0.2em] transition-colors duration-300",
              activeSignal?.id === "green" ? "text-[#14b8a6]" :
              activeSignal?.id === "orange" ? "text-[#f97316]" : "text-[#ef4444]"
            )}>
              {activeSignal?.label}
            </span>
          </div>
        </div>

        {/* Alert Pills */}
        <div className="grid grid-cols-3 gap-3">
          {alertPills.map((pill) => (
            <Button
              key={pill.label}
              className={cn(
                "h-16 rounded-3xl border-none text-white font-bold flex flex-col gap-1 items-center justify-center transition-transform active:scale-95",
                pill.color
              )}
            >
              {pill.icon}
              <span className="text-[10px] uppercase tracking-widest">{pill.label}</span>
            </Button>
          ))}
        </div>

        {/* Score Card */}
        <Card className="bg-[#1f2937] border-[#374151] rounded-[2.5rem] p-8 overflow-hidden relative shadow-2xl">
          <div className="absolute -top-6 -right-6 p-8 opacity-5">
            <Sparkles className="h-48 w-48 text-white" />
          </div>
          <CardContent className="p-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] mb-4">Baseline Stability</p>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-white tracking-tighter">8.4</span>
              <span className="text-[#14b8a6] text-sm font-black">+1.2</span>
            </div>
            <p className="text-gray-400 text-sm mt-5 leading-relaxed font-medium">
              Your stability is trending up. Day 12 of consecutive logs.
            </p>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#1f2937] border-[#374151] rounded-[2rem] p-6 shadow-xl border-l-4 border-l-[#a855f7]">
            <div className="p-2.5 bg-[#7c3aed]/10 w-fit rounded-2xl mb-4">
              <Brain className="h-5 w-5 text-[#a855f7]" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Coping Use</p>
            <p className="text-2xl font-black text-white">12/15</p>
          </Card>
          <Card className="bg-[#1f2937] border-[#374151] rounded-[2rem] p-6 shadow-xl border-l-4 border-l-[#14b8a6]">
            <div className="p-2.5 bg-[#14b8a6]/10 w-fit rounded-2xl mb-4">
              <Zap className="h-5 w-5 text-[#14b8a6]" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Active Cycle</p>
            <p className="text-2xl font-black text-white">Day 4</p>
          </Card>
        </div>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}