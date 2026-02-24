import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Heart, Stars, Plus, MessageCircleHeart, Pencil, Trash2, Archive, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Win } from "@shared/schema";

export default function Gratitude() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newWin, setNewWin] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();

  const { data: wins = [] } = useQuery<Win[]>({
    queryKey: ["/api/wins"],
    queryFn: () => apiRequest("GET", "/api/wins").then(r => r.json()),
  });

  const { data: archivedWins = [] } = useQuery<Win[]>({
    queryKey: ["/api/wins/archived"],
    queryFn: () => apiRequest("GET", "/api/wins/archived").then(r => r.json()),
  });

  const invalidateWins = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/wins"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wins/archived"] });
  };

  const createWinMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/wins", data),
    onSuccess: () => {
      invalidateWins();
      setNewWin("");
      toast({
        title: "Win Posted!",
        description: "Sharing gratitude strengthens your connection.",
      });
    },
    onError: (error) => {
      console.error("Failed to create win:", error);
      toast({
        title: "Couldn't post",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateWinMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      apiRequest("PATCH", `/api/wins/${id}`, { text }),
    onSuccess: () => {
      invalidateWins();
      setEditingId(null);
      setEditText("");
      toast({ title: "Win updated!", description: "Your gratitude entry has been saved." });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const deleteWinMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/wins/${id}`),
    onSuccess: () => {
      invalidateWins();
      setDeleteConfirmId(null);
      toast({ title: "Win deleted", description: "The entry has been removed." });
    },
    onError: () => {
      toast({ title: "Delete failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const archiveWinMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/wins/${id}/archive`),
    onSuccess: () => {
      invalidateWins();
      toast({ title: "Win archived", description: "Moved to your archived section." });
    },
    onError: () => {
      toast({ title: "Archive failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (!newWin.trim()) return;
    createWinMutation.mutate({
      text: newWin,
      author: user?.firstName || user?.email?.split('@')[0] || "Me",
    });
  };

  const handleArchiveAll = async () => {
    for (const win of wins) {
      await apiRequest("POST", `/api/wins/${win.id}/archive`);
    }
    invalidateWins();
    toast({ title: "All wins archived", description: "Your wins have been moved to the archive." });
  };

  const startEditing = (win: Win) => {
    setEditingId(win.id);
    setEditText(win.text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  const renderWinCard = (win: Win, isArchived = false) => (
    <Card
      key={win.id}
      className={`group hover:shadow-md transition-all duration-300 border-border/50 bg-white/50 dark:bg-card/50 backdrop-blur-sm relative overflow-hidden ${isArchived ? "opacity-70" : ""}`}
      data-testid={`card-win-${win.id}`}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-chart-3" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-chart-3/10 flex items-center justify-center text-chart-3 text-xs font-bold">
              {(win.author || 'A')[0].toUpperCase()}
            </div>
            <span className="text-sm font-bold text-foreground">{win.author || 'Anonymous'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">{win.date ? new Date(win.date).toLocaleDateString() : 'Today'}</span>
            {!isArchived && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-chart-3"
                  onClick={() => startEditing(win)}
                  data-testid={`button-edit-win-${win.id}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-amber-500"
                  onClick={() => archiveWinMutation.mutate(win.id)}
                  data-testid={`button-archive-win-${win.id}`}
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteConfirmId(win.id)}
                  data-testid={`button-delete-win-${win.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {editingId === win.id ? (
          <div className="space-y-3">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="border-chart-3/20 focus-visible:ring-chart-3"
              data-testid={`input-edit-win-${win.id}`}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-chart-3 hover:bg-chart-3/90 text-white"
                onClick={() => updateWinMutation.mutate({ id: win.id, text: editText })}
                disabled={updateWinMutation.isPending || !editText.trim()}
                data-testid={`button-save-win-${win.id}`}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEditing}
                data-testid={`button-cancel-edit-${win.id}`}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : deleteConfirmId === win.id ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive font-medium">Are you sure you want to delete this win?</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteWinMutation.mutate(win.id)}
                disabled={deleteWinMutation.isPending}
                data-testid={`button-confirm-delete-${win.id}`}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                data-testid={`button-cancel-delete-${win.id}`}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-foreground leading-relaxed italic">"{win.text}"</p>
            <div className="mt-4 flex justify-end">
              <Heart className="h-4 w-4 text-rose-400 fill-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Wins & Gratitude</h1>
            <p className="text-muted-foreground mt-1">A shared space to celebrate your growth.</p>
          </div>
          <div className="flex items-center gap-3">
            {wins.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-amber-500"
                onClick={handleArchiveAll}
                data-testid="button-archive-all"
              >
                <Archive className="h-4 w-4" /> Archive All
              </Button>
            )}
            <Stars className="h-8 w-8 text-chart-3 animate-pulse" />
          </div>
        </div>

        <Card className="bg-chart-3/5 border-chart-3/20 shadow-lg shadow-chart-3/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-chart-3">
              <MessageCircleHeart className="h-5 w-5" />
              Appreciate Your Partner
            </CardTitle>
            <CardDescription>What's something small or large you're grateful for today?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="e.g., Thank you for listening to me today without judgment." 
              value={newWin}
              onChange={(e) => setNewWin(e.target.value)}
              className="min-h-[100px] bg-white dark:bg-card border-chart-3/20 focus-visible:ring-chart-3"
              data-testid="input-gratitude"
            />
            <Button 
              onClick={handleAdd} 
              className="bg-chart-3 hover:bg-chart-3/90 text-white gap-2 w-full md:w-auto"
              disabled={createWinMutation.isPending}
              data-testid="button-post-win"
            >
              <Plus className="h-4 w-4" /> Post Victory
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wins.length === 0 ? (
            <div className="col-span-2 p-8 border-2 border-dashed border-muted rounded-2xl flex flex-col items-center justify-center text-center">
              <Stars className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No wins yet. Start sharing your gratitude!</p>
            </div>
          ) : (
            wins.map((win) => renderWinCard(win))
          )}
        </div>

        {archivedWins.length > 0 && (
          <div className="space-y-4">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-toggle-archived"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`} />
              <span className="text-sm font-medium">Archived ({archivedWins.length})</span>
            </button>
            {showArchived && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {archivedWins.map((win) => renderWinCard(win, true))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
