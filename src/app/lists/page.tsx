
"use client";

import React, { useState, useMemo } from "react";
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
  Zap,
  Tag,
  Calendar,
  ChevronLeft,
  X,
  MoreVertical,
  Pin,
  CalendarDays
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function ListsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [newListName, setNewListName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const listsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "lists"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: lists, loading } = useCollection(listsQuery);

  const pinnedLists = useMemo(() => {
    return lists?.filter(l => 
      l.name.toLowerCase().includes('grocery') || 
      l.name.toLowerCase().includes('errand')
    ) || [];
  }, [lists]);

  const otherLists = useMemo(() => {
    return lists?.filter(l => 
      !l.name.toLowerCase().includes('grocery') && 
      !l.name.toLowerCase().includes('errand') &&
      !l.name.toLowerCase().includes('schedule')
    ) || [];
  }, [lists]);

  const handleCreateList = (name: string) => {
    if (!db || !user || !name.trim()) return;

    setIsAdding(true);
    const data = {
      name: name.trim(),
      userId: user.uid,
      items: [],
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, "lists"), data)
      .then(() => {
        setNewListName("");
        setIsAdding(false);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "lists",
          operation: "create",
          requestResourceData: data,
        });
        errorEmitter.emit("permission-error", permissionError);
        setIsAdding(false);
      });
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedWeek);
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [selectedWeek]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-32 space-y-8">
        {/* Pinned Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Pin className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Pinned Collections</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {pinnedLists.map((list) => (
              <ListCard key={list.id} list={list} featured />
            ))}
            {pinnedLists.length === 0 && !loading && (
              <div className="col-span-2 p-6 rounded-3xl border border-dashed border-gray-800 flex flex-col items-center justify-center text-center">
                <ShoppingCart className="h-6 w-6 text-gray-700 mb-2" />
                <p className="text-[10px] font-bold text-gray-600 uppercase">Pin items by naming them 'Groceries' or 'Errands'</p>
              </div>
            )}
          </div>
        </section>

        {/* Weekly Planner */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-purple-500" />
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Weekly Planner</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setSelectedWeek(d => addDays(d, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
                {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d")}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setSelectedWeek(d => addDays(d, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {weekDays.map((day) => (
              <DayCard key={day.toISOString()} date={day} />
            ))}
          </div>
        </section>

        {/* All Collections */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-teal-500" />
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">My Lists</h2>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-gray-800 rounded-full">
                  <Plus className="h-4 w-4 text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1f2937] border-[#374151] text-white rounded-3xl">
                <DialogHeader>
                  <DialogTitle>New Collection</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="List name (e.g. Wishlist, Books to Read)" 
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="bg-[#111827] border-[#374151] h-12 rounded-xl"
                  />
                </div>
                <DialogFooter>
                  <Button 
                    className="w-full btn-gradient h-12 rounded-xl"
                    onClick={() => {
                      handleCreateList(newListName);
                    }}
                  >
                    Create Collection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : otherLists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
            {!loading && otherLists.length === 0 && (
              <div className="text-center py-12 bg-[#111827] rounded-[2rem] border border-dashed border-gray-800">
                <Tag className="h-8 w-8 text-gray-800 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-gray-600 uppercase">Your custom lists will appear here</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}

function ListCard({ list, featured = false }: { list: any, featured?: boolean }) {
  const db = useFirestore();
  const [newItem, setNewItem] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newItem.trim()) return;

    setIsAddingItem(true);
    const listRef = doc(db, "lists", list.id);
    updateDoc(listRef, {
      items: arrayUnion(newItem.trim())
    }).then(() => {
      setNewItem("");
      setIsAddingItem(false);
    }).catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: listRef.path,
        operation: 'update',
        requestResourceData: { items: newItem.trim() }
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsAddingItem(false);
    });
  };

  const handleRemoveItem = (item: string) => {
    if (!db) return;
    const listRef = doc(db, "lists", list.id);
    updateDoc(listRef, {
      items: arrayRemove(item)
    }).catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: listRef.path,
        operation: 'update'
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleDeleteList = () => {
    if (!db) return;
    deleteDoc(doc(db, "lists", list.id)).catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: `lists/${list.id}`,
        operation: 'delete'
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('grocery')) return <ShoppingCart className="h-6 w-6 text-orange-500" />;
    if (lower.includes('errand')) return <Zap className="h-6 w-6 text-yellow-500" />;
    return <ListChecks className="h-6 w-6 text-primary" />;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className={cn(
          "bg-[#1f2937] border-[#374151] rounded-3xl shadow-xl active:scale-[0.98] transition-transform cursor-pointer overflow-hidden",
          featured ? "h-32" : "h-20"
        )}>
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-xl">
                {getIcon(list.name)}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white truncate uppercase tracking-tight">{list.name}</h3>
                <p className="text-[10px] text-gray-500 font-bold">{list.items?.length || 0} ITEMS</p>
              </div>
            </div>
            {featured && list.items?.length > 0 && (
              <div className="mt-2 text-[10px] text-gray-400 italic line-clamp-2 bg-black/20 p-2 rounded-xl">
                {list.items[0]}{list.items.length > 1 ? `, ${list.items[1]}...` : ''}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] bg-[#111827] border-[#374151] text-white rounded-t-[2.5rem] sm:rounded-3xl p-0 overflow-hidden">
        <div className="p-6 bg-[#1f2937] border-b border-[#374151] flex justify-between items-center">
          <DialogHeader className="p-0 text-left">
            <DialogTitle className="text-xl font-black tracking-tight text-white uppercase">{list.name}</DialogTitle>
          </DialogHeader>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-red-500"
            onClick={handleDeleteList}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
          <form onSubmit={handleAddItem} className="flex gap-2 bg-[#111827] p-2 rounded-2xl border border-[#374151]/50">
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
              className="bg-primary hover:bg-primary/90 rounded-xl shrink-0"
            >
              {isAddingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </form>

          <div className="space-y-2">
            {list.items?.map((item: string, idx: number) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 bg-[#1f2937] rounded-2xl border border-[#374151]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-gray-200">{item}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveItem(item)}
                  className="h-8 w-8 text-gray-600 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DayCard({ date }: { date: Date }) {
  const { user } = useUser();
  const db = useFirestore();
  const isToday = isSameDay(date, new Date());
  
  const listName = `Schedule: ${format(date, "yyyy-MM-dd")}`;
  
  const scheduleQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "lists"),
      where("userId", "==", user.uid),
      where("name", "==", listName),
      limit(1)
    );
  }, [db, user, listName]);

  const { data: scheduleList } = useCollection(scheduleQuery);
  const existingList = scheduleList?.[0];

  const handleAddItem = (item: string) => {
    if (!db || !user || !item.trim()) return;

    if (!existingList) {
      addDoc(collection(db, "lists"), {
        name: listName,
        userId: user.uid,
        items: [item.trim()],
        createdAt: serverTimestamp()
      });
    } else {
      updateDoc(doc(db, "lists", existingList.id), {
        items: arrayUnion(item.trim())
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={cn(
          "min-w-[100px] p-4 rounded-3xl border transition-all active:scale-95 cursor-pointer",
          isToday ? "bg-purple-600 border-purple-400" : "bg-[#1f2937] border-[#374151]"
        )}>
          <p className={cn("text-[10px] font-black uppercase tracking-widest", isToday ? "text-purple-200" : "text-gray-500")}>
            {format(date, "EEE")}
          </p>
          <p className="text-xl font-black text-white">{format(date, "d")}</p>
          <div className="mt-2 h-1 w-full bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500" 
              style={{ width: `${Math.min((existingList?.items?.length || 0) * 20, 100)}%` }} 
            />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="bg-[#111827] border-[#374151] text-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight font-black">
            {format(date, "EEEE, MMMM do")}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <Input 
            placeholder="Plan your day..." 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddItem((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
            className="bg-[#1f2937] border-[#374151] h-14 rounded-2xl"
          />
          <div className="space-y-2">
            {existingList?.items?.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-[#1f2937] rounded-2xl">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
            {(!existingList || existingList.items?.length === 0) && (
              <p className="text-center py-10 text-xs text-gray-500 font-bold uppercase tracking-widest italic">
                No events scheduled
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function limit(count: number) {
  return (q: any) => q; // Simple mock for where limit isn't exported from firestore/lite in some environments
}
