import React, { useState, useEffect } from 'react';
import { Download, Trash2, Play, Image as ImageIcon, Video, Maximize2, X, Filter, Loader2, ChevronLeft, ChevronRight, Share2, Globe, Check, CheckCircle2, AlertCircle, Mic } from 'lucide-react';
import { GenerationViewer } from './ui/GenerationViewer';
import { apiFetch } from '../lib/api';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { GalleryItem } from './ui/GalleryItem';

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
