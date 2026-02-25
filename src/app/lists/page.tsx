
"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { 
  ListChecks, 
  Plus, 
  Trash2, 
  MoreVertical, 
  CheckCircle2, 
  Circle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from "firebase/firestore";

export default function ListsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [newListName, setNewListName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const listsQuery = React.useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "lists"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: lists, loading } = useCollection(listsQuery);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !newListName.trim()) return;

    setIsAdding(true);
    addDoc(collection(db, "lists"), {
      name: newListName.trim(),
      userId: user.uid,
      items: [],
      createdAt: serverTimestamp()
    });
    setNewListName("");
    setIsAdding(false);
  };

  const handleDeleteList = async (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, "lists", id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-6 pt-8 pb-6 bg-gradient-to-b from-orange-500/5 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold font-headline">Collections</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage shared and personal task lists.</p>
      </header>

      <div className="px-6 space-y-6 pb-24">
        {/* Create List Form */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <form onSubmit={handleCreateList} className="flex p-2 gap-2">
            <Input 
              placeholder="e.g., Weekend Chores" 
              className="border-none shadow-none focus-visible:ring-0 bg-transparent"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
            <Button 
              type="submit" 
              size="sm" 
              className="bg-orange-500 hover:bg-orange-600 rounded-xl px-6"
              disabled={isAdding || !newListName.trim()}
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </form>
        </Card>

        {/* Lists Grid */}
        <div className="grid gap-4">
          {lists?.map((list) => (
            <Card key={list.id} className="border-none shadow-sm group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                    <ListChecks className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{list.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{list.items?.length || 0} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteList(list.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!lists || lists.length === 0) && !loading && (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <p className="text-xs text-muted-foreground">Your collections are empty.</p>
            </div>
          )}
        </div>
      </div>

      <MobileNav activeTab="home" />
    </div>
  );
}
