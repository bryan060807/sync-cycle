"use client";

import React, { useState, useEffect } from "react";
import { Plus, LayoutGrid, Calendar as CalendarIcon, CheckCircle2, MoreVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/mobile-nav";
import Link from "next/link";

interface Cycle {
  id: string;
  name: string;
  description: string;
  progress: number;
  taskCount: number;
  completedCount: number;
}

export default function Dashboard() {
  const [cycles, setCycles] = useState<Cycle[]>([]);

  useEffect(() => {
    // Mock data for initial state
    setCycles([
      {
        id: "1",
        name: "Q1 Launch Plan",
        description: "Main objectives for the first quarter product launch.",
        progress: 65,
        taskCount: 12,
        completedCount: 8,
      },
      {
        id: "2",
        name: "Personal Growth",
        description: "Learning goals and habit tracking for this year.",
        progress: 30,
        taskCount: 5,
        completedCount: 1,
      }
    ]);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline text-foreground">My Cycles</h1>
          <p className="text-sm text-muted-foreground">You have 2 active workspaces</p>
        </div>
        <Button size="icon" variant="outline" className="rounded-full bg-white shadow-sm">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="px-6 space-y-6 flex-1 overflow-y-auto">
        {/* Quick Stats / Summary Card */}
        <Card className="bg-primary border-none text-primary-foreground overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10">
            <Sparkles className="h-24 w-24 translate-x-4 -translate-y-4" />
          </div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm opacity-80 mb-1">Total Progress</p>
                <h2 className="text-3xl font-bold">58%</h2>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-none">
                On Track
              </Badge>
            </div>
            <Progress value={58} className="bg-white/20" />
            <p className="text-xs mt-4 opacity-70">
              9/17 tasks completed across all cycles
            </p>
          </CardContent>
        </Card>

        {/* Cycles List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Recent Workspaces
            </h3>
            <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80 font-medium">
              View All
            </Button>
          </div>

          {cycles.map((cycle) => (
            <Link key={cycle.id} href={`/cycles/${cycle.id}`} className="block transition-transform active:scale-[0.98]">
              <Card className="hover:border-primary/50 transition-colors shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{cycle.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {cycle.completedCount}/{cycle.taskCount}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-1">{cycle.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Progress value={cycle.progress} className="h-2" />
                    <span className="text-xs font-medium text-muted-foreground w-8">
                      {cycle.progress}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          <Button 
            className="w-full h-14 border-dashed border-2 hover:bg-muted/50 text-muted-foreground" 
            variant="outline"
          >
            <Plus className="mr-2 h-5 w-5" /> Create New Cycle
          </Button>
        </div>
      </div>

      <MobileNav activeTab="home" />
    </div>
  );
}