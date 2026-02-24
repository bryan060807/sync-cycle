import Layout from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Plus, Activity, Pill, Heart, Weight, Trash2 } from "lucide-react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import type { Episode, HealthMetric, Medication } from "@shared/schema";

export default function BPDTracker() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
    queryFn: () => apiRequest("GET", "/api/episodes").then(r => r.json()),
  });

  const { data: healthMetrics = [] } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics"],
    queryFn: () => apiRequest("GET", "/api/health-metrics").then(r => r.json()),
  });

  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
    queryFn: () => apiRequest("GET", "/api/medications").then(r => r.json()),
  });

  const createEpisodeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/episodes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      setTrigger("");
      setNotes("");
      setIntensity([5]);
      toast({ title: "Check-in logged!", description: "Your wellness data has been saved." });
    },
    onError: () => {
      toast({ title: "Couldn't save", description: "Please try again.", variant: "destructive" });
    },
  });

  const createHealthMetricMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/health-metrics", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      setHmWeight("");
      setHmSystolic("");
      setHmDiastolic("");
      setHmBloodSugar("");
      setHmNotes("");
      toast({ title: "Health metric saved!", description: "Your entry has been recorded." });
    },
    onError: () => {
      toast({ title: "Couldn't save", description: "Please try again.", variant: "destructive" });
    },
  });

  const deleteHealthMetricMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/health-metrics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      toast({ title: "Entry deleted" });
    },
  });

  const createMedicationMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/medications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      setMedName("");
      setMedDosage("");
      setMedSchedule("");
      toast({ title: "Medication added!" });
    },
    onError: () => {
      toast({ title: "Couldn't save", description: "Please try again.", variant: "destructive" });
    },
  });

  const updateMedicationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/medications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
    },
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/medications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({ title: "Medication removed" });
    },
  });

  const [intensity, setIntensity] = useState([5]);
  const [trigger, setTrigger] = useState("");
  const [notes, setNotes] = useState("");
  const [isContributing, setIsContributing] = useState(true);

  const [hmWeight, setHmWeight] = useState("");
  const [hmSystolic, setHmSystolic] = useState("");
  const [hmDiastolic, setHmDiastolic] = useState("");
  const [hmBloodSugar, setHmBloodSugar] = useState("");
  const [hmNotes, setHmNotes] = useState("");

  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medSchedule, setMedSchedule] = useState("");

  const handleLog = () => {
    createEpisodeMutation.mutate({
      intensity: intensity[0],
      trigger: trigger || "Unknown",
      notes: notes,
      emotion: intensity[0] > 7 ? 'Angry' : intensity[0] > 4 ? 'Anxious' : 'Neutral',
      isContributed: isContributing
    });
  };

  const handleLogHealthMetric = () => {
    const data: any = {};
    if (hmWeight) data.weight = parseFloat(hmWeight);
    if (hmSystolic) data.bpSystolic = parseInt(hmSystolic);
    if (hmDiastolic) data.bpDiastolic = parseInt(hmDiastolic);
    if (hmBloodSugar) data.bloodSugar = parseFloat(hmBloodSugar);
    if (hmNotes) data.notes = hmNotes;
    if (Object.keys(data).length === 0) {
      toast({ title: "Please fill in at least one field", variant: "destructive" });
      return;
    }
    createHealthMetricMutation.mutate(data);
  };

  const handleAddMedication = () => {
    if (!medName.trim()) {
      toast({ title: "Medication name is required", variant: "destructive" });
      return;
    }
    createMedicationMutation.mutate({
      name: medName.trim(),
      dosage: medDosage.trim() || null,
      schedule: medSchedule.trim() || null,
    });
  };

  const chartData = episodes.map(ep => ({
    date: new Date(ep.date || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    intensity: ep.intensity
  })).reverse();

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Wellness Tracker</h1>
          <p className="text-muted-foreground mt-1">Track your emotional wellness, health metrics, and medications.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-md overflow-hidden relative" data-testid="card-intensity-chart">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 z-0" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Intensity Over Time</CardTitle>
                  <CardDescription>Personal episode intensity history</CardDescription>
                </div>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[300px] relative z-10">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                      <YAxis axisLine={false} tickLine={false} domain={[0, 10]} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                      <Area
                        type="monotone"
                        dataKey="intensity"
                        name="Intensity"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorIntensity)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground" data-testid="text-no-episodes">
                    <p>No episodes logged yet. Use the check-in form to start tracking.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md" data-testid="card-health-metrics">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500" />
                  Health Metrics
                </CardTitle>
                <CardDescription>Log weight, blood pressure, and blood sugar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Weight (lbs)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 150"
                      value={hmWeight}
                      onChange={(e) => setHmWeight(e.target.value)}
                      data-testid="input-hm-weight"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Systolic</label>
                    <Input
                      type="number"
                      placeholder="e.g. 120"
                      value={hmSystolic}
                      onChange={(e) => setHmSystolic(e.target.value)}
                      data-testid="input-hm-systolic"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Diastolic</label>
                    <Input
                      type="number"
                      placeholder="e.g. 80"
                      value={hmDiastolic}
                      onChange={(e) => setHmDiastolic(e.target.value)}
                      data-testid="input-hm-diastolic"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Blood Sugar</label>
                    <Input
                      type="number"
                      placeholder="e.g. 95"
                      value={hmBloodSugar}
                      onChange={(e) => setHmBloodSugar(e.target.value)}
                      data-testid="input-hm-blood-sugar"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <Input
                    placeholder="Optional notes..."
                    value={hmNotes}
                    onChange={(e) => setHmNotes(e.target.value)}
                    data-testid="input-hm-notes"
                  />
                </div>
                <Button
                  onClick={handleLogHealthMetric}
                  disabled={createHealthMetricMutation.isPending}
                  className="w-full"
                  data-testid="button-log-health-metric"
                >
                  <Plus className="mr-2 h-4 w-4" /> Log Health Metric
                </Button>

                {healthMetrics.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Recent Entries</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {healthMetrics.slice(0, 10).map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm" data-testid={`row-health-metric-${m.id}`}>
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <span className="text-muted-foreground text-xs">
                              {new Date(m.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {m.weight && <span data-testid={`text-weight-${m.id}`}><Weight className="inline h-3 w-3 mr-1" />{m.weight} lbs</span>}
                            {m.bpSystolic && m.bpDiastolic && <span data-testid={`text-bp-${m.id}`}>{m.bpSystolic}/{m.bpDiastolic} mmHg</span>}
                            {m.bloodSugar && <span data-testid={`text-sugar-${m.id}`}>{m.bloodSugar} mg/dL</span>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteHealthMetricMutation.mutate(m.id)}
                            data-testid={`button-delete-health-metric-${m.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md" data-testid="card-medications">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-blue-500" />
                  Medications
                </CardTitle>
                <CardDescription>Track your current medications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Name</label>
                    <Input
                      placeholder="Medication name"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      data-testid="input-med-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Dosage</label>
                    <Input
                      placeholder="e.g. 50mg"
                      value={medDosage}
                      onChange={(e) => setMedDosage(e.target.value)}
                      data-testid="input-med-dosage"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Schedule</label>
                    <Input
                      placeholder="e.g. Twice daily"
                      value={medSchedule}
                      onChange={(e) => setMedSchedule(e.target.value)}
                      data-testid="input-med-schedule"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddMedication}
                  disabled={createMedicationMutation.isPending}
                  className="w-full"
                  data-testid="button-add-medication"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Medication
                </Button>

                {medications.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {medications.map((med) => (
                      <div key={med.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid={`row-medication-${med.id}`}>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${!med.active ? 'line-through text-muted-foreground' : ''}`} data-testid={`text-med-name-${med.id}`}>
                            {med.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {med.dosage && <span data-testid={`text-med-dosage-${med.id}`}>{med.dosage}</span>}
                            {med.dosage && med.schedule && ' · '}
                            {med.schedule && <span data-testid={`text-med-schedule-${med.id}`}>{med.schedule}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={med.active ?? true}
                            onCheckedChange={(checked) =>
                              updateMedicationMutation.mutate({ id: med.id, data: { active: checked } })
                            }
                            data-testid={`switch-med-active-${med.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMedicationMutation.mutate(med.id)}
                            data-testid={`button-delete-medication-${med.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8 border-primary/20 shadow-lg shadow-primary/5" data-testid="card-checkin">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Activity className="h-5 w-5" />
                  Log Check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Intensity (1-10)</label>
                    <span className="text-sm font-bold text-primary" data-testid="text-intensity">{intensity[0]}</span>
                  </div>
                  <Slider
                    value={intensity}
                    onValueChange={setIntensity}
                    max={10}
                    step={1}
                    className="py-4"
                    data-testid="slider-intensity"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>Calm</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Trigger (Optional)</label>
                  <Input
                    placeholder="e.g., Work deadline, Argument..."
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    data-testid="input-trigger"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="How are you feeling? What do you need?"
                    className="h-24 resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    data-testid="input-notes"
                  />
                </div>

                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    id="research"
                    checked={isContributing}
                    onChange={(e) => setIsContributing(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    data-testid="checkbox-contribute"
                  />
                  <label htmlFor="research" className="text-xs text-muted-foreground cursor-pointer leading-tight">
                    Anonymize and contribute this entry to the Global BPD Research Database.
                  </label>
                </div>

                <Button
                  onClick={handleLog}
                  className="w-full h-11 shadow-md shadow-primary/10"
                  disabled={createEpisodeMutation.isPending}
                  data-testid="button-log-episode"
                >
                  <Plus className="mr-2 h-4 w-4" /> Save Check-in
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
