"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { 
  Users, 
  Plus, 
  MessageCircle, 
  Heart, 
  Search, 
  Loader2, 
  Filter
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, updateDoc, doc, increment } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ForumsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isPosting, setIsPosting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [category, setCategory] = useState("General");
  const [isSaving, setIsSaving] = useState(false);

  const userId = user?.uid || "guest_user";
  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || "Guest";

  const postsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "forum-posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db]);

  const { data: posts, isLoading: postsLoading } = useCollection(postsQuery);

  const handleCreatePost = async () => {
    if (!db || !newTitle.trim() || !newContent.trim()) return;
    setIsSaving(true);

    const data = {
      userId: userId,
      userDisplayName: userDisplayName,
      userPhotoUrl: user?.photoURL || "",
      title: newTitle.trim(),
      content: newContent.trim(),
      category,
      likes: 0,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "forum-posts"), data)
      .then(() => {
        setNewTitle("");
        setNewContent("");
        setIsPosting(false);
        toast({
          title: "Post created!",
          description: "Your discussion has been shared with the community."
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleLike = (id: string) => {
    if (!db) return;
    const postRef = doc(db, "forum-posts", id);
    updateDoc(postRef, {
      likes: increment(1)
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-32 space-y-6 text-white">
        <div className="pt-4 flex justify-between items-center text-left">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest">Community</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Global Discussion</p>
          </div>
          <Dialog open={isPosting} onOpenChange={setIsPosting}>
            <DialogTrigger asChild>
              <Button size="icon" className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1f2937] border-[#374151] text-white rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-white uppercase font-black tracking-tight">New Discussion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {["General", "Coping", "Relationships", "Success"].map((cat) => (
                    <Badge 
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "cursor-pointer px-3 py-1 transition-colors",
                        category === cat ? "bg-primary text-white" : "bg-[#111827] text-gray-500"
                      )}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
                <Input 
                  placeholder="Topic Title" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl text-white h-12"
                />
                <Textarea 
                  placeholder="What's on your mind?" 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl text-white h-32 resize-none"
                />
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreatePost} 
                  disabled={isSaving || !newTitle.trim() || !newContent.trim()}
                  className="w-full btn-gradient h-12 rounded-xl"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Post Discussion"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 bg-[#1f2937]/50 p-2 rounded-2xl border border-[#374151]/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search topics..." 
              className="bg-[#111827] border-none h-10 pl-10 rounded-xl text-xs text-white"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 bg-[#111827] rounded-xl">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {postsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : posts?.map((post: any) => (
            <Card key={post.id} className="bg-[#1f2937] border-[#374151] rounded-[2rem] overflow-hidden shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarImage src={post.userPhotoUrl || `https://picsum.photos/seed/${post.userId}/100`} />
                    <AvatarFallback>{post.userDisplayName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-black text-white truncate uppercase tracking-tight">{post.userDisplayName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-bold">
                        {post.createdAt?.toDate ? format(post.createdAt.toDate(), "MMM dd") : "Just now"}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-gray-700" />
                      <span className="text-[10px] text-primary font-black uppercase tracking-widest">{post.category}</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-black text-white leading-tight mb-2 uppercase tracking-tight line-clamp-2 text-left">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-3 italic text-left">
                  "{post.content}"
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 group"
                    >
                      <Heart className="h-4 w-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                      <span className="text-[10px] font-black text-gray-500">{post.likes || 0}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-[10px] font-black text-gray-500">0</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}