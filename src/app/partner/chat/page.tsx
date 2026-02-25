
"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  Plus, 
  Image as ImageIcon,
  Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function PartnerChatPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Fetch couple info
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const coupleId = userProfile?.coupleId;

  // Fetch messages
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !coupleId) return null;
    return query(
      collection(db, "couples", coupleId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, coupleId]);
  const { data: messages, isLoading } = useCollection(messagesQuery);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !coupleId || !text.trim()) return;

    setIsSending(true);
    addDoc(collection(db, "couples", coupleId, "messages"), {
      senderId: user.uid,
      text: text.trim(),
      createdAt: serverTimestamp(),
    }).then(() => {
      setText("");
    }).finally(() => {
      setIsSending(false);
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f1117]">
      {/* Header */}
      <header className="h-20 bg-[#1f2937]/80 backdrop-blur-md border-b border-[#374151] flex items-center px-4 shrink-0 safe-top">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white mr-2">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage src={`https://picsum.photos/seed/${userProfile?.partnerId}/100`} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">P</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-tight">Partner Chat</h1>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Now</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32"
      >
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages?.map((msg: any) => {
          const isMine = msg.senderId === user?.uid;
          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex flex-col max-w-[80%] space-y-1",
                isMine ? "ml-auto items-end" : "items-start"
              )}
            >
              <div className={cn(
                "px-4 py-3 rounded-[1.5rem] text-sm font-medium shadow-lg",
                isMine 
                  ? "bg-primary text-white rounded-tr-none" 
                  : "bg-[#1f2937] text-gray-200 border border-[#374151] rounded-tl-none"
              )}>
                {msg.text}
              </div>
              <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
                {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), "HH:mm") : "..."}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0f1117] border-t border-[#374151] safe-bottom max-w-md mx-auto">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-12 w-12 text-gray-500 shrink-0">
            <Plus className="h-6 w-6" />
          </Button>
          <div className="relative flex-1">
            <Input 
              placeholder="Type your heart out..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-[#1f2937] border-[#374151] h-12 pl-4 pr-12 rounded-2xl text-white placeholder:text-gray-600 focus:ring-primary"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-primary transition-colors">
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <Button 
            type="submit" 
            disabled={isSending || !text.trim()}
            className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 shrink-0"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
