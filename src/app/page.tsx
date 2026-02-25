
"use client";

import React from "react";
import { 
  Plus, 
  Sparkles, 
  Heart, 
  Target, 
  ListChecks, 
  TrendingUp, 
  ArrowRight,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/mobile-nav";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();

  const episodesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "episodes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );
  }, [db, user]);

  const goalsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "goals"),
      where("userId", "==", user.uid),
      orderBy("progress", "desc"),
      limit(2)
    );
  }, [db, user]);

  const { data: recentEpisodes } = useCollection(episodesQuery);
  const { data: activeGoals } = useCollection(goalsQuery);

  const quickLinks = [
    { label: "BPD Pulse", icon: <Heart className="h-5 w-5 text-red-500" />, href: "/bpd-tracker" },
    { label: "Goals", icon: <Target className="h-5 w-5 text-primary" />, href: "/goals" },
    { label: "Retro", icon: <TrendingUp className="h-5 w-5 text-accent" />, href: "/retro" },
    { label: "Lists", icon: <ListChecks className="h-5 w-5 text-orange-500" />, href: "/lists" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-6 pt-8 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline text-foreground">SyncCycle</h1>
          <p className="text-xs text-muted-foreground">Welcome back, {user?.displayName || "friend"}</p>
        </div>
        <Link href="/settings">
          <Button size="icon" variant="ghost" className="rounded-full">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      <div className="px-6 space-y-6 flex-1 overflow-y-auto pb-24">
        <Card className="bg-primary border-none text-primary-foreground overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10">
            <Sparkles className="h-24 w-24 translate-x-4 -translate-y-4" />
          </div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs opacity-80 mb-1">Weekly Pulse Score</p>
                <h2 className="text-3xl font-bold">7.2</h2>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-none">
                Steady
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] opacity-70">
                <span>Goal Progress</span>
                <span>65%</span>
              </div>
              <Progress value={65} className="bg-white/20 h-1" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:border-primary/50 transition-all active:scale-[0.98] border-none shadow-sm">
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className="p-2 rounded-xl bg-muted/50">
                    {link.icon}
                  </div>
                  <span className="text-xs font-semibold">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" /> Recent Pulse
            </h3>
            <Link href="/bpd-tracker" className="text-[10px] text-primary font-bold">VIEW ALL</Link>
          </div>
          {recentEpisodes?.[0] ? (
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-[10px] border-red-200 text-red-500">
                    Intensity: {recentEpisodes[0].intensity}/10
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {recentEpisodes[0].createdAt?.toDate ? format(recentEpisodes[0].createdAt.toDate(), "h:mm a") : "Just now"}
                  </span>
                </div>
                <p className="text-sm font-medium line-clamp-1">{recentEpisodes[0].trigger}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-6 bg-muted/20 rounded-2xl border-2 border-dashed">
              <p className="text-[10px] text-muted-foreground">No pulses logged today</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Active Goals
            </h3>
            <Link href="/goals" className="text-[10px] text-primary font-bold">MANAGE</Link>
          </div>
          {activeGoals?.map((goal) => (
            <Card key={goal.id} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{goal.title}</span>
                  <span className="text-xs font-bold text-primary">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <MobileNav activeTab="home" />
    </div>
  );
}
