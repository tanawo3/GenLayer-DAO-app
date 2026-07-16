import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { X, Info } from 'lucide-react';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; requestedFunds: number }) => Promise<void>;
}

export function CreateProposalModal({ isOpen, onClose, onSubmit }: CreateProposalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestedFunds, setRequestedFunds] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !requestedFunds) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await onSubmit({
        title,
        description,
        requestedFunds: parseInt(requestedFunds, 10),
      });
      setTitle('');
      setDescription('');
      setRequestedFunds('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit transaction to the network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-4 flex flex-col max-h-[95vh]"
          >
            <div className="glass-panel-heavy shadow-2xl flex flex-col overflow-hidden max-h-full">
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 bg-white/[0.02] shrink-0">
                <h2 className="font-medium text-lg text-white tracking-tight">
                  Create Proposal
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto overflow-x-hidden" data-lenis-prevent="true">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="mb-2 block text-xs font-medium tracking-wide text-white/70">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Q3 Community Grants"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="funds" className="mb-2 block text-xs font-medium tracking-wide text-white/70">
                      Requested Funds (USD)
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-white/50 font-mono text-sm">
                        $
                      </div>
                      <input
                        type="number"
                        id="funds"
                        value={requestedFunds}
                        onChange={(e) => setRequestedFunds(e.target.value)}
                        placeholder="50000"
                        min="1"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-8 pr-4 py-3 text-sm text-white font-medium placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="description" className="block text-xs font-medium tracking-wide text-white/70">
                        Description
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowExample(!showExample)}
                        className="text-xs font-medium text-white/50 hover:text-white transition-colors"
                      >
                        {showExample ? 'Hide example' : 'Show example'}
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {showExample && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 overflow-hidden"
                        >
                          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap">
                            {`This proposal requests funding for a Community Workshop Series.

1. Roadmap:
   - Month 1: Preparation, speaker onboarding.
   - Month 2: Execute 4 online workshops.
   - Month 3: Feedback & report gathering.

2. Deliverables:
   - 4 recorded workshop videos.
   - Final impact report submitted.`}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explain the purpose and execution plan..."
                      rows={5}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.05] focus:outline-none transition-all leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                      required
                    />
                  </div>

                  <div className="rounded-xl bg-blue-500/[0.05] border border-blue-500/20 p-4 flex gap-3 text-blue-100/80 text-sm">
                     <Info className="w-5 h-5 flex-shrink-0 text-blue-400" />
                     <p className="leading-relaxed">
                       GenVM AI will evaluate this proposal against the Constitution. Ensure your request aligns with network rules.
                     </p>
                  </div>
                  
                  {error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
