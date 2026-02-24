import Layout from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Save, 
  AlertTriangle,
  HeartPulse,
  Phone,
  MessageSquareHeart,
  Lightbulb,
  Shield,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CrisisPlan } from "@shared/schema";

interface LocalPlan {
  triggers: string[];
  deescalation: string[];
  immediateActions: string[];
  copingStrategies: string[];
  safeWord: string;
  contact: string;
  secondaryContact: string;
}

export default function CrisisPlanPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: crisisPlan } = useQuery<CrisisPlan>({
    queryKey: ["/api/crisis-plan"],
    queryFn: () => apiRequest("GET", "/api/crisis-plan").then(r => r.json()),
  });

  const [plan, setPlan] = useState<LocalPlan>({
    triggers: [],
    deescalation: [],
    immediateActions: [],
    copingStrategies: [],
    safeWord: "",
    contact: "",
    secondaryContact: ""
  });

  useEffect(() => {
    if (crisisPlan) {
      setPlan({
        triggers: (crisisPlan.triggers as string[]) || [],
        deescalation: (crisisPlan.deescalation as string[]) || [],
        immediateActions: (crisisPlan.immediateActions as string[]) || [],
        copingStrategies: (crisisPlan.copingStrategies as string[]) || [],
        safeWord: crisisPlan.safeWord || "",
        contact: crisisPlan.contact || "",
        secondaryContact: crisisPlan.secondaryContact || ""
      });
    }
  }, [crisisPlan]);

  const savePlanMutation = useMutation({
    mutationFn: (data: LocalPlan) => apiRequest("PUT", "/api/crisis-plan", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crisis-plan"] });
      toast({
        title: "Plan Saved",
        description: "Your shared crisis plan has been updated successfully.",
      });
    },
  });

  const handleSave = () => {
    savePlanMutation.mutate(plan);
  };

  const addItem = (field: 'triggers' | 'deescalation' | 'immediateActions' | 'copingStrategies') => {
    setPlan({ ...plan, [field]: [...plan[field], ""] });
  };

  const removeItem = (field: 'triggers' | 'deescalation' | 'immediateActions' | 'copingStrategies', index: number) => {
    const newItems = [...plan[field]];
    newItems.splice(index, 1);
    setPlan({ ...plan, [field]: newItems });
  };

  const updateItem = (field: 'triggers' | 'deescalation' | 'immediateActions' | 'copingStrategies', index: number, value: string) => {
    const newItems = [...plan[field]];
    newItems[index] = value;
    setPlan({ ...plan, [field]: newItems });
  };

  const progressInfo = useMemo(() => {
    const sections = [
      plan.triggers.some(t => t.trim() !== ""),
      plan.deescalation.some(d => d.trim() !== ""),
      plan.immediateActions.some(a => a.trim() !== ""),
      plan.copingStrategies.some(c => c.trim() !== ""),
      plan.safeWord.trim() !== "",
      plan.contact.trim() !== "" || plan.secondaryContact.trim() !== "",
    ];
    const filled = sections.filter(Boolean).length;
    return { filled, total: sections.length };
  }, [plan]);

  const lastUpdated = crisisPlan?.updatedAt
    ? new Date(crisisPlan.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Crisis Plan</h1>
            <p className="text-muted-foreground mt-1">A pre-agreed blueprint for difficult moments.</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-sm text-muted-foreground" data-testid="text-progress">
                {progressInfo.filled} of {progressInfo.total} sections filled
              </span>
              <div className="h-2 w-32 rounded-full bg-muted overflow-hidden" data-testid="progress-bar">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${(progressInfo.filled / progressInfo.total) * 100}%` }}
                />
              </div>
              {lastUpdated && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="text-last-updated">
                  <Clock className="h-3 w-3" />
                  Last updated {lastUpdated}
                </span>
              )}
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2 shadow-lg shadow-primary/20" disabled={savePlanMutation.isPending} data-testid="button-save-plan">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <MessageSquareHeart className="h-5 w-5" />
              The "Green Period" Rule
            </CardTitle>
            <CardDescription>
              This plan should only be edited when both partners are feeling stable and connected. 
              Decisions made here protect both of you when emotions are high.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-amber-200/50 dark:border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Early Triggers
              </CardTitle>
              <CardDescription>Behaviors or situations that might lead to an episode.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.triggers.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    value={item} 
                    onChange={(e) => updateItem('triggers', i, e.target.value)}
                    placeholder="e.g., Raised voices"
                    data-testid={`input-trigger-${i}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeItem('triggers', i)} className="text-destructive" data-testid={`button-remove-trigger-${i}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem('triggers')} className="w-full" data-testid="button-add-trigger">
                <Plus className="h-4 w-4 mr-2" /> Add Trigger
              </Button>
            </CardContent>
          </Card>

          <Card className="border-rose-200/50 dark:border-rose-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartPulse className="h-5 w-5 text-rose-500" />
                De-escalation Needs
              </CardTitle>
              <CardDescription>Exactly what I need from you when things escalate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.deescalation.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    value={item} 
                    onChange={(e) => updateItem('deescalation', i, e.target.value)}
                    placeholder="e.g., Leave a glass of water outside"
                    data-testid={`input-deescalation-${i}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeItem('deescalation', i)} className="text-destructive" data-testid={`button-remove-deescalation-${i}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem('deescalation')} className="w-full" data-testid="button-add-deescalation">
                <Plus className="h-4 w-4 mr-2" /> Add Need
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Immediate Actions
              </CardTitle>
              <CardDescription>Steps I will take to help myself.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.immediateActions.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    value={item} 
                    onChange={(e) => updateItem('immediateActions', i, e.target.value)}
                    placeholder="e.g., Box breathing for 5 minutes"
                    data-testid={`input-action-${i}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeItem('immediateActions', i)} className="text-destructive" data-testid={`button-remove-action-${i}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem('immediateActions')} className="w-full" data-testid="button-add-action">
                <Plus className="h-4 w-4 mr-2" /> Add Action
              </Button>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/50 dark:border-emerald-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-emerald-500" />
                Coping Strategies
              </CardTitle>
              <CardDescription>Healthy ways to manage overwhelming emotions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.copingStrategies.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    value={item} 
                    onChange={(e) => updateItem('copingStrategies', i, e.target.value)}
                    placeholder="e.g., Write in journal for 10 minutes"
                    data-testid={`input-coping-${i}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeItem('copingStrategies', i)} className="text-destructive" data-testid={`button-remove-coping-${i}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem('copingStrategies')} className="w-full" data-testid="button-add-coping">
                <Plus className="h-4 w-4 mr-2" /> Add Strategy
              </Button>
            </CardContent>
          </Card>

          <Card className="border-violet-200/50 dark:border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-violet-500" />
                Safe Word
              </CardTitle>
              <CardDescription>A word or phrase either partner can use to signal they need space — no questions asked.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                value={plan.safeWord} 
                onChange={(e) => setPlan({ ...plan, safeWord: e.target.value })}
                placeholder="e.g., Pineapple"
                data-testid="input-safe-word"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-primary" />
                Emergency Support
              </CardTitle>
              <CardDescription>Who to call if extra help is needed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Contact</label>
                <Input 
                  value={plan.contact} 
                  onChange={(e) => setPlan({ ...plan, contact: e.target.value })}
                  placeholder="e.g., Therapist: 555-0199"
                  data-testid="input-contact"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Secondary Contact</label>
                <Input 
                  value={plan.secondaryContact} 
                  onChange={(e) => setPlan({ ...plan, secondaryContact: e.target.value })}
                  placeholder="e.g., Crisis Line: 988"
                  data-testid="input-secondary-contact"
                />
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-xs font-bold text-destructive uppercase tracking-widest mb-1">Critical Reminder</p>
                <p className="text-sm text-destructive/80 italic">
                  "I love you, and this plan exists because our relationship is worth protecting."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
