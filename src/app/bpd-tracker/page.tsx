
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
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy } from "firebase/firestore";
import { format } from "date-fns";

export default function BpdTracker() {
  const { user } = useUser();
  const db = useFirestore();
  const [isLogging, setIsLogging] = useState(false);
  const [intensity, setIntensity] = useState([5]);
  const [trigger, setTrigger] = useState("");
  const [notes, setNotes] = useState("");

  const episodesQuery = React.useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "episodes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: episodes, loading } = useCollection(episodesQuery);

  const handleLogEpisode = async () => {
    if (!db || !user) return;
    
    addDoc(collection(db, "episodes"), {
      intensity: intensity[0],
      trigger,
      notes,
      userId: user.uid,
      createdAt: serverTimestamp()
    });

    setTrigger("");
    setNotes("");
    setIntensity([5]);
    setIsLogging(false);
  };

  const avgIntensity = episodes?.length 
    ? (episodes.reduce((acc, ep) => acc + (ep.intensity || 0), 0) / episodes.length).toFixed(1)
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Intensity</p>
              <h3 className="text-2xl font-bold text-red-500">{avgIntensity}</h3>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Logs</p>
              <h3 className="text-2xl font-bold text-primary">{episodes?.length || 0}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <Dialog open={isLogging} onOpenChange={setIsLogging}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 bg-red-500 hover:bg-red-600 rounded-2xl shadow-lg shadow-red-500/20 gap-2">
              <Plus className="h-5 w-5" /> Log New Episode
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-t-3xl sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>How are you feeling?</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Intensity</label>
                  <Badge variant="outline" className="text-red-500 border-red-200">
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
                <label className="text-sm font-medium">Trigger</label>
                <Input 
                  placeholder="What happened?" 
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea 
                  placeholder="Additional context..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleLogEpisode} className="w-full bg-red-500 hover:bg-red-600">Save Log</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" /> Recent Pulse
          </h3>
          {episodes?.map((episode) => (
            <Card key={episode.id} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={episode.intensity > 7 ? "bg-red-500" : "bg-orange-400"}>
                      Int: {episode.intensity}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {episode.createdAt?.toDate ? format(episode.createdAt.toDate(), "MMM dd, h:mm a") : "Just now"}
                    </span>
                  </div>
                </div>
                <p className="font-medium text-sm mb-1">{episode.trigger}</p>
                {episode.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">"{episode.notes}"</p>
                )}
              </CardContent>
            </Card>
          ))}
          {(!episodes || episodes.length === 0) && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No episodes logged yet.</p>
            </div>
          )}
        </div>
      </div>

      <MobileNav activeTab="home" />
    </div>
  );
}
