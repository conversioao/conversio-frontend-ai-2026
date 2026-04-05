import React, { useState, useRef, useEffect } from 'react';
import { ParticlesBackground } from './ui/ParticlesBackground';
import { Send, Settings2, ChevronDown, Zap, Loader2, Sparkles, Music, History, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { ConfirmationModal } from './ui/ConfirmationModal';

export function AudioGenerator() {
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [instrumentalOnly, setInstrumentalOnly] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle'|'generating'>('idle');
  const [showToast, setShowToast] = useState(false);
  const [backgroundTasks, setBackgroundTasks] = useState<number>(0);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  }>({ title: '', message: '', onConfirm: () => {} });

  const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');

  const fetchModels = async () => {
    try {
      const res = await apiFetch('/models?type=audio');
      const data = await res.json();
      if (data.success && data.models.length > 0) {
        setAvailableModels(data.models);
        setSelectedModel(data.models[0]);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchModels();
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDropdownClick = (e: React.MouseEvent, dropdown: string) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user.id || loading) return;
    setLoading(true);
    try {
      const endpoint = '/generate/voice';
      const bodyPayload = {
        userId: user.id,
        prompt,
        type: 'musica',
        style: selectedStyle,
        instrumental: instrumentalOnly,
        model: selectedModel?.id === 'v4' ? 'V4' : selectedModel?.id === 'v5' ? 'V5' : selectedModel?.name || 'Music Gen'
      };

      setStatus('generating');
      setTimeout(() => setStatus('idle'), 3000);

      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (data.success) {
        setPrompt('');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
        
        if (data.batchId) pollGeneration(data.batchId);

        if (data.newCredits !== undefined) {
           const updatedUser = { ...user, credits: data.newCredits };
           localStorage.setItem('conversio_user', JSON.stringify(updatedUser));
           window.dispatchEvent(new Event('storage')); 
        }
      } else {
        setConfirmModalConfig({
          title: 'Erro ao Gerar',
          message: data.message || 'Ocorreu um erro inesperado ao processar sua geração musical.',
          type: 'error',
          onConfirm: () => setShowConfirmModal(false)
        });
        setShowConfirmModal(true);
      }
    } catch (err) {
      console.error('Gen failed:', err);
      setLoading(false);
    }
  };

  const pollGeneration = (batchId: string) => {
    setBackgroundTasks(prev => prev + 1);
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/generations?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          const batch = data.generations.filter((g: any) => g.batch_id === batchId);
          const allFinished = batch.length > 0 && batch.every((g: any) => g.status === 'completed' || g.status === 'failed');
          
          if (allFinished) {
            clearInterval(interval);
            setBackgroundTasks(prev => Math.max(0, prev - 1));
            
            const hasFailures = batch.some((g: any) => g.status === 'failed');
            if (hasFailures) {
              setConfirmModalConfig({
                title: 'Erro na Geração',
                message: 'Detectámos que a composição musical falhou. Os teus créditos foram devolvidos automaticamente.',
                type: 'error',
                onConfirm: () => setShowConfirmModal(false)
              });
              setShowConfirmModal(true);
            }
            
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (e) {}
    }, 5000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] w-full max-w-6xl mx-auto relative px-4 sm:px-0 animate-in fade-in duration-700">
      <ParticlesBackground type="audio" />
      
      <div className="flex-1 flex flex-col justify-center w-full max-w-4xl mx-auto">
        <div className="w-full text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Crie <span className="text-[#FFB800] underline decoration-[#FFB800]/30">Músicas</span> Únicas com IA
          </h1>
          <p className="text-text-secondary text-sm mt-2 opacity-80">Transforme suas descrições em trilhas sonoras profissionais em segundos</p>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-4">
             <div className="flex bg-[#FFB800]/10 p-1 rounded-xl border border-[#FFB800]/20 shadow-sm">
                <div className="px-6 py-2 rounded-lg text-[11px] font-black bg-[#FFB800] text-black shadow-md flex items-center gap-2">
                   <Music size={14} /> Geração de Música
                </div>
             </div>

             <button 
               onClick={() => window.dispatchEvent(new CustomEvent('conversio_navigate', { detail: 'audio-gallery' }))}
               className="hidden sm:flex px-4 py-2 rounded-xl bg-surface border border-border-subtle text-text-primary text-[11px] font-black uppercase tracking-widest hover:border-[#FFB800]/50 transition-all items-center gap-2"
             >
               <History size={14} /> Ver Gerações
             </button>
          </div>
        </div>

        <div className="relative w-full rounded-[2rem] p-[1px] shadow-2xl group transition-all">
          <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
            <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-30"></div>
          </div>
          
          <div className="relative bg-surface/95 backdrop-blur-2xl rounded-[calc(2rem-1px)] p-4 flex flex-col gap-3 h-full w-full border border-border-subtle hover:border-[#FFB800]/30 transition-colors">
            <div className="flex gap-4 items-start">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Descreva o estilo musical, instrumentos ou tema da música que deseja gerar..."
                className="w-full bg-transparent text-text-primary placeholder:text-text-tertiary resize-none outline-none min-h-[120px] py-2 text-base scrollbar-hide"
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <button onClick={(e) => handleDropdownClick(e, 'model')} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-base border border-border-subtle text-[10px] font-bold text-text-secondary hover:text-[#FFB800] transition-colors">
                      <Settings2 size={12} /> {selectedModel?.name || 'Modelo'}
                      {selectedModel?.credit_cost && <span className="px-1 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black">{selectedModel.credit_cost} CR.</span>}
                      <ChevronDown size={12} />
                    </button>
                    {activeDropdown === 'model' && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden z-[100] py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {availableModels.map(m => (
                          <button key={m.id} onClick={() => { setSelectedModel(m); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 transition-colors ${selectedModel?.id === m.id ? 'bg-[#FFB800]/10 text-[#FFB800] font-bold' : 'hover:bg-surface-hover text-text-secondary'}`}>
                            <div className="flex items-center justify-between">
                              <p className="text-[13px]">{m.name}</p>
                              <span className="px-1.5 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black">{m.credit_cost} CR.</span>
                            </div>
                          </button>
                        ))}
                        {[
                          { id: 'v4', name: 'Music V4 Pro', credit_cost: 5 },
                          { id: 'v5', name: 'Music V5 Ultra', credit_cost: 8 }
                        ].map(m => (
                          <button key={m.id} onClick={() => { setSelectedModel(m); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 transition-colors ${selectedModel?.id === m.id ? 'bg-[#FFB800]/10 text-[#FFB800] font-bold' : 'hover:bg-surface-hover text-text-secondary'}`}>
                            <div className="flex items-center justify-between">
                              <p className="text-[13px]">{m.name}</p>
                              <span className="px-1.5 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black">{m.credit_cost} CR.</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button onClick={(e) => handleDropdownClick(e, 'style')} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-base border border-border-subtle text-[10px] font-bold text-text-secondary hover:text-[#FFB800] transition-colors">
                      <Sparkles size={12} /> {selectedStyle || 'Estilo Livre'}
                      <ChevronDown size={12} />
                    </button>
                    {activeDropdown === 'style' && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden z-[100] py-1 animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                        <button onClick={() => { setSelectedStyle(''); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 hover:bg-surface-hover transition-colors text-[13px] ${selectedStyle === '' ? 'text-[#FFB800] font-bold bg-[#FFB800]/10' : 'text-text-secondary'}`}>
                          Nenhum (Livre)
                        </button>
                        {['🔥 Kuduro', '💕 Kizomba', '🌍 Afropop', '🎹 Amapiano', '🎤 Afrobeats', '🙏 Gospel Angolano', '🎧 Afrohouse', '🎵 Semba', '🌊 Ghetto Zouk', '🎤 Trap Afro', '🎸 Funaná', '🎺 Jazz', '🎸 Rock', '🎻 Clássica'].map(s => (
                          <button key={s} onClick={() => { setSelectedStyle(s); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 hover:bg-surface-hover transition-colors text-[13px] ${selectedStyle === s ? 'text-[#FFB800] font-bold bg-[#FFB800]/10' : 'text-text-secondary'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setInstrumentalOnly(!instrumentalOnly)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${instrumentalOnly ? 'bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30 shadow-[0_0_10px_rgba(255,184,0,0.2)]' : 'bg-bg-base text-text-secondary border-border-subtle hover:text-[#FFB800]'}`}
                  >
                    <Music size={12} /> Só Instrumental: {instrumentalOnly ? 'Sim' : 'Não'}
                  </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || loading}
                  className="p-3.5 rounded-full bg-[#FFB800] text-black animate-pulse-glow hover:scale-110 transition-transform shadow-lg disabled:opacity-50"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 mt-1 border-t border-border-subtle/50 pt-3">
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Estúdio de Geração Musical</p>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20">
                <Zap size={12} className="text-[#FFB800]" fill="currentColor" />
                <span className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest">Custo Estimado: {selectedModel?.credit_cost || 5} Cr.</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {backgroundTasks > 0 && (
        <div className="fixed top-24 right-8 z-[60] animate-in slide-in-from-right-5 fade-in duration-500">
           <div className="bg-surface/80 backdrop-blur-xl border border-border-subtle p-3 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="relative">
                 <div className="w-6 h-6 rounded-lg border-2 border-[#FFB800]/30 border-t-[#FFB800] animate-spin" />
                 <Music size={10} className="absolute inset-0 m-auto text-[#FFB800]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Compondo {backgroundTasks} {backgroundTasks === 1 ? 'Música' : 'Músicas'}</span>
           </div>
        </div>
      )}

      {status === 'generating' && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-base/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
           <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-[#FFB800]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#FFB800] rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <Music className="text-[#FFB800] animate-pulse" size={32} />
              </div>
           </div>
           <h3 className="text-2xl font-black tracking-tight text-white mb-2">Compondo sua música...</h3>
           <p className="text-text-secondary text-sm">O maestro digital está trabalhando na sua obra.</p>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
           <div className="bg-surface/90 backdrop-blur-2xl border border-[#FFB800]/30 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFB800]/20 flex items-center justify-center">
                 <Music size={20} className="text-[#FFB800]" />
              </div>
              <div>
                 <p className="text-[13px] font-bold text-text-primary">Música em produção!</p>
                 <p className="text-[10px] text-text-tertiary">Acompanhe o progresso na biblioteca de áudio.</p>
              </div>
           </div>
        </div>
      )}

      {showConfirmModal && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          type={confirmModalConfig.type}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
}
