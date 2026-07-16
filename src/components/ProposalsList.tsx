import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Proposal } from '../types';
import { cn } from '../lib/utils';
import { GenLayerService } from '../lib/genlayer';
import { useWallet } from '../hooks/useWallet';
import { MagicCard } from './MagicCard';

interface ProposalsListProps {
  proposals: Proposal[];
  onProposalsChange: () => void;
}

export function ProposalsList({ proposals, onProposalsChange }: ProposalsListProps) {
  const { address } = useWallet();
  const [filter, setFilter] = useState<'All' | 'Pending Check' | 'Voting' | 'Delivery' | 'Finished' | 'Rejected'>('All');

  const handleEvaluate = async (id: string) => {
    const sender = address || '0x0000000000000000000000000000000000000000';
    await GenLayerService.evaluateProposal(id, sender);
    onProposalsChange();
  };

  const filteredProposals = proposals.filter((proposal) => {
    if (filter === 'All') return true;
    if (filter === 'Pending Check') return proposal.state === 'FLAGGED';
    if (filter === 'Voting') return proposal.state === 'PENDING' || proposal.state === 'APPEALED';
    if (filter === 'Delivery') return proposal.state === 'APPROVED' || proposal.state === 'AWAITING_DELIVERY';
    if (filter === 'Finished') return proposal.state === 'EXECUTED';
    if (filter === 'Rejected') return proposal.state === 'REJECTED' || proposal.state === 'DEFEATED' || proposal.state === 'DELIVERY_REJECTED';
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3 mb-0">
          Proposals
          <span className="bg-white/10 text-white/70 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-white/5">
            {filteredProposals.length}
          </span>
        </h2>
        
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-full">
          {(['All', 'Pending Check', 'Voting', 'Delivery', 'Finished', 'Rejected'] as const).map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className="relative px-4 py-1.5 text-xs font-medium tracking-wide rounded-full transition-all duration-300 z-10"
             >
               {filter === f && (
                 <motion.div
                   layoutId="active-filter"
                   className="absolute inset-0 bg-white/10 rounded-full z-[-1] border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                   transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                 />
               )}
               <span className={cn(
                 "relative z-10 transition-colors duration-300",
                 filter === f ? "text-white" : "text-white/50 hover:text-white/80"
               )}>
                 {f}
               </span>
             </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProposals.map((proposal) => (
            <ProposalCard 
              key={proposal.id} 
              proposal={proposal} 
              onEvaluate={() => handleEvaluate(proposal.id)} 
            />
          ))}
          {filteredProposals.length === 0 && (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass-panel flex flex-col items-center justify-center py-24 text-center p-6 border-dashed border-white/10"
            >
              <h3 className="text-lg font-medium tracking-tight text-white mb-2">No Proposals Found</h3>
              <p className="max-w-md text-sm text-white/50">
                {filter === 'All' ? 'Initiate protocol sequence. Awaiting first proposal.' : 'No data modules match current filter parameters.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const ProposalCard: React.FC<{ proposal: Proposal; onEvaluate: () => Promise<void> }> = ({ proposal, onEvaluate }) => {
  const { address } = useWallet();
  const [evaluating, setEvaluating] = useState(false);
  const [voting, setVoting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (proposal.state === 'FLAGGED') {
      setEvaluating(true);
    } else {
      setEvaluating(false);
    }
  }, [proposal.state]);

  const handleTriggerEval = async () => {
    setEvaluating(true);
    setError(null);
    try {
      await onEvaluate();
    } catch (e: any) {
      setError(e.message || "Consensus failed.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleVote = async (support: boolean) => {
    setVoting(true);
    setError(null);
    try {
      const sender = address || '0x0000000000000000000000000000000000000000';
      await GenLayerService.castVote(proposal.id, support, sender);
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Voting failed.");
      setVoting(false);
    }
  };

  const handleFinalize = async () => {
    setVoting(true);
    setError(null);
    try {
      const sender = address || '0x0000000000000000000000000000000000000000';
      await GenLayerService.finalizeProposal(proposal.id, sender);
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Finalization failed.");
      setVoting(false);
    }
  };

  const handleVeto = async () => {
    setVoting(true);
    setError(null);
    try {
      const sender = address || '0x0000000000000000000000000000000000000000';
      await GenLayerService.vetoProposal(proposal.id, sender);
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Veto failed.");
      setVoting(false);
    }
  };

  const handleAppeal = async () => {
    const reason = prompt("Enter appeal reason:");
    if (!reason) return;
    setVoting(true);
    setError(null);
    try {
      const sender = address || '0x0000000000000000000000000000000000000000';
      await GenLayerService.fileAppeal(proposal.id, reason, sender);
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Appeal failed.");
      setVoting(false);
    }
  };

  const handleSubmitDelivery = async () => {
    const url = prompt("Enter the URL to your completed work (e.g., GitHub, IPFS):");
    if (!url) return;
    setVoting(true);
    setError(null);
    try {
      const sender = address || '0x0000000000000000000000000000000000000000';
      await GenLayerService.submitDelivery(proposal.id, url, sender);
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Submit delivery failed.");
      setVoting(false);
    }
  };

  const handleVerifyDelivery = async () => {
    setVoting(true);
    setError(null);
    try {
      const sender = address || '0x0000000000000000000000000000000000000000';
      await GenLayerService.verifyAndPayout(proposal.id, sender);
      onProposalsChange();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to verify delivery");
    } finally {
      setVoting(false);
    }
  };

  const handleAuditLive = async () => {
    setVoting(true);
    setError(null);
    try {
      const sender = address || '0x0000000000000000000000000000000000000000';
      await GenLayerService.auditLiveProject(proposal.id, sender);
      onProposalsChange();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to audit live project");
    } finally {
      setVoting(false);
    }
  };

  const handleRaiseDispute = async () => {
    setVoting(true);
    setError(null);
    try {
      const reason = prompt("Enter reason for Multi-Stage AI Dispute:");
      if (!reason) return;
      const sender = address || '0x0000000000000000000000000000000000000000';
      await GenLayerService.raiseDispute(proposal.id, reason, sender);
      onProposalsChange();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to raise dispute");
    } finally {
      setVoting(false);
    }
  };

  const getStatusConfig = () => {
    switch (proposal.state) {
      case 'PENDING':
        return { className: 'text-blue-400 border-blue-400/30 bg-blue-400/10', text: 'Voting Active' };
      case 'APPEALED':
        return { className: 'text-purple-400 border-purple-400/30 bg-purple-400/10 animate-pulse', text: 'Appeal Active' };
      case 'APPROVED':
        return { className: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10', text: 'Passed (Finalize to Escrow)' };
      case 'AWAITING_DELIVERY':
        return { className: 'text-blue-400 border-blue-400/30 bg-blue-400/10', text: 'Awaiting Delivery' };
      case 'DELIVERY_REJECTED':
        return { className: 'text-red-400 border-red-400/30 bg-red-400/10', text: 'Delivery Rejected (Funds Refunded)' };
      case 'REJECTED':
        return { className: 'text-red-400 border-red-400/30 bg-red-400/10', text: 'Rejected' };
      case 'FLAGGED':
        return { className: 'text-amber-400 border-amber-400/30 bg-amber-400/10 animate-pulse', text: 'AI Flagged' };
      case 'EXECUTED':
        return { className: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10', text: 'Executed & Paid' };
      case 'DEFEATED':
        return { className: 'text-white/50 border-white/10 bg-white/5', text: 'Defeated' };
      default:
        return { className: 'text-white/70 border-white/10 bg-white/5', text: proposal.state || 'Unknown' };
    }
  };

  const Status = getStatusConfig();
  const totalVotes = (proposal.votesFor || 0) + (proposal.votesAgainst || 0);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <MagicCard
      layout
      layoutId={`card-${proposal.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      className="group relative glass-panel p-6 flex flex-col gap-5 overflow-hidden perspective-[1000px]"
      gradientColor="rgba(59,130,246,0.15)"
      gradientSize={300}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between relative z-10">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("px-2.5 py-1 text-[11px] font-mono font-medium rounded-full border", Status.className)}>
              {evaluating ? "Syncing..." : Status.text}
            </div>
            <span className="text-[11px] font-mono font-medium py-1 px-2.5 rounded-full bg-white/5 text-white/50 border border-white/5">ID: {String(proposal.id || "").split('-')[1]?.slice(-4) || '0000'}</span>
            <span className="text-[11px] font-mono font-medium py-1 px-2.5 rounded-full bg-white/5 text-white/50 border border-white/5">{new Date(proposal.createdAt).toLocaleDateString()}</span>
            {proposal.riskScore !== undefined && (
               <span className={cn(
                 "text-[11px] font-mono font-medium py-1 px-2.5 rounded-full border",
                 proposal.riskScore > 7000 ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                 proposal.riskScore > 4000 ? 'border-amber-400/30 text-amber-400 bg-amber-400/10' :
                 'border-emerald-400/30 text-emerald-400 bg-emerald-400/10'
               )}>
                 Risk: {(proposal.riskScore / 100).toFixed(0)}%
               </span>
            )}
          </div>
          
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-2">{proposal.title}</h3>
            <p className="text-sm leading-relaxed text-white/60 font-normal sm:max-w-2xl">{proposal.description}</p>
            {proposal.state === 'REJECTED' && proposal.aiReasoning && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                <h4 className="text-red-400 text-[11px] font-mono tracking-widest uppercase mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Blocked by AI Security Shield
                </h4>
                <p className="text-red-200/80 text-sm">{proposal.aiReasoning}</p>
              </motion.div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-sm font-mono font-medium text-white/80 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="text-white/40">Req:</span> ${proposal.requestedFunds.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-mono font-medium text-white/80 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="text-white/40">From:</span> {proposal.creator.slice(0,6)}...{proposal.creator.slice(-4)}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 pt-4 sm:pt-0 flex flex-col gap-3 min-w-[200px] relative z-10">
          {(proposal.state === 'APPROVED' || proposal.state === 'REJECTED' || proposal.state === 'FLAGGED') && (
            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinalize}
                disabled={voting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              >
                {voting ? "Processing..." : "Finalize Proposal"}
              </motion.button>
              
              {proposal.state === 'REJECTED' && (
                <div className="flex flex-col sm:flex-row gap-2 w-full mt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAppeal}
                    disabled={voting}
                    className="flex-1 px-5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {voting ? "Processing..." : "File Manual Appeal"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRaiseDispute}
                    disabled={voting}
                    className="flex-1 px-5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {voting ? "Processing..." : "Raise Multi-Stage Dispute"}
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {proposal.state === 'AWAITING_DELIVERY' && (
             <div className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
               <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Escrow Delivery</h4>
               {!proposal.deliveryUrl ? (
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={handleSubmitDelivery}
                   disabled={voting}
                   className="w-full px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all disabled:opacity-50"
                 >
                   {voting ? "Processing..." : "Submit Work URL"}
                 </motion.button>
               ) : (
                 <>
                   <div className="flex items-center justify-between gap-2 mb-2">
                     <a href={proposal.deliveryUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate">
                       {proposal.deliveryUrl}
                     </a>
                     <button onClick={handleSubmitDelivery} disabled={voting} className="text-[10px] text-white/50 hover:text-white/90 border border-white/10 px-2 py-1 rounded bg-white/5 whitespace-nowrap">
                       Edit URL
                     </button>
                   </div>
                   <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={handleVerifyDelivery}
                     disabled={voting}
                     className="w-full px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all disabled:opacity-50"
                   >
                     {voting ? "Verifying..." : "Verify via AI & Payout"}
                   </motion.button>
                 </>
               )}
             </div>
          )}

          {error && (
            <p className="text-xs font-mono text-red-400 text-center mt-1 z-10 relative">
              {error}
            </p>
          )}

          {(proposal.state === 'PENDING' || proposal.state === 'APPEALED') && (
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 bg-white/5">
               <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 text-center mb-1">Awaiting Input</h4>
               <div className="flex gap-2 w-full">
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleVote(true)}
                   disabled={voting}
                   className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 transition-all disabled:opacity-50 border border-white/5"
                 >
                   Yes ({proposal.votesFor || 0})
                 </motion.button>
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleVote(false)}
                   disabled={voting}
                   className="flex-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-medium py-2 transition-all disabled:opacity-50"
                 >
                   No ({proposal.votesAgainst || 0})
                 </motion.button>
               </div>
               
               {(proposal.votesFor || 0) + (proposal.votesAgainst || 0) > 0 && (
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={handleTriggerEval}
                   disabled={evaluating}
                   className="w-full mt-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 transition-all disabled:opacity-50"
                 >
                   {evaluating ? "Executing..." : "Evaluate via GenVM"}
                 </motion.button>
               )}
               
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={handleVeto}
                 disabled={voting}
                 className="w-full mt-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-sm font-medium py-1 transition-all disabled:opacity-50"
               >
                 Admin Veto
               </motion.button>
            </div>
          )}
          
          {(proposal.state === 'EXECUTED' || proposal.state === 'DEFEATED') && (
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 bg-white/5">
               <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1 text-center">Final Tally</h4>
               <div className="flex items-center gap-2 w-full mb-2">
                 <div className="flex-1 text-center py-1.5 rounded-lg bg-white/5 text-white/90 font-medium text-sm border border-white/5">Yes: {proposal.votesFor || 0}</div>
                 <div className="flex-1 text-center py-1.5 rounded-lg bg-white/5 text-white/50 font-medium text-sm border border-white/5">No: {proposal.votesAgainst || 0}</div>
               </div>
               
               {proposal.state === 'EXECUTED' && (
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={handleAuditLive}
                   disabled={voting}
                   className="w-full rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-sm font-medium py-2 transition-all disabled:opacity-50"
                 >
                   {voting ? "Auditing..." : "Audit Live Project (Reputation Decay)"}
                 </motion.button>
               )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(proposal.aiReasoning || proposal.deliverySummary) && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            className="overflow-hidden border-t border-white/10 pt-6 mt-4"
          >
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5 relative">
              <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] font-mono uppercase tracking-widest text-white/50 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  GenVM AI Oracle
                </div>
                {proposal.state === 'DEFEATED' || proposal.state === 'REJECTED' || proposal.state === 'DELIVERY_REJECTED' ? (
                  <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-red-400 border border-red-400/20 px-2 py-0.5 rounded-full bg-red-400/10">Violation Detected</span>
                ) : (
                  <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full bg-emerald-400/10">Protocol Passed</span>
                )}
              </div>
              <div className="space-y-4">
                {proposal.aiReasoning && (
                  <div>
                    <h5 className="text-[10px] font-mono uppercase text-white/30 mb-1">Risk Evaluation</h5>
                    <p className="text-sm leading-relaxed text-white/70 font-mono">
                      {proposal.aiReasoning.replace('[Validator Consensus] ', '').replace('[Consensus reached] ', '')}
                    </p>
                  </div>
                )}
                {proposal.deliverySummary && (
                  <div>
                    <h5 className="text-[10px] font-mono uppercase text-white/30 mb-1 mt-3 border-t border-white/5 pt-3">Delivery Verification</h5>
                    <p className="text-sm leading-relaxed text-emerald-400/80 font-mono">
                      {proposal.deliverySummary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MagicCard>
  );
}
