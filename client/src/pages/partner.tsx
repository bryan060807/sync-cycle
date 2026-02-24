import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useRef, useEffect } from "react";
import { Users, Heart, Send, MessageCircle, Search, Mail, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Message, Goal, Win } from "@shared/schema";

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

interface PartnerData {
  connection: any;
  partner: UserProfile | null;
}

export default function Partner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: partnerData } = useQuery<PartnerData | null>({
    queryKey: ["/api/partner"],
    queryFn: () => apiRequest("GET", "/api/partner").then(r => r.json()),
  });

  const { data: receivedInvites = [] } = useQuery<Invite[]>({
    queryKey: ["/api/invites/received"],
    queryFn: () => apiRequest("GET", "/api/invites/received").then(r => r.json()),
  });

  const { data: sentInvites = [] } = useQuery<any[]>({
    queryKey: ["/api/invites/sent"],
    queryFn: () => apiRequest("GET", "/api/invites/sent").then(r => r.json()),
  });

  const hasPartner = partnerData && partnerData.partner;

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    queryFn: () => apiRequest("GET", "/api/messages").then(r => r.json()),
    enabled: !!hasPartner,
    refetchInterval: 5000,
  });

  const { data: signalData } = useQuery<any>({
    queryKey: ["/api/signal"],
    queryFn: () => apiRequest("GET", "/api/signal").then(r => r.json()),
    enabled: !!hasPartner,
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: () => apiRequest("GET", "/api/goals").then(r => r.json()),
    enabled: !!hasPartner,
  });

  const { data: wins = [] } = useQuery<Win[]>({
    queryKey: ["/api/wins"],
    queryFn: () => apiRequest("GET", "/api/wins").then(r => r.json()),
    enabled: !!hasPartner,
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
    },
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
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      apiRequest("POST", `/api/invites/${id}/respond`, { accept }),
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites/received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner"] });
      toast({
        title: accept ? "Connected!" : "Declined",
        description: accept ? "You're now connected with your partner!" : "Invite declined.",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => apiRequest("POST", "/api/messages", { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
    },
    onError: () => {
      toast({ title: "Couldn't send message", variant: "destructive" });
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getDisplayName = (u: UserProfile) => {
    if (u.firstName || u.lastName) {
      return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    }
    return u.email?.split("@")[0] || "User";
  };

  const activeGoalsCount = goals.filter((g: any) => g.status === "active" || !g.completedAt).length;
  const recentWins = wins.slice(0, 3);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Partner</h1>
          <p className="text-muted-foreground mt-1">
            {hasPartner
              ? "Chat with your partner and stay in sync."
              : "Find and connect with your partner to sync together."}
          </p>
        </div>

        {hasPartner ? (
          <>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {partnerData.partner?.profileImageUrl ? (
                      <img
                        src={partnerData.partner.profileImageUrl}
                        alt={getDisplayName(partnerData.partner!)}
                        className="h-14 w-14 rounded-full object-cover"
                        data-testid="img-partner-avatar"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl" data-testid="img-partner-avatar">
                        {getDisplayName(partnerData.partner!)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg" data-testid="text-partner-name">
                        {getDisplayName(partnerData.partner!)}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid="text-partner-email">
                        {partnerData.partner?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    CONNECTED
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Partner Signal</p>
                      <p className="font-bold text-lg" data-testid="text-partner-signal">
                        {signalData?.partnerSignal?.overall != null
                          ? `${Math.round(signalData.partnerSignal.overall * 10)}%`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Active Goals</p>
                      <p className="font-bold text-lg" data-testid="text-active-goals">
                        {activeGoalsCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recent Shared Wins</p>
                      <p className="font-bold text-lg" data-testid="text-recent-wins">
                        {recentWins.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-5 py-3.5 border-b border-border flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Messages</span>
              </div>
              <div className="h-80 overflow-y-auto p-4 space-y-3 bg-background" data-testid="chat-messages">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-12">
                    No messages yet. Start a conversation with your partner!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.fromUserId === user?.id ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          msg.fromUserId === user?.id
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.fromUserId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="border-t border-border p-3 flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>
          </>
        ) : (
          <>
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
                    <div
                      key={inv.invite.id}
                      className="flex items-center justify-between p-4 bg-white dark:bg-card rounded-xl border border-primary/20"
                    >
                      <div className="flex items-center gap-4">
                        {inv.fromUser.profileImageUrl ? (
                          <img
                            src={inv.fromUser.profileImageUrl}
                            alt=""
                            className="h-12 w-12 rounded-full object-cover"
                          />
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
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondMutation.mutate({ id: inv.invite.id, accept: false })}
                          disabled={respondMutation.isPending}
                          data-testid={`button-decline-${inv.invite.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="email" className="flex-1" data-testid="tab-email-invite">
                  <Mail className="h-4 w-4 mr-2" />
                  Invite by Email
                </TabsTrigger>
                <TabsTrigger value="search" className="flex-1" data-testid="tab-search">
                  <Search className="h-4 w-4 mr-2" />
                  Find User
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
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
                        onKeyDown={(e) => e.key === "Enter" && emailInput && sendEmailInviteMutation.mutate(emailInput)}
                        data-testid="input-email-invite"
                      />
                      <Button
                        onClick={() => sendEmailInviteMutation.mutate(emailInput)}
                        disabled={sendEmailInviteMutation.isPending || !emailInput || !emailInput.includes("@")}
                        data-testid="button-send-email"
                      >
                        <Send className="h-4 w-4 mr-1" /> Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="search">
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
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        data-testid="input-search-partner"
                      />
                      <Button
                        onClick={handleSearch}
                        disabled={isSearching || searchQuery.length < 2}
                        data-testid="button-search"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="space-y-2 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground">Results:</p>
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {result.profileImageUrl ? (
                                <img
                                  src={result.profileImageUrl}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover"
                                />
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
              </TabsContent>
            </Tabs>

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
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
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
