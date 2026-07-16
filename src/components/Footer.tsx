import React from 'react';
import { Github, Twitter, Disc, ArrowUpRight } from 'lucide-react';
import { GenLayerLogo } from './GenLayerLogo';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-white/5 bg-[#050505] pt-24 pb-12 mt-32 relative overflow-hidden z-20">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
        
        {/* Brand Column */}
        <div className="md:col-span-4 lg:col-span-5 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
            <GenLayerLogo />
            <span className="text-xl font-semibold tracking-tighter text-white">GenLayer Enterprise</span>
          </div>
          <p className="text-white/40 text-sm max-w-xs leading-relaxed font-sans mb-8">
            The world's first decentralized network executing subjective consensus with intelligent algorithms. Built for the next generation of autonomous organizations.
          </p>
          <div className="flex gap-4">
            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all">
              <Disc className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Links Columns */}
        <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
          
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-medium text-sm tracking-widest uppercase mb-2">Protocol</h4>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors flex items-center group">
              Intelligent Contracts
              <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1 group-hover:translate-y-0" />
            </a>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors flex items-center group">
              Subjective Consensus
              <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1 group-hover:translate-y-0" />
            </a>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Validators</a>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-2">
              Status <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-medium text-sm tracking-widest uppercase mb-2">Developers</h4>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Documentation</a>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">GenVM SDK</a>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Audits</a>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Bug Bounty</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-medium text-sm tracking-widest uppercase mb-2">Organization</h4>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">About Us</a>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Careers</a>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Blog</a>
            <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Terms of Service</a>
          </div>

        </div>
      </div>
      
      <div className="mt-24 text-center text-white/20 text-xs font-mono tracking-widest uppercase pb-4">
        © 2026 GenLayer DAO. All rights reserved. <br/>
        <span className="opacity-50 inline-block mt-2">Executed via GenVM Engine</span>
      </div>
    </footer>
  );
};
