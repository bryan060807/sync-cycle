
"use client";

import React, { useState, useEffect } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { 
  Users, 
  Send, 
  UserPlus, 
  MessageSquare, 
  Heart, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Share2,
  Lock,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, updateDoc, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function PartnerPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch current user's profile to see partnerId
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userProfile } = useDoc(userDocRef);

  // Fetch partner profile if connected
  const partnerDocRef = useMemoFirebase(() => {
    if (!db || !userProfile?.partnerId) return null;
    return doc(db, "users", userProfile.partnerId);
  }, [db, userProfile?.partnerId]);
  const { data: partnerProfile } = useDoc(partnerDocRef);

  // Fetch outgoing invites
  const outgoingQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "invites"),
      where("senderId", "==", user.uid),
      where("status", "==", "pending")
    );
  }, [db, user]);
  const { data: outgoingInvites } = useCollection(outgoingQuery);

  // Fetch incoming invites
  const incomingQuery = useMemoFirebase(() => {
    if (!db || !user?.email) return null;
    return query(
      collection(db, "invites"),
      where("receiverEmail", "==", user.email),
      where("status", "==", "pending")
    );
  }, [db, user?.email]);
  const { data: incomingInvites } = useCollection(incomingQuery);

  const handleSendInvite = () => {
    if (!db || !user || !inviteEmail.trim()) return;
    setIsSending(true);

    const inviteData = {
      senderId: user.uid,
      senderEmail: user.email,
      receiverEmail: inviteEmail.trim(),
      status: "pending",
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "invites"), inviteData)
      .then(() => {
        setInviteEmail("");
        setIsInviting(false);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "invites",
          operation: "create",
          requestResourceData: inviteData,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => setIsSending(false));
  };

  const handleAcceptInvite = async (invite: any) => {
    if (!db || !user) return;

    const coupleId = `${invite.senderId}_${user.uid}`;
    
    // 1. Create Couple document
    await setDoc(doc(db, "couples", coupleId), {
      uids: [invite.senderId, user.uid],
      createdAt: serverTimestamp(),
    });

    // 2. Update Sender's profile
    await updateDoc(doc(db, "users", invite.senderId), {
      partnerId: user.uid,
      coupleId: coupleId,
    });

    // 3. Update Current User's profile
    await updateDoc(doc(db, "users", user.uid), {
      partnerId: invite.senderId,
      coupleId: coupleId,
    });

    // 4. Update Invite status
    await updateDoc(doc(db, "invites", invite.id), {
      status: "accepted",
    });
  };

  const handleDeclineInvite = async (inviteId: string) => {
    if (!db) return;
    updateDoc(doc(db, "invites", inviteId), { status: "declined" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-32 space-y-6">
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Partner Hub</h2>
          <p className="text-gray-500 text-sm mt-1">Connect and sync your life with your partner.</p>
        </div>

        {userProfile?.partnerId ? (
          <div className="space-y-6">
            {/* Partner Profile Card */}
            <Card className="bg-[#1f2937] border-[#374151] rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Heart className="h-32 w-32 text-red-500 fill-red-500" />
              </div>
              <CardContent className="p-0">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={partnerProfile?.photoURL || `https://picsum.photos/seed/${userProfile.partnerId}/200`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {partnerProfile?.username?.charAt(0) || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      {partnerProfile?.username || "Partner"}
                    </h3>
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest px-2">
                      Connected
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => router.push("/partner/chat")}
                    className="bg-primary hover:bg-primary/90 rounded-2xl h-12 gap-2 font-bold"
                  >
                    <MessageSquare className="h-4 w-4" /> Message
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-[#374151] bg-transparent rounded-2xl h-12 gap-2 font-bold text-gray-300"
                  >
                    <Share2 className="h-4 w-4" /> Share Score
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Controls */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Privacy & Sharing</h3>
              <Card className="bg-[#1f2937] border-[#374151] rounded-3xl p-4">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-bold text-gray-200">Private Episode Notes</span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500 border-none text-[9px]">Always Hidden</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-gray-200">Share Pulse Baseline</span>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-none text-[9px]">Enabled</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* No Partner View */}
            <div className="text-center py-12 px-6 bg-[#1f2937] rounded-[2.5rem] border border-[#374151]">
              <div className="bg-primary/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">No Partner Connected</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Invite your partner to share goals, track wellness patterns together, and stay synced.
              </p>
              
              <Dialog open={isInviting} onOpenChange={setIsInviting}>
                <DialogTrigger asChild>
                  <Button className="w-full btn-gradient h-14 rounded-2xl shadow-lg shadow-primary/20 font-bold">
                    Invite Your Partner
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#111827] border-[#374151] text-white rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="text-white font-black uppercase tracking-tight">Send Invite</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-xs text-gray-500">Enter your partner's email address to send a coupling request.</p>
                    <Input 
                      placeholder="partner@example.com" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-[#1f2937] border-[#374151] h-12 rounded-xl text-white"
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleSendInvite} 
                      disabled={isSending || !inviteEmail.trim()}
                      className="w-full btn-gradient h-12 rounded-xl"
                    >
                      {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Pending Requests */}
            {incomingInvites && incomingInvites.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Incoming Requests</h3>
                {incomingInvites.map((invite: any) => (
                  <Card key={invite.id} className="bg-[#1f2937] border-[#374151] rounded-3xl p-4">
                    <CardContent className="p-0 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{invite.senderEmail}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black">Wants to pair</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-green-500" onClick={() => handleAcceptInvite(invite)}>
                          <CheckCircle2 className="h-6 w-6" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500" onClick={() => handleDeclineInvite(invite.id)}>
                          <XCircle className="h-6 w-6" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Outgoing Requests */}
            {outgoingInvites && outgoingInvites.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Awaiting Response</h3>
                {outgoingInvites.map((invite: any) => (
                  <Card key={invite.id} className="bg-[#1f2937] border-[#374151] rounded-3xl p-4 opacity-70">
                    <CardContent className="p-0 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Send className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-bold text-gray-300">{invite.receiverEmail}</span>
                      </div>
                      <Badge className="bg-gray-800 text-gray-500 border-none text-[9px] uppercase">Sent</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}
