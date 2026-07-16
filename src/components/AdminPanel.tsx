import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GenLayerService } from '../lib/genlayer';
import { useWallet } from '../hooks/useWallet';

export function AdminPanel() {
  const { address } = useWallet();
  const [memberAddress, setMemberAddress] = useState('');
  const [newConstitution, setNewConstitution] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!memberAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const sender = address || '0x0000000000000000000000000000000000000000';
      await GenLayerService.addMember(memberAddress, sender);
      setMemberAddress('');
      alert("Member added successfully!");
    } catch (e: any) {
      setError(e.message || "Failed to add member.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmendConstitution = async () => {
    if (!newConstitution) return;
    setIsLoading(true);
    setError(null);
    try {
      const sender = address || '0x0000000000000000000000000000000000000000';
      await GenLayerService.amendConstitution(newConstitution, sender);
      setNewConstitution('');
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Failed to amend constitution.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-5 border-amber-500/10">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white tracking-tight">Admin Controls</h3>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase text-white/50">Add Member (Sybil Protection)</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={memberAddress}
            onChange={(e) => setMemberAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddMember}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </motion.button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase text-white/50">Amend Constitution</h4>
        <textarea
          value={newConstitution}
          onChange={(e) => setNewConstitution(e.target.value)}
          placeholder="Enter new DAO rules..."
          className="w-full h-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAmendConstitution}
          disabled={isLoading}
          className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors"
        >
          {isLoading ? "Updating..." : "Update Rules"}
        </motion.button>
      </div>

      {error && (
        <p className="text-xs font-mono text-red-400 mt-2 bg-red-500/10 p-2 rounded border border-red-500/20">
          {error}
        </p>
      )}
    </div>
  );
}
