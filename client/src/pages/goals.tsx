import Layout from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Target, Pencil, Trash2, Archive, ChevronDown, CheckSquare, Square, ExternalLink, CheckCircle2, ListTodo } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Goal, GoalTask } from "@shared/schema";

type GoalFormData = {
  title: string;
  description: string;
  category: string;
  assignedTo: string;
  goalType: string;
  targetDate: string;
};

const emptyForm: GoalFormData = {
  title: "",
  description: "",
  category: "Wellness",
  assignedTo: "Both",
  goalType: "short-term",
  targetDate: "",
};

function GoalTaskList({ goalId }: { goalId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { data: tasks = [] } = useQuery<GoalTask[]>({
    queryKey: [`/api/goals/${goalId}/tasks`],
    queryFn: () => apiRequest("GET", `/api/goals/${goalId}/tasks`).then(r => r.json()),
  });

  const addTaskMutation = useMutation({
    mutationFn: (title: string) => apiRequest("POST", `/api/goals/${goalId}/tasks`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goalId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setNewTaskTitle("");
    },
    onError: () => toast({ title: "Couldn't add task", variant: "destructive" }),
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/goal-tasks/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goalId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/goal-tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/goals/${goalId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2 group" data-testid={`task-item-${task.id}`}>
          <Checkbox
            checked={task.completed ?? false}
            onCheckedChange={() => toggleTaskMutation.mutate(task.id)}
            data-testid={`checkbox-task-${task.id}`}
          />
          <span className={`flex-1 text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => deleteTaskMutation.mutate(task.id)}
            data-testid={`button-delete-task-${task.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Input
          placeholder="Add a task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && newTaskTitle.trim()) addTaskMutation.mutate(newTaskTitle.trim()); }}
          className="h-8 text-sm"
          data-testid={`input-new-task-${goalId}`}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          disabled={!newTaskTitle.trim() || addTaskMutation.isPending}
          onClick={() => { if (newTaskTitle.trim()) addTaskMutation.mutate(newTaskTitle.trim()); }}
          data-testid={`button-add-task-${goalId}`}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function GoalCard({ goal, onEdit, onSyncTodoist }: { goal: Goal; onEdit: (goal: Goal) => void; onSyncTodoist?: (goalId: string) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const { data: tasks = [] } = useQuery<GoalTask[]>({
    queryKey: [`/api/goals/${goal.id}/tasks`],
    queryFn: () => apiRequest("GET", `/api/goals/${goal.id}/tasks`).then(r => r.json()),
  });

  const computedProgress = tasks.length > 0
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : goal.progress;

  const updateProgressMutation = useMutation({
    mutationFn: (progress: number) => apiRequest("PATCH", `/api/goals/${goal.id}`, { progress }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/goals/${goal.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal deleted" });
    },
    onError: () => toast({ title: "Couldn't delete goal", variant: "destructive" }),
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/goals/${goal.id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/archived"] });
      toast({ title: "Goal archived" });
    },
    onError: () => toast({ title: "Couldn't archive goal", variant: "destructive" }),
  });

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-border/50 bg-white/50 dark:bg-card/50 backdrop-blur-sm" data-testid={`card-goal-${goal.id}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" data-testid={`badge-category-${goal.id}`}>
                {goal.category}
              </Badge>
              <Badge variant={goal.goalType === "long-term" ? "default" : "outline"} data-testid={`badge-type-${goal.id}`}>
                {goal.goalType === "long-term" ? "Long-term" : "Short-term"}
              </Badge>
            </div>
            <CardTitle className="text-xl">{goal.title}</CardTitle>
            {goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              onClick={() => onEdit(goal)}
              data-testid={`button-edit-${goal.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-500"
              onClick={() => archiveMutation.mutate()}
              data-testid={`button-archive-${goal.id}`}
            >
              <Archive className="h-4 w-4" />
            </Button>
            {onSyncTodoist && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-violet-600"
                onClick={() => onSyncTodoist(goal.id)}
                title="Sync tasks to Todoist"
                data-testid={`button-sync-todoist-${goal.id}`}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => deleteMutation.mutate()}
              data-testid={`button-delete-${goal.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Target: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "No date"}</span>
            <span data-testid={`text-progress-${goal.id}`}>{computedProgress}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={computedProgress} className="h-2 flex-1" />
            {tasks.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/10 h-7 px-2 text-xs"
                onClick={() => updateProgressMutation.mutate(Math.min(100, goal.progress + 10))}
                data-testid={`button-update-${goal.id}`}
              >
                +10%
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">ME</div>
              {goal.assignedTo !== "Me" && (
                <div className="h-8 w-8 rounded-full border-2 border-background bg-chart-4 flex items-center justify-center text-xs font-bold text-white">PR</div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
              data-testid={`button-expand-tasks-${goal.id}`}
            >
              {tasks.length > 0 ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span className="text-xs">{completedCount}/{tasks.length} tasks</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {expanded && (
            <div className="pt-2">
              <GoalTaskList goalId={goal.id} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TodoistTasksPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showTodoist, setShowTodoist] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState("");

  const { data: todoistTasks = [], isError: todoistError } = useQuery<any[]>({
    queryKey: ["/api/todoist/tasks"],
    queryFn: () => apiRequest("GET", "/api/todoist/tasks").then(r => r.json()),
    enabled: showTodoist,
    retry: false,
  });

  const addTodoistTaskMutation = useMutation({
    mutationFn: (content: string) => apiRequest("POST", "/api/todoist/tasks", { content }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
      setNewTaskContent("");
      toast({ title: "Task added to Todoist!" });
    },
    onError: () => toast({ title: "Couldn't add task", variant: "destructive" }),
  });

  const closeTodoistTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/todoist/tasks/${id}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
      toast({ title: "Task completed!" });
    },
    onError: () => toast({ title: "Couldn't complete task", variant: "destructive" }),
  });

  return (
    <Card className="border-violet-200 dark:border-violet-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-violet-600" />
            Todoist Tasks
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={() => setShowTodoist(!showTodoist)}
            data-testid="button-toggle-todoist"
          >
            {showTodoist ? "Hide" : "Show"}
            <ChevronDown className={cn("h-3 w-3 transition-transform", showTodoist && "rotate-180")} />
          </Button>
        </div>
      </CardHeader>
      {showTodoist && (
        <CardContent>
          {todoistError ? (
            <p className="text-sm text-muted-foreground">Could not connect to Todoist. Make sure it's set up.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a task to Todoist..."
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newTaskContent.trim()) addTodoistTaskMutation.mutate(newTaskContent.trim()); }}
                  className="h-8 text-sm"
                  data-testid="input-todoist-new-task"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 border-violet-200 text-violet-600 hover:bg-violet-50"
                  disabled={!newTaskContent.trim() || addTodoistTaskMutation.isPending}
                  onClick={() => { if (newTaskContent.trim()) addTodoistTaskMutation.mutate(newTaskContent.trim()); }}
                  data-testid="button-todoist-add-task"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {todoistTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active tasks in Todoist.</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {todoistTasks.slice(0, 20).map((task: any) => (
                    <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group" data-testid={`todoist-task-${task.id}`}>
                      <button
                        onClick={() => closeTodoistTaskMutation.mutate(task.id)}
                        className="h-4 w-4 rounded-full border-2 border-violet-300 hover:border-violet-500 hover:bg-violet-500 flex-shrink-0 transition-colors flex items-center justify-center"
                        data-testid={`button-todoist-complete-${task.id}`}
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{task.content}</p>
                        {task.due?.string && (
                          <p className="text-xs text-muted-foreground">{task.due.string}</p>
                        )}
                      </div>
                      {task.priority > 1 && (
                        <Badge variant="outline" className={cn(
                          "text-[10px] px-1.5",
                          task.priority === 4 && "border-rose-300 text-rose-600",
                          task.priority === 3 && "border-amber-300 text-amber-600",
                          task.priority === 2 && "border-blue-300 text-blue-600",
                        )}>
                          P{5 - task.priority}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function Goals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>(emptyForm);
  const [activeTab, setActiveTab] = useState<"short-term" | "long-term">("short-term");
  const [showArchived, setShowArchived] = useState(false);

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: () => apiRequest("GET", "/api/goals").then(r => r.json()),
  });

  const { data: archivedGoals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals/archived"],
    queryFn: () => apiRequest("GET", "/api/goals/archived").then(r => r.json()),
    enabled: showArchived,
  });

  const filteredGoals = goals.filter(g => g.goalType === activeTab);

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      closeDialog();
      toast({ title: "Goal created!", description: "Keep working towards your dreams together." });
    },
    onError: () => toast({ title: "Couldn't create goal", description: "Please try again.", variant: "destructive" }),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      closeDialog();
      toast({ title: "Goal updated!" });
    },
    onError: () => toast({ title: "Couldn't update goal", variant: "destructive" }),
  });

  const syncToTodoistMutation = useMutation({
    mutationFn: (goalId: string) => apiRequest("POST", `/api/todoist/sync-goal/${goalId}`).then(r => r.json()),
    onSuccess: (data: { projectName: string; tasksCreated: number }) => {
      toast({ title: `Synced to Todoist!`, description: `Created ${data.tasksCreated} tasks in "${data.projectName}"` });
    },
    onError: () => toast({ title: "Sync failed", description: "Could not connect to Todoist. Make sure it's connected.", variant: "destructive" }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingGoal(null);
    setFormData(emptyForm);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      category: goal.category || "Wellness",
      assignedTo: goal.assignedTo || "Both",
      goalType: goal.goalType || "short-term",
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      assignedTo: formData.assignedTo,
      goalType: formData.goalType,
      targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : null,
    };

    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data: payload });
    } else {
      createGoalMutation.mutate({ ...payload, progress: 0 });
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Shared Goals</h1>
            <p className="text-muted-foreground mt-1">Dreams you're building together.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg shadow-primary/20" size="sm" data-testid="button-new-goal">
                  <Plus className="h-4 w-4" /> New Goal
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Goal title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="input-goal-title"
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  data-testid="input-goal-description"
                />
                <Select value={formData.goalType} onValueChange={(v) => setFormData({ ...formData, goalType: v })}>
                  <SelectTrigger data-testid="select-goal-type">
                    <SelectValue placeholder="Goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-term">Short-term</SelectItem>
                    <SelectItem value="long-term">Long-term</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wellness">Wellness</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Relationship">Relationship</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formData.assignedTo} onValueChange={(v) => setFormData({ ...formData, assignedTo: v })}>
                  <SelectTrigger data-testid="select-assigned">
                    <SelectValue placeholder="Assigned to" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Me">Me</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  data-testid="input-target-date"
                />
                <Button
                  onClick={handleSave}
                  className="w-full"
                  disabled={!formData.title || createGoalMutation.isPending || updateGoalMutation.isPending}
                  data-testid="button-save-goal"
                >
                  {editingGoal ? "Save Changes" : "Create Goal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="flex gap-2" data-testid="tabs-goal-type">
          <Button
            variant={activeTab === "short-term" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("short-term")}
            data-testid="tab-short-term"
          >
            Short-term
          </Button>
          <Button
            variant={activeTab === "long-term" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("long-term")}
            data-testid="tab-long-term"
          >
            Long-term
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={openEditDialog} onSyncTodoist={(id) => syncToTodoistMutation.mutate(id)} />
          ))}

          <button
            className="h-full min-h-[200px] rounded-xl border-2 border-dashed border-muted hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary"
            onClick={() => {
              setFormData({ ...emptyForm, goalType: activeTab });
              setDialogOpen(true);
            }}
            data-testid="button-add-goal-card"
          >
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-medium">Add a new goal</span>
          </button>
        </div>

        <TodoistTasksPanel />

        <div className="border-t border-border/50 pt-6">
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowArchived(!showArchived)}
            data-testid="button-toggle-archived"
          >
            <Archive className="h-4 w-4" />
            Archived Goals
            <ChevronDown className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`} />
          </Button>

          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {archivedGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-2">No archived goals yet.</p>
              ) : (
                archivedGoals.map((goal) => (
                  <Card key={goal.id} className="opacity-60 border-border/30" data-testid={`card-archived-goal-${goal.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex gap-2 flex-wrap mb-1">
                        <Badge variant="secondary">{goal.category}</Badge>
                        <Badge variant="outline">{goal.goalType === "long-term" ? "Long-term" : "Short-term"}</Badge>
                      </div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Target: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "No date"}</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2 mt-2" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
