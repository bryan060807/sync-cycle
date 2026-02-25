"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, BrainCircuit, ShieldCheck, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { analyzeWellnessEpisode, type WellnessAnalysisOutput } from "@/ai/flows/wellness-analysis-flow";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function WellnessTracker() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [intensity, setIntensity] = useState([5]);
  const [trigger, setTrigger] = useState("");
  const [notes, setNotes] = useState("");
  const [isAnonymized, setIsAnonymized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [aiAnalysis, setAiAnalysis] = useState<WellnessAnalysisOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const recentEpisodesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "episodes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(7)
    );
  }, [db, user]);

  const { data: episodes } = useCollection(recentEpisodesQuery);

  const chartData = React.useMemo(() => {
    if (!episodes) return [];
    return [...episodes].reverse().map((ep: any) => ({
      name: ep.createdAt?.toDate ? ep.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'short' }) : "...",
      score: ep.intensity || 0,
    }));
  }, [episodes]);

  const handleAiAnalyze = async () => {
    if (!notes.trim()) {
      toast({ title: "Needs Context", description: "Add some notes first for AI to analyze." });
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeWellnessEpisode({ 
        notes: notes.trim(), 
        intensity: intensity[0] 
      });
      setAiAnalysis(result);
      if (result.suggestedTriggers.length > 0) {
        setTrigger(prev => prev || result.suggestedTriggers[0]);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to analyze episode." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogSession = async () => {
    if (!db || !user) return;
    setIsSaving(true);

    const data = {
      intensity: intensity[0],
      trigger: trigger.trim(),
      notes: notes.trim(),
      userId: user.uid,
      createdAt: serverTimestamp(),
      isAnonymized,
      aiInsights: aiAnalysis || null,
    };

    addDoc(collection(db, "episodes"), data)
      .then(() => {
        setIntensity([5]);
        setTrigger("");
        setNotes("");
        setIsAnonymized(false);
        setAiAnalysis(null);
        toast({ title: "Logged", description: "Your check-in has been saved." });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "episodes",
          operation: "create",
          requestResourceData: data,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-32 space-y-6">
        <div className="pt-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">Emotional Check-in</h2>
          <Button variant="ghost" className="text-[#a855f7] font-bold text-xs uppercase tracking-widest">History</Button>
        </div>

        <Card className="bg-[#1f2937] border-[#374151] rounded-3xl p-2 pt-6 shadow-xl">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length > 0 ? chartData : [{ name: "", score: 0 }]}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={1500}
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6b7280', fontSize: 10, fontWeight: 'bold'}} 
                />
                <YAxis hide domain={[0, 10]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6 pt-2">
          <div className="space-y-4 bg-[#1f2937] p-6 rounded-3xl border border-[#374151] shadow-2xl">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-white uppercase tracking-wider">Intensity</label>
                <span className="text-[#14b8a6] font-black text-lg">{intensity[0]}/10</span>
              </div>
              <Slider 
                value={intensity} 
                onValueChange={setIntensity} 
                max={10} 
                min={1}
                step={1} 
                className="py-2"
              />
              <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">
                <span>Calm</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Notes</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleAiAnalyze}
                    disabled={isAnalyzing || !notes.trim()}
                    className="h-6 text-primary gap-1 px-2 hover:bg-primary/10"
                  >
                    {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI Analyze
                  </Button>
                </div>
                <Textarea 
                  placeholder="How are you feeling? What do you need?" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-2xl h-32 resize-none text-white placeholder:text-gray-600 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              {aiAnalysis && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black text-primary uppercase tracking-widest">AI Insights</span>
                  </div>
                  <p className="text-xs text-gray-300 italic">"{aiAnalysis.insight}"</p>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.copingStrategies.map((s, i) => (
                      <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] uppercase">
                        <ShieldCheck className="h-3 w-3 mr-1" /> {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trigger (Optional)</label>
                <Input 
                  placeholder="What triggered this?" 
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-2xl h-12 text-white placeholder:text-gray-600 focus:ring-purple-500" 
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3 py-2">
              <Checkbox 
                id="anon" 
                checked={isAnonymized}
                onCheckedChange={(checked) => setIsAnonymized(!!checked)}
                className="border-[#374151] h-5 w-5 rounded-md data-[state=checked]:bg-[#14b8a6]" 
              />
              <label htmlFor="anon" className="text-xs text-gray-400 font-medium">Anonymize for global research</label>
            </div>

            <Button 
              onClick={handleLogSession}
              disabled={isSaving}
              className="w-full btn-gradient h-14 shadow-lg shadow-purple-600/20"
            >
              {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : "Log Check-in"}
            </Button>
          </div>
        </div>
      </main>

      <MobileNav activeTab="wellness" />
    </div>
  );
}
