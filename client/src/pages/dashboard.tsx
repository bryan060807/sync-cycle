import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Smile,
  ShieldAlert,
  CheckCircle2,
  Heart,
  DollarSign,
  AlertTriangle,
  Shield,
  Waves,
  X,
  Clock
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { Episode, Goal, Transaction, CrisisPlan, Signal, SpendingSettings, Win, PartnerAlert, IncomeSource, Bill } from "@shared/schema";

type SignalStatus = 'green' | 'yellow' | 'red';

const ALERT_TYPES = [
  { type: 'triggered', label: 'Badly Triggered', icon: AlertTriangle, color: 'bg-amber-500 hover:bg-amber-600', description: 'Let your partner know you\'re having a hard moment' },
  { type: 'safe_word', label: 'Safe Word', icon: Shield, color: 'bg-rose-500 hover:bg-rose-600', description: 'Use your pre-agreed safe word signal' },
  { type: 'overwhelmed', label: 'Overwhelmed', icon: Waves, color: 'bg-violet-500 hover:bg-violet-600', description: 'Signal that you need space or support' },
] as const;

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const { data: cooldownData } = useQuery<{ canSend: boolean; cooldownRemaining: number }>({
    queryKey: ["/api/alerts/cooldown"],
    queryFn: () => apiRequest("GET", "/api/alerts/cooldown").then(r => r.json()),
    refetchInterval: cooldownRemaining > 0 ? 10000 : false,
  });

  const { data: incomingAlerts = [] } = useQuery<PartnerAlert[]>({
    queryKey: ["/api/alerts"],
    queryFn: () => apiRequest("GET", "/api/alerts").then(r => r.json()),
    refetchInterval: 15000,
  });

  const { data: partner } = useQuery<any>({
    queryKey: ["/api/partner"],
    queryFn: () => apiRequest("GET", "/api/partner").then(r => r.json()).catch(() => null),
  });

  useEffect(() => {
    if (cooldownData) {
      setCooldownRemaining(cooldownData.cooldownRemaining);
    }
  }, [cooldownData]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const sendAlertMutation = useMutation({
    mutationFn: (alertType: string) => apiRequest("POST", "/api/alerts", { alertType }),
    onSuccess: () => {
      toast({ title: "Alert sent", description: "Your partner has been notified." });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/cooldown"] });
    },
    onError: (err: any) => {
      if (err.message?.includes("429")) {
        toast({ title: "Cooldown active", description: "Please wait before sending another alert.", variant: "destructive" });
      } else {
        toast({ title: "Couldn't send alert", description: "Make sure you have a connected partner.", variant: "destructive" });
      }
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/alerts/${id}/acknowledge`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] }),
  });

  const canSend = cooldownRemaining <= 0;
  const cooldownMins = Math.ceil(cooldownRemaining / 60000);

  const { data: signal } = useQuery<Signal>({
    queryKey: ["/api/signal"],
    queryFn: () => apiRequest("GET", "/api/signal").then(r => r.json()),
  });

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
    queryFn: () => apiRequest("GET", "/api/episodes").then(r => r.json()),
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: () => apiRequest("GET", "/api/goals").then(r => r.json()),
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: () => apiRequest("GET", "/api/transactions").then(r => r.json()),
  });

  const { data: crisisPlan } = useQuery<CrisisPlan>({
    queryKey: ["/api/crisis-plan"],
    queryFn: () => apiRequest("GET", "/api/crisis-plan").then(r => r.json()),
  });

  const { data: spendingSettings } = useQuery<SpendingSettings>({
    queryKey: ["/api/spending-settings"],
    queryFn: () => apiRequest("GET", "/api/spending-settings").then(r => r.json()),
  });

  const { data: incomeSources = [] } = useQuery<IncomeSource[]>({
    queryKey: ["/api/income-sources"],
    queryFn: () => apiRequest("GET", "/api/income-sources").then(r => r.json()),
  });

  const { data: userBills = [] } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
    queryFn: () => apiRequest("GET", "/api/bills").then(r => r.json()),
  });

  const { data: wins = [] } = useQuery<Win[]>({
    queryKey: ["/api/wins"],
    queryFn: () => apiRequest("GET", "/api/wins").then(r => r.json()),
  });

  const signalMutation = useMutation({
    mutationFn: (status: string) => apiRequest("PUT", "/api/signal", { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/signal"] }),
  });

  const currentSignal: SignalStatus = (signal?.status as SignalStatus) || 'green';
  const setSignal = (status: SignalStatus) => signalMutation.mutate(status);

  const activeGoals = goals.filter(g => g.progress < 100);
  const recentEpisodes = episodes.slice(0, 5);
  const avgIntensity = recentEpisodes.length > 0 
    ? (recentEpisodes.reduce((acc, curr) => acc + curr.intensity, 0) / recentEpisodes.length).toFixed(1)
    : "0";
  
  const chartData = episodes.slice(0, 7).map(ep => ({
    date: new Date(ep.date || Date.now()).toLocaleDateString('en-US', { weekday: 'short' }),
    intensity: ep.intensity
  })).reverse();

  function normalizeToMonthly(amount: number, cadence: string): number {
    switch (cadence) {
      case "weekly": return amount * 4.33;
      case "biweekly": return amount * 2.17;
      case "monthly": return amount;
      case "quarterly": return amount / 3;
      case "yearly": return amount / 12;
      default: return amount;
    }
  }

  const monthlyIncome = incomeSources.reduce((sum, s) => sum + normalizeToMonthly(s.amount, s.cadence), 0);
  const monthlyBills = userBills.reduce((sum, b) => sum + normalizeToMonthly(b.amount, b.cadence), 0);
  const budgetBalance = monthlyIncome - monthlyBills;
  const hasBudgetData = incomeSources.length > 0 || userBills.length > 0;

  const budgetHealthRatio = monthlyIncome > 0 ? (monthlyIncome - monthlyBills) / monthlyIncome : 0;
  const financeStatus: 'on-track' | 'watch' | 'over' = 
    !hasBudgetData ? 'on-track' :
    budgetHealthRatio >= 0.2 ? 'on-track' :
    budgetHealthRatio >= 0 ? 'watch' : 'over';

  const financeConfig = {
    'on-track': { label: 'Healthy', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'bg-emerald-500' },
    'watch': { label: 'Tight', color: 'text-amber-600', bg: 'bg-amber-50', icon: 'bg-amber-500' },
    'over': { label: 'Over Budget', color: 'text-rose-600', bg: 'bg-rose-50', icon: 'bg-rose-500' },
  };

  const signalColors = {
    green: "bg-emerald-500 shadow-emerald-500/20",
    yellow: "bg-amber-500 shadow-amber-500/20",
    red: "bg-rose-500 shadow-rose-500/20"
  };

  const signalText = {
    green: "Feeling Stable",
    yellow: "Feeling Sensitive",
    red: "In Crisis / Need Space"
  };

  const userName = user?.firstName || user?.email?.split('@')[0] || 'there';
  const recentWins = wins.filter(w => !w.archived).slice(0, 3);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground" data-testid="text-greeting">
              Good morning, {userName}
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay synced and supported with your partner.
            </p>
          </div>

          <Card className="flex-1 lg:max-w-md border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn("h-4 w-4 rounded-full animate-pulse shadow-lg", signalColors[currentSignal])} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Your Signal</p>
                  <p className="text-sm font-medium" data-testid="text-signal-status">{signalText[currentSignal]}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {(['green', 'yellow', 'red'] as SignalStatus[]).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={currentSignal === s ? "default" : "outline"}
                    className={cn(
                      "h-8 w-8 p-0 rounded-full",
                      currentSignal === s && s === 'green' && "bg-emerald-500 hover:bg-emerald-600 border-none",
                      currentSignal === s && s === 'yellow' && "bg-amber-500 hover:bg-amber-600 border-none",
                      currentSignal === s && s === 'red' && "bg-rose-500 hover:bg-rose-600 border-none",
                    )}
                    onClick={() => setSignal(s)}
                    data-testid={`button-signal-${s}`}
                  >
                    <div className={cn("h-2 w-2 rounded-full bg-white", currentSignal !== s && "opacity-50")} />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {incomingAlerts.length > 0 && (
          <div className="space-y-3">
            {incomingAlerts.map((alert) => {
              const alertConfig = ALERT_TYPES.find(a => a.type === alert.alertType) || ALERT_TYPES[0];
              const AlertIcon = alertConfig.icon;
              return (
                <Card key={alert.id} className="border-2 border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 animate-in slide-in-from-top duration-500 shadow-lg" data-testid={`alert-incoming-${alert.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center flex-shrink-0 animate-pulse">
                      <AlertIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-rose-900 dark:text-rose-200">
                        Your partner sent a "{alertConfig.label}" alert
                      </p>
                      <p className="text-sm text-rose-700 dark:text-rose-300 mt-0.5">
                        {alert.message || "They need your support right now."} · {timeAgo(alert.createdAt!)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-300 text-rose-700 hover:bg-rose-100 flex-shrink-0"
                      onClick={() => acknowledgeMutation.mutate(alert.id)}
                      data-testid={`button-acknowledge-${alert.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Got it
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {partner && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Alert Partner
              </CardTitle>
              <CardDescription className="text-xs">
                {canSend 
                  ? "Send a one-tap alert when you need your partner to know how you're feeling. Limited to once every 30 minutes."
                  : `Cooldown active — you can send another alert in ~${cooldownMins} min`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {ALERT_TYPES.map((alert) => {
                  const Icon = alert.icon;
                  return (
                    <Button
                      key={alert.type}
                      disabled={!canSend || sendAlertMutation.isPending}
                      className={cn(
                        "flex flex-col items-center gap-1.5 h-auto py-3 text-white border-none",
                        canSend ? alert.color : "bg-muted text-muted-foreground"
                      )}
                      onClick={() => sendAlertMutation.mutate(alert.type)}
                      data-testid={`button-alert-${alert.type}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{alert.label}</span>
                    </Button>
                  );
                })}
              </div>
              {!canSend && (
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground justify-center">
                  <Clock className="h-3 w-3" />
                  <span>{cooldownMins} minute{cooldownMins !== 1 ? 's' : ''} remaining</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(currentSignal === 'red' || currentSignal === 'yellow') && crisisPlan && (
          <Card className={cn(
            "border-none shadow-xl animate-in slide-in-from-top duration-500",
            currentSignal === 'red' ? "bg-rose-50 text-rose-900" : "bg-amber-50 text-amber-900"
          )}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <ShieldAlert className={cn("h-6 w-6", currentSignal === 'red' ? "text-rose-600" : "text-amber-600")} />
              <div>
                <CardTitle className="text-lg">Active Crisis Plan</CardTitle>
                <CardDescription className={cn(currentSignal === 'red' ? "text-rose-700/70" : "text-amber-700/70")}>
                  Pre-agreed steps for when things feel difficult.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">De-escalation</p>
                <ul className="text-sm space-y-1">
                  {(crisisPlan.deescalation as string[] || []).map((step, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">Immediate Actions</p>
                <ul className="text-sm space-y-1">
                  {(crisisPlan.immediateActions as string[] || []).map((step, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 opacity-60" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/bpd-tracker" className="block group" data-testid="link-emotional-baseline">
            <Card className="glass-panel border-none shadow-sm hover:shadow-md transition-shadow group-hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emotional Baseline</CardTitle>
                <Smile className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-intensity">{avgIntensity}<span className="text-sm font-normal text-muted-foreground">/10 avg</span></div>
                <p className="text-xs text-muted-foreground mt-1">Recent {recentEpisodes.length} entries</p>
                <div className="h-[40px] mt-3 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line 
                        type="monotone" 
                        dataKey="intensity" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2} 
                        dot={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </a>

          <Card className="glass-panel border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shared Goals</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-goals">{activeGoals.length} Active</div>
              <div className="mt-3 space-y-2">
                {activeGoals.slice(0, 3).map(goal => (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="truncate">{goal.title}</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-1.5" />
                  </div>
                ))}
                {activeGoals.length === 0 && (
                  <p className="text-xs text-muted-foreground">No active goals yet.</p>
                )}
              </div>
              <Button variant="link" className="px-0 mt-2 text-xs h-auto" asChild data-testid="link-view-all-goals">
                <a href="/goals">View All →</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("flex items-center gap-2", financeConfig[financeStatus].color)}>
                <div className={cn("h-3 w-3 rounded-full", financeConfig[financeStatus].icon)} />
                <span className="text-xl font-bold" data-testid="text-finance-status">{financeConfig[financeStatus].label}</span>
              </div>
              <div className="mt-3">
                <Progress 
                  value={hasBudgetData ? Math.max(0, Math.min(budgetHealthRatio * 100 + 50, 100)) : 50} 
                  className={cn("h-2", 
                    financeStatus === 'over' && "[&>div]:bg-rose-500",
                    financeStatus === 'watch' && "[&>div]:bg-amber-500",
                    financeStatus === 'on-track' && "[&>div]:bg-emerald-500"
                  )} 
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {!hasBudgetData && "Set up your budget to see your financial health."}
                  {hasBudgetData && financeStatus === 'on-track' && "Your budget has healthy breathing room."}
                  {hasBudgetData && financeStatus === 'watch' && "Budget is tight - bills are close to income."}
                  {hasBudgetData && financeStatus === 'over' && "Bills exceed income - review your budget."}
                </p>
              </div>
              <Button variant="link" className="px-0 mt-1 text-xs h-auto" asChild data-testid="link-view-budget">
                <a href="/finance">View Budget →</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-primary" />
              Recent Wins
            </CardTitle>
            <CardDescription>Gratitude and positive moments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentWins.length === 0 ? (
              <p className="text-muted-foreground text-sm" data-testid="text-no-wins">No wins recorded yet. Head to gratitude to add some!</p>
            ) : (
              <div className="space-y-4">
                {recentWins.map((win) => (
                  <div key={win.id} className="flex gap-3 p-3 rounded-lg bg-muted/50" data-testid={`card-win-${win.id}`}>
                    <div className="mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{win.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {win.author && <span className="text-xs text-muted-foreground">— {win.author}</span>}
                        {win.date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(win.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="link" className="px-0 mt-3 text-xs h-auto" asChild data-testid="link-view-gratitude">
              <a href="/gratitude">View all gratitude entries →</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
