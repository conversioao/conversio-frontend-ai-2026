import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Mic, Check, Globe, Download, Loader2, CheckCircle2, AlertCircle, Edit2, Copy } from 'lucide-react';
import { ImageEditor } from './ImageEditor';
import { ConfirmationModal } from './ConfirmationModal';
interface GenerationViewerProps {
  item: any;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPublish?: (item: any) => void;
  publishing?: string | null;
  publishStatus?: { id: string; success: boolean; message: string } | null;
}

export function GenerationViewer({ 
  item, 
  onClose, 
  onPrev, 
  onNext, 
  onPublish,
  publishing,
  publishStatus
}: GenerationViewerProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [userLogo, setUserLogo] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('conversio_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.brand_logo_url) setUserLogo(user.brand_logo_url);
      }
    } catch(e) {}
  }, []);

  if (!item) return null;

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      {/* Close Button */}
      <button 
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-[110] transition-colors"
        onClick={onClose}
      >
        <X size={24} />
      </button>

      {/* Navigation Buttons */}
      <button 
        className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white z-[110] active:scale-95 border border-white/10 transition-all"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
      >
        <ChevronLeft size={32} />
      </button>
      
      <button 
        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white z-[110] active:scale-95 border border-white/10 transition-all"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      >
        <ChevronRight size={32} />
      </button>

      {/* Main Container */}
      <div 
        className="flex flex-col lg:flex-row w-full max-w-[1200px] max-h-[90vh] bg-[#0A0A0A] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Media */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[40vh] lg:min-h-0 overflow-hidden">
          {item.type === 'video' ? (
            <video 
              src={item.result_url} 
              className="max-w-full max-h-full object-contain" 
              controls 
              autoPlay 
              loop 
            />
          ) : item.type === 'voice' ? (
            <div className="w-full max-w-lg aspect-square flex flex-col items-center justify-center p-12 bg-white/5 rounded-[3rem] border border-white/10 shadow-2xl">
              <div className="w-32 h-32 rounded-full bg-[#FFB800]/20 flex items-center justify-center text-[#FFB800] mb-8 animate-pulse shadow-[0_0_30px_rgba(255,184,0,0.2)]">
                <Mic size={56} />
              </div>
              <audio src={item.result_url} className="w-full h-12" controls autoPlay />
              <p className="mt-8 text-white/40 text-xs uppercase font-black tracking-[0.2em]">{item.model}</p>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center group">
               <img 
                 src={item.result_url} 
                 className="max-w-full max-h-full object-contain shadow-2xl" 
                 alt="Geração IA"
               />
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
                     <p className="text-white text-xl font-bold tracking-tight text-center leading-tight">
                        {item.headline || ""}
                     </p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Right Side: Info Panel */}
        <div className="w-full lg:w-[420px] p-8 flex flex-col gap-6 overflow-y-auto bg-[#0F0F0F] border-l border-white/5">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-[10px] font-black text-[#FFB800] uppercase tracking-[0.2em] mb-3">CONTEÚDO FINAL</h3>
              <div className="bg-[#FFB800]/5 rounded-2xl p-5 border border-[#FFB800]/10 shadow-[0_0_20px_rgba(255,184,0,0.05)]">
                 <p className="text-white/90 text-sm leading-relaxed mb-4 whitespace-pre-wrap font-medium">
                    {item.copy || 'Crie uma legenda para esta imagem.'}
                 </p>
                 <div className="flex flex-wrap gap-2">
                    {item.hashtags?.split(' ').map((tag: string, i: number) => (
                      <span key={i} className="text-[#FFB800] text-[10px] font-black uppercase tracking-wider opacity-60">
                        {tag}
                      </span>
                    )) || ''}
                 </div>
              </div>
            </div>

            <div className="opacity-40 hover:opacity-100 transition-opacity">
              <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Prompt Técnico</h3>
              <p className="text-white/50 text-[11px] leading-relaxed italic font-light line-clamp-3 hover:line-clamp-none transition-all cursor-help">
                "{item.prompt}"
              </p>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button 
              onClick={() => {
                const text = `${item.copy || ''}\n\n${item.hashtags || ''}`;
                navigator.clipboard.writeText(text);
                setModal({
                  isOpen: true,
                  title: 'Conteúdo Copiado',
                  message: 'A legenda e as hashtags foram copiadas para a sua área de transferência.',
                  type: 'success'
                });
              }}
              className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl"
            >
              <Check size={16} strokeWidth={3} />
              Copiar Tudo
            </button>

            {onPublish && (
              <button 
                onClick={(e) => { e.stopPropagation(); onPublish(item); }}
                disabled={publishing === item.id}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl ${
                  publishStatus?.id === item.id 
                    ? (publishStatus.success ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30')
                    : 'bg-[#FFB800] text-black hover:scale-[1.02] active:scale-[0.98]'
                } disabled:opacity-50`}
              >
                {publishing === item.id ? <Loader2 size={18} className="animate-spin" /> : publishStatus?.id === item.id ? (publishStatus.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />) : <Globe size={18} />}
                {publishStatus?.id === item.id ? publishStatus.message : 'Publicar na Comunidade'}
              </button>
            )}

            {item.type === 'image' && (
              <button 
                onClick={() => setShowEditor(true)}
                className="w-full py-4 rounded-2xl bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#FFB800]/20 active:scale-[0.98] transition-all shadow-xl"
              >
                <Edit2 size={18} /> Adicionar Logótipo
              </button>
            )}

            <button 
              onClick={async () => {
                try {
                  const response = await fetch(item.result_url);
                  const blob = await response.blob();
                  const blobUrl = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = `conversio-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(blobUrl);
                } catch (err) {
                  console.error('Download error:', err);
                  window.open(item.result_url, '_blank');
                }
              }}
              className="w-full py-4 rounded-2xl bg-white/5 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              <Download size={18} /> Baixar {item.type === 'video' ? 'Vídeo' : 'Imagem'}
            </button>

            <div className="flex items-center justify-between text-[9px] text-white/30 px-2 mt-2 font-black uppercase tracking-widest">
              <span>{item.model || item.metadata?.model}</span>
              <span>{new Date(item.created_at).toLocaleDateString('pt-PT')}</span>
            </div>
          </div>
        </div>
      </div>

      {showEditor && (
        <ImageEditor 
          imageUrl={item.result_url} 
          brandLogoUrl={userLogo}
          onClose={() => setShowEditor(false)}
        />
      )}
      </div>

      <ConfirmationModal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={() => setModal(prev => ({ ...prev, isOpen: false }))}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
