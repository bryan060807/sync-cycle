
"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { 
  ListChecks, 
  Plus, 
  Trash2, 
  ChevronRight,
  Loader2,
  ShoppingCart,
  CheckCircle2,
  Circle,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export default function ListsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [newListName, setNewListName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const listsQuery = useMemoFirebase(() => {
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
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-24 space-y-6">
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Collections</h2>
          <p className="text-gray-500 text-sm mt-1">Groceries, tasks, and shared lists.</p>
        </div>

        {/* Create List Form */}
        <Card className="bg-[#1f2937] border-[#374151] rounded-2xl overflow-hidden shadow-xl">
          <form onSubmit={handleCreateList} className="flex p-2 gap-2">
            <Input 
              placeholder="e.g. Weekly Groceries" 
              className="bg-transparent border-none shadow-none focus-visible:ring-0 text-white placeholder:text-gray-600 h-12"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="bg-orange-500 hover:bg-orange-600 rounded-xl h-12 w-12 shrink-0"
              disabled={isAdding || !newListName.trim()}
            >
              {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            </Button>
          </form>
        </Card>

        {/* Lists Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : lists?.map((list: any) => (
            <ListCard key={list.id} list={list} onDelete={() => handleDeleteList(list.id)} />
          ))}
          
          {!loading && lists?.length === 0 && (
            <div className="text-center py-20 bg-[#111827] rounded-3xl border border-dashed border-[#374151]">
              <ShoppingCart className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500">Your collections are empty.</p>
              <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">Create your first list</p>
            </div>
          )}
        </div>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}

function ListCard({ list, onDelete }: { list: any, onDelete: () => void }) {
  const db = useFirestore();
  const [newItem, setNewItem] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newItem.trim()) return;

    setIsAddingItem(true);
    const listRef = doc(db, "lists", list.id);
    await updateDoc(listRef, {
      items: arrayUnion(newItem.trim())
    });
    setNewItem("");
    setIsAddingItem(false);
  };

  const handleRemoveItem = async (item: string) => {
    if (!db) return;
    const listRef = doc(db, "lists", list.id);
    updateDoc(listRef, {
      items: arrayRemove(item)
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="bg-[#1f2937] border-[#374151] rounded-3xl shadow-xl active:scale-[0.98] transition-transform cursor-pointer group">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-2xl">
                <ListChecks className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{list.name}</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">
                  {list.items?.length || 0} items
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-700 group-hover:text-orange-500 transition-colors" />
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] bg-[#111827] border-[#374151] text-white rounded-t-[2.5rem] sm:rounded-3xl p-0 overflow-hidden">
        <div className="p-6 bg-[#1f2937] border-b border-[#374151] flex justify-between items-center">
          <DialogHeader className="p-0 text-left">
            <DialogTitle className="text-xl font-black tracking-tight text-white">{list.name}</DialogTitle>
          </DialogHeader>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-red-500"
            onClick={onDelete}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
          <form onSubmit={handleAddItem} className="flex gap-2 bg-[#111827] p-2 rounded-2xl border border-[#374151]/50 shadow-inner">
            <Input 
              placeholder="Add item..." 
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-gray-600"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isAddingItem || !newItem.trim()}
              className="bg-orange-500 hover:bg-orange-600 rounded-xl shrink-0"
            >
              {isAddingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </form>

          <div className="space-y-2">
            {list.items?.map((item: string, idx: number) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 bg-[#1f2937] rounded-2xl border border-[#374151]/30 group"
              >
                <div className="flex items-center gap-3">
                  <Circle className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-200">{item}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveItem(item)}
                  className="h-8 w-8 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!list.items || list.items.length === 0) && (
              <p className="text-center py-10 text-xs text-gray-500 font-bold uppercase tracking-widest italic">
                No items in this collection
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
