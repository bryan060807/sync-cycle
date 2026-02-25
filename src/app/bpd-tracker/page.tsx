"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { 
  Heart, 
  Plus, 
  BrainCircuit, 
  MessageSquare, 
  AlertCircle,
  TrendingUp,
  History,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";

export default function BpdTracker() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLogging, setIsLogging] = useState(false);
  const [intensity, setIntensity] = useState([5]);
  const [trigger, setTrigger] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const episodesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "episodes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: episodes, isLoading } = useCollection(episodesQuery);

  const handleLogEpisode = async () => {
    if (!db || !user) return;
    setIsSaving(true);
    
    const data = {
      intensity: intensity[0],
      trigger,
      notes,
      userId: user.uid,
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, "episodes"), data)
      .then(() => {
        setTrigger("");
        setNotes("");
        setIntensity([5]);
        setIsLogging(false);
        toast({ title: "Episode logged", description: "Your emotional pulse has been saved." });
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

  const avgIntensity = episodes?.length 
    ? (episodes.reduce((acc, ep) => acc + (ep.intensity || 0), 0) / episodes.length).toFixed(1)
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <header className="px-6 pt-8 pb-6 bg-gradient-to-b from-red-500/5 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          <h1 className="text-2xl font-bold font-headline">Emotional Pulse</h1>
        </div>
        <p className="text-sm text-muted-foreground">Track your mood cycles and coping strategies.</p>
      </header>

      <div className="px-6 space-y-6 pb-24">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#1f2937] border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Intensity</p>
              <h3 className="text-2xl font-bold text-red-500">{avgIntensity}</h3>
            </CardContent>
          </Card>
          <Card className="bg-[#1f2937] border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Logs</p>
              <h3 className="text-2xl font-bold text-primary">{episodes?.length || 0}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <Dialog open={isLogging} onOpenChange={setIsLogging}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 bg-red-500 hover:bg-red-600 rounded-2xl shadow-lg shadow-red-500/20 gap-2 font-bold uppercase tracking-widest text-xs">
              <Plus className="h-5 w-5" /> Log New Episode
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-t-3xl sm:rounded-lg bg-[#1f2937] border-[#374151] text-white">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-tight font-black">How are you feeling?</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Intensity</label>
                  <Badge variant="outline" className="text-red-500 border-red-500/20">
                    {intensity[0]}/10
                  </Badge>
                </div>
                <Slider 
                  value={intensity} 
                  onValueChange={setIntensity} 
                  max={10} 
                  step={1} 
                  className="py-4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trigger</label>
                <Input 
                  placeholder="What happened?" 
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="bg-[#111827] border-[#374151] h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Notes</label>
                <Textarea 
                  placeholder="Additional context..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl h-24 resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleLogEpisode} disabled={isSaving} className="w-full bg-red-500 hover:bg-red-600 h-12 rounded-xl font-bold">
                {isSaving ? "Saving..." : "Save Log"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 uppercase tracking-widest text-gray-500">
            <History className="h-4 w-4" /> Recent Pulse
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Heart className="h-8 w-8 text-red-500 animate-pulse" />
            </div>
          ) : episodes?.map((episode) => (
            <Card key={episode.id} className="bg-[#1f2937] border-[#374151] rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={episode.intensity > 7 ? "bg-red-500" : "bg-orange-400"}>
                      Int: {episode.intensity}
                    </Badge>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                      {episode.createdAt?.toDate ? format(episode.createdAt.toDate(), "MMM dd, HH:mm") : "Just now"}
                    </span>
                  </div>
                </div>
                <p className="font-black text-sm text-white uppercase tracking-tight mb-1">{episode.trigger || "Untitled Episode"}</p>
                {episode.notes && (
                  <p className="text-xs text-gray-400 line-clamp-2 italic leading-relaxed">"{episode.notes}"</p>
                )}
              </CardContent>
            </Card>
          ))}
          {(!episodes || episodes.length === 0) && !isLoading && (
            <div className="text-center py-12 text-gray-700 bg-[#111827] rounded-[2rem] border border-dashed border-[#374151]">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No episodes logged yet</p>
            </div>
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  );
}