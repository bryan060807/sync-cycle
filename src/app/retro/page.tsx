
"use client";

import React from "react";
import { MobileNav } from "@/components/mobile-nav";
import { 
  History, 
  TrendingUp, 
  Heart, 
  Target, 
  DollarSign,
  Sparkles,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { subDays } from "date-fns";

export default function RetroPage() {
  const { user } = useUser();
  const db = useFirestore();

  const lastWeek = useMemoFirebase(() => subDays(new Date(), 7), []);

  const episodesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "episodes"),
      where("userId", "==", user.uid),
      where("createdAt", ">=", lastWeek),
      orderBy("createdAt", "desc")
    );
  }, [db, user, lastWeek]);

  const { data: episodes } = useCollection(episodesQuery);

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-6 pt-8 pb-6 bg-gradient-to-b from-accent/5 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <History className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold font-headline">Weekly Retro</h1>
        </div>
        <p className="text-sm text-muted-foreground">Reflecting on the last 7 days.</p>
      </header>

      <div className="px-6 space-y-6 pb-24">
        <Card className="bg-accent text-accent-foreground border-none relative overflow-hidden">
          <Sparkles className="absolute right-4 top-4 h-12 w-12 opacity-10" />
          <CardContent className="pt-6">
            <h3 className="font-bold text-lg mb-1">Momentum Summary</h3>
            <p className="text-xs opacity-80 leading-relaxed">
              You've completed {completedGoals?.length || 0} goals and logged {episodes?.length || 0} emotional cycles this week.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Heart className="h-5 w-5 text-red-500 mb-2" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Pulse</p>
              <h4 className="text-xl font-bold">{avgIntensity}</h4>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Target className="h-5 w-5 text-primary mb-2" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Wins</p>
              <h4 className="text-xl font-bold">{completedGoals?.length || 0}</h4>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Detailed Insights</h3>
          
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <CardTitle className="text-sm">Growth Cycles</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Mood Stability</span>
                <Badge variant="outline" className="text-green-500 border-green-200">Improving</Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Goal Velocity</span>
                <span className="font-bold">+{completedGoals?.length || 0} this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm">Quick Advice</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "Small wins lead to big changes. You've shown consistency in tracking your cycles, which is the first step to mastering them."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileNav activeTab="home" />
    </div>
  );
}
