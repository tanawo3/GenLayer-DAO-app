import React from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Shield, Network, Code2 } from 'lucide-react';

export const AboutProject = () => {
  const cards = [
    {
      title: 'Intelligent Contracts on GenVM',
      description: 'Unlike traditional blockchain smart contracts that only understand strict deterministic logic, this DAO is powered by GenLayer Intelligent Contracts written in Python. It allows the protocol to natively understand, parse, and evaluate unstructured data using LLMs directly on-chain.',
      icon: <Code2 className="w-6 h-6 text-emerald-400" />,
      colSpan: 'md:col-span-2 lg:col-span-2',
      delay: 0.1
    },
    {
      title: 'Subjective Consensus',
      description: 'The GenLayer network uses a unique Leader-Validator architecture. When a proposal is submitted, a Leader AI node evaluates it. Then, Validator AI nodes independently critique the Leader’s reasoning to reach Byzantine fault-tolerant consensus.',
      icon: <Network className="w-6 h-6 text-purple-400" />,
      colSpan: 'md:col-span-1 lg:col-span-1',
      delay: 0.2
    },
    {
      title: 'On-Chain AI Audits',
      description: 'Every governance proposal is automatically subjected to rigorous AI deep-scanning. The protocol intercepts prompt-injection attacks, analyzes governance risks, and generates a Global Risk Index before any human ever votes.',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      colSpan: 'md:col-span-1 lg:col-span-1',
      delay: 0.3
    },
    {
      title: 'Autonomous Governance',
      description: 'This architecture represents the future of decentralized organizations: eliminating the reliance on human multi-sigs for complex decisions. The DAO operates with semantic understanding, automatically enforcing its constitution through mathematical and subjective algorithms.',
      icon: <BrainCircuit className="w-6 h-6 text-rose-400" />,
      colSpan: 'md:col-span-2 lg:col-span-2',
      delay: 0.4
    }
  ];

  return (
    <div className="w-full mb-24 relative z-20">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Protocol Architecture</h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: card.delay, ease: [0.16, 1, 0.3, 1] }}
            className={`bento-card p-8 flex flex-col gap-6 ${card.colSpan} group`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              {card.icon}
            </div>
            
            <div>
              <h3 className="text-xl font-medium tracking-tight mb-3 text-white">
                {card.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed font-sans">
                {card.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
