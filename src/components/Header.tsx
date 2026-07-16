import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, Activity, RefreshCw, Coins } from 'lucide-react';
import { cn } from '../lib/utils';
import { useWallet } from '../hooks/useWallet';
import { getContractAddress, setContractAddress, deployNewContract, GenLayerService } from '../lib/genlayer';
import { GenLayerLogo } from './GenLayerLogo';
import daoCode from '../../contracts/dao.py?raw';

export function Header() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const contractAddress = getContractAddress();
  const isDeployed = contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000";
  const [isDeploying, setIsDeploying] = useState(false);
  const [treasury, setTreasury] = useState(0);
  const [reputation, setReputation] = useState<number | null>(null);
  const [isFunding, setIsFunding] = useState(false);

  useEffect(() => {
    if (isDeployed) {
      GenLayerService.getTreasuryBalance().then(setTreasury);
      if (address) {
        GenLayerService.getReputation(address).then(setReputation);
      }
    }
  }, [isDeployed, address]);

  const handleDeploy = async () => {
    if (!address) {
      alert("Please connect your wallet first.");
      connect();
      return;
    }
    
    setIsDeploying(true);
    localStorage.removeItem('DAO_CONTRACT_ADDRESS_V9');
    await deployNewContract(daoCode, address);
    setIsDeploying(false);
  };

  const handleFund = async () => {
    if (!address) return;
    const amountStr = prompt("Enter amount of GEN ATTO to fund Treasury:");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    
    try {
      setIsFunding(true);
      await GenLayerService.fundTreasury(address, amount);
      const newBal = await GenLayerService.getTreasuryBalance();
      setTreasury(newBal);
      alert("Treasury funded successfully!");
    } catch (e: any) {
      alert("Funding failed: " + e.message);
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-5xl z-50 glass-panel-heavy rounded-full px-2 transition-all">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center text-white">
            <GenLayerLogo className="h-full w-full" />
          </div>
          <span className="font-semibold text-[18px] tracking-tight text-white font-sans">GenLayer</span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {isDeployed && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
               <Coins className="w-3.5 h-3.5" />
               <span className="text-[11px] tracking-widest uppercase font-mono">Treasury: {treasury}</span>
               <button onClick={handleFund} disabled={isFunding} className="ml-2 hover:text-white transition-colors">
                  {isFunding ? '...' : '+'}
               </button>
            </div>
          )}
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
             <span className="text-[11px] tracking-widest uppercase font-mono">Synced</span>
          </div>
          
          {address ? (
            <div className="flex items-center gap-4 z-50">
            {address && reputation !== null && (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
               >
                 <Activity className={cn("w-4 h-4", reputation >= 50 ? "text-green-400" : "text-red-400")} />
                 <span className="text-sm font-mono text-white/80">REP: {reputation}</span>
               </motion.div>
            )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeploy}
                disabled={isDeploying}
                className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 transition-colors disabled:opacity-50 text-[12px] font-mono tracking-widest uppercase"
              >
              {isDeploying ? 'Deploying...' : 'Deploy Contract'}
              </motion.button>
              <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/90 text-[13px] font-mono tracking-wider">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <button 
                onClick={disconnect}
                className="flex items-center justify-center p-2.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Disconnect"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={connect}
              disabled={isConnecting}
              className="px-5 py-2.5 rounded-full bg-white text-black text-[12px] font-mono font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </motion.button>
          )}
        </nav>
      </div>
    </header>
  );
}
