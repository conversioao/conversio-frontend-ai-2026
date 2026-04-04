import React, { useEffect, useState, useRef } from 'react';
import { Music, Mic, Play, Pause, Download, Trash2, Calendar, Search, X, FileText, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/api';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface Generation {
  id: string;
  prompt: string;
  title?: string;
  batch_id: string;
  type: string;
  status: string;
  model?: string;
  style?: string;
  result_url?: string;
  copy?: string;
  created_at: string;
  metadata?: any;
}

interface BatchGroup {
  batch_id: string;
  title?: string;
  prompt: string;
  type: string;
  model?: string;
  style?: string;
  copy?: string;
  created_at: string;
  items: Generation[];
  hasCompleted: boolean;
}

export function AudioGallery() {
  const [batches, setBatches] = useState<BatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'voice' | 'music'>('all');
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<BatchGroup | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedCopy, setExpandedCopy] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<BatchGroup | null>(null);

  const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');

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
      // Fallback to simple link
      window.open(url, '_blank');
    }
  };

  const fetchGenerations = async () => {
    if (!user.id) return;
    try {
      const res = await apiFetch(`http://localhost:3003/api/generations?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        const audioGens: Generation[] = data.generations.filter(
          (g: any) => g.type === 'audio' || g.type === 'voice' || g.type === 'musica' || g.type === 'music'
        );

        // Group by batch_id  
        const batchMap = new Map<string, BatchGroup>();
        audioGens.forEach((gen) => {
          const key = gen.batch_id || gen.id;
          if (!batchMap.has(key)) {
            batchMap.set(key, {
              batch_id: key,
              title: gen.title,
              prompt: gen.prompt,
              type: gen.type,
              model: gen.model,
              style: gen.style,
              copy: gen.copy,
              created_at: gen.created_at,
              items: [],
              hasCompleted: false,
            });
          }
          const batch = batchMap.get(key)!;
          batch.items.push(gen);
          if (gen.status === 'completed') batch.hasCompleted = true;
          // Prefer a copy from any item that has one
          if (gen.copy && !batch.copy) batch.copy = gen.copy;
          // Prefer title if set
          if (gen.title && !batch.title) batch.title = gen.title;
        });

        setBatches(Array.from(batchMap.values()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, []);

  const handleDeleteBatch = async (batch: BatchGroup) => {
    try {
      await Promise.all(
        batch.items.map((item) =>
          apiFetch(`http://localhost:3003/api/generations/${item.id}?userId=${user.id}`, { method: 'DELETE' })
        )
      );
      setBatches((prev) => prev.filter((b) => b.batch_id !== batch.batch_id));
      if (selectedBatch?.batch_id === batch.batch_id) {
        setSelectedBatch(null);
      }
      if (batch.items.some((i) => i.id === playingId)) {
        audioRef.current?.pause();
        setPlayingId(null);
      }
      setShowDeleteModal(false);
      setBatchToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingId(id);
      }
    }
  };

  const filteredBatches = batches.filter((b) => {
    const matchSearch =
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.prompt?.toLowerCase().includes(search.toLowerCase());
    const isMusicInBatch =
      b.type === 'musica' ||
      (b.model && (b.model === 'V4' || b.model === 'V5' || b.model.toLowerCase().includes('music')));

    if (filter === 'music') return matchSearch && isMusicInBatch;
    if (filter === 'voice') return matchSearch && !isMusicInBatch;
    return matchSearch;
  });

  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const currentBatches = filteredBatches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isMusic = (b: BatchGroup) =>
    b.type === 'musica' ||
    (b.model && (b.model === 'V4' || b.model === 'V5' || b.model.toLowerCase().includes('music')));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">
            Biblioteca de <span className="text-[#FFB800]">Músicas e Sons</span>
          </h1>
          <p className="text-text-secondary font-medium">Suas narrações e composições musicais, agrupadas por criação.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-[#FFB800] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Pesquisar gerações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3 bg-surface border border-border-subtle rounded-2xl outline-none focus:border-[#FFB800]/50 transition-all w-full md:w-64 text-sm font-medium"
            />
          </div>

          <div className="flex bg-surface p-1 rounded-2xl border border-border-subtle">
            {(['all', 'voice', 'music'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/10' : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {f === 'all' ? 'Tudo' : f === 'voice' ? 'Voz' : 'Música'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 8].map((i) => (
            <div key={i} className="h-44 bg-surface/50 rounded-3xl animate-pulse border border-border-subtle border-dashed" />
          ))}
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-surface/30 rounded-[3rem] border border-border-subtle border-dashed">
          <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center text-text-tertiary mb-6 border border-border-subtle shadow-inner">
            <Volume2 size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Nenhum som encontrado</h3>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">Comece a dar voz às suas ideias no gerador de áudio.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {currentBatches.map((batch) => {
              const music = isMusic(batch);
              const statusColor = !batch.hasCompleted ? 'text-[#FFB800]' : 'text-emerald-400';
              const statusText = !batch.hasCompleted ? 'A processar...' : `${batch.items.filter(i => i.status === 'completed').length} versão${batch.items.filter(i => i.status === 'completed').length > 1 ? 'ões' : ''} pronta${batch.items.filter(i => i.status === 'completed').length > 1 ? 's' : ''}`;

              return (
                <motion.div
                  key={batch.batch_id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedBatch(batch)}
                  className="relative bg-surface border border-border-subtle rounded-3xl p-5 cursor-pointer hover:border-[#FFB800]/50 hover:shadow-xl hover:shadow-[#FFB800]/5 transition-all group overflow-hidden"
                >
                  {/* Glow blob */}
                  <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 ${music ? 'bg-blue-500' : 'bg-emerald-500'}`} />

                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className={`p-2.5 rounded-2xl ${music ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {music ? <Music size={18} /> : <Mic size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>{statusText}</p>
                      <p className="text-[10px] text-text-tertiary uppercase font-medium">{batch.model || 'AI'}{batch.style ? ` · ${batch.style}` : ''}</p>
                    </div>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setBatchToDelete(batch);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-text-primary line-clamp-2 mb-3 relative z-10">
                    {batch.title || batch.prompt || 'Geração de Áudio'}
                  </h4>

                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                      <Calendar size={10} /> {new Date(batch.created_at).toLocaleDateString('pt-PT')}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-text-tertiary group-hover:text-[#FFB800] transition-colors font-bold uppercase tracking-wider">
                      Ver detalhes →
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 pb-8">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-secondary hover:text-[#FFB800] disabled:opacity-30 transition-all"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === idx + 1 ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'bg-surface text-text-tertiary hover:text-text-primary border border-border-subtle'}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-secondary hover:text-[#FFB800] disabled:opacity-30 transition-all"
            >
              Próximo
            </button>
          </div>
        )}
        </>
      )}

      {/* ============ DETAIL MODAL ============ */}
      <AnimatePresence>
        {selectedBatch && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedBatch(null)}
          >
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-bg-base border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-surface/50">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${isMusic(selectedBatch) ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {isMusic(selectedBatch) ? <Music size={22} /> : <Mic size={22} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-text-primary">
                      {selectedBatch.title || selectedBatch.prompt?.substring(0, 50) || 'Geração de Áudio'}
                    </h2>
                    <p className="text-xs text-text-tertiary">
                      {selectedBatch.model || 'AI'}{selectedBatch.style ? ` · Estilo: ${selectedBatch.style}` : ''} · {new Date(selectedBatch.created_at).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="p-2.5 text-text-tertiary hover:text-white hover:bg-surface rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {/* Prompt / Descrição */}
                <div className="px-6 pt-5">
                  <p className="text-sm text-text-secondary italic mb-6 bg-surface/40 p-4 rounded-2xl border border-border-subtle">
                    "{selectedBatch.prompt}"
                  </p>
                </div>

                {/* Copy / Letra da Música */}
                {selectedBatch.copy && (
                  <div className="px-6 mb-6">
                    <button
                      onClick={() => setExpandedCopy(!expandedCopy)}
                      className="w-full flex items-center justify-between p-4 bg-surface/60 border border-border-subtle rounded-2xl hover:border-[#FFB800]/40 transition-all"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                        <FileText size={16} className="text-[#FFB800]" /> Letra / Copy
                      </div>
                      {expandedCopy ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
                    </button>
                    <AnimatePresence>
                      {expandedCopy && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-5 bg-surface/40 border border-border-subtle rounded-2xl text-sm text-text-secondary whitespace-pre-wrap leading-relaxed font-medium">
                            {selectedBatch.copy}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Audio Tracks */}
                <div className="px-6 pb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary mb-3">
                    Versões Geradas ({selectedBatch.items.filter(i => i.status === 'completed').length})
                  </h3>
                  <div className="flex flex-col gap-3">
                    {selectedBatch.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          playingId === item.id
                            ? 'bg-[#FFB800]/10 border-[#FFB800]/40'
                            : 'bg-surface border-border-subtle hover:border-[#FFB800]/30'
                        }`}
                      >
                        <button
                          disabled={item.status !== 'completed' || !item.result_url}
                          onClick={() => item.result_url && togglePlay(item.id, item.result_url)}
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-md ${
                            item.status !== 'completed'
                              ? 'bg-surface-hover text-text-tertiary cursor-not-allowed'
                              : playingId === item.id
                              ? 'bg-text-primary text-surface scale-95'
                              : 'bg-[#FFB800] text-black hover:scale-110'
                          }`}
                        >
                          {item.status === 'processing' ? (
                            <div className="w-4 h-4 border-2 border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin" />
                          ) : playingId === item.id ? (
                            <Pause size={18} fill="currentColor" />
                          ) : (
                            <Play size={18} fill="currentColor" className="ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">
                            Versão {idx + 1}
                            {playingId === item.id && (
                              <span className="ml-2 text-[#FFB800] text-xs animate-pulse">▶ A tocar</span>
                            )}
                          </p>
                          <p className="text-xs text-text-tertiary uppercase tracking-wider">
                            {item.status === 'processing' ? 'A processar...' : item.status === 'completed' ? 'Pronto' : item.status}
                          </p>
                        </div>

                        {item.status === 'completed' && item.result_url && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDownload(item.result_url!, `conversio-${selectedBatch.title || 'audio'}-${idx+1}.mp3`);
                            }}
                            className="p-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-secondary hover:text-[#FFB800] hover:border-[#FFB800]/50 transition-all flex-shrink-0"
                            title="Descarregar MP3"
                          >
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Eliminar Geração"
        message="Tem certeza que deseja eliminar toda esta geração? Esta ação é permanente e não pode ser desfeita."
        confirmLabel="Eliminar Agora"
        type="error"
        onConfirm={() => batchToDelete && handleDeleteBatch(batchToDelete)}
        onCancel={() => {
          setShowDeleteModal(false);
          setBatchToDelete(null);
        }}
      />
    </div>
  );
}
