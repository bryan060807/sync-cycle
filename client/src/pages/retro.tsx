import Layout from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { 
  ClipboardCheck, 
  Calendar,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  Target,
  CheckCircle,
  Pencil,
  Trash2,
  Smile
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Retro } from "@shared/schema";

const MOOD_OPTIONS = [
  { value: 1, label: "Rough", emoji: "😣" },
  { value: 2, label: "Meh", emoji: "😕" },
  { value: 3, label: "Okay", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great", emoji: "😄" },
];

export default function RetroPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [wentWell, setWentWell] = useState("");
  const [disconnected, setDisconnected] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: retros = [] } = useQuery<Retro[]>({
    queryKey: ["/api/retros"],
    queryFn: () => apiRequest("GET", "/api/retros").then(r => r.json()),
  });

  const createRetroMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/retros", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retros"] });
      resetForm();
      toast({
        title: "Retro Submitted",
        description: "Weekly maintenance complete. Great job checking in!",
      });
    },
  });

  const updateRetroMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/retros/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retros"] });
      resetForm();
      toast({
        title: "Retro Updated",
        description: "Your reflection has been updated.",
      });
    },
  });

  const deleteRetroMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/retros/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retros"] });
      toast({
        title: "Retro Deleted",
        description: "Your reflection has been removed.",
      });
    },
  });

  const resetForm = () => {
    setWentWell("");
    setDisconnected("");
    setNextSteps("");
    setMood(null);
    setEditingId(null);
  };

  const handleEdit = (retro: Retro) => {
    setWentWell(retro.wentWell || "");
    setDisconnected(retro.disconnected || "");
    setNextSteps(retro.nextSteps || "");
    setMood(retro.mood || null);
    setEditingId(retro.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    deleteRetroMutation.mutate(id);
  };

  const handleSubmit = () => {
    if (!wentWell || !disconnected) return;
    const payload = {
      date: new Date().toISOString(),
      wentWell,
      disconnected,
      nextSteps,
      mood,
    };

    if (editingId) {
      updateRetroMutation.mutate({ id: editingId, data: payload });
    } else {
      createRetroMutation.mutate(payload);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getMoodDisplay = (moodValue: number | null | undefined) => {
    if (!moodValue) return null;
    const option = MOOD_OPTIONS.find(m => m.value === moodValue);
    return option ? `${option.emoji} ${option.label}` : null;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Weekly Retro</h1>
          <p className="text-muted-foreground mt-1">Reflect on your week together to grow stronger.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20 shadow-lg shadow-primary/5">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  {editingId ? "Edit Reflection" : "Week of"}{" "}
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </CardTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Smile className="h-4 w-4 text-amber-500" />
                    How are you feeling this week?
                  </label>
                  <div className="flex gap-2" data-testid="mood-selector">
                    {MOOD_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMood(option.value)}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer ${
                          mood === option.value
                            ? "border-primary bg-primary/10 scale-105"
                            : "border-muted hover:border-primary/40"
                        }`}
                        data-testid={`mood-option-${option.value}`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    What went well this week?
                  </label>
                  <Textarea 
                    placeholder="Celebrations, small wins, moments of connection..." 
                    value={wentWell}
                    onChange={(e) => setWentWell(e.target.value)}
                    className="min-h-[100px]"
                    data-testid="input-went-well"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Target className="h-4 w-4 text-rose-500" />
                    Where did we feel disconnected?
                  </label>
                  <Textarea 
                    placeholder="Misunderstandings, triggers, missed needs..." 
                    value={disconnected}
                    onChange={(e) => setDisconnected(e.target.value)}
                    className="min-h-[100px]"
                    data-testid="input-disconnected"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold flex items-center gap-2 text-primary">
                    <MessageCircle className="h-4 w-4" />
                    Next steps for next week?
                  </label>
                  <Textarea 
                    placeholder="What will we try differently?" 
                    value={nextSteps}
                    onChange={(e) => setNextSteps(e.target.value)}
                    className="min-h-[100px]"
                    data-testid="input-next-steps"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleSubmit} 
                    className="flex-1 h-12 text-lg"
                    disabled={!wentWell || !disconnected || createRetroMutation.isPending || updateRetroMutation.isPending}
                    data-testid="button-submit-retro"
                  >
                    {editingId ? "Update Reflection" : "Submit Reflection"}
                  </Button>
                  {editingId && (
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      className="h-12"
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <h3 className="font-heading font-bold text-lg flex items-center gap-2 px-1">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Past Reflections
            </h3>
            <div className="space-y-4">
              {retros.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-muted rounded-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-muted-foreground">No retros yet. Start your first reflection today!</p>
                </div>
              ) : (
                retros.map((retro) => {
                  const isExpanded = expandedId === retro.id;
                  return (
                    <Card
                      key={retro.id}
                      className="hover:border-primary/30 transition-colors group"
                      data-testid={`card-retro-${retro.id}`}
                    >
                      <CardHeader
                        className="p-4 cursor-pointer"
                        onClick={() => toggleExpand(retro.id)}
                        data-testid={`toggle-retro-${retro.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">
                              Week of {retro.date ? new Date(retro.date).toLocaleDateString() : "Recently"}
                            </CardTitle>
                            {retro.mood && (
                              <span className="text-base" data-testid={`mood-display-${retro.id}`}>
                                {MOOD_OPTIONS.find(m => m.value === retro.mood)?.emoji}
                              </span>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent className="px-4 pb-4 pt-0 space-y-4" data-testid={`content-retro-${retro.id}`}>
                          {retro.mood && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Mood:</span> {getMoodDisplay(retro.mood)}
                            </div>
                          )}
                          {retro.wentWell && (
                            <div className="space-y-1">
                              <p className="text-xs font-bold flex items-center gap-1 text-emerald-600">
                                <CheckCircle className="h-3 w-3" /> Went Well
                              </p>
                              <p className="text-sm text-foreground whitespace-pre-wrap" data-testid={`text-went-well-${retro.id}`}>
                                {retro.wentWell}
                              </p>
                            </div>
                          )}
                          {retro.disconnected && (
                            <div className="space-y-1">
                              <p className="text-xs font-bold flex items-center gap-1 text-rose-600">
                                <Target className="h-3 w-3" /> Disconnected
                              </p>
                              <p className="text-sm text-foreground whitespace-pre-wrap" data-testid={`text-disconnected-${retro.id}`}>
                                {retro.disconnected}
                              </p>
                            </div>
                          )}
                          {retro.nextSteps && (
                            <div className="space-y-1">
                              <p className="text-xs font-bold flex items-center gap-1 text-primary">
                                <MessageCircle className="h-3 w-3" /> Next Steps
                              </p>
                              <p className="text-sm text-foreground whitespace-pre-wrap" data-testid={`text-next-steps-${retro.id}`}>
                                {retro.nextSteps}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(retro);
                              }}
                              data-testid={`button-edit-retro-${retro.id}`}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(retro.id);
                              }}
                              data-testid={`button-delete-retro-${retro.id}`}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
