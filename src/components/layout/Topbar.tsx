import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Zap, Menu, Loader2, User, Search, Activity } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
  hasNotification?: boolean;
  onNotificationClick?: () => void;
  onNewResult?: () => void;
  stats?: { credits: number; totalGenerations: number };
  currentPage?: string;
  isGenerating?: boolean;
  generationCount?: number;
  onToggleGenerationModal?: () => void;
  onLogoClick?: () => void;
  onNavigate?: (page: string) => void;
}

export function Topbar({ 
  onMenuClick, 
  hasNotification, 
  onNotificationClick, 
  onNewResult, 
  stats, 
  currentPage, 
  isGenerating,
  generationCount,
  onToggleGenerationModal,
  onLogoClick,
  onNavigate
}: TopbarProps) {

  const [showSuccess, setShowSuccess] = useState(false);
  const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');

  const currentCredits = stats?.credits ?? user.credits ?? 0;
  const currentGens = stats?.totalGenerations ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-bg-base/80 backdrop-blur-xl border-b border-border-subtle z-40 transition-all duration-300">
      <div className="h-full pr-4 pl-4 md:pr-8 md:pl-28 lg:pl-32 flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl bg-surface border border-border-subtle text-text-primary"
          >
            <Menu size={20} />
          </button>
          
          {/* Logo - Hide on home to avoid redundancy with the big dashboard logo */}
          {currentPage !== 'home' && (
            <div 
              className="flex items-center gap-2 cursor-pointer group animate-in fade-in slide-in-from-left-4 duration-500 relative z-50"
              onClick={onLogoClick}
            >
              <img src="/logo.png" alt="Conversio.AI" className="h-10 md:h-12 w-auto object-contain" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
          {/* Enriched Stats Section - Right Aligned */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 bg-surface/30 p-1.5 rounded-2xl border border-border-subtle/50">
            {/* Account ID / Info */}
            <div className="hidden lg:flex flex-col items-end px-3 border-r border-border-subtle/30">
              <span className="text-[8px] text-text-tertiary uppercase font-bold tracking-widest">Conta ID</span>
              <span className="text-[11px] font-mono text-text-secondary">#{(user.id || '0000').toString().slice(-5)}</span>
            </div>

            {/* Credits Section */}
            <div className="flex items-center gap-2.5 px-3 py-1 bg-surface/50 border border-border-subtle rounded-xl shadow-inner min-w-[90px]">
              <Zap size={12} className="text-[#FFB800]" fill="#FFB800" fillOpacity={0.2} />
              <div className="flex flex-col">
                <span className="text-[8px] leading-none text-text-tertiary uppercase tracking-wider font-bold mb-1">Créditos</span>
                <span className="text-sm leading-none font-bold text-text-primary">{currentCredits}</span>
              </div>
            </div>

            {/* Generations Section */}
            <div className="flex items-center gap-2.5 px-3 py-1 bg-surface/50 border border-border-subtle rounded-xl shadow-inner min-w-[90px]">
              <Activity size={12} className="text-accent" />
              <div className="flex flex-col">
                <span className="text-[8px] leading-none text-text-tertiary uppercase tracking-wider font-bold mb-1">Gerações</span>
                <span className="text-sm leading-none font-bold text-text-primary">{currentGens}</span>
              </div>
            </div>


          </div>

          {/* Modern Generating Indicator */}
          {isGenerating && (
            <button 
              onClick={onToggleGenerationModal}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full animate-in fade-in zoom-in duration-300 hover:bg-accent/20 transition-all group/gen"
            >
               <div className="relative">
                 <Loader2 size={12} className="text-accent animate-spin" />
                 {generationCount && generationCount > 0 && (
                   <span className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-accent text-black text-[7px] font-black flex items-center justify-center rounded-full border border-bg-base">
                     {generationCount}
                   </span>
                 )}
               </div>
               <span className="text-[9px] font-black uppercase tracking-wider text-accent group-hover/gen:text-white transition-colors">Gerando</span>
            </button>
          )}


          <div className="flex items-center gap-2">
            <button 
              onClick={onNotificationClick}
              className={`p-2.5 rounded-xl border transition-all duration-300 group relative ${
                hasNotification 
                ? 'bg-accent/10 border-accent/50 text-accent ring-2 ring-accent/20' 
                : 'bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong'
              }`}
            >
              {hasNotification ? (
                <>
                  <BellRing size={20} className="animate-[wiggle_1s_infinite]" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-bg-base shadow-lg"></span>
                </>
              ) : (
                <Bell size={20} />
              )}
            </button>
            <button 
              onClick={() => onNavigate?.('profile')}
              className={`p-2.5 rounded-xl border transition-all shadow-float ${currentPage === 'profile' ? 'bg-accent border-accent text-accent-fg shadow-glow' : 'bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong'}`}
            >
              <User size={20} />
            </button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
      `}} />
    </header>
  );
}
