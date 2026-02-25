"use client";

import React, { useState, useEffect, use } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  ChevronRight,
  BrainCircuit,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { generateSubtasks } from "@/ai/flows/ai-subtask-generation";
import { aiTaskPrioritization } from "@/ai/flows/ai-task-prioritization-flow";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  notes?: string;
  priority?: number;
}

export default function CycleDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAiPrioritizing, setIsAiPrioritizing] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    // Initial mock data
    setTasks([
      { id: "101", description: "Design mobile wireframes", completed: true, dueDate: "2024-03-25" },
      { id: "102", description: "Implement authentication flow", completed: false, dueDate: "2024-03-28", notes: "Use Firebase Auth" },
      { id: "103", description: "Set up real-time database", completed: false, dueDate: "2024-03-30" },
      { id: "104", description: "Test push notifications", completed: false, dueDate: "2024-04-02" },
    ]);
  }, []);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      description: newTaskTitle,
      completed: false
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle("");
    setIsAddingTask(false);
    toast({ title: "Task added", description: "New task successfully created." });
  };

  const runAiPrioritization = async () => {
    setIsAiPrioritizing(true);
    try {
      const result = await aiTaskPrioritization({
        workspaceName: "Q1 Launch Plan",
        tasks: tasks.map(t => ({ id: t.id, description: t.description, dueDate: t.dueDate, notes: t.notes }))
      });

      const prioritizedIds = result.prioritizedTasks.map(t => t.id);
      const updatedTasks = [...tasks].sort((a, b) => {
        const indexA = prioritizedIds.indexOf(a.id);
        const indexB = prioritizedIds.indexOf(b.id);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
      
      setTasks(updatedTasks.map(t => {
        const aiInfo = result.prioritizedTasks.find(pt => pt.id === t.id);
        return aiInfo ? { ...t, priority: aiInfo.priority } : t;
      }));

      toast({
        title: "AI Prioritization Complete",
        description: "Your tasks have been reordered based on urgency and context."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Failed to prioritize tasks."
      });
    } finally {
      setIsAiPrioritizing(false);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-6 pt-6 pb-4 border-b">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold font-headline truncate flex-1">Q1 Launch Plan</h1>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Sparkles className="h-5 w-5 text-accent" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-muted-foreground">{completedCount} of {tasks.length} completed</span>
            <span className="font-bold text-primary">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </header>

      {/* Tools bar */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
        <Button 
          size="sm" 
          variant="secondary" 
          className="rounded-full bg-accent/10 text-accent border-none"
          onClick={runAiPrioritization}
          disabled={isAiPrioritizing}
        >
          {isAiPrioritizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
          AI Prioritize
        </Button>
        <Button size="sm" variant="outline" className="rounded-full">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Timeline
        </Button>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-none py-1">
          Active
        </Badge>
      </div>

      {/* Task List */}
      <div className="px-6 pb-24 space-y-4">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className={cn(
              "p-4 rounded-2xl bg-white border shadow-sm transition-all flex items-start gap-3",
              task.completed && "opacity-60 bg-muted/30"
            )}
          >
            <Checkbox 
              checked={task.completed} 
              onCheckedChange={() => toggleTask(task.id)}
              className="mt-1 h-5 w-5 rounded-full"
            />
            <div className="flex-1">
              <div className="flex justify-between items-start gap-2">
                <p className={cn(
                  "font-medium text-sm transition-all",
                  task.completed && "line-through text-muted-foreground"
                )}>
                  {task.description}
                </p>
                {task.priority && (
                  <Badge className="text-[9px] bg-accent/20 text-accent border-none h-4">
                    P{task.priority}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-2">
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{task.dueDate}</span>
                  </div>
                )}
                {task.notes && (
                  <div className="text-[10px] text-muted-foreground line-clamp-1 italic">
                    {task.notes}
                  </div>
                )}
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <TaskSubtasksDialog task={task} />
            </Dialog>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6">
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-t-3xl sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input 
                placeholder="What needs to be done?" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
              />
              <Textarea placeholder="Notes (optional)" className="h-20" />
            </div>
            <DialogFooter>
              <Button onClick={handleAddTask} className="w-full">Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <MobileNav activeTab="home" />
    </div>
  );
}

function TaskSubtasksDialog({ task }: { task: Task }) {
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateSubtasks = async () => {
    setIsGenerating(true);
    try {
      const result = await generateSubtasks({ taskDescription: task.description });
      setSubtasks(result.subtasks);
      toast({ title: "Subtasks generated", description: `Created ${result.subtasks.length} subtasks.` });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate subtasks." });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px] rounded-t-3xl sm:rounded-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {task.description}
        </DialogTitle>
      </DialogHeader>
      
      <div className="py-4 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold">Subtasks</h4>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-accent h-7 px-2"
            onClick={handleGenerateSubtasks}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Sparkles className="h-3 w-3 mr-2" />}
            AI Breakdown
          </Button>
        </div>

        {subtasks.length > 0 ? (
          <ul className="space-y-2">
            {subtasks.map((st, i) => (
              <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                <Circle className="h-3 w-3 text-muted-foreground" />
                {st}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No subtasks yet. Let AI help you break this down!
          </div>
        )}
      </div>

      <DialogFooter>
        <Button className="w-full">Done</Button>
      </DialogFooter>
    </DialogContent>
  );
}