"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Plus, Target, Users, MoreHorizontal, CheckCircle, Trash2, Loader2, Edit2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { cn } from "@/lib/utils";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";

export default function Goals() {
  const { user, loading: isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [tab, setTab] = useState("personal");
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New goal form state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [isShared, setIsShared] = useState(false);

  const goalsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "goals"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: goals, isLoading: loading } = useCollection(goalsQuery);

  const filteredGoals = goals?.filter(g => 
    tab === "shared" ? g.shared === true : g.shared !== true
  ) || [];

  const handleCreateGoal = async () => {
    if (!db || !user || !newTitle.trim()) return;
    setIsSaving(true);

    const goalData = {
      userId: user.uid,
      title: newTitle.trim(),
      category: newCategory,
      shared: isShared,
      progress: 0,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "goals"), goalData)
      .then(() => {
        setNewTitle("");
        setNewCategory("General");
        setIsShared(false);
        setIsAdding(false);
        toast({ title: "Goal set!", description: "Keep chasing your progress." });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "goals",
          operation: "create",
          requestResourceData: goalData,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => setIsSaving(false));
  };

  const handleDeleteGoal = (id: string) => {
    if (!db) return;
    const goalRef = doc(db, "goals", id);
    deleteDoc(goalRef)
      .then(() => {
        toast({ title: "Goal removed" });
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: goalRef.path,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      });
  };

  const handleUpdateProgress = (id: string, currentProgress: number, increment: number) => {
    if (!db) return;
    const newProgress = Math.max(0, Math.min(100, currentProgress + increment));
    const goalRef = doc(db, "goals", id);
    updateDoc(goalRef, { progress: newProgress })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: goalRef.path,
          operation: "update",
          requestResourceData: { progress: newProgress },
        });
        errorEmitter.emit("permission-error", permissionError);
      });
  };

  const handleSignIn = () => {
    signInAnonymously(auth);
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0f1117] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0f1117]">
        <MobileHeader />
        <main className="flex-1 px-4 pt-20 flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-gray-500" />
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Login Required</h2>
          <p className="text-gray-500 text-sm max-w-xs">
            You need to be signed in to manage your personal and shared goals.
          </p>
          <Button onClick={handleSignIn} className="btn-gradient w-full max-w-xs h-12 rounded-xl">
            Enter Anonymously
          </Button>
        </main>
        <MobileNav activeTab="home" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-24 space-y-6">
        <div className="pt-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Goals</h2>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="btn-gradient h-10 px-4">
                <Plus className="h-4 w-4 mr-2" /> New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1f2937] border-[#374151] text-white rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-white font-black uppercase tracking-tight">Set New Objective</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Goal Title</Label>
                  <Input 
                    placeholder="e.g. Daily Meditation" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-[#111827] border-[#374151] h-12 rounded-xl text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</Label>
                  <Input 
                    placeholder="e.g. Health, Finance, Growth" 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bg-[#111827] border-[#374151] h-12 rounded-xl text-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="shared" 
                    checked={isShared} 
                    onChange={(e) => setIsShared(e.target.checked)}
                    className="h-4 w-4 accent-primary" 
                  />
                  <Label htmlFor="shared" className="text-xs text-gray-300">Share this goal with my partner</Label>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreateGoal} 
                  disabled={isSaving || !newTitle.trim()}
                  className="w-full btn-gradient h-12 rounded-xl"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Goal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pill Toggle */}
        <div className="flex p-1 bg-[#1f2937] rounded-full border border-[#374151]">
          <button
            onClick={() => setTab("personal")}
            className={cn(
              "flex-1 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-widest",
              tab === "personal" ? "bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20" : "text-gray-500"
            )}
          >
            Personal
          </button>
          <button
            onClick={() => setTab("shared")}
            className={cn(
              "flex-1 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-widest",
              tab === "shared" ? "bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20" : "text-gray-500"
            )}
          >
            Shared
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredGoals.map((goal: any) => (
            <Card key={goal.id} className="bg-[#1f2937] border-[#374151] rounded-3xl p-6 shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white uppercase tracking-tight">{goal.title}</h3>
                      {goal.shared && <Users className="h-3 w-3 text-[#a855f7]" />}
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{goal.category}</p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1f2937] border-[#374151] text-white">
                      <DropdownMenuItem 
                        className="text-red-500 focus:text-red-500 focus:bg-red-500/10 gap-2 cursor-pointer"
                        onSelect={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete Goal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-[#a855f7]">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-1.5 bg-[#111827]" />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleUpdateProgress(goal.id, goal.progress, -10)}
                    className="flex-1 bg-[#111827] text-[10px] font-black uppercase tracking-widest rounded-xl h-9 hover:bg-[#252f3f] text-gray-400"
                  >
                    -10%
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleUpdateProgress(goal.id, goal.progress, 10)}
                    className="flex-1 bg-[#111827] text-[10px] font-black uppercase tracking-widest rounded-xl h-9 hover:bg-[#252f3f] text-primary"
                  >
                    +10%
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleUpdateProgress(goal.id, 0, 100)}
                    className={cn(
                      "h-9 w-9 rounded-xl transition-all",
                      goal.progress >= 100 ? "bg-green-500 text-white" : "bg-[#14b8a6]/10 text-[#14b8a6]"
                    )}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {!loading && filteredGoals.length === 0 && (
            <div className="text-center py-20 bg-[#111827] rounded-[2.5rem] border border-dashed border-[#374151]">
              <Target className="h-12 w-12 text-gray-800 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">No goals yet</p>
              <p className="text-[10px] text-gray-700 mt-1 uppercase">Start manifesting your progress</p>
            </div>
          )}
        </div>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}