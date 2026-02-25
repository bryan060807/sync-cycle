
"use client";

import React from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Bell, CheckCircle2, AlertTriangle, MessageSquare, History, Loader2, X, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user } = useUser();
  const db = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: notifications, loading } = useCollection(notificationsQuery);

  const markAsRead = (id: string) => {
    if (!db) return;
    updateDoc(doc(db, "notifications", id), { read: true });
  };

  const deleteNotification = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, "notifications", id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'social': return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-32 space-y-6">
        <div className="pt-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Notifications</h2>
            <p className="text-gray-500 text-sm mt-1">Updates on your cycles and community.</p>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications?.map((notification: any) => (
            <Card 
              key={notification.id} 
              className={cn(
                "bg-[#1f2937] border-[#374151] rounded-3xl overflow-hidden shadow-xl transition-all",
                !notification.read && "border-primary/40 bg-[#252f3f]"
              )}
            >
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl shrink-0 h-fit",
                    notification.read ? "bg-gray-800" : "bg-primary/20"
                  )}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={cn(
                        "text-sm font-bold truncate",
                        notification.read ? "text-gray-400" : "text-white"
                      )}>
                        {notification.title}
                      </h4>
                      <span className="text-[9px] text-gray-500 uppercase font-black whitespace-nowrap ml-2">
                        {notification.createdAt?.toDate ? format(notification.createdAt.toDate(), "HH:mm") : "Now"}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs leading-relaxed mb-3",
                      notification.read ? "text-gray-500" : "text-gray-300"
                    )}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => markAsRead(notification.id)}
                          className="h-7 px-3 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary/20 rounded-lg"
                        >
                          Mark as read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteNotification(notification.id)}
                        className="h-7 w-7 p-0 text-gray-600 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && notifications?.length === 0 && (
            <div className="text-center py-20 bg-[#111827] rounded-[2.5rem] border border-dashed border-[#374151]">
              <Bell className="h-12 w-12 text-gray-800 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">All caught up!</p>
              <p className="text-[10px] text-gray-700 mt-1 uppercase">No new alerts for you</p>
            </div>
          )}
        </div>
      </main>

      <MobileNav activeTab="home" />
    </div>
  );
}
