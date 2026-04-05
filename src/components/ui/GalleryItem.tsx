import React from 'react';
import { Download, Trash2, Play, Video, Maximize2, AlertCircle, Mic } from 'lucide-react';

export const GalleryItem = React.memo(({ item, onExpand, onDelete, onDownload, formatDate }: { 
  item: any, 
  onExpand: () => void, 
  onDelete: (e: React.MouseEvent, id: string) => void,
  onDownload: (url: string, filename: string) => void,
  formatDate: (d: string) => string
}) => {
  if (item.status === 'processing') {
    return (
      <div className="group relative aspect-square rounded-2xl overflow-hidden p-[2px] shadow-xl">
        <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)]"></div>
        <div className="relative w-full h-full bg-surface/90 backdrop-blur-xl rounded-[calc(1.5rem-2px)] flex flex-col items-center justify-center p-6 text-center animate-pulse">
          <div className="w-12 h-12 rounded-full border-2 border-[#FFB800] border-t-transparent animate-spin mb-4" />
          <p className="text-text-primary font-bold text-sm">Gerando {item.type === 'video' ? 'Vídeo' : 'Anúncio'}...</p>
          <p className="text-[10px] text-text-tertiary uppercase tracking-widest mt-2">{item.metadata?.model || 'AI Engine'}</p>
        </div>
      </div>
    );
  }

  if (item.status === 'failed') {
    return (
      <div className="group relative aspect-square rounded-2xl overflow-hidden bg-red-500/5 border border-red-500/20 flex flex-col items-center justify-center p-6 text-center shadow-lg">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
          <AlertCircle size={20} />
        </div>
        <p className="text-xs font-semibold text-red-500">Falha na Geração</p>
        <p className="text-[9px] text-red-400 mt-1 opacity-80">Créditos estornados</p>
        <button onClick={(e) => onDelete(e, item.id)} className="mt-4 p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Eliminar"><Trash2 size={16} /></button>
      </div>
    );
  }

    const [loaded, setLoaded] = React.useState(false);
    const displayUrl = item.type !== 'video' && item.type !== 'voice' ? (item.metadata?.thumb_url || item.result_url) : item.result_url;

    // Check if the image is already cached by the browser to prevent shimmer blinking
    React.useEffect(() => {
        if (displayUrl && item.type !== 'video' && item.type !== 'voice') {
            const img = new Image();
            img.src = displayUrl;
            if (img.complete) {
                setLoaded(true);
            }
        }
    }, [displayUrl, item.type]);

    return (
        <div 
            onClick={onExpand} 
            className="group relative aspect-square rounded-2xl overflow-hidden bg-surface border border-border-subtle shadow-lg cursor-pointer transform transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
            {/* Shimmer Placeholder */}
            {!loaded && <div className="absolute inset-0 shimmer-dark z-10" />}
            
            {item.type === 'video' ? (
                <div className="w-full h-full relative">
                    <video 
                        src={item.result_url} 
                        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${loaded ? 'media-loaded' : 'media-loading'}`} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        preload="metadata"
                        onLoadedData={() => setLoaded(true)}
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg flex items-center gap-1.5 border border-white/10 z-20">
                        <Video size={10} className="text-[#FFB800]" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Vídeo</span>
                    </div>
                </div>
            ) : item.type === 'voice' ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-bg-base/30 group-hover:bg-accent/5 transition-colors gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Mic size={20} />
          </div>
          <div className="flex gap-1 h-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-1 bg-accent/30 rounded-full animate-pulse" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      ) : (
        <img 
            src={displayUrl} 
            alt="Gen" 
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${loaded ? 'media-loaded' : 'media-loading'}`} 
            loading="lazy" 
            onLoad={() => setLoaded(true)}
        />
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-30">

        <div className="flex justify-end">
          <button onClick={(e) => onDelete(e, item.id)} className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors shadow-lg"><Trash2 size={16} /></button>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg">
            {item.type === 'video' ? <Play size={18} fill="white" /> : item.type === 'voice' ? <Play size={18} fill="white" /> : <Maximize2 size={18} />}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div className="max-w-[120px]">
            <p className="text-white font-medium text-xs truncate">{(item.copy || item.prompt || 'IA Gen').substring(0, 30)}</p>
            <p className="text-white/70 text-[10px]">{formatDate(item.created_at)}</p>
          </div>
          <button 
            onClick={e => {
              e.stopPropagation();
              onDownload(item.result_url, `conversio-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`);
            }} 
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});
