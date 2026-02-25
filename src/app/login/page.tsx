"use client";

import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Mail, 
  Lock, 
  UserPlus, 
  LogIn, 
  UserCircle2, 
  Loader2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, useUser } from "@/firebase";
import { 
  initiateAnonymousSignIn, 
  initiateEmailSignIn, 
  initiateEmailSignUp 
} from "@/firebase/non-blocking-login";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: isUserLoading } = useUser();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleAuthAction = async (action: () => void, successMessage: string) => {
    setIsLoading(true);
    try {
      await action();
      toast({
        title: "Auth Initiated",
        description: successMessage,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please check your credentials.",
      });
      setIsLoading(false);
    }
  };

  const onEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    handleAuthAction(
      () => initiateEmailSignIn(auth, email, password),
      "Checking credentials..."
    );
  };

  const onEmailSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    handleAuthAction(
      () => initiateEmailSignUp(auth, email, password),
      "Creating your profile..."
    );
  };

  const onAnonymousSignIn = () => {
    handleAuthAction(
      () => initiateAnonymousSignIn(auth),
      "Entering as a guest..."
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117] p-6 justify-center">
      <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="p-4 bg-primary/10 rounded-[2rem] mb-4 shadow-2xl shadow-primary/20">
          <Heart className="h-10 w-10 text-primary fill-primary" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">SyncCycle</h1>
        <p className="text-gray-500 text-sm font-medium max-w-[240px]">
          Securely track your emotional and physical wellness cycles.
        </p>
      </div>

      <Card className="bg-[#1f2937] border-[#374151] rounded-[2.5rem] shadow-2xl overflow-hidden border-none">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full h-14 bg-[#111827] rounded-none p-0">
            <TabsTrigger 
              value="login" 
              className="rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:text-primary font-black uppercase tracking-widest text-[10px]"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              className="rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:text-primary font-black uppercase tracking-widest text-[10px]"
            >
              Register
            </TabsTrigger>
          </TabsList>
          
          <CardContent className="p-8 pt-10">
            <TabsContent value="login" className="mt-0 space-y-4">
              <form onSubmit={onEmailSignIn} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#111827] border-[#374151] h-14 pl-12 rounded-2xl text-white placeholder:text-gray-700"
                    autoComplete="email"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#111827] border-[#374151] h-14 pl-12 rounded-2xl text-white placeholder:text-gray-700"
                    autoComplete="current-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading || !email || !password}
                  className="w-full h-14 btn-gradient shadow-lg shadow-primary/20"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" /> Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0 space-y-4">
              <form onSubmit={onEmailSignUp} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    type="email" 
                    placeholder="Choose Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#111827] border-[#374151] h-14 pl-12 rounded-2xl text-white placeholder:text-gray-700"
                    autoComplete="email"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    type="password" 
                    placeholder="Create Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#111827] border-[#374151] h-14 pl-12 rounded-2xl text-white placeholder:text-gray-700"
                    autoComplete="new-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading || !email || !password}
                  className="w-full h-14 btn-gradient shadow-lg shadow-primary/20"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" /> Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#374151]"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
                <span className="bg-[#1f2937] px-4 text-gray-600">OR</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={onAnonymousSignIn}
              disabled={isLoading}
              className="w-full h-14 border-[#374151] bg-[#111827]/50 text-gray-300 rounded-2xl hover:bg-[#111827] transition-all gap-3"
            >
              <UserCircle2 className="h-5 w-5" />
              <span>Continue as Guest</span>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-600" />
            </Button>
          </CardContent>
        </Tabs>
      </Card>

      <div className="mt-10 flex items-center justify-center gap-2 text-gray-600">
        <ShieldCheck className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted Sync</span>
      </div>
    </div>
  );
}