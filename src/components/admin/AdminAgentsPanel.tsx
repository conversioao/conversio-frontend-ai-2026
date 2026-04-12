import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Video, 
  Image as ImageIcon, 
  Music, 
  Search, 
  Plus, 
  X, 
  Save, 
  Trash2, 
  Copy, 
  Download, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Settings,
  FileCode,
  Layout,
  Layers,
  Sparkles,
  BarChart3,
  Cpu
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

type CategoryType = 'all' | 'engine' | 'analyzer' | 'video' | 'image' | 'music';

interface PromptAgent {
  id: number;
  technical_id?: string;
  name: string;
  description: string;
  category: string;
  system_prompt: string;
  user_prompt_template?: string;
  few_shot_examples: string;
  model_id: string;
  params: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  is_active: boolean;
  created_at?: string;
}

const CATEGORIES: { id: string; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'Todos os Agentes', icon: <Layers size={20} />, color: 'white' },
  { id: 'engine', label: 'Engine CORE', icon: <Cpu size={20} />, color: 'orange' },
  { id: 'analyzer', label: 'Boutique/Visão', icon: <BarChart3 size={20} />, color: 'emerald' },
  { id: 'video', label: 'Vídeo AI', icon: <Video size={20} />, color: 'blue' },
  { id: 'image', label: 'Imagem Flux', icon: <ImageIcon size={20} />, color: 'violet' },
  { id: 'music', label: 'Voz/Música', icon: <Music size={20} />, color: 'pink' },
];

export function AdminAgentsPanel() {
  const [agents, setAgents] = useState<PromptAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [selectedAgent, setSelectedAgent] = useState<PromptAgent | null>(null);
  const [editForm, setEditForm] = useState<Partial<PromptAgent>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/prompt-agents');
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar agentes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSelectAgent = (agent: PromptAgent) => {
    setSelectedAgent(agent);
    setEditForm({ ...agent });
  };

  const handleUpdate = async () => {
    if (!selectedAgent || !editForm.name) return;
    setIsSaving(true);
    try {
      const res = await apiFetch(`/admin/prompt-agents/${selectedAgent.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setAgents(agents.map(a => a.id === selectedAgent.id ? data.agent : a));
        setSelectedAgent(data.agent);
        showToast('Agente atualizado com sucesso!');
      }
    } catch (err) {
      showToast('Erro ao salvar agente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!editForm.name || !editForm.category || !editForm.system_prompt) {
        showToast('Preencha os campos obrigatórios.', 'error');
        return;
    }
    setIsSaving(true);
    try {
      const res = await apiFetch('/admin/prompt-agents', {
        method: 'POST',
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setAgents([...agents, data.agent]);
        setShowModal(false);
        showToast('Novo agente criado!');
        handleSelectAgent(data.agent);
      }
    } catch (err) {
      showToast('Erro ao criar agente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este agente?')) return;
    try {
      const res = await apiFetch(`/admin/prompt-agents/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAgents(agents.filter(a => a.id !== id));
        if (selectedAgent?.id === id) {
          setSelectedAgent(null);
          setEditForm({});
        }
        showToast('Agente eliminado.');
      }
    } catch (err) {
      showToast('Erro ao eliminar agente.', 'error');
    }
  };

  const handleDuplicate = async () => {
    if (!selectedAgent) return;
    const duplicatedAgent = { ...selectedAgent, name: `${selectedAgent.name} (Cópia)`, id: undefined };
    setEditForm(duplicatedAgent);
    setShowModal(true);
  };

  const exportJSON = () => {
    if (!editForm) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editForm, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${editForm.name}_config.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const filteredAgents = selectedCategory === 'all' ? agents : agents.filter(a => a.category === selectedCategory);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-140px)] bg-[#0A0D0C]/80 border border-white/5 rounded-[2rem] flex overflow-hidden font-sans animation-fade-in shadow-2xl">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span className="text-sm font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {/* Sidebar - Categorias */}
      <aside className="w-24 md:w-64 bg-surface/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center md:items-stretch py-8 shrink-0">
        <div className="px-6 mb-12 hidden md:block">
          <div className="flex items-center gap-3 mb-1">
             <Bot className="text-[#FFB800]" size={28} />
             <h1 className="text-xl font-black text-text-primary uppercase tracking-tight">Agentes</h1>
          </div>
          <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">Controlo de Lógica AI</p>
        </div>

        <nav className="flex-1 w-full space-y-2 px-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`w-full flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-4 rounded-2xl transition-all duration-300 group ${selectedCategory === cat.id ? 'bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800]' : 'text-text-tertiary hover:bg-white/5 hover:text-text-secondary'}`}
            >
              <div className={`shrink-0 transition-transform duration-300 ${selectedCategory === cat.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {cat.icon}
              </div>
              <div className="flex-1 text-left">
                <span className="text-[10px] md:text-sm font-black uppercase tracking-widest md:tracking-normal block">{cat.label}</span>
                <span className="text-[8px] font-bold opacity-40">{agents.filter(a => a.category === cat.id).length} Agentes</span>
              </div>
            </button>
          ))}
        </nav>

      </aside>

      {/* Área Central - Lista de Cards */}
      <main className="flex-1 flex flex-col min-w-0 bg-bg-base/20">
        {/* Header da Área Central */}
        <header className="h-24 border-b border-white/5 px-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight capitalize">{selectedCategory}</h2>
            <p className="text-xs text-text-tertiary font-medium">{filteredAgents.length} Agentes nesta categoria</p>
          </div>
          <button 
            onClick={() => {
                setEditForm({ category: selectedCategory, is_active: true, params: { temperature: 0.7, max_tokens: 2000 } });
                setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#FFB800] text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#FFB800]/20"
          >
            <Plus size={18} /> Novo Agente
          </button>
        </header>

        {/* Grid de Cards */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           {filteredAgents.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Sparkles size={64} className="mb-4 text-text-tertiary" />
                <p className="text-lg font-bold text-text-secondary">Nenhum agente configurado</p>
                <p className="text-sm">Crie o primeiro agente de {selectedCategory} para começar.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
               {filteredAgents.map(agent => (
                 <div
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent)}
                    className={`group relative p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer ${selectedAgent?.id === agent.id ? 'bg-[#FFB800]/10 border-[#FFB800]/30 shadow-2xl scale-[1.02]' : 'bg-surface/30 border-white/5 hover:border-white/10 hover:bg-surface/50'}`}
                 >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${selectedAgent?.id === agent.id ? 'bg-[#FFB800] text-black' : 'bg-bg-base border-white/10 text-[#FFB800]'}`}>
                        <Cpu size={24} />
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${agent.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {agent.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {agent.is_active ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-black text-text-primary mb-1 tracking-tight line-clamp-1">{agent.name}</h3>
                    {agent.technical_id && (
                      <p className="text-[9px] font-mono text-[#FFB800] uppercase tracking-widest mb-2 opacity-70">ID: {agent.technical_id}</p>
                    )}
                    <p className="text-xs text-text-secondary mb-6 line-clamp-2 leading-relaxed min-h-[32px]">{agent.description}</p>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                       <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                         {agent.model_id || 'Modelo Padrão'}
                       </span>
                    </div>

                    <div className={`absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 ${selectedAgent?.id === agent.id ? 'opacity-100 translate-x-0' : ''}`}>
                       <ChevronRight className="text-[#FFB800]" size={20} />
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </main>

      {/* Painel Lateral Direito - Editor */}
      <aside className={`bg-surface/60 backdrop-blur-3xl flex flex-col transition-all duration-500 shrink-0 overflow-hidden ${selectedAgent ? 'w-[450px] opacity-100 border-l border-white/10' : 'w-0 opacity-0 border-l-0'}`}>
        {!selectedAgent ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
             <Settings size={48} className="mb-4" />
             <p className="text-sm font-bold uppercase tracking-widest">Seleccione um agente para editar</p>
          </div>
        ) : (
          <>
            <header className="h-24 border-b border-white/5 px-8 flex items-center justify-between shrink-0 bg-white/5">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800]">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-text-primary uppercase tracking-tight">Editor do Agente</h3>
                    <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">Guardar para aplicar</p>
                  </div>
               </div>
               <button onClick={() => setSelectedAgent(null)} className="text-text-tertiary hover:text-white p-2">
                 <X size={20} />
               </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
               
               {/* Campos Básicos */}
                <section className="space-y-6">
                  <div className="p-5 bg-accent/5 border border-accent/20 rounded-3xl">
                    <label className="text-[10px] font-black text-accent uppercase tracking-widest mb-2 block">ID Técnico (Slug)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: boutique-fashion"
                      className="w-full bg-bg-base/40 border border-white/10 rounded-2xl p-4 text-sm font-mono text-accent focus:border-accent/50 outline-none transition-all"
                      value={editForm.technical_id || ''}
                      onChange={e => setEditForm({...editForm, technical_id: e.target.value})}
                    />
                    <p className="text-[9px] text-text-tertiary mt-2">Usado pelo sistema para identificar o agente no código. Não altere se não tiver certeza.</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Nome do Agente</label>
                    <input 
                      type="text" 
                      className="w-full bg-bg-base/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-text-primary focus:border-[#FFB800]/50 outline-none transition-all"
                      value={editForm.name || ''}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Descrição</label>
                    <textarea 
                      rows={2}
                      className="w-full bg-bg-base/40 border border-white/10 rounded-2xl p-4 text-sm font-medium text-text-secondary focus:border-[#FFB800]/50 outline-none transition-all resize-none"
                      value={editForm.description || ''}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                    />
                  </div>
                </section>

                {/* Prompt Engineering */}
                <section className="space-y-6">
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">System Prompt (Personalidade)</span>
                      <Sparkles size={14} className="text-[#FFB800]" />
                    </label>
                    <textarea 
                      rows={10}
                      className="w-full bg-bg-base/60 border border-white/10 rounded-3xl p-5 text-sm font-medium text-text-primary focus:border-[#FFB800]/50 outline-none transition-all resize-none shadow-inner font-mono leading-relaxed"
                      placeholder="Define quem o agente é..."
                      value={editForm.system_prompt || ''}
                      onChange={e => setEditForm({...editForm, system_prompt: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">User Message Template (Variáveis)</span>
                       <FileCode size={14} className="text-blue-400" />
                    </label>
                    <textarea 
                      rows={6}
                      className="w-full bg-bg-base/60 border border-white/10 rounded-3xl p-5 text-xs font-medium text-text-secondary focus:border-[#FFB800]/50 outline-none transition-all resize-none font-mono"
                      placeholder="Input: ${analysis} ..."
                      value={editForm.user_prompt_template || ''}
                      onChange={e => setEditForm({...editForm, user_prompt_template: e.target.value})}
                    />
                    <div className="mt-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">Variáveis Disponíveis:</p>
                      <div className="flex flex-wrap gap-2">
                        {['image', 'analyzer'].includes(editForm.category || '') && (
                          <>
                            <code className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300 font-mono">{"${analysis}"}</code>
                            <code className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300 font-mono">{"${userPrompt}"}</code>
                            <code className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300 font-mono">{"${style}"}</code>
                            <code className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300 font-mono">{"${seed}"}</code>
                          </>
                        )}
                        {['video'].includes(editForm.category || '') && (
                          <>
                            <code className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300 font-mono">{"${prompt}"}</code>
                            <code className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300 font-mono">{"${style}"}</code>
                          </>
                        )}
                        {!editForm.category && <span className="text-[9px] text-text-tertiary">Seleccione categoria para ver variáveis.</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Exemplos Few-Shot / Notas</span>
                       <Layout size={14} className="text-emerald-400" />
                    </label>
                    <textarea 
                      rows={4}
                      className="w-full bg-bg-base/60 border border-white/10 rounded-3xl p-5 text-xs font-medium text-text-secondary focus:border-[#FFB800]/50 outline-none transition-all resize-none font-mono"
                      placeholder="Notas adicionais ou exemplos..."
                      value={editForm.few_shot_examples || ''}
                      onChange={e => setEditForm({...editForm, few_shot_examples: e.target.value})}
                    />
                  </div>
                </section>

               {/* Configurações do Modelo */}
               <section className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <Layers size={18} className="text-[#FFB800]" />
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">Modelo & Parâmetros</h4>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Modelo AI</label>
                      <input 
                        type="text" 
                        placeholder="gpt-4o"
                        className="w-full bg-bg-base border border-white/10 rounded-xl p-3 text-[11px] font-bold text-text-primary focus:border-[#FFB800]/50 outline-none"
                        value={editForm.model_id || ''}
                        onChange={e => setEditForm({...editForm, model_id: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Temperatura</label>
                      <input 
                        type="number" 
                        step="0.1"
                        min="0"
                        max="2"
                        className="w-full bg-bg-base border border-white/10 rounded-xl p-3 text-[11px] font-bold text-text-primary focus:border-[#FFB800]/50 outline-none"
                        value={editForm.params?.temperature ?? 0.7}
                        onChange={e => setEditForm({...editForm, params: {...(editForm.params || {}), temperature: parseFloat(e.target.value)}})}
                      />
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Estado do Agente</span>
                    <button 
                      onClick={() => setEditForm({...editForm, is_active: !editForm.is_active})}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editForm.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                    >
                      {editForm.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                 </div>
               </section>
            </div>

            {/* Ações do Footer */}
            <footer className="p-8 border-t border-white/5 bg-white/5 grid grid-cols-2 gap-4">
               <button 
                 onClick={handleUpdate}
                 disabled={isSaving}
                 className="col-span-2 flex items-center justify-center gap-2 py-4 bg-[#FFB800] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
               >
                 {isSaving ? 'A guardar...' : <><Save size={18} /> Guardar Alterações</>}
               </button>
               <button 
                 onClick={handleDuplicate}
                 className="flex items-center justify-center gap-2 py-3 bg-white/5 text-text-secondary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
               >
                 <Copy size={14} /> Duplicar
               </button>
               <button 
                 onClick={() => handleDelete(selectedAgent.id)}
                 className="flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/10"
               >
                 <Trash2 size={14} /> Eliminar
               </button>
               <button 
                 onClick={exportJSON}
                 className="col-span-2 flex items-center justify-center gap-2 py-3 text-blue-400 font-black text-[10px] uppercase tracking-widest hover:underline"
               >
                 <Download size={14} /> Exportar Configurações JSON
               </button>
            </footer>
          </>
        )}
      </aside>

      {/* Modal para Novo Agente / Duplicação */}
      {showModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="w-full max-w-xl bg-surface border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-8 right-8 text-text-tertiary hover:text-white"
              >
                <X size={24} />
              </button>
              
              <div className="p-12">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800]">
                       <Plus size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-text-primary tracking-tight">CRIAR NOVO AGENTE</h2>
                      <p className="text-xs text-text-tertiary font-medium">Define a lógica de refinamento do prompt</p>
                    </div>
                 </div>

                  <div className="space-y-6 mb-10">
                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl">
                        <label className="text-[10px] font-black text-accent uppercase tracking-widest mb-2 block">ID Técnico (Único)</label>
                        <input 
                          type="text" 
                          placeholder="ex: novo-agente-slug"
                          className="w-full bg-bg-base/40 border border-white/10 rounded-2xl p-4 text-sm font-mono text-accent focus:border-accent/50 outline-none"
                          value={editForm.technical_id || ''}
                          onChange={e => setEditForm({...editForm, technical_id: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Nome</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Refinador Master"
                            className="w-full bg-bg-base/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-text-primary focus:border-[#FFB800]/50 outline-none"
                            value={editForm.name || ''}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Categoria</label>
                          <select 
                            className="w-full bg-bg-base/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-text-primary focus:border-[#FFB800]/50 outline-none appearance-none"
                            value={editForm.category}
                            onChange={e => setEditForm({...editForm, category: e.target.value as any})}
                          >
                             {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Prompt do Sistema (Obrigatório)</label>
                       <textarea 
                         rows={4}
                         className="w-full bg-bg-base/40 border border-white/10 rounded-2xl p-4 text-sm font-medium text-text-primary focus:border-[#FFB800]/50 outline-none resize-none font-mono"
                         placeholder="Instruções para a IA..."
                         value={editForm.system_prompt || ''}
                         onChange={e => setEditForm({...editForm, system_prompt: e.target.value})}
                       />
                    </div>
                  </div>

                  <button 
                    onClick={handleCreate}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-[#FFB800] text-black rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'A criar...' : <><Zap size={20} /> Finalizar e Activar Agente</>}
                  </button>
               </div>
            </div>
         </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .animation-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />

    </div>
  );
}
