
"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Pill, Plus, Clock, Trash2, Calendar, Loader2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function MedicationsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [schedule, setSchedule] = useState("");
  const [frequency, setFrequency] = useState("");

  const medsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "medications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: medications, loading } = useCollection(medsQuery);

  const handleAddMed = async () => {
    if (!db || !user || !name.trim()) return;
    setIsSaving(true);

    const data = {
      name: name.trim(),
      dosage: dosage.trim(),
      schedule: schedule.trim(),
      frequency: frequency.trim(),
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "medications"), data)
      .then(() => {
        setName("");
        setDosage("");
        setSchedule("");
        setFrequency("");
        setIsAdding(false);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "medications",
          operation: "create",
          requestResourceData: data,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleDeleteMed = async (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, "medications", id)).catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: `medications/${id}`,
        operation: "delete",
      });
      errorEmitter.emit("permission-error", permissionError);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-24 space-y-6">
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Medications</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your prescriptions and supplements.</p>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-600/20 gap-2 font-bold">
              <Plus className="h-5 w-5" /> Add New Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#1f2937] border-[#374151] rounded-t-3xl sm:rounded-3xl text-white">
            <DialogHeader>
              <DialogTitle className="text-white">New Medication Entry</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Medication Name</Label>
                <Input 
                  placeholder="e.g. Sertraline" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Dosage</Label>
                  <Input 
                    placeholder="e.g. 50mg" 
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Frequency</Label>
                  <Input 
                    placeholder="e.g. Daily" 
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Schedule</Label>
                <Input 
                  placeholder="e.g. Morning after breakfast" 
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="bg-[#111827] border-[#374151] rounded-xl h-12 text-white" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddMed} 
                disabled={isSaving || !name.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Medication"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-gray-500" />
            <h3 className="font-bold text-gray-300">Active Regimen</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : medications?.map((med: any) => (
            <Card key={med.id} className="bg-[#1f2937] border-[#374151] rounded-3xl overflow-hidden shadow-xl group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/10 rounded-2xl">
                      <Pill className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white">{med.name}</h4>
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-tighter">{med.dosage}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteMed(med.id)}
                    className="text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 bg-[#111827] p-3 rounded-2xl border border-[#374151]/30">
                    <Calendar className="h-4 w-4 text-teal-400" />
                    <div className="flex flex-col">
                      <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Frequency</span>
                      <span className="text-xs text-gray-200 font-bold">{med.frequency || "Not set"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#111827] p-3 rounded-2xl border border-[#374151]/30">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <div className="flex flex-col">
                      <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Schedule</span>
                      <span className="text-xs text-gray-200 font-bold truncate">{med.schedule || "Not set"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && medications?.length === 0 && (
            <div className="text-center py-20 bg-[#111827] rounded-3xl border border-dashed border-[#374151]">
              <Info className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500">No medications logged.</p>
              <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">Keep your health synced</p>
            </div>
          )}
        </div>
      </main>

      <MobileNav activeTab="wellness" />
    </div>
  );
}
