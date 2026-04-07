import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, Search, Filter, MessageSquare, User, Briefcase, Target, 
  Send, Bot, UserCheck, Clock, CheckCircle2, AlertCircle,
  ToggleLeft, ToggleRight, MessageCircle, X, ChevronRight,
  Shield, Brain, Zap, ArrowRight, RefreshCcw, Layers, Save, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../lib/api';

console.log('AdminWhatsAppLeads Loaded Correctly');

interface Lead {
  id: string;
  phone: string;
  name: string;
  business_info: string;
  needs: string;
  status: 'new' | 'in_progress' | 'qualified' | 'converted' | 'human';
  agent_active: boolean;
  last_interaction: string;
  created_at: string;
}

interface Message {
  id: number;
  role: 'user' | 'agent' | 'human';
  content: string;
  created_at: string;
}

export default function AdminWhatsAppLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [agentGlobalEnabled, setAgentGlobalEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'settings'>('leads');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [instanceStatus, setInstanceStatus] = useState<any>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    qualified: 0,
    inProgress: 0,
    messagesToday: 0
  });

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/leads?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
        setAgentGlobalEnabled(data.agentEnabled);
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
        const [promptRes, phoneRes, statusRes] = await Promise.all([
          fetch(`${BASE_URL}/admin/whatsapp/config/whatsapp_agent_prompt`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
          }),
          fetch(`${BASE_URL}/admin/whatsapp/config/admin_whatsapp`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
          }),
          fetch(`${BASE_URL}/admin/whatsapp/instance-status`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
          })
        ]);

        const promptData = await promptRes.json();
        const phoneData = await phoneRes.json();
        const statusData = await statusRes.json();

        if (promptData.success) setAgentPrompt(promptData.value);
        if (phoneData.success) setAdminPhone(phoneData.value);
        if (statusData.success) setInstanceStatus(statusData);

    } catch (e) { console.error('Error fetching config:', e); }
  };

  const calculateStats = (allLeads: Lead[]) => {
    setStats({
      total: allLeads.length,
      qualified: allLeads.filter(l => l.status === 'qualified').length,
      inProgress: allLeads.filter(l => l.status === 'in_progress' || l.status === 'new').length,
      messagesToday: 0 // Seria ideal vir do backend, mas calculamos o que podemos
    });
  };

  const updateGlobalConfig = async (key: string, value: any) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` 
        },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
          if (key === 'whatsapp_agent_enabled') setAgentGlobalEnabled(value);
          if (key === 'admin_whatsapp') setAdminPhone(value);
          if (key === 'whatsapp_agent_prompt') alert('Conhecimento atualizado com sucesso!');
          fetchLeads();
          fetchConfig();
      }
    } catch (e) { console.error(e); }
    finally { setIsSavingConfig(false); }
  };

  const setupWebhook = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/setup-webhook`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchConfig();
      } else {
        alert('Erro ao ativar: ' + data.message);
      }
    } catch (e) { console.error(e); }
    finally { setIsSavingConfig(false); }
  };

  const fetchMessages = async (leadId: string) => {
    setChatLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/leads/${leadId}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
      });
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchConfig();
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id);
      const interval = setInterval(() => fetchMessages(selectedLead.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedLead?.id]);

  const toggleLeadAgent = async (lead: Lead) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/leads/${lead.id}/toggle-agent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` 
        },
        body: JSON.stringify({ active: !lead.agent_active })
      });
      if (res.ok) {
        fetchLeads();
        if (selectedLead?.id === lead.id) {
            setSelectedLead({ ...selectedLead, agent_active: !lead.agent_active });
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !messageInput.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/leads/${selectedLead.id}/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` 
        },
        body: JSON.stringify({ text: messageInput })
      });
      const data = await res.json();
      if (data.success) {
        setMessageInput('');
        fetchMessages(selectedLead.id);
        fetchLeads();
      }
    } catch (e) { console.error(e); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-black border border-blue-500/20 uppercase tracking-wider">Novo</span>;
      case 'in_progress': return <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full text-[10px] font-black border border-yellow-500/20 uppercase tracking-wider">Qualificando</span>;
      case 'qualified': return <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[10px] font-black border border-emerald-500/20 uppercase tracking-wider">Qualificado</span>;
      case 'converted': return <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full text-[10px] font-black border border-purple-500/20 uppercase tracking-wider">Convertido</span>;
      case 'human': return <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-black border border-orange-500/20 uppercase tracking-wider">Humano</span>;
      default: return null;
    }
  };

  const filteredLeads = leads.filter(l => 
    l.phone.includes(search) || 
    (l.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-bg-base/30 backdrop-blur-3xl p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 -z-10"></div>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-text-primary flex items-center gap-3">
              <Layers className="text-emerald-500" size={32} />
              Gestor de Leads WhatsApp v2
            </h2>
            <p className="text-text-tertiary text-sm mt-1 font-medium">Qualificação autónoma e monitorização em tempo real.</p>
          </div>

          <div className="h-12 w-px bg-border-subtle/50 hidden md:block"></div>

          <div className="flex bg-surface p-1 rounded-2xl border border-border-subtle shadow-inner">
            {[
              { id: 'leads', icon: <UsersIcon size={16} />, label: 'Leads' },
              { id: 'settings', icon: <Cpu size={16} />, label: 'Ajustes do Agente' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {instanceStatus?.state === 'open' ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">WhatsApp Conectado</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">WhatsApp Desconectado</span>
            </div>
          )}

          <button
             onClick={() => updateGlobalConfig('whatsapp_agent_enabled', !agentGlobalEnabled)}
             disabled={isSavingConfig}
             className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all active:scale-95 ${
               agentGlobalEnabled 
                 ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20' 
                 : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
             }`}
          >
            <Bot size={18} className={agentGlobalEnabled ? 'text-emerald-500' : 'text-red-500'} />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Agente Global</span>
              <span className={`text-xs font-bold ${agentGlobalEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
                {agentGlobalEnabled ? 'LIGADO' : 'DESLIGADO'}
              </span>
            </div>
            {isSavingConfig ? <RefreshCcw size={14} className="animate-spin ml-2" /> : (agentGlobalEnabled ? <ToggleRight className="text-emerald-500 ml-2" size={24} /> : <ToggleLeft className="text-red-500 ml-2" size={24} />)}
          </button>
          
          <button 
            onClick={() => { fetchLeads(); fetchConfig(); }}
            className="p-3 bg-surface border border-border-subtle rounded-2xl text-text-tertiary hover:text-emerald-500 transition-all shadow-sm active:scale-95"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      {/* Stats Band */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total de Leads', value: leads.length, icon: <UsersIcon size={20} />, color: 'blue' },
          { label: 'Qualificados', value: stats.qualified, icon: <Target size={20} />, color: 'emerald' },
          { label: 'Em Qualificação', value: stats.inProgress, icon: <Zap size={20} />, color: 'yellow' },
          { label: 'Saúde API', value: instanceStatus?.state === 'open' ? '100%' : 'Erro', icon: <Cpu size={20} />, color: instanceStatus?.state === 'open' ? 'emerald' : 'red' }
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-surface/50 backdrop-blur-xl border border-border-subtle p-5 rounded-[2rem] flex items-center gap-5 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center bg-${stat.color}-500/10 text-${stat.color}-500`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">{stat.label}</p>
              <h4 className="text-2xl font-black text-text-primary mt-0.5">{stat.value}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leads' ? (
          <motion.div 
            key="leads-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex gap-6 overflow-hidden max-h-[calc(100vh-220px)]"
          >
            {/* Left Col: Lead List */}
            <div className="w-1/3 flex flex-col gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome ou nº..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-text-primary"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {['all', 'new', 'in_progress', 'qualified', 'human'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      filter === s 
                        ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20' 
                        : 'bg-surface border-border-subtle text-text-tertiary hover:border-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {s === 'all' ? 'Todos' : s.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredLeads.map((lead) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-4 rounded-3xl border cursor-pointer transition-all relative group ${
                        selectedLead?.id === lead.id 
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xl shadow-emerald-500/5' 
                          : 'bg-surface border-border-subtle hover:border-emerald-500/30 hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-colors ${
                          selectedLead?.id === lead.id ? 'bg-emerald-500 text-black' : 'bg-bg-base text-text-tertiary group-hover:bg-emerald-500/10 group-hover:text-emerald-500'
                        }`}>
                          {lead.name ? lead.name[0].toUpperCase() : <User size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-black text-sm text-text-primary truncate">{lead.name || lead.phone}</h3>
                            <span className="text-[10px] text-text-tertiary font-medium">
                              {new Date(lead.last_interaction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-text-tertiary font-bold tracking-tight">{lead.phone}</span>
                            <div className="w-1 h-1 bg-border-subtle rounded-full"></div>
                            {getStatusBadge(lead.status)}
                          </div>
                        </div>
                      </div>
                      {lead.business_info && (
                        <p className="text-[10px] text-text-tertiary font-medium line-clamp-1 italic bg-bg-base/50 p-1 px-2 rounded-lg">
                          {lead.business_info}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredLeads.length === 0 && !loading && (
                    <div className="text-center py-20 text-text-tertiary text-xs font-black uppercase tracking-widest opacity-30">Nenhum Lead</div>
                )}
              </div>
            </div>

            {/* Right Col: Chat & Insights */}
            <div className="flex-1 flex gap-6 overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedLead ? (
                  <motion.div 
                    key={selectedLead.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col bg-surface/50 backdrop-blur-2xl border border-border-subtle rounded-[2.5rem] overflow-hidden"
                  >
                    <div className="p-6 bg-surface border-b border-border-subtle flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center font-black text-emerald-500 text-lg">
                          {selectedLead.name ? selectedLead.name[0].toUpperCase() : 'L'}
                        </div>
                        <div>
                          <h3 className="font-black text-text-primary flex items-center gap-2">
                            {selectedLead.name || 'Lead WhatsApp'}
                            {!selectedLead.agent_active && <Shield size={14} className="text-orange-500" />}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-500">{selectedLead.phone}</span>
                            <div className="w-1 h-1 bg-emerald-500/30 rounded-full"></div>
                            {getStatusBadge(selectedLead.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleLeadAgent(selectedLead)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-[11px] uppercase tracking-wider transition-all ${
                            selectedLead.agent_active 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                              : 'bg-orange-500/10 border-orange-500/30 text-orange-500'
                          }`}
                        >
                          {selectedLead.agent_active ? <Bot size={16} /> : <UserCheck size={16} />}
                          {selectedLead.agent_active ? 'IA Ativa' : 'Modo Humano'}
                        </button>
                        <button onClick={() => setSelectedLead(null)} className="p-2 text-text-tertiary bg-bg-base/50 rounded-xl hover:text-text-primary transition-colors"><X size={20} /></button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-bg-base/20">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] px-5 py-4 rounded-2xl ${
                            msg.role === 'user' 
                              ? 'bg-surface border border-border-subtle rounded-tl-none text-text-primary' 
                              : 'bg-emerald-500 text-black rounded-tr-none'
                          }`}>
                             <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] uppercase font-black tracking-widest ${msg.role === 'user' ? 'text-emerald-500' : 'text-black/50'}`}>
                                    {msg.role === 'user' ? 'Cliente' : 'Alex (IA)'}
                                </span>
                            </div>
                            <p className="text-[13px] font-medium leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-surface border-t border-border-subtle">
                      <form onSubmit={handleSendMessage} className="flex gap-4">
                        <input 
                          type="text" 
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Digite ou assuma o controle..."
                          className="w-full bg-bg-base border border-border-subtle rounded-2xl py-4 flex-1 text-sm font-medium px-6 focus:outline-none focus:border-emerald-500 text-text-primary"
                        />
                        <button type="submit" disabled={!messageInput.trim()} className="bg-[#FFB800] text-black w-14 h-14 flex items-center justify-center rounded-2xl shadow-lg active:scale-95 disabled:opacity-50"><Send size={22} /></button>
                      </form>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border-subtle rounded-[2.5rem] text-text-tertiary p-12 text-center opacity-50">
                    <MessageSquare size={40} className="mb-4" />
                    <h3 className="font-black text-text-primary">Monitor de Conversas</h3>
                    <p className="text-xs max-w-[250px] mt-2 leading-relaxed">Selecione um lead para visualizar a qualificação em tempo real.</p>
                  </div>
                )}
              </AnimatePresence>

              {selectedLead && (
                <div className="w-80 bg-surface/30 backdrop-blur-2xl border border-border-subtle rounded-[2.5rem] p-6 flex flex-col gap-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB800] flex items-center gap-2"><Brain size={14} /> Dados Qualificados</h4>
                    <div className="space-y-4">
                        <div className="bg-bg-base/50 p-4 rounded-2xl border border-border-subtle">
                            <label className="text-[9px] font-black uppercase tracking-widest text-text-tertiary">Negócio</label>
                            <p className="text-xs font-bold text-text-primary mt-1">{selectedLead.business_info || 'Identificando...'}</p>
                        </div>
                        <div className="bg-bg-base/50 p-4 rounded-2xl border border-border-subtle">
                            <label className="text-[9px] font-black uppercase tracking-widest text-text-tertiary">Necessidade</label>
                            <p className="text-xs font-bold text-text-primary mt-1">{selectedLead.needs || 'Identificando...'}</p>
                        </div>
                    </div>
                    <div className="mt-auto p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Status</span>
                        <div className="flex items-center gap-2 mt-2">{getStatusBadge(selectedLead.status)}</div>
                    </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="settings-tab"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col bg-surface/50 backdrop-blur-3xl border border-border-subtle rounded-[2.5rem] overflow-hidden"
          >
            <div className="p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-text-primary flex items-center gap-3">
                            <Brain className="text-[#FFB800]" size={24} />
                            Knowledge Base do Agente
                        </h3>
                        <p className="text-text-tertiary text-sm mt-1 font-medium">Define a identidade, preços e regras de qualificação do Alex.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={async () => {
                                if (confirm('Isto irá verificar e criar tabelas em falta. Continuar?')) {
                                    const res = await fetch(`${BASE_URL}/admin/setup`, { 
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
                                    });
                                    if (res.ok) alert('Base de dados sincronizada com sucesso!');
                                }
                            }}
                            className="flex items-center gap-2 bg-surface border border-border-subtle text-text-secondary px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-hover transition-all active:scale-95"
                        >
                            <RefreshCcw size={16} />
                            Sincronizar DB
                        </button>
                        <button 
                            onClick={() => updateGlobalConfig('whatsapp_agent_prompt', agentPrompt)}
                            disabled={isSavingConfig}
                            className="flex items-center gap-2 bg-emerald-500 text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {isSavingConfig ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                            Guardar Alterações
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex gap-8">
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">System Prompt / Conhecimento</label>
                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">MarkDown Ativo</span>
                        </div>
                        <textarea 
                            value={agentPrompt}
                            onChange={(e) => setAgentPrompt(e.target.value)}
                            className="flex-1 bg-bg-base/50 border border-border-subtle rounded-3xl p-8 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all text-text-secondary leading-relaxed resize-none custom-scrollbar"
                            placeholder="# Define aqui quem é o agente e o que ele sabe..."
                        />
                    </div>

                    <div className="w-80 space-y-6">
                        <div className="bg-bg-base/50 p-6 rounded-3xl border border-border-subtle">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-4 flex items-center gap-2">
                                <MessageCircle size={14} /> Contacto Admin para Handover
                             </h4>
                             <div className="space-y-2">
                                <p className="text-[11px] text-text-tertiary font-medium">Define o número que recebe alertas de leads qualificados.</p>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={adminPhone}
                                    onChange={(e) => setAdminPhone(e.target.value)}
                                    placeholder="Ex: 244923000000"
                                    className="flex-1 bg-bg-base border border-border-subtle rounded-xl py-3 px-4 text-xs font-bold text-text-primary focus:border-emerald-500 outline-none"
                                  />
                                  <button 
                                    onClick={() => updateGlobalConfig('admin_whatsapp', adminPhone)}
                                    className="p-3 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-all shadow-lg active:scale-95"
                                  >
                                    <Save size={18} />
                                  </button>
                                </div>
                             </div>
                        </div>

                          <div className="bg-bg-base/50 p-6 rounded-3xl border border-border-subtle">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                                <Zap size={14} /> Ativação de Automação
                             </h4>
                             <div className="space-y-4">
                                <p className="text-[11px] text-text-tertiary font-medium">Ativa o Webhook para o Alex responder mensagens em tempo real.</p>
                                <button 
                                  onClick={setupWebhook}
                                  disabled={isSavingConfig}
                                  className="w-full flex items-center justify-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                  {isSavingConfig ? <RefreshCcw size={16} className="animate-spin" /> : <Zap size={16} />}
                                  Ligar Automação (Webhook)
                                </button>
                                <div className="flex items-center gap-2 p-3 bg-bg-base rounded-xl border border-border-subtle">
                                   <div className={`w-2 h-2 rounded-full ${instanceStatus?.state === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                   <span className="text-[10px] font-black uppercase tracking-tight text-text-secondary">
                                      Estado: {instanceStatus?.state === 'open' ? 'CONECTADO' : 'DESCONECTADO'}
                                   </span>
                                </div>
                             </div>
                         </div>

                        <div className="bg-bg-base/50 p-6 rounded-3xl border border-border-subtle">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-4">Dicas de Edição</h4>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 bg-emerald-500/10 flex items-center justify-center rounded-lg text-emerald-500 font-black text-[10px]">1</div>
                                    <p className="text-[11px] text-text-tertiary leading-relaxed font-medium">Use <b>MarkDown</b> para estruturar o conhecimento.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 bg-emerald-500/10 flex items-center justify-center rounded-lg text-emerald-500 font-black text-[10px]">2</div>
                                    <p className="text-[11px] text-text-tertiary leading-relaxed font-medium">Mantenha a identidade <b>Alex</b> e o sotaque angolano.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 bg-emerald-500/10 flex items-center justify-center rounded-lg text-emerald-500 font-black text-[10px]">3</div>
                                    <p className="text-[11px] text-text-tertiary leading-relaxed font-medium">Defina regras claras de <b>preços e planos</b>.</p>
                                </li>
                            </ul>
                        </div>

                        <div className="p-6 bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-3xl">
                            <div className="flex items-center gap-3 text-[#FFB800] mb-3">
                                <AlertCircle size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Cuidado</span>
                            </div>
                            <p className="text-[11px] text-[#FFB800]/80 leading-relaxed font-medium">
                                Alterar o prompt afeta <b>todos os novos leads</b> em tempo real. Teste sempre com um número próprio antes de escalar.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
