
"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Send, History, Loader2, AlertCircle } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";

export default function Gratitude() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const gratitudeQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "gratitude"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, user]);

  const { data: archives, isLoading: loading } = useCollection(gratitudeQuery);

  const handleSendWin = () => {
    if (!text.trim() || !db || !user) return;

    setIsSending(true);
    const data = {
      text: text.trim(),
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "gratitude"), data)
      .then(() => {
        setText("");
        toast({ title: "Win logged!", description: "Gratitude keeps the cycle healthy." });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "gratitude",
          operation: "create",
          requestResourceData: data,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setIsSending(false);
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
            You need to be signed in to log your daily wins and view your gratitude archive.
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
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Wins & Gratitude</h2>
          <p className="text-gray-500 text-sm mt-1">What went well today?</p>
        </div>

        {/* Input Box */}
        <div className="bg-[#1f2937] p-6 rounded-3xl border border-[#374151] space-y-4 shadow-xl text-body">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Daily Prompt</p>
            <p className="text-sm text-gray-300 italic font-medium">"One thing I'm proud of myself or my partner for today..."</p>
          </div>
          <div className="relative">
            <Input 
              placeholder="Start typing..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-[#111827] border-[#374151] rounded-2xl h-14 pl-4 pr-14 text-white placeholder:text-gray-700"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendWin();
              }}
            />
            <Button 
              size="icon" 
              onClick={handleSendWin}
              disabled={isSending || !text.trim()}
              className="absolute right-2 top-2 h-10 w-10 bg-yellow-500 hover:bg-yellow-600 rounded-xl"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-gray-500" />
              <h3 className="font-bold text-gray-300 uppercase tracking-widest text-[10px]">Archived Wins</h3>
            </div>
            <span className="text-[10px] bg-[#1f2937] px-3 py-1 rounded-full border border-[#374151] text-gray-500 font-bold uppercase tracking-widest">
              {archives?.length || 0} Total
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : archives?.map((win: any) => (
              <Card key={win.id} className="bg-[#1f2937] border-[#374151] rounded-2xl p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-yellow-500/10 rounded-xl">
                    <Heart className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium italic">"{win.text}"</p>
                    <p className="text-[10px] text-gray-600 mt-1 uppercase font-bold">
                      {win.createdAt?.toDate ? format(win.createdAt.toDate(), "MMM dd") : "Just now"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            {!loading && archives?.length === 0 && (
              <p className="text-center text-gray-500 text-xs py-12 bg-[#111827] rounded-3xl border border-dashed border-[#374151]">No wins archived yet. Start the cycle of praise!</p>
            )}
          </div>
        </div>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}
