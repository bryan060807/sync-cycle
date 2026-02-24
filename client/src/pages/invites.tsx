import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Users, UserPlus, Check, X, Search, Heart, Send, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface Invite {
  invite: {
    id: string;
    fromUserId: string;
    toUserId: string | null;
    status: string;
    createdAt: string;
  };
  fromUser: UserProfile;
}

export default function Invites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: receivedInvites = [] } = useQuery<Invite[]>({
    queryKey: ["/api/invites/received"],
    queryFn: () => apiRequest("GET", "/api/invites/received").then(r => r.json()),
  });

  const { data: sentInvites = [] } = useQuery<any[]>({
    queryKey: ["/api/invites/sent"],
    queryFn: () => apiRequest("GET", "/api/invites/sent").then(r => r.json()),
  });

  const { data: partnerData } = useQuery({
    queryKey: ["/api/partner"],
    queryFn: () => apiRequest("GET", "/api/partner").then(r => r.json()),
  });

  const sendInviteMutation = useMutation({
    mutationFn: (toUserId: string) => apiRequest("POST", "/api/invites", { toUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites/sent"] });
      setSearchQuery("");
      setSearchResults([]);
      toast({ title: "Invite sent!", description: "An email notification has been sent." });
    },
    onError: () => {
      toast({ title: "Failed to send invite", variant: "destructive" });
    }
  });

  const sendEmailInviteMutation = useMutation({
    mutationFn: (email: string) => apiRequest("POST", "/api/invites/email", { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites/sent"] });
      setEmailInput("");
      toast({ title: "Email sent!", description: "Your partner will receive an invitation email." });
    },
    onError: () => {
      toast({ title: "Failed to send email", variant: "destructive" });
    }
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => 
      apiRequest("POST", `/api/invites/${id}/respond`, { accept }),
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites/received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner"] });
      toast({ 
        title: accept ? "Connected!" : "Declined", 
        description: accept ? "You're now connected with your partner!" : "Invite declined." 
      });
    },
  });

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setIsSearching(true);
    try {
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      toast({ title: "Search failed", variant: "destructive" });
    }
    setIsSearching(false);
  };

  const getDisplayName = (u: UserProfile) => {
    if (u.firstName || u.lastName) {
      return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    }
    return u.email?.split('@')[0] || 'User';
  };

  const hasPartner = partnerData && partnerData.partner;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Partner Connection</h1>
          <p className="text-muted-foreground mt-1">Find and connect with your partner to sync together.</p>
        </div>

        {hasPartner ? (
          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Heart className="h-5 w-5 fill-emerald-500" />
                Connected!
              </CardTitle>
              <CardDescription className="text-emerald-600">
                You're connected with {partnerData.partner.firstName || partnerData.partner.email?.split('@')[0]}.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            {/* Received Invites */}
            {receivedInvites.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <UserPlus className="h-5 w-5" />
                    Pending Invites ({receivedInvites.length})
                  </CardTitle>
                  <CardDescription>Someone wants to connect with you!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {receivedInvites.map((inv) => (
                    <div key={inv.invite.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-primary/20">
                      <div className="flex items-center gap-4">
                        {inv.fromUser.profileImageUrl ? (
                          <img src={inv.fromUser.profileImageUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {getDisplayName(inv.fromUser)[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{getDisplayName(inv.fromUser)}</p>
                          <p className="text-sm text-muted-foreground">{inv.fromUser.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => respondMutation.mutate({ id: inv.invite.id, accept: true })}
                          disabled={respondMutation.isPending}
                          data-testid={`button-accept-${inv.invite.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => respondMutation.mutate({ id: inv.invite.id, accept: false })}
                          disabled={respondMutation.isPending}
                          data-testid={`button-decline-${inv.invite.id}`}
                        >
                          <X className="h-4 w-4 mr-1" /> Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Invite by Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  Invite by Email
                </CardTitle>
                <CardDescription>Send an email invitation to your partner.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    type="email"
                    placeholder="partner@email.com" 
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && emailInput && sendEmailInviteMutation.mutate(emailInput)}
                    data-testid="input-email-invite"
                  />
                  <Button 
                    onClick={() => sendEmailInviteMutation.mutate(emailInput)}
                    disabled={sendEmailInviteMutation.isPending || !emailInput || !emailInput.includes('@')}
                    data-testid="button-send-email"
                  >
                    <Send className="h-4 w-4 mr-1" /> Send
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search for Partner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  Find Existing User
                </CardTitle>
                <CardDescription>Search for someone already on SyncCycle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Search by name or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    data-testid="input-search-partner"
                  />
                  <Button onClick={handleSearch} disabled={isSearching || searchQuery.length < 2} data-testid="button-search">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground">Results:</p>
                    {searchResults.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {result.profileImageUrl ? (
                            <img src={result.profileImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {getDisplayName(result)[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{getDisplayName(result)}</p>
                            <p className="text-xs text-muted-foreground">{result.email}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => sendInviteMutation.mutate(result.id)}
                          disabled={sendInviteMutation.isPending}
                          data-testid={`button-invite-${result.id}`}
                        >
                          <Send className="h-4 w-4 mr-1" /> Invite
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sent Invites */}
            {sentInvites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    Sent Invites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sentInvites.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">Invite sent</span>
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Pending</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
