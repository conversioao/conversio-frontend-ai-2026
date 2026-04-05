import React, { useEffect, useState } from 'react';
import { Box, Plus, Trash2, Zap, RefreshCw, Layers, Sliders, CheckCircle2, Image as ImageIcon, Video, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../lib/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export function AdminModels() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'audio'>('image');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modelToDeleteId, setModelToDeleteId] = useState<number | null>(null);
  
  // Form State
  const [newModel, setNewModel] = useState({
    type: 'image',
    name: '',
    style_id: '',
    category: 'core',
    credit_cost: 1
  });

  const fetchModels = async () => {
    try {
      setLoading(true);
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/models?adminId=${adminId}`);
      const data = await res.json();
      if (data.success) {
        setModels(data.models || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newModel, type: activeTab, adminId })
      });
      const data = await res.json();
      if (data.success) {
        setNewModel({
          type: activeTab,
          name: '',
          style_id: '',
          category: 'core',
          credit_cost: 1
        });
        fetchModels();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (model: any) => {
    try {
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      await apiFetch(`/admin/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminId, 
          is_active: !model.is_active,
          name: model.name,
          style_id: model.style_id,
          category: model.category,
          credit_cost: model.credit_cost
        })
      });
      fetchModels();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCost = async (model: any, newCost: number) => {
    try {
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      await apiFetch(`/admin/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminId, 
          is_active: model.is_active,
          name: model.name,
          style_id: model.style_id,
          category: model.category,
          credit_cost: newCost
        })
      });
      setModels(prev => prev.map(m => m.id === model.id ? {...m, credit_cost: newCost} : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      await apiFetch(`/admin/models/${id}?adminId=${adminId}`, {
        method: 'DELETE'
      });
      setShowDeleteModal(false);
      setModelToDeleteId(null);
      fetchModels();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredModels = models.filter(m => m.type === activeTab);

  if (loading) return <div className="p-12 text-center text-text-tertiary animate-pulse font-black uppercase tracking-widest text-sm">Sincronizando Modelos de IA...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
             <Layers size={32} className="text-[#FFB800]" /> Gestão de IA e Motores
          </h1>
          <p className="text-text-secondary text-sm font-medium">Configura os custos de crédito e motores ativos para cada categoria.</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex gap-2 p-1 bg-bg-base border border-border-subtle rounded-2xl w-fit">
        <button onClick={() => setActiveTab('image')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'image' ? 'bg-[#FFB800] text-black shadow-lg' : 'text-text-tertiary hover:text-white'}`}>
          <ImageIcon size={14} /> Imagem
        </button>
        <button onClick={() => setActiveTab('video')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'video' ? 'bg-[#FFB800] text-black shadow-lg' : 'text-text-tertiary hover:text-white'}`}>
          <Video size={14} /> Vídeos
        </button>
        <button onClick={() => setActiveTab('audio')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'audio' ? 'bg-[#FFB800] text-black shadow-lg' : 'text-text-tertiary hover:text-white'}`}>
          <Music size={14} /> Músicas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Creator Card */}
         <div className="lg:col-span-1 bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm h-fit">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-wider mb-8 flex items-center gap-2">
               <Plus size={20} className="text-[#FFB800]" /> Adicionar {activeTab === 'image' ? 'Motor' : activeTab === 'video' ? 'Core' : 'Versão'}
            </h3>
            <form onSubmit={handleCreate} className="space-y-6">
               <div>
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Nome de Exibição</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Cinematic Realistic"
                    className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-sm font-bold text-text-primary focus:outline-none focus:border-[#FFB800]/50"
                    value={newModel.name}
                    onChange={(e) => setNewModel({...newModel, name: e.target.value})}
                  />
               </div>

               <div>
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Identificador (Style ID)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: cinematic-hq"
                    className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-sm font-bold text-text-primary focus:outline-none focus:border-[#FFB800]/50"
                    value={newModel.style_id}
                    onChange={(e) => setNewModel({...newModel, style_id: e.target.value})}
                  />
               </div>

               <div>
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Custo (Créditos)</label>
                  <div className="relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB800]" size={16} />
                    <input 
                      type="number" 
                      className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 pl-12 text-sm font-bold text-text-primary focus:outline-none focus:border-[#FFB800]/50"
                      value={newModel.credit_cost}
                      onChange={(e) => setNewModel({...newModel, credit_cost: Number(e.target.value)})}
                    />
                  </div>
               </div>

               <button 
                 type="submit"
                 disabled={creating || !newModel.name || !newModel.style_id}
                 className="w-full py-5 bg-[#FFB800] text-black font-black text-sm uppercase tracking-widest rounded-3xl shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                  {creating ? <RefreshCw size={18} className="animate-spin" /> : <Box size={18} />}
                  Guardar
               </button>
            </form>
         </div>

         {/* Models List */}
         <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-4 ml-4">
               <h3 className="text-lg font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={20} className="text-text-tertiary" /> Modelos Configurados
               </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               <AnimatePresence mode="popLayout">
                 {filteredModels.map((model) => (
                   <motion.div 
                     key={model.id} 
                     layout
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className={`bg-surface border ${model.is_active ? 'border-border-subtle' : 'border-red-500/20 opacity-60'} rounded-[2rem] p-6 relative overflow-hidden group shadow-sm transition-all`}
                   >
                      <div className="flex items-start justify-between mb-6">
                         <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 text-text-tertiary">
                                  {String(model.category || 'core')}
                                </span>
                             </div>
                             <h4 className="text-lg font-black text-text-primary tracking-tight leading-tight">{String(model.name || '')}</h4>
                             <code className="text-[10px] text-text-tertiary font-mono block mt-1">{String(model.style_id || '')}</code>
                          </div>
                         <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => handleToggle(model)}
                              className={`p-2 rounded-xl transition-colors ${model.is_active ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-text-tertiary hover:bg-white/5'}`}
                            >
                               <CheckCircle2 size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                setModelToDeleteId(model.id);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-text-tertiary hover:text-red-500 transition-colors"
                            >
                               <Trash2 size={18} />
                            </button>
                         </div>
                      </div>

                      <div className="pt-4 border-t border-border-subtle space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Custo de Créditos</span>
                            <div className="flex items-center gap-2 bg-bg-base px-3 py-1.5 rounded-xl border border-border-subtle">
                               <input 
                                 type="number"
                                 className="w-10 bg-transparent text-xs font-black text-[#FFB800] text-center outline-none"
                                 value={model.credit_cost}
                                 onChange={(e) => handleUpdateCost(model, Number(e.target.value))}
                               />
                               <Zap size={12} className="text-[#FFB800]" />
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
               
               {filteredModels.length === 0 && (
                 <div className="md:col-span-2 xl:col-span-3 p-12 text-center bg-bg-base/30 border border-dashed border-border-subtle rounded-[2rem] text-text-tertiary italic text-sm">Nenhum motor configurado nesta categoria.</div>
               )}
            </div>
         </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Eliminar Motor de IA"
        message="Tem certeza que deseja eliminar este modelo permanentemente? Esta ação pode afetar gerações em curso que utilizem este motor."
        confirmLabel="Eliminar Definitivamente"
        type="error"
        onConfirm={() => modelToDeleteId && handleDelete(modelToDeleteId)}
        onCancel={() => {
          setShowDeleteModal(false);
          setModelToDeleteId(null);
        }}
      />
    </div>
  );
}
