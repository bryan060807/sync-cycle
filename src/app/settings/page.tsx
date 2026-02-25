
"use client";

import React, { useState, useRef } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { 
  User, 
  Bell, 
  Shield, 
  Smartphone, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Camera,
  Mail,
  Edit2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useUser, useAuth } from "@/firebase";
import { updateProfile, updateEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.photoURL || `https://picsum.photos/seed/${user?.uid || 'user'}/200/200`);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName,
      });
      // Email update requires re-authentication usually, but for prototype we'll attempt
      if (email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, email);
      }
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update profile information.",
      });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        // In a real app, you'd upload this to Firebase Storage and then updateProfile(photoURL)
        if (auth.currentUser) {
          updateProfile(auth.currentUser, { photoURL: base64String });
        }
        toast({
          title: "Photo Updated",
          description: "Your new profile picture has been set.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: <Bell className="h-5 w-5" />, label: "Notifications", type: "toggle", default: true },
        { icon: <Shield className="h-5 w-5" />, label: "Privacy Mode", type: "toggle", default: false },
        { icon: <Smartphone className="h-5 w-5" />, label: "Offline Sync", type: "toggle", default: true },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: <HelpCircle className="h-5 w-5" />, label: "Help Center", type: "nav" },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <header className="px-6 pt-12 pb-8 bg-gradient-to-b from-primary/10 to-transparent">
        <h1 className="text-3xl font-black text-white mb-8 tracking-tight">Settings</h1>
        
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="h-24 w-24 border-4 border-[#1f2937] shadow-2xl">
              <AvatarImage src={avatarUrl} className="object-cover" />
              <AvatarFallback className="bg-[#1f2937] text-white font-bold text-xl">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-black text-xl text-white tracking-tight">
                {user?.displayName || "New User"}
              </h2>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-white">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1f2937] border-[#374151] text-white rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="text-white font-black uppercase tracking-tight">Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Display Name</label>
                      <Input 
                        placeholder="Your Name" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white placeholder:text-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                      <Input 
                        placeholder="email@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleUpdateProfile} className="w-full btn-gradient h-12 rounded-xl">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xs text-gray-500 font-bold">{user?.email}</p>
            <Badge variant="secondary" className="mt-2 bg-primary/20 text-primary border-none text-[10px] px-3 py-1 font-black uppercase tracking-widest">
              Beta Access
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-8 px-4 pt-6 pb-32 overflow-y-auto no-scrollbar">
        {settingsGroups.map((group, i) => (
          <div key={i} className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-2">
              {group.title}
            </h3>
            <div className="bg-[#1f2937] rounded-[2rem] border border-[#374151]/50 overflow-hidden shadow-xl">
              {group.items.map((item, j) => (
                <div key={j}>
                  <div className="flex items-center justify-between p-5 active:bg-[#111827] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-[#111827] rounded-xl text-primary">
                        {item.icon}
                      </div>
                      <span className="text-sm font-bold text-gray-200">{item.label}</span>
                    </div>
                    {item.type === "nav" ? (
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Switch 
                        defaultChecked={item.default} 
                        className="data-[state=checked]:bg-primary border-none"
                      />
                    )}
                  </div>
                  {j < group.items.length - 1 && <Separator className="bg-[#374151]/30 mx-6" />}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="px-2 space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-14 text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-[1.5rem] font-black uppercase tracking-widest transition-all"
            onClick={() => auth.signOut()}
          >
            <LogOut className="mr-3 h-5 w-5" /> Sign Out
          </Button>
          
          <div className="text-center">
            <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.3em]">
              SyncCycle v1.2.0 • Build 2024.1
            </p>
          </div>
        </div>
      </div>

      <MobileNav activeTab="settings" />
    </div>
  );
}
