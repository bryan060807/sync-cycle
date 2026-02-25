"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Activity, Plus, History, Loader2, Weight, HeartPulse, Droplets, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function HealthPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [isLogging, setIsLogging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [weight, setWeight] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [pulseRate, setPulseRate] = useState("");
  const [notes, setNotes] = useState("");

  const metricsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "health-metrics"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, user]);

  const { data: metrics, loading } = useCollection(metricsQuery);

  const handleLogMetric = async () => {
    if (!db || !user) return;
    setIsSaving(true);

    const data = {
      weight: weight ? parseFloat(weight) : null,
      systolic: systolic ? parseInt(systolic) : null,
      diastolic: diastolic ? parseInt(diastolic) : null,
      bloodSugar: bloodSugar ? parseFloat(bloodSugar) : null,
      pulseRate: pulseRate ? parseInt(pulseRate) : null,
      notes: notes.trim(),
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "health-metrics"), data)
      .then(() => {
        setWeight("");
        setSystolic("");
        setDiastolic("");
        setBloodSugar("");
        setPulseRate("");
        setNotes("");
        setIsLogging(false);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "health-metrics",
          operation: "create",
          requestResourceData: data,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-24 space-y-6">
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Health Metrics</h2>
          <p className="text-gray-500 text-sm mt-1">Track your vitals and physical well-being.</p>
        </div>

        <Dialog open={isLogging} onOpenChange={setIsLogging}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 bg-purple-600 hover:bg-purple-700 rounded-2xl shadow-lg shadow-purple-600/20 gap-2 font-bold">
              <Plus className="h-5 w-5" /> Log New Metrics
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#1f2937] border-[#374151] rounded-t-3xl sm:rounded-3xl text-white">
            <DialogHeader>
              <DialogTitle className="text-white">New Health Entry</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Weight (kg)</Label>
                <Input 
                  type="number" 
                  placeholder="0.0" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Systolic (mmHg)</Label>
                <Input 
                  type="number" 
                  placeholder="120" 
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Diastolic (mmHg)</Label>
                <Input 
                  type="number" 
                  placeholder="80" 
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Blood Sugar</Label>
                <Input 
                  type="number" 
                  placeholder="mg/dL" 
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Pulse Rate</Label>
                <Input 
                  type="number" 
                  placeholder="BPM" 
                  value={pulseRate}
                  onChange={(e) => setPulseRate(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white" 
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Notes (Optional)</Label>
                <Textarea 
                  placeholder="Any physical symptoms?" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl h-24 text-white resize-none" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleLogMetric} 
                disabled={isSaving}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-xl font-bold"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-gray-500" />
            <h3 className="font-bold text-gray-300">Metric History</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : metrics?.map((metric: any) => (
            <Card key={metric.id} className="bg-[#1f2937] border-[#374151] rounded-3xl overflow-hidden shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                    {metric.createdAt?.toDate ? format(metric.createdAt.toDate(), "MMM dd, yyyy") : "Processing..."}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {metric.weight && (
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-teal-500" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Weight</span>
                        <span className="text-white font-black">{metric.weight} kg</span>
                      </div>
                    </div>
                  )}
                  {(metric.systolic || metric.diastolic) && (
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-4 w-4 text-red-500" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-tighter">B.P.</span>
                        <span className="text-white font-black">{metric.systolic || "--"}/{metric.diastolic || "--"}</span>
                      </div>
                    </div>
                  )}
                  {metric.bloodSugar && (
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-orange-500" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Sugar</span>
                        <span className="text-white font-black">{metric.bloodSugar} mg/dL</span>
                      </div>
                    </div>
                  )}
                  {metric.pulseRate && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-teal-400" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Pulse</span>
                        <span className="text-white font-black">{metric.pulseRate} BPM</span>
                      </div>
                    </div>
                  )}
                </div>

                {metric.notes && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-gray-400 italic leading-relaxed">"{metric.notes}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {!loading && metrics?.length === 0 && (
            <div className="text-center py-20 bg-[#111827] rounded-3xl border border-dashed border-[#374151]">
              <Activity className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500">No health data yet.</p>
              <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">Start tracking vitals</p>
            </div>
          )}
        </div>
      </main>

      <MobileNav activeTab="wellness" />
    </div>
  );
}