"use client";

import React from "react";
import { MobileNav } from "@/components/mobile-nav";
import { CheckCircle2, Circle, Clock, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AllTasks() {
  const allTasks = [
    { id: "1", title: "Design mobile wireframes", cycle: "Q1 Launch", status: "completed", date: "Today" },
    { id: "2", title: "User testing session", cycle: "Q1 Launch", status: "pending", date: "Tomorrow" },
    { id: "3", title: "Learn React Native", cycle: "Personal Growth", status: "pending", date: "Friday" },
    { id: "4", title: "Update README", cycle: "Q1 Launch", status: "pending", date: "Apr 2" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold font-headline mb-4">All Tasks</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-10 bg-white" placeholder="Search tasks..." />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="px-6 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h2>
          <Badge variant="outline" className="text-[10px]">4 Total</Badge>
        </div>

        {allTasks.map((task) => (
          <Card key={task.id} className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
              {task.status === "completed" ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
              <div className="flex-1">
                <h3 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                    {task.cycle}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {task.date}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <MobileNav activeTab="tasks" />
    </div>
  );
}