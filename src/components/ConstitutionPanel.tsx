import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

interface ConstitutionPanelProps {
  constitution: string;
}

export function ConstitutionPanel({ constitution }: ConstitutionPanelProps) {
  const safeConstitution = String(constitution || "");
  const lines = safeConstitution.split('\n').filter(Boolean);

  return (
    <div className="glass-panel p-6 relative overflow-hidden">
      <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white mb-1">Network Rules</h2>
          <p className="text-xs text-white/50 font-mono uppercase tracking-widest">Protocol_Directives</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
        </div>
      </div>
      
      <div className="space-y-4">
        {lines.map((line, i) => {
          const text = line.replace(/^\d+\.\s*/, '');
          return (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="flex gap-4 items-start"
            >
              <div className="w-6 h-6 rounded-full flex-shrink-0 bg-white/5 text-white/70 text-[11px] flex items-center justify-center font-medium mt-0.5 border border-white/10 font-mono">
                {i + 1}
              </div>
              <p className="text-sm text-white/70 leading-relaxed pt-0.5">
                {text}
              </p>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-8 rounded-xl bg-white/[0.02] p-4 border border-white/5 flex items-start gap-3">
        <div className="mt-1.5 flex-shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>
        </div>
        <p className="text-xs leading-relaxed text-white/50">
          The GenVM AI strictly enforces these rules during execution. <span className="text-white/90 font-medium">Rule violation results in automatic rejection</span>.
        </p>
      </div>
    </div>
  );
}
