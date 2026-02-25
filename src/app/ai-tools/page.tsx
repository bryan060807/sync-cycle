"use client";

import React from "react";
import { MobileNav } from "@/components/mobile-nav";
import { Sparkles, BrainCircuit, ListTree, Lightbulb, ArrowRight, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AiTools() {
  const tools = [
    {
      title: "Smart Prioritization",
      description: "Reorder tasks based on deadlines and context.",
      icon: <BrainCircuit className="h-6 w-6 text-accent" />,
      action: "Run Now"
    },
    {
      title: "Task Breakdown",
      description: "Automatically generate actionable subtasks.",
      icon: <ListTree className="h-6 w-6 text-primary" />,
      action: "Select Task"
    },
    {
      title: "Focus Suggestions",
      description: "AI identifies what you should work on next.",
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      action: "View Suggestions"
    },
    {
      title: "Workspace Insights",
      description: "Analyze your productivity trends and cycles.",
      icon: <Lightbulb className="h-6 w-6 text-orange-500" />,
      action: "Open Insights"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 pt-8 pb-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-headline">AI Assistant</h1>
        </div>
        <p className="text-sm text-muted-foreground">Supercharge your productivity with CycleSync AI.</p>
      </header>

      <div className="px-6 space-y-4 pb-24">
        {tools.map((tool, i) => (
          <Card key={i} className="hover:border-primary/50 transition-all active:scale-[0.98]">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              <div className="p-3 rounded-2xl bg-muted/50">
                {tool.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{tool.title}</CardTitle>
                <CardDescription className="text-xs">{tool.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex justify-end">
              <Button variant="ghost" size="sm" className="text-primary font-semibold">
                {tool.action} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-primary text-primary-foreground mt-6">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2">Did you know?</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              Users who use AI Prioritization complete their cycles 25% faster than average. Start optimizing today!
            </p>
          </CardContent>
        </Card>
      </div>

      <MobileNav activeTab="ai" />
    </div>
  );
}