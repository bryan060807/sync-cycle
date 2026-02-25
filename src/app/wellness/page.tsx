"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Mon", score: 6 },
  { name: "Tue", score: 8 },
  { name: "Wed", score: 7 },
  { name: "Thu", score: 9 },
  { name: "Fri", score: 8 },
  { name: "Sat", score: 5 },
  { name: "Sun", score: 7 },
];

export default function WellnessTracker() {
  const [intensity, setIntensity] = useState([7]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      <MobileHeader />

      <main className="flex-1 px-4 pt-20 pb-24 space-y-6">
        <div className="pt-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Wellness Tracker</h2>
          <Button variant="ghost" className="text-[#a855f7] font-bold text-sm">HISTORY</Button>
        </div>

        {/* Chart Card */}
        <Card className="bg-[#1f2937] border-[#374151] rounded-3xl p-2 pt-6">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
                <YAxis hide />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Form */}
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sleep (hrs)</label>
              <Input placeholder="0.0" className="bg-[#111827] border-[#374151] rounded-2xl h-12 text-center" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Energy</label>
              <Input placeholder="1-10" className="bg-[#111827] border-[#374151] rounded-2xl h-12 text-center" />
            </div>
          </div>

          <div className="space-y-4 bg-[#1f2937] p-6 rounded-3xl border border-[#374151]">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-white">Check-in Intensity</label>
              <span className="text-[#14b8a6] font-bold">{intensity[0]}/10</span>
            </div>
            <Slider 
              value={intensity} 
              onValueChange={setIntensity} 
              max={10} 
              step={1} 
              className="py-2"
            />
            <Textarea 
              placeholder="What's on your mind?" 
              className="bg-[#111827] border-[#374151] rounded-2xl h-24 resize-none"
            />
            
            <div className="flex items-center space-x-2 py-2">
              <Checkbox id="anon" className="border-[#374151] data-[state=checked]:bg-[#14b8a6]" />
              <label htmlFor="anon" className="text-xs text-gray-400">Anonymize for partner</label>
            </div>

            <Button className="w-full btn-gradient h-14">
              Log Session
            </Button>
          </div>
        </div>
      </main>

      <MobileNav activeTab="wellness" />
    </div>
  );
}