'use client';

import { Sparkles, FileText, FileCheck } from 'lucide-react';

export default function ProcessingAnimation() {
  return (
    <div className="flex items-center justify-center gap-8 md:gap-12">
      {/* Left — source document */}
      <div className="relative group">
        <div className="absolute -inset-2 bg-brand-blue/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative w-24 h-28 md:w-28 md:h-32 bg-white rounded-2xl border-2 border-brand-blue/10 shadow-lg shadow-brand-blue/5 flex flex-col items-center justify-center gap-2 transition-transform duration-700 hover:-translate-y-1">
          <FileText className="w-8 h-8 text-brand-blue" />
          <div className="space-y-1 w-14">
            <div className="h-1 bg-brand-blue/20 rounded-full" />
            <div className="h-1 bg-brand-blue/15 rounded-full w-10" />
            <div className="h-1 bg-brand-blue/10 rounded-full w-12" />
          </div>
        </div>
      </div>

      {/* Center — AI processing orb */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-brand-yellow/20 to-brand-blue/20 animate-pulse blur-md" />
        {/* Middle ring */}
        <div className="absolute -inset-2 rounded-full border-2 border-dashed border-brand-yellow/30 animate-[spin_8s_linear_infinite]" />
        {/* Core orb */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-brand-blue to-brand-blue-light rounded-full flex items-center justify-center shadow-xl shadow-brand-blue/30">
          <Sparkles className="w-7 h-7 md:w-9 md:h-9 text-brand-yellow animate-pulse" />
        </div>
        {/* Orbiting dot */}
        <div className="absolute -inset-3 animate-[spin_3s_linear_infinite]">
          <div className="w-2.5 h-2.5 bg-brand-yellow rounded-full shadow-md shadow-brand-yellow/50" />
        </div>
      </div>

      {/* Right — optimized document */}
      <div className="relative group">
        <div className="absolute -inset-2 bg-brand-green/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative w-24 h-28 md:w-28 md:h-32 bg-white rounded-2xl border-2 border-brand-green/20 shadow-lg shadow-brand-green/5 flex flex-col items-center justify-center gap-2 transition-transform duration-700 hover:-translate-y-1">
          <FileCheck className="w-8 h-8 text-brand-green" />
          <div className="space-y-1 w-14">
            <div className="h-1 bg-brand-green/30 rounded-full" />
            <div className="h-1 bg-brand-green/25 rounded-full w-12" />
            <div className="h-1 bg-brand-green/20 rounded-full w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
