"use client";

import React, { useState, useEffect } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Sparkles, Brain, AlertCircle, Zap, ShieldAlert, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [signal, setSignal] = useState("green");
  const [cooldowns, setCooldowns] = useState<{ [key: string]: number }>({});

  // Fetch episodes for stats
  const episodesQuery = React.useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "episodes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: episodes, loading: loadingEpisodes } = useCollection(episodesQuery);

  useEffect(() => {
    const saved = localStorage.getItem("crisis_cooldowns");
    if (saved) {
      setCooldowns(JSON.parse(saved));
    }
  }, []);

  const signals = [
    { id: "green", label: "Feeling Stable", color: "bg-[#14b8a6]" },
    { id: "orange", label: "Feeling Sensitive", color: "bg-[#f97316]" },
    { id: "red", label: "In Crisis / Need Space", color: "bg-[#ef4444]" },
  ];

  const handleSignalChange = (newSignal: string) => {
    const oldSignal = signal;
    setSignal(newSignal);

    if (newSignal !== "green" && oldSignal === "green") {
      toast({
        title: "Crisis Plan Activated",
        description: `Your signal is now ${newSignal === 'orange' ? 'Sensitive' : 'Crisis'}. Your safety techniques are ready.`,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-white/20 bg-white/10 text-white"
            onClick={() => router.push("/crisis")}
          >
            View Plan
          </Button>
        ),
        className: "bg-[#ef4444] text-white border-none",
      });
    }
  };

  const handleCrisisAlert = (id: string, label: string) => {
    const now = Date.now();
    const lastActive = cooldowns[id] || 0;
    const thirtyMinutes = 30 * 60 * 1000;

    if (now - lastActive < thirtyMinutes) {
      const remaining = Math.ceil((thirtyMinutes - (now - lastActive)) / (60 * 1000));
      toast({
        title: "Button on Cooldown",
        description: `You can send another ${label} alert in ${remaining} minutes.`,
        variant: "destructive",
      });
      return;
    }

    const newCooldowns = { ...cooldowns, [id]: now };
    setCooldowns(newCooldowns);
    localStorage.setItem("crisis_cooldowns", JSON.stringify(newCooldowns));

    toast({
      title: "Alert Sent to Partner",
      description: `Your partner has been notified: "${label}"`,
      className: "bg-[#14b8a6] text-white border-none font-bold",
    });
  };

  const alertPills = [
    { id: "crisis", label: "BADLY TRIGGERED", color: "bg-[#f97316]", icon: <ShieldAlert className="h-4 w-4" /> },
    { id: "safeword", label: "SAFE WORD", color: "bg-[#ef4444]", icon: <AlertCircle className="h-4 w-4" /> },
    { id: "overwhelmed", label: "FEELING OVERWHELMED", color: "bg-[#3b82f6]", icon: <Zap className="h-4 w-4" /> },
  ];

  const activeSignal = signals.find((s) => s.id === signal);

  // Calculate Average Intensity (Baseline)
  const avgIntensity = episodes?.length 
    ? (episodes.reduce((acc, ep) => acc + (ep.intensity || 0), 0) / episodes.length).toFixed(1)
    : "0.0";

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-24 space-y-6">
        <div className="pt-4">
          <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">Good morning, {user?.displayName || "Alex"}</h2>
          <p className="text-gray-500 text-sm font-medium">How's your signal today?</p>
        </div>

        {/* Signal Selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-1.5 bg-[#1f2937] rounded-full border border-[#374151] shadow-inner">
            {signals.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSignalChange(s.id)}
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

        {/* Crisis Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {alertPills.map((pill) => (
            <Button
              key={pill.id}
              onClick={() => handleCrisisAlert(pill.id, pill.label)}
              className={cn(
                "h-20 rounded-3xl border-none text-white font-bold flex flex-col gap-1 items-center justify-center transition-transform active:scale-95 shadow-xl px-2 text-center",
                pill.color,
                signal !== 'green' && pill.id === 'crisis' && "ring-4 ring-white/20 animate-pulse"
              )}
            >
              {pill.icon}
              <span className="text-[9px] uppercase tracking-tighter leading-tight">{pill.label}</span>
            </Button>
          ))}
        </div>

        {/* Emotional Baseline Score Card */}
        <Card className="bg-[#1f2937] border-[#374151] rounded-[2.5rem] p-8 overflow-hidden relative shadow-2xl">
          <div className="absolute -top-6 -right-6 p-8 opacity-5">
            <Sparkles className="h-48 w-48 text-white" />
          </div>
          <CardContent className="p-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] mb-4">Emotional Baseline</p>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-white tracking-tighter">
                {loadingEpisodes ? "--" : avgIntensity}
              </span>
              <span className="text-gray-400 text-xl font-medium">/ 10</span>
            </div>
            <p className="text-gray-400 text-sm mt-5 leading-relaxed font-medium">
              Average pulse intensity based on your recent check-ins.
            </p>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#1f2937] border-[#374151] rounded-[2rem] p-6 shadow-xl border-l-4 border-l-[#a855f7]">
            <div className="p-2.5 bg-[#7c3aed]/10 w-fit rounded-2xl mb-4">
              <History className="h-5 w-5 text-[#a855f7]" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Recent Entries</p>
            <p className="text-2xl font-black text-white">{episodes?.length || 0}</p>
          </Card>
          <Card className="bg-[#1f2937] border-[#374151] rounded-[2rem] p-6 shadow-xl border-l-4 border-l-[#14b8a6]">
            <div className="p-2.5 bg-[#14b8a6]/10 w-fit rounded-2xl mb-4">
              <Brain className="h-5 w-5 text-[#14b8a6]" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Cycle Status</p>
            <p className="text-2xl font-black text-white">{episodes && episodes.length > 0 ? "Tracking" : "Idle"}</p>
          </Card>
        </div>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}
