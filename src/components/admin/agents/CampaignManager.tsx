import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, Search, Calendar, Users, Send, CheckCircle, BarChart3, Clock, X, Trash2, Filter, Pause } from 'lucide-react';
import { api } from '../../../lib/api';

interface CampaignManagerProps {
    campaigns: any[];
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ campaigns }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        type: 'promotional',
        target_segment: 'all',
        message_template: '',
        channels: ['whatsapp']
    });

    const statusIcons: any = {
        active: <Send className="text-emerald-500" size={16} />,
        paused: <Pause className="text-amber-500" size={16} />,
        completed: <CheckCircle className="text-blue-500" size={16} />,
        draft: <Clock className="text-gray-500" size={16} />
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/campaigns', newCampaign);
            if (res.ok) {
                setIsCreateOpen(false);
                // Notification success
            }
        } catch (err) {
            console.error('Error creating campaign:', err);
        }
    };

    return (
        <div className="bg-surface/50 backdrop-blur-xl border border-border-subtle rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Megaphone size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight">Gestão de Campanhas</h3>
                        <p className="text-sm font-medium text-text-tertiary">Envios em massa e segmentação dinâmica</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-[#FFB800] transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar campanha..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-bg-base/50 border border-border-subtle rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-[#FFB800]"
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#FFB800] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#FFB800]/20"
                    >
                        <Plus size={16} /> Nova Campanha
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-bg-base/30 text-[10px] font-black text-text-tertiary uppercase tracking-[0.15em] border-b border-border-subtle">
                            <th className="px-8 py-4">Campanha</th>
                            <th className="px-8 py-4">Público Alvo</th>
                            <th className="px-8 py-4">Alcance</th>
                            <th className="px-8 py-4">Conversão</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/50">
                        {campaigns.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-12 text-center text-text-tertiary italic">Nenhuma campanha activa encontrada.</td>
                            </tr>
                        ) : (
                            campaigns.map((camp) => (
                                <tr key={camp.id} className="group hover:bg-surface-hover/20 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-text-primary">{camp.name}</span>
                                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{camp.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                                            <Users size={14} /> {camp.target_segment}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-text-primary">{camp.total_recipients || 0}</span>
                                            <span className="text-[10px] text-text-tertiary uppercase">Destinatários</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-bg-base rounded-full overflow-hidden min-w-[60px]">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full" 
                                                    style={{ width: `${(camp.converted_count/camp.total_recipients)*100 || 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-black text-emerald-500">
                                                {((camp.converted_count/camp.total_recipients)*100 || 0).toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            {statusIcons[camp.status]}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{camp.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 bg-bg-base/50 border border-border-subtle rounded-lg text-text-secondary hover:text-[#FFB800] transition-colors">
                                                <BarChart3 size={16} />
                                            </button>
                                            <button className="p-2 bg-bg-base/50 border border-border-subtle rounded-lg text-text-secondary hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal - Simplificado para o exemplo */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-surface border border-border-subtle w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-border-subtle flex items-center justify-between">
                                <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Lançar Nova Campanha IA</h3>
                                <button onClick={() => setIsCreateOpen(false)} className="text-text-tertiary hover:text-text-primary"><X /></button>
                            </div>
                            <form onSubmit={handleCreate} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Nome da Campanha</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm font-medium text-text-primary outline-none focus:border-[#FFB800]"
                                        placeholder="EX: Black Friday VIP Angola"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Tipo</label>
                                        <select className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm font-medium text-text-primary outline-none focus:border-[#FFB800]">
                                            <option value="promotional">Promocional</option>
                                            <option value="educational">Educativa</option>
                                            <option value="seasonal">Sazonal</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Segmento</label>
                                        <select className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm font-medium text-text-primary outline-none focus:border-[#FFB800]">
                                            <option value="all">Todos os Clientes</option>
                                            <option value="new">Novos (7 dias)</option>
                                            <option value="vip">VIP (+50k Kz LTV)</option>
                                            <option value="churn_risk">Risco de Churn</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Mensagem IA (Persuasiva)</label>
                                    <textarea 
                                        rows={4}
                                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm font-medium text-text-primary outline-none focus:border-[#FFB800] resize-none"
                                        placeholder="Dica: Use {name} para personalizar..."
                                        required
                                    ></textarea>
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full py-4 bg-[#FFB800] text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Agendar Envio Imediato
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
