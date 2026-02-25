"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { 
  History, 
  TrendingUp, 
  Heart, 
  Target, 
  Sparkles,
  Info,
  BrainCircuit,
  Loader2,
  ShieldCheck,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { subDays } from "date-fns";
import { generateWeeklyRetroAI, type WeeklyRetroOutput } from "@/ai/flows/aggregate-insights-flow";
import { Progress } from "@/components/ui/progress";

export default function RetroPage() {
  const { user } = useUser();
  const db = useFirestore();

  const [aiRetro, setAiRetro] = useState<WeeklyRetroOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const lastWeek = useMemoFirebase(() => subDays(new Date(), 7), []);

  const episodesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "episodes"),
      where("userId", "==", user.uid),
      where("createdAt", ">=", lastWeek),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user, lastWeek]);

  const { data: episodes, isLoading: loadingEpisodes } = useCollection(episodesQuery);

  const goalsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "goals"),
      where("userId", "==", user.uid),
      where("progress", "==", 100)
    );
  }, [db, user]);

  const { data: completedGoals } = useCollection(goalsQuery);

  const avgIntensity = episodes?.length 
    ? (episodes.reduce((acc, ep) => acc + (ep.intensity || 0), 0) / episodes.length).toFixed(1)
    : 0;

  const handleGenerateAiRetro = async () => {
    if (!episodes || episodes.length === 0) return;
    setIsGenerating(true);
    try {
      const result = await generateWeeklyRetroAI({
        episodes: episodes.map(e => ({
          intensity: e.intensity,
          trigger: e.trigger,
          notes: e.notes,
        }))
      });
      setAiRetro(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-32 space-y-6">
        <header className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Weekly Retro</h1>
          </div>
          <p className="text-sm text-gray-500">Reflecting on the last 7 days.</p>
        </header>

        <Card className="bg-primary/10 border-primary/20 rounded-[2rem] p-6 relative overflow-hidden shadow-xl">
          <Sparkles className="absolute right-4 top-4 h-12 w-12 text-primary opacity-20" />
          <CardContent className="p-0 space-y-4">
            <h3 className="font-black text-white uppercase tracking-tight">AI Momentum Summary</h3>
            {aiRetro ? (
              <div className="space-y-4 animate-in fade-in duration-700">
                <p className="text-xs text-gray-300 leading-relaxed italic">"{aiRetro.weeklySummary}"</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                    <span>Weekly Growth</span>
                    <span>{aiRetro.growthScore}%</span>
                  </div>
                  <Progress value={aiRetro.growthScore} className="h-1.5 bg-black/20" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">
                  Review your weekly emotional logs, triggers, and growth patterns with AI analysis.
                </p>
                <Button 
                  onClick={handleAiRetro}
                  disabled={isGenerating || !episodes?.length}
                  className="w-full btn-gradient h-12 gap-2"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                  Generate Weekly Insights
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#1f2937] border-[#374151] rounded-3xl p-4 shadow-xl">
            <CardContent className="p-0 flex flex-col items-center text-center gap-1">
              <Heart className="h-5 w-5 text-red-500" />
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Avg Pulse</p>
              <h4 className="text-2xl font-black text-white">{loadingEpisodes ? "--" : avgIntensity}</h4>
            </CardContent>
          </Card>
          <Card className="bg-[#1f2937] border-[#374151] rounded-3xl p-4 shadow-xl">
            <CardContent className="p-0 flex flex-col items-center text-center gap-1">
              <Target className="h-5 w-5 text-primary" />
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Wins</p>
              <h4 className="text-2xl font-black text-white">{completedGoals?.length || 0}</h4>
            </CardContent>
          </Card>
        </div>

        {aiRetro && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] px-2">Identified Patterns</h3>
            <div className="grid gap-3">
              {aiRetro.identifiedPatterns.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-[#1f2937] border border-[#374151] rounded-2xl">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-gray-200">{p}</span>
                </div>
              ))}
            </div>
            
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] px-2 mt-6">Next Step Advice</h3>
            <Card className="bg-[#1f2937] border-[#374151] rounded-3xl p-6">
              <div className="flex gap-4">
                <div className="p-3 bg-teal-500/10 rounded-2xl h-fit">
                  <ShieldCheck className="h-6 w-6 text-teal-500" />
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  {aiRetro.advice}
                </p>
              </div>
            </Card>
          </div>
        )}

        {!aiRetro && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-white">Recent Activity</h3>
            {episodes?.slice(0, 3).map((ep) => (
              <Card key={ep.id} className="bg-[#1f2937] border-[#374151] rounded-3xl p-4">
                <div className="flex justify-between items-center">
                  <Badge className={ep.intensity > 7 ? "bg-red-500" : "bg-primary"}>
                    Int: {ep.intensity}
                  </Badge>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">
                    {ep.createdAt?.toDate ? ep.createdAt.toDate().toLocaleDateString() : "Just now"}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-2 font-medium line-clamp-1">{ep.trigger || "No trigger logged"}</p>
              </Card>
            ))}
          </div>
        )}
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}
