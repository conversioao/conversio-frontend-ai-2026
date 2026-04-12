import React, { useState, useEffect } from 'react';
import { Download, Trash2, Play, Image as ImageIcon, Video, Maximize2, X, Filter, Loader2, ChevronLeft, ChevronRight, Share2, Globe, Check, CheckCircle2, AlertCircle, Mic } from 'lucide-react';
import { GenerationViewer } from './ui/GenerationViewer';
import { apiFetch } from '../lib/api';
import { ConfirmationModal } from './ui/ConfirmationModal';

export function Gallery() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterModel, setFilterModel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedItem, setExpandedItem] = useState<any | null>(null);
  
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<{id: string, success: boolean, message: string} | null>(null);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');

  const fetchGenerations = async (page = 1) => {
    if (!user.id) return;
    
    try {
      const response = await apiFetch(`/generations?userId=${user.id}&page=${page}&limit=18&excludeTypes=audio,voice,musica`);
      if (!response.ok) return; 
      
      const data = await response.json();
      if (data.success && Array.isArray(data.generations)) {
        setItems(data.generations);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations(currentPage);
    const interval = setInterval(() => {
      fetchGenerations(currentPage); 
    }, 15000); 
    return () => clearInterval(interval);
  }, [currentPage]);

  // Memoize handlers
  const handlePublish = React.useCallback(async (item: any) => {
    if (!user.id || publishing) return;
    
    setPublishing(item.id);
    setPublishStatus(null);
    
    try {
      const response = await apiFetch('/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          generationId: item.id,
          type: item.type,
          imageUrl: item.result_url,
          prompt: item.prompt
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPublishStatus({ id: item.id, success: true, message: 'Publicado com sucesso!' });
      } else {
        setPublishStatus({ id: item.id, success: false, message: data.message || 'Erro ao publicar' });
      }
    } catch (err) {
      setPublishStatus({ id: item.id, success: false, message: 'Erro de conexão' });
    } finally {
      setPublishing(null);
      setTimeout(() => setPublishStatus(null), 4000);
    }
  }, [user.id, publishing]);

  const handleDelete = React.useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setModal({
      isOpen: true,
      title: 'Excluir Criação',
      message: 'Tem certeza que deseja excluir esta criação? Esta ação não pode ser desfeita.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await apiFetch(`/generations/${id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            setItems(prev => prev.filter(i => i.id !== id));
            setModal(prev => ({ ...prev, isOpen: false }));
          } else {
            const data = await response.json();
            setModal({
              isOpen: true,
              title: 'Erro ao Excluir',
              message: data.message || 'Falha ao tentar excluir a criação.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error('Delete error:', err);
          setModal({
            isOpen: true,
            title: 'Erro de Conexão',
            message: 'Não foi possível conectar ao servidor para excluir o item.',
            type: 'error'
          });
        }
      }
    });
  }, [user.id]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  };

  const handlePrev = React.useCallback(() => {
    const available = items.filter(i => i.status === 'completed');
    if (available.length === 0) return;
    setExpandedItem(prev => {
      if (!prev) return null;
      const idx = available.findIndex(i => i.id === prev.id);
      return idx > 0 ? available[idx - 1] : available[available.length - 1];
    });
  }, [items]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const handleNext = React.useCallback(() => {
    const available = items.filter(i => i.status === 'completed');
    if (available.length === 0) return;
    setExpandedItem(prev => {
      if (!prev) return null;
      const idx = available.findIndex(i => i.id === prev.id);
      return idx < available.length - 1 ? available[idx + 1] : available[0];
    });
  }, [items]);

  const models = React.useMemo(() => 
    Array.from(new Set(items.map(i => i.model || i.metadata?.model || 'Desconhecido'))),
    [items]
  );

  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      // Exclude audio types from the main mixed gallery
      if (item.type === 'audio' || item.type === 'voice' || item.type === 'musica' || item.voice_type === 'musica') return false;

      if (filterType !== 'all') {
        if (filterType === 'image' && item.type !== 'image') return false;
        if (filterType === 'video' && item.type !== 'video') return false;
      }
      const modelName = item.model || item.metadata?.model || 'Desconhecido';
      if (filterModel !== 'all' && modelName !== filterModel) return false;
      return true;
    });
  }, [items, filterType, filterModel]);

  const paginatedItems = filteredItems;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterModel]);

  return (
    <>
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight mb-2">Sua Galeria</h1>
          <p className="text-text-secondary">Explore e gerencie suas criações geradas por IA.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-surface border border-border-subtle rounded-full p-1 shadow-sm">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-surface-hover text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType('image')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${filterType === 'image' ? 'bg-surface-hover text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <ImageIcon size={14} /> Imagens
            </button>
            <button 
              onClick={() => setFilterType('video')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${filterType === 'video' ? 'bg-surface-hover text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Video size={14} /> Vídeos
            </button>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle rounded-full text-sm font-medium text-text-secondary hover:text-text-primary transition-colors shadow-sm">
              <Filter size={14} />
              {filterModel === 'all' ? 'Todos os Modelos' : filterModel}
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden z-50 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button onClick={() => setFilterModel('all')} className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors">Todos</button>
              {models.map(m => (
                <button key={m} onClick={() => setFilterModel(m)} className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors">{m}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-accent" size={40} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {paginatedItems.map(item => (
              <GalleryItem 
                key={item.id} 
                item={item} 
                onExpand={() => setExpandedItem(item)} 
                onDelete={handleDelete} 
                onDownload={handleDownload}
                formatDate={formatDate}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 mt-12 mb-8">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-full bg-surface border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="flex items-center gap-2">
                 <span className="text-sm font-black text-text-primary">{currentPage}</span>
                 <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">de {totalPages} Páginas</span>
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-3 rounded-full bg-surface border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="w-16 h-16 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-text-tertiary mb-4 opacity-50">
                  <Filter size={24} />
               </div>
               <p className="text-text-secondary font-medium">Nenhum item encontrado com estes filtros.</p>
            </div>
          )}
        </>
      )}

      {/* Unified Generation Viewer */}
      {expandedItem && (
        <GenerationViewer 
          item={expandedItem}
          onClose={() => setExpandedItem(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          onPublish={handlePublish}
          publishing={publishing}
          publishStatus={publishStatus}
        />
      )}
    </div>

    <ConfirmationModal 
      isOpen={modal.isOpen}
      title={modal.title}
      message={modal.message}
      type={modal.type}
      onConfirm={() => {
        if (modal.onConfirm) modal.onConfirm();
        setModal(prev => ({ ...prev, isOpen: false }));
      }}
      onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
    />
    </>
  );
}

// --- Helper Components ---

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
