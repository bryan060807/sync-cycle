import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Heart, Send, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export default function UserProfilePage() {
  const [match, params] = useRoute("/user/:id");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const userId = params?.id;

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users", userId, "profile"],
    queryFn: () => apiRequest("GET", `/api/users/${userId}/profile`).then(r => r.json()),
    enabled: !!userId,
  });

  const sendInviteMutation = useMutation({
    mutationFn: (toUserId: string) => apiRequest("POST", "/api/invites", { toUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites/sent"] });
      toast({ title: "Invite sent!", description: "Waiting for them to accept." });
    },
    onError: () => {
      toast({ title: "Failed to send invite", variant: "destructive" });
    }
  });

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">This user profile doesn't exist.</p>
            <Button onClick={() => setLocation("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile.firstName || profile.lastName 
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : 'SyncCycle User';

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-8">
        <Button onClick={() => setLocation(isAuthenticated ? "/dashboard" : "/")} variant="ghost" className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20" />
          <CardContent className="relative pt-0">
            <div className="-mt-16 mb-4">
              {profile.profileImageUrl ? (
                <img 
                  src={profile.profileImageUrl} 
                  alt={displayName} 
                  className="h-32 w-32 rounded-full border-4 border-background object-cover shadow-lg"
                />
              ) : (
                <div className="h-32 w-32 rounded-full border-4 border-background bg-primary/10 flex items-center justify-center shadow-lg">
                  <User className="h-16 w-16 text-primary" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-heading font-bold" data-testid="text-profile-name">{displayName}</h1>
                <p className="text-muted-foreground">SyncCycle Member</p>
              </div>

              {!isAuthenticated ? (
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-3">
                    Sign in to connect with {profile.firstName || 'this user'} and start your wellness journey together.
                  </p>
                  <Button asChild>
                    <a href="/api/login">
                      <Heart className="h-4 w-4 mr-2 fill-current" /> Sign In to Connect
                    </a>
                  </Button>
                </div>
              ) : isOwnProfile ? (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-sm text-primary">This is your public profile. Share the link with your partner!</p>
                </div>
              ) : (
                <Button 
                  onClick={() => sendInviteMutation.mutate(profile.id)}
                  disabled={sendInviteMutation.isPending}
                  className="w-full"
                  data-testid="button-send-invite"
                >
                  <Send className="h-4 w-4 mr-2" /> Send Partner Request
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
