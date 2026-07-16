import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ProposalsList } from './components/ProposalsList';
import { ConstitutionPanel } from './components/ConstitutionPanel';
import { CreateProposalModal } from './components/CreateProposalModal';
import { SmoothScroll } from './components/SmoothScroll';
import { MagneticCursor } from './components/MagneticCursor';
import { Proposal } from './types';
import { useWallet } from './hooks/useWallet';
import { GenLayerService, getContractAddress } from './lib/genlayer';
import { motion } from 'motion/react';
import { FloatingToken } from './components/FloatingToken';
import { AboutProject } from './components/AboutProject';
import { Footer } from './components/Footer';
import { initializeGlobalSounds } from './lib/audio';
import { AdminPanel } from './components/AdminPanel';
import { AuroraText } from './components/AuroraText';

const titleText = "Protocol Governance".split("");

export default function App() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [constitution, setConstitution] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useWallet();

  const fetchData = async () => {
    const contractAddr = getContractAddress();
    if (contractAddr === '0x0000000000000000000000000000000000000000' || !contractAddr) {
      setProposals([]);
      setConstitution('');
      setIsLoading(false);
      return;
    }

    try {
      const [propData, constData] = await Promise.all([
        GenLayerService.getProposals(),
        GenLayerService.getConstitution()
      ]);
      setProposals(propData);
      setConstitution(constData);
    } catch (error) {
      console.log("Network state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const cleanupSounds = initializeGlobalSounds();
    return () => {
      if (cleanupSounds) cleanupSounds();
    };
  }, []);

  const handleCreateProposal = async (data: { title: string; description: string; requestedFunds: number }) => {
    if (!address) {
      throw new Error("Please connect your wallet first.");
    }
    await GenLayerService.submitProposal(data.title, data.description, data.requestedFunds, address);
    await fetchData();
  };

  return (
    <SmoothScroll>
      <MagneticCursor />
      <div className="min-h-[100dvh] bg-[#0a0a0a] flex flex-col font-sans text-[#ededed] relative selection:bg-white/20 selection:text-white">
        
        {/* Subtle Background Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white opacity-[0.015] blur-[120px] pointer-events-none rounded-full" />

        <Header />
        
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-40 pb-0 relative z-10 flex flex-col">
          
          <FloatingToken />

          {/* Vercel / Linear Hero with Awwwards Animation */}
          <motion.div 
            className="flex flex-col items-center text-center mb-24 perspective-[1000px] relative z-20"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="px-3 py-1 mb-6 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-mono tracking-widest uppercase"
            >
              Intelligent Contract V8
            </motion.div>
            
            <AuroraText as="h1" className="text-5xl md:text-7xl font-semibold tracking-tighter text-white leading-tight mb-6 max-w-3xl flex flex-wrap justify-center overflow-hidden py-2">
              {titleText.map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ y: 100, rotateX: -90, opacity: 0 }}
                  animate={{ y: 0, rotateX: 0, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.03,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="inline-block transform-style-3d origin-bottom"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </AuroraText>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/50 text-lg md:text-xl font-normal max-w-2xl leading-relaxed mb-10"
            >
              Shape the future of the network. Propose, vote, and execute completely autonomously on GenLayer.
            </motion.p>
            
            {getContractAddress() !== '0x0000000000000000000000000000000000000000' && getContractAddress() && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-white text-black rounded-full font-semibold text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] relative overflow-hidden group"
              >
                <span className="relative z-10">Create Proposal</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
              </motion.button>
            )}
          </motion.div>

          <AboutProject />

          <div className="w-full space-y-12 pb-24 relative z-20">
            {isLoading ? (
              <div className="glass-panel h-64 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin mb-4"></div>
                <span className="text-white/50 font-mono text-sm tracking-widest">SYNCING STATE...</span>
              </div>
            ) : getContractAddress() === '0x0000000000000000000000000000000000000000' || !getContractAddress() ? (
              <div className="glass-panel h-64 flex flex-col items-center justify-center text-center p-8 border-dashed border-white/10">
                <span className="text-lg text-white font-medium mb-2 tracking-tight">Protocol Offline</span>
                <p className="text-white/50 text-sm">Deploy the Intelligent Contract via the GenLayer network to initiate governance.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8">
                  <ProposalsList proposals={proposals} onProposalsChange={fetchData} />
                </div>
                <div className="lg:col-span-4 sticky top-32 flex flex-col gap-8">
                  <AdminPanel />
                  <ConstitutionPanel constitution={constitution} />
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />

        <CreateProposalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateProposal}
        />
      </div>
    </SmoothScroll>
  );
}
