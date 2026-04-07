import React from 'react';
import { Home, Image as ImageIcon, Video, Mic, Compass, Folder, CreditCard, Settings, AlertCircle, X, LogOut, ShieldAlert, ShieldCheck, LayoutDashboard, Headphones, Bot, PenTool, Film, Sparkles, Music } from 'lucide-react';

interface SidebarProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  user?: any;
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
  isGeneratingAudio?: boolean;
}

export function Sidebar({ activePage = 'home', onNavigate, onLogout, isOpen = false, onClose, user, isGeneratingImage, isGeneratingVideo, isGeneratingAudio }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] md:hidden transition-opacity"
          onClick={onClose}
        ></div>
      )}
      
      {/* Sidebar Container */}
      <div className={`fixed left-0 md:left-3 lg:left-4 transition-all duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-4' : '-translate-x-[150%]'} top-24 md:top-1/2 md:-translate-y-1/2 z-[100] group`}>
        {/* Rotating border container */}
        <div className="relative rounded-[2rem] md:rounded-full p-[1px] overflow-hidden shadow-float w-[70vw] md:w-[60px] max-w-[280px]">
          {/* Rotating gradient background */}
          <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-40 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Inner Content */}
          <aside className="relative bg-surface/95 backdrop-blur-xl rounded-[calc(2rem-1px)] md:rounded-[calc(9999px-1px)] py-6 md:py-3 px-4 md:px-1.5 flex flex-col items-center gap-5 border border-border-subtle h-[75vh] md:h-auto overflow-y-auto custom-scrollbar">
            
            {/* Mobile Close Button */}
            <div className="md:hidden w-full flex justify-end mb-2">
               <button onClick={onClose} className="p-2 text-text-secondary hover:text-white rounded-full bg-black/40 border border-white/10"><X size={16} /></button>
            </div>

            {/* Top Icons */}
            <div className="flex flex-col gap-3 w-full md:w-auto items-center">
              {[
                { id: 'home', icon: <Home size={20} strokeWidth={activePage === 'home' ? 2 : 1.5} />, label: 'Início' },
                { id: 'generate-image', icon: <ImageIcon size={20} strokeWidth={activePage === 'generate-image' ? 2 : 1.5} />, label: 'Gerar Imagem' },
                { id: 'editor', icon: <PenTool size={20} strokeWidth={activePage === 'editor' ? 2 : 1.5} />, label: 'Editor Pro' },
                { id: 'generate-video', icon: <Video size={20} strokeWidth={activePage === 'generate-video' ? 2 : 1.5} />, label: 'Gerar Vídeo' },
                { id: 'generate-audio', icon: <Music size={20} strokeWidth={activePage === 'generate-audio' ? 2 : 1.5} />, label: 'Gerar Música' },
                { id: 'audio-gallery', icon: <Headphones size={20} strokeWidth={activePage === 'audio-gallery' ? 2 : 1.5} />, label: 'Biblioteca Áudio' },
                { id: 'projects', icon: <Folder size={20} strokeWidth={activePage === 'projects' ? 2 : 1.5} />, label: 'Projetos' },
                { id: 'billing', icon: <CreditCard size={20} strokeWidth={activePage === 'billing' ? 2 : 1.5} />, label: 'Créditos' },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`p-3 md:p-2 flex items-center gap-3 md:justify-center rounded-2xl md:rounded-full transition-colors w-full md:w-auto relative group-icon ${activePage === item.id ? 'bg-accent text-accent-fg shadow-glow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                  title={item.label}
                >
                  <div className="relative flex items-center justify-center">
                     {item.icon}
                     {((item.id === 'generate-image' && isGeneratingImage) || 
                       (item.id === 'generate-video' && isGeneratingVideo) || 
                       (item.id === 'generate-audio' && isGeneratingAudio)) && (
                       <div className="absolute -inset-1.5 rounded-full border border-dashed border-[#FFB800] animate-[spin_3s_linear_infinite]" />
                     )}
                  </div>
                  <span className="md:hidden font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>
            
            {/* Divider */}
            <div className="w-full md:w-6 h-[1px] bg-border-subtle my-1"></div>
            
            {/* Bottom Icons */}
            <div className="flex flex-col gap-3 w-full md:w-auto items-center">
              <button 
                onClick={() => onNavigate?.('settings')}
                className={`p-3 md:p-2 flex items-center gap-3 rounded-2xl md:rounded-full transition-colors w-full md:w-auto ${activePage === 'settings' ? 'bg-accent text-accent-fg shadow-glow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                title="Configurações"
              >
                <Settings size={20} strokeWidth={activePage === 'settings' ? 2 : 1.5} />
                <span className="md:hidden font-medium text-sm">Configurações</span>
              </button>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => onNavigate?.('admin-stats')}
                  className={`p-3 md:p-2 flex items-center gap-3 md:justify-center rounded-2xl md:rounded-full transition-colors w-full md:w-auto ${activePage?.startsWith('admin') ? 'bg-accent text-accent-fg shadow-glow' : 'text-[#FFB800] hover:bg-[#FFB800]/10'}`}
                  title="Painel Admin"
                >
                  <LayoutDashboard size={20} strokeWidth={2} />
                  <span className="md:hidden font-medium text-sm">Painel Admin</span>
                </button>
              )}

              <button 
                onClick={() => onNavigate?.('profile')}
                className={`hidden mt-2 p-2 w-full md:w-8 h-auto md:h-8 flex-col items-center justify-center gap-3 rounded-2xl md:rounded-full overflow-hidden border transition-all ${activePage === 'profile' ? 'border-accent shadow-glow' : 'border-border-subtle hover:border-text-secondary'}`}
                title="Meu Perfil"
              >
                <img src={user?.avatar_url || "https://picsum.photos/seed/user/100/100"} alt="User" referrerPolicy="no-referrer" className="w-8 h-8 md:w-full md:h-full rounded-full object-cover" />
                <span className="md:hidden font-medium text-sm">Meu Perfil</span>
              </button>

              <button 
                onClick={onLogout}
                className="p-3 md:p-2 flex items-center gap-3 rounded-2xl md:rounded-full transition-colors w-full md:w-auto text-red-400 hover:text-red-300 hover:bg-red-500/10"
                title="Sair"
              >
                <LogOut size={20} strokeWidth={1.5} />
                <span className="md:hidden font-medium text-sm">Sair</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
