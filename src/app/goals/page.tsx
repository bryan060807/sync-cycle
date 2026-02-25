
"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { 
  Target, 
  Plus, 
  Calendar, 
  ChevronRight, 
  Users, 
  User as UserIcon,
  Trophy,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, updateDoc, doc, query, where, orderBy } from "firebase/firestore";

export default function GoalsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "personal",
    isMutual: false,
    progress: 0
  });

  const goalsQuery = React.useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "goals"),
      where("userId", "==", user.uid),
      orderBy("progress", "asc")
    );
  }, [db, user]);

  const { data: goals } = useCollection(goalsQuery);

  const handleCreateGoal = async () => {
    if (!db || !user) return;
    addDoc(collection(db, "goals"), {
      ...newGoal,
      userId: user.uid,
      createdAt: new Date().toISOString()
    });
    setNewGoal({ title: "", description: "", category: "personal", isMutual: false, progress: 0 });
    setIsAddingGoal(false);
  };

  const updateProgress = async (goalId: string, current: number, amount: number) => {
    if (!db) return;
    const newProgress = Math.max(0, Math.min(100, current + amount));
    updateDoc(doc(db, "goals", goalId), { progress: newProgress });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-6 pt-8 pb-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-headline">SyncGoals</h1>
          </div>
          <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" className="rounded-full h-10 w-10">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Set New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input 
                  placeholder="Goal Title" 
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                />
                <Textarea 
                  placeholder="Why is this important?" 
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mutual/Couple Goal</span>
                  <Switch 
                    checked={newGoal.isMutual}
                    onCheckedChange={(checked) => setNewGoal({...newGoal, isMutual: checked})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGoal} className="w-full">Activate Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">Dream, plan, and achieve together.</p>
      </header>

      <div className="px-6 space-y-4 pb-24">
        {goals?.map((goal) => (
          <Card key={goal.id} className="border-none shadow-sm overflow-hidden group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                    {goal.isMutual ? (
                      <Users className="h-3 w-3 text-accent" />
                    ) : (
                      <UserIcon className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription className="text-xs line-clamp-1">{goal.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                  {goal.progress}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={goal.progress} className="h-1.5" />
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 text-[10px] h-8"
                    onClick={() => updateProgress(goal.id, goal.progress, -10)}
                  >
                    -10%
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 text-[10px] h-8"
                    onClick={() => updateProgress(goal.id, goal.progress, 10)}
                  >
                    +10%
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!goals || goals.length === 0) && (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
            <Trophy className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-bold text-muted-foreground">No goals set yet</h3>
            <p className="text-xs text-muted-foreground/60 px-10">Start your journey by adding your first personal or shared goal.</p>
          </div>
        )}
      </div>

      <MobileNav activeTab="home" />
    </div>
  );
}
