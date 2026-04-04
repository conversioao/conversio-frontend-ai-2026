import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Layout, 
  Send, 
  History, 
  MoreVertical, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Zap,
  RefreshCcw,
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface Lead {
    id: string;
    name: string;
    email: string;
    whatsapp: string;
    whatsapp_verified: boolean;
    credits: number;
    created_at: string;
    crm_stage_id: string;
    last_interaction: string | null;
}

interface Stage {
    id: string;
    name: string;
    order_index: number;
}

const AdminCRM: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pipeline' | 'campaigns' | 'automation' | 'logs'>('pipeline');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<any[]>([]);

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

    const [automations, setAutomations] = useState<any[]>([]);
    const [loadingAutomations, setLoadingAutomations] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stagesRes, leadsRes] = await Promise.all([
                api.get('/admin/crm/stages'),
                api.get('/admin/crm/pipeline')
            ]);
            
            const stagesData = await stagesRes.json();
            const leadsData = await leadsRes.json();

            if (stagesData.success) setStages(stagesData.stages);
            if (leadsData.success) setLeads(leadsData.leads);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (lead: Lead) => {
        setSelectedLead(lead);
        const res = await api.get(`/admin/crm/user/${lead.id}`);
        const data = await res.json();
        if (data.success) {
            setInteractions(data.interactions);
        }
    };

    const updateStage = async (userId: string, stageId: string) => {
        const res = await api.post('/admin/crm/update-stage', { userId, stageId });
        const data = await res.json();
        if (data.success) {
            setLeads(leads.map(l => l.id === userId ? { ...l, crm_stage_id: stageId } : l));
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/admin/crm/automations/${id}`);
            setAutomations(prev => prev.filter(a => a.id !== id));
            setModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAutomations = async () => {
        setLoadingAutomations(true);
        try {
            const res = await api.get('/admin/crm/automations');
            const data = await res.json();
            if (data.success) setAutomations(data.automations);
        } finally {
            setLoadingAutomations(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'automation') fetchAutomations();
    }, [activeTab]);

    if (loading) return <div className="p-8 text-center text-slate-400">Carregando CRM...</div>;

    return (
        <>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-400" />
                        CRM & Sales Pipeline
                    </h1>
                    <p className="text-slate-400 text-sm">Gerencie leads, conversões e automações de WhatsApp.</p>
                </div>

                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                    {(['pipeline', 'campaigns', 'automation', 'logs'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab 
                                ? 'bg-indigo-500 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'pipeline' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4"
                    >
                        {stages.map(stage => (
                            <div key={stage.id} className="min-w-[280px] flex flex-col gap-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        {stage.name}
                                        <span className="bg-slate-800 text-slate-500 text-[10px] px-2 py-0.5 rounded-full">
                                            {leads.filter(l => String(l.crm_stage_id) === String(stage.id)).length}
                                        </span>
                                    </h3>
                                </div>

                                <div className="flex flex-col gap-3 min-h-[500px] p-2 bg-slate-900/50 rounded-2xl border border-slate-800/50 border-dashed">
                                    {leads.filter(l => String(l.crm_stage_id) === String(stage.id)).map(lead => (
                                        <motion.div
                                            key={lead.id}
                                            layoutId={lead.id}
                                            onClick={() => fetchUserDetails(lead)}
                                            className="bg-slate-800 border border-slate-700 p-4 rounded-xl hover:border-indigo-500/50 cursor-pointer transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-medium text-white group-hover:text-indigo-400 transition-colors uppercase">
                                                    {lead.name.split(' ')[0]}
                                                </div>
                                                <div className={`w-2 h-2 rounded-full ${lead.whatsapp_verified ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-600'}`} />
                                            </div>
                                            <div className="text-xs text-slate-400 mb-3 truncate flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {lead.whatsapp || lead.email}
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-4 text-[10px] text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="bg-slate-700/50 px-2 py-0.5 rounded text-indigo-300">
                                                    {lead.credits} cr
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'campaigns' && <CampaignView leads={leads} setModal={setModal} />}
                {activeTab === 'automation' && (
                    <AutomationView 
                        automations={automations}
                        loading={loadingAutomations}
                        setAutomations={setAutomations}
                        setModal={setModal} 
                        onDelete={handleDelete}
                    />
                )}
                {activeTab === 'logs' && <WhatsAppLogsView />}
            </AnimatePresence>

            {/* Lead Details Modal */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-8 shadow-2xl relative overflow-y-auto"
                    >
                        <button onClick={() => setSelectedLead(null)} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="mt-8 space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1 uppercase tracking-tight">{selectedLead.name}</h2>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Mail className="w-4 h-4" /> {selectedLead.email}
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                    <Phone className="w-4 h-4" /> {selectedLead.whatsapp || 'N/A'}
                                    {selectedLead.whatsapp_verified && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Status Atual</div>
                                    <select 
                                        value={selectedLead.crm_stage_id || ''} 
                                        onChange={(e) => updateStage(selectedLead.id, e.target.value)}
                                        className="bg-transparent text-indigo-400 font-bold outline-none w-full"
                                    >
                                        <option value="" disabled>Selecionar...</option>
                                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Créditos</div>
                                    <div className="text-white font-bold">{selectedLead.credits}</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Histórico de Atividade
                                </h3>
                                <div className="space-y-4">
                                    {interactions.map((int: any) => (
                                        <div key={int.id} className="relative pl-6 border-l border-slate-800 pb-4 last:pb-0">
                                            <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                            <div className="text-xs text-slate-500 mb-1">{new Date(int.created_at).toLocaleString()}</div>
                                            <div className="text-sm text-slate-200 bg-slate-800/30 p-2 rounded-lg border border-slate-800/50">
                                                <span className="font-bold text-indigo-400 text-[10px] uppercase block mb-1">{int.type}:</span>
                                                {int.content}
                                            </div>
                                        </div>
                                    ))}
                                    {interactions.length === 0 && <div className="text-slate-600 text-sm italic">Nenhum histórico encontrado.</div>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <h3 className="text-sm font-bold text-white mb-4 uppercase">Acções Rápidas</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                        <Send className="w-4 h-4" /> Enviar WhatsApp
                                    </button>
                                    <button className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700">
                                        <Plus className="w-4 h-4" /> Adicionar Nota
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
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
};

const CampaignView: React.FC<{ 
    leads: Lead[]; 
    setModal: (m: any) => void;
}> = ({ leads, setModal }) => {
    const [name, setName] = useState('');
    const [template, setTemplate] = useState('Olá {name}, vimos que você ainda não aproveitou os recursos PRO da Conversio...');
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [sending, setSending] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleGenerateAI = async () => {
        setGenerating(true);
        try {
            const res = await api.post('/admin/crm/campaign/generate', { promptInput: name || '' });
            const data = await res.json();
            if (data.success && data.aiGenerated) {
                setTemplate(data.aiGenerated.messageTemplate);
                
                // Extrai IDs válidos baseado na recomendação da IA, convertendo tudo para string
                const aiAudience = Array.isArray(data.aiGenerated.audience) ? data.aiGenerated.audience.map(String) : [];
                if (aiAudience.length > 0) {
                     setSelectedLeads(aiAudience);
                } else {
                     setSelectedLeads(leads.filter(l => l.whatsapp).map(l => l.id));
                }
                
                if (!name) setName('Campanha Gerada por IA');
            } else {
                setModal({
                    isOpen: true,
                    title: 'Erro na IA',
                    message: data.message || 'Falha ao gerar campanha inteligente.',
                    type: 'error'
                });
            }
        } catch (e) {
            setModal({
                isOpen: true,
                title: 'Erro de Conexão',
                message: 'Não foi possível conectar ao servidor de IA.',
                type: 'error'
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleSend = async () => {
        if (!name || !template || selectedLeads.length === 0) return;
        setSending(true);
        try {
            const res = await api.post('/admin/crm/campaign/send', { name, template, userIds: selectedLeads });
            const data = await res.json();
            if (data.success) {
                setModal({
                    isOpen: true,
                    title: 'Sucesso',
                    message: 'Campanha enviada com sucesso para a fila de disparo!',
                    type: 'success'
                });
                setName('');
                setSelectedLeads([]);
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-green-400" />
                            Criar Nova Campanha WhatsApp
                        </h2>
                        <button 
                            onClick={handleGenerateAI}
                            disabled={generating}
                            className="bg-indigo-500/20 border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2"
                        >
                            {generating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Gerar Rascunho com IA
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome da Campanha</label>
                            <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ex: Recuperação de Carrinho"
                                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Mensagem (Template)</label>
                            <textarea 
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                rows={6}
                                placeholder="Use {name} para personalizar..."
                                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all resize-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-2">Dica: Use <code className="text-indigo-400">{`{name}`}</code> para inserir automaticamente o primeiro nome do lead.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-white font-bold">Resumo do Envio</div>
                            <div className="text-slate-400 text-sm">{selectedLeads.length} leads <span className="text-green-400 font-bold">verificados</span> selecionados para esta campanha.</div>
                        </div>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={sending || selectedLeads.length === 0 || !name}
                        className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        {sending ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Iniciar Disparo</>}
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit max-h-[700px] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-white uppercase text-sm">Selecionar Leads</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Apenas números verificados</p>
                    </div>
                    <button 
                        onClick={() => setSelectedLeads(leads.filter(l => l.whatsapp && l.whatsapp_verified).map(l => l.id))}
                        className="text-[10px] text-indigo-400 uppercase font-bold hover:underline"
                    >
                        Selecionar Todos
                    </button>
                </div>
                <div className="space-y-2">
                    {leads.filter(l => l.whatsapp && l.whatsapp_verified).length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">Nenhum utilizador com WhatsApp verificado.</div>
                    ) : (
                        leads.filter(l => l.whatsapp && l.whatsapp_verified).map(lead => (
                            <div 
                                key={lead.id}
                                onClick={() => {
                                    setSelectedLeads(prev => 
                                        prev.includes(lead.id) ? prev.filter(i => i !== lead.id) : [...prev, lead.id]
                                    );
                                }}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                    selectedLeads.includes(lead.id) 
                                    ? 'bg-indigo-500/10 border-indigo-500' 
                                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold ${selectedLeads.includes(lead.id) ? 'text-indigo-400' : 'text-slate-500'}`}>
                                        {lead.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-xs text-white font-medium">{lead.name}</div>
                                        <div className="text-[10px] text-green-400 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Verificado
                                        </div>
                                    </div>
                                </div>
                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${selectedLeads.includes(lead.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                                    {selectedLeads.includes(lead.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const AutomationView: React.FC<{
    automations: any[];
    loading: boolean;
    setAutomations: React.Dispatch<React.SetStateAction<any[]>>;
    setModal: (m: any) => void;
    onDelete: (id: number) => void;
}> = ({ automations, loading, setAutomations, setModal, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', delay_days: 0, message_template: '', trigger_type: 'days_after_signup' });

    // Remove local useEffect and fetchAutomations since they are now in parent component

    const handleSave = async () => {
        if (!form.name || !form.message_template) return;
        setSaving(true);
        try {
            const res = await api.post('/admin/crm/automations', form);
            const data = await res.json();
            if (data.success) {
                setAutomations(prev => [...prev, data.automation]);
                setShowModal(false);
                setForm({ name: '', delay_days: 0, message_template: '', trigger_type: 'days_after_signup' });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: number) => {
        const res = await api.put(`/admin/crm/automations/${id}/toggle`, {});
        const data = await res.json();
        if (data.success) {
            setAutomations(prev => prev.map(a => a.id === id ? data.automation : a));
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/admin/crm/automations/${id}`);
            setAutomations(prev => prev.filter(a => a.id !== id));
            setModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Sequências de Follow-Up Automático
                        </h2>
                        <p className="text-slate-400 text-sm">Mensagens enviadas automaticamente após o cadastro do utilizador.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                        <Plus className="w-4 h-4" /> Nova Sequência
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500">A carregar automações...</div>
                ) : automations.length === 0 ? (
                    <div className="text-center py-12">
                        <Zap className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500">Nenhuma automação criada ainda.</p>
                        <p className="text-slate-600 text-sm mt-1">Clique em "Nova Sequência" para começar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {automations.map(seq => (
                            <div key={seq.id} className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggle(seq.id)}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                            seq.is_active
                                            ? 'bg-green-500/20 border border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                                            : 'bg-slate-700 border border-slate-600'
                                        }`}
                                        title={seq.is_active ? 'Pausar' : 'Ativar'}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${seq.is_active ? 'bg-green-400' : 'bg-slate-500'}`} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setModal({
                                                isOpen: true,
                                                title: 'Eliminar Automação',
                                                message: 'Tem certeza que deseja eliminar esta sequência automática? Esta ação não pode ser desfeita.',
                                                type: 'confirm',
                                                onConfirm: () => onDelete(seq.id)
                                            });
                                        }} 
                                        className="text-slate-600 hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mb-4 pr-14">
                                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">{seq.name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                            {seq.delay_days === 0 ? '⚡ Enviado no Cadastro' : `⏱ ${seq.delay_days} dias após cadastro`}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-sm text-slate-400 italic mb-4 line-clamp-3">
                                    "{seq.message_template}"
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-600 font-bold uppercase">
                                        {seq.is_active ? <span className="text-green-500">● Ativa</span> : <span className="text-slate-500">● Pausada</span>}
                                    </span>
                                    <span className="text-xs text-slate-500">{seq.sent_count} envios</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Automation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Nova Sequência de Automação</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome da Sequência</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="ex: Boas-Vindas, Re-engajamento..."
                                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Enviar depois de quantos dias após o cadastro?</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.delay_days}
                                    onChange={e => setForm(f => ({ ...f, delay_days: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-indigo-500 transition-all"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Use 0 para enviar imediatamente ao cadastrar. Use {`{name}`} para personalizar o nome.</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Mensagem WhatsApp</label>
                                <textarea
                                    value={form.message_template}
                                    onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))}
                                    rows={5}
                                    placeholder={`Olá {name}, bem-vindo à Conversio! 🚀\nEstamos aqui para te ajudar a criar conteúdo visual incrível...`}
                                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-700 text-slate-400 hover:text-white rounded-xl font-bold transition-all">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name || !form.message_template}
                                className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Guardar Sequência</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

const WhatsAppLogsView: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/admin/whatsapp-logs');
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-400" />
                            Relatórios de WhatsApp (Evolution API)
                        </h2>
                        <p className="text-slate-400 text-sm">Acompanhe as entregas de campanhas e disparos com sucesso e erro.</p>
                    </div>
                    <button onClick={fetchLogs} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 border border-slate-700">
                        <RefreshCcw className="w-4 h-4" /> Atualizar
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="p-4 rounded-tl-xl font-medium">Data / Hora</th>
                                <th className="p-4 font-medium">Destinatário</th>
                                <th className="p-4 font-medium">Tipo</th>
                                <th className="p-4 font-medium max-w-sm">Conteúdo</th>
                                <th className="p-4 font-medium text-center">Status</th>
                                <th className="p-4 rounded-tr-xl font-medium">Razão (Erro)</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">A carregar logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma mensagem disparada ainda.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 text-slate-300">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 font-medium text-white">{log.recipient}</td>
                                        <td className="p-4 text-slate-400 capitalize">{log.type}</td>
                                        <td className="p-4 text-slate-400 max-w-[250px] truncate" title={log.content}>
                                            {log.content}
                                        </td>
                                        <td className="p-4 text-center">
                                            {log.status === 'delivered' ? (
                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 text-green-400" title="Sucesso">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-400" title="Falhou">
                                                    <AlertCircle className="w-4 h-4" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-red-400 max-w-[200px] truncate" title={log.error_details || ''}>
                                            {log.error_details || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminCRM;
