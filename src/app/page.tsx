"use client";

import React, { useState, useEffect } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Sparkles, AlertCircle, Zap, ShieldAlert, History, TrendingUp, Heart, BrainCircuit, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Use a stable ID for the prototype if not logged in
  const userId = user?.uid || "guest_user";
  const displayName = user?.displayName || user?.email?.split('@')[0] || "Guest";

  // Fetch user profile for signal state
  const userProfileRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "users", userId);
  }, [db, userId]);
  const { data: userProfile } = useDoc(userProfileRef);

  // Initialize profile if it doesn't exist
  useEffect(() => {
    if (db && !userProfile) {
      const userRef = doc(db, "users", userId);
      setDoc(userRef, {
        id: userId,
        username: displayName,
        currentSignal: "green",
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
  }, [db, userId, userProfile, displayName]);

  const signal = userProfile?.currentSignal || "green";

  const episodesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "episodes"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(5)
    );
  }, [db, userId]);

  const { data: episodes, isLoading: loadingEpisodes } = useCollection(episodesQuery);

  const winsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "gratitude"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
  }, [db, userId]);

  const { data: recentWins, isLoading: loadingWins } = useCollection(winsQuery);

  const signals = [
    { id: "green", label: "Feeling Stable", color: "bg-[#14b8a6]" },
    { id: "orange", label: "Feeling Sensitive", color: "bg-[#f97316]" },
    { id: "red", label: "In Crisis / Need Space", color: "bg-[#ef4444]" },
  ];

  const handleSignalChange = (newSignal: string) => {
    if (!db) return;
    const oldSignal = signal;
    
    const userRef = doc(db, "users", userId);
    updateDoc(userRef, { 
      currentSignal: newSignal,
      updatedAt: serverTimestamp() 
    }).then(() => {
      if (newSignal !== "green" && oldSignal === "green") {
        toast({
          title: "Crisis Plan Activated",
          description: `Your signal is now ${newSignal === 'orange' ? 'Sensitive' : 'Crisis'}.`,
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
    });
  };

  const handleCrisisAlert = (label: string) => {
    toast({
      title: "Alert Simulated",
      description: `In a real scenario, your partner would be notified: "${label}"`,
      className: "bg-[#14b8a6] text-white border-none font-bold",
    });
  };

  const alertPills = [
    { id: "crisis", label: "BADLY TRIGGERED", color: "bg-[#f97316]", icon: <ShieldAlert className="h-4 w-4" /> },
    { id: "safeword", label: "SAFE WORD", color: "bg-[#ef4444]", icon: <AlertCircle className="h-4 w-4" /> },
    { id: "overwhelmed", label: "FEELING OVERWHELMED", color: "bg-[#3b82f6]", icon: <Zap className="h-4 w-4" /> },
  ];

  const activeSignal = signals.find((s) => s.id === signal);
  const avgIntensity = episodes?.length 
    ? (episodes.reduce((acc, ep) => acc + (ep.intensity || 0), 0) / episodes.length).toFixed(1)
    : "0.0";

  const latestWin = recentWins?.[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-32 space-y-6">
        <div className="pt-4 text-left">
          <h2 className="text-3xl font-black text-white mb-1 tracking-tighter uppercase leading-none">
            Welcome, {displayName}
          </h2>
          <p className="text-gray-500 text-sm font-black uppercase tracking-widest mt-2">Emotional Status</p>
        </div>

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

        <div className="grid grid-cols-3 gap-3">
          {alertPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => handleCrisisAlert(pill.label)}
              className={cn(
                "h-20 rounded-3xl border-none text-white font-bold flex flex-col gap-1 items-center justify-center transition-transform active:scale-95 shadow-xl px-2 text-center",
                pill.color,
                signal !== 'green' && pill.id === 'crisis' && "ring-4 ring-white/20 animate-pulse"
              )}
            >
              {pill.icon}
              <span className="text-[9px] uppercase tracking-tighter leading-tight">{pill.label}</span>
            </button>
          ))}
        </div>

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
          </CardContent>
        </Card>

        <Card 
          className="bg-[#1f2937] border-[#374151] rounded-[2rem] p-6 shadow-xl active:scale-[0.98] transition-transform cursor-pointer"
          onClick={() => router.push("/gratitude")}
        >
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-500/10 rounded-xl">
                  <Heart className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recent Wins</p>
              </div>
              <TrendingUp className="h-4 w-4 text-gray-700" />
            </div>
            {loadingWins ? (
              <p className="text-gray-600 text-sm animate-pulse">Fetching latest wins...</p>
            ) : latestWin ? (
              <p className="text-white text-sm font-medium leading-relaxed italic line-clamp-2">
                "{latestWin.text}"
              </p>
            ) : (
              <p className="text-gray-500 text-sm italic">No wins logged recently.</p>
            )}
          </CardContent>
        </Card>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}