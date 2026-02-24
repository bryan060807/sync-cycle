import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Heart, CheckCircle2, Bell, LogOut, Moon, Sun, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { Link } from "wouter";
import { useState } from "react";

interface PartnerData {
  connection: any;
  partner: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  } | null;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [dataSharing, setDataSharing] = useState(false);

  const { data: partnerData } = useQuery<PartnerData | null>({
    queryKey: ["/api/partner"],
    queryFn: () => apiRequest("GET", "/api/partner").then(r => r.json()),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string }) =>
      apiRequest("PATCH", "/api/user/profile", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Profile Updated", description: "Your name has been saved." });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ firstName, lastName });
  };

  const userName = user?.firstName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const hasPartner = partnerData && partnerData.partner;

  const getPartnerDisplayName = () => {
    if (!partnerData?.partner) return 'Partner';
    const p = partnerData.partner;
    if (p.firstName || p.lastName) {
      return `${p.firstName || ''} ${p.lastName || ''}`.trim();
    }
    return p.email?.split('@')[0] || 'Partner';
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your profile details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt={userName} 
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                      {userName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-lg" data-testid="text-profile-name">{userName}</p>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">First Name</label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Last Name</label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Your public profile:</p>
                  <Link href={`/user/${user?.id}`} className="text-sm text-primary hover:underline">
                    {window.location.origin}/user/{user?.id}
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Heart className="h-5 w-5 fill-primary" />
                  Partner Connection
                </CardTitle>
                <CardDescription>Your relationship connection status.</CardDescription>
              </CardHeader>
              <CardContent>
                {hasPartner ? (
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-card rounded-xl border border-primary/20">
                    <div className="flex items-center gap-4">
                      {partnerData.partner?.profileImageUrl ? (
                        <img 
                          src={partnerData.partner.profileImageUrl} 
                          alt={getPartnerDisplayName()} 
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {getPartnerDisplayName()[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold" data-testid="text-partner-name">{getPartnerDisplayName()}</p>
                        <p className="text-sm text-muted-foreground">{partnerData.partner?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      CONNECTED
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">You're not connected with a partner yet.</p>
                    <Link href="/partner">
                      <Button className="gap-2" data-testid="button-go-to-partner">
                        <Heart className="h-4 w-4" />
                        Go to Partner Page
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <button 
                  onClick={toggleTheme}
                  className="flex items-center justify-between py-2 w-full text-left"
                  data-testid="button-toggle-theme"
                >
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? (
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Sun className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">Dark Mode</span>
                  </div>
                  <div className={`h-5 w-9 rounded-full relative transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted"}`}>
                    <div className={`h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all ${theme === "dark" ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </button>
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Notifications</span>
                  </div>
                  <div className="h-5 w-9 bg-primary rounded-full relative">
                    <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </div>
                </div>
                <button
                  onClick={() => setDataSharing(!dataSharing)}
                  className="flex items-center justify-between py-2 w-full text-left border-t border-border"
                  data-testid="button-toggle-data-sharing"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium block">Data Sharing</span>
                      <span className="text-xs text-muted-foreground">Share anonymized wellness data for BPD research</span>
                    </div>
                  </div>
                  <div className={`h-5 w-9 rounded-full relative transition-colors ${dataSharing ? "bg-primary" : "bg-muted"}`}>
                    <div className={`h-4 w-4 bg-white rounded-full absolute top-0.5 transition-all ${dataSharing ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => logout()}
                  data-testid="button-logout-settings"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
