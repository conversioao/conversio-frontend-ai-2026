import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Activity, ShieldAlert, Clipboard, 
  Megaphone, Settings, BarChart3, RefreshCw,
  TrendingUp, Users, DollarSign, Zap
} from 'lucide-react';

// Hooks
import { useAgentsDashboard } from '../../hooks/useAgentsDashboard';

// Components
import { AgentStatusCard } from './agents/AgentStatusCard';
import { MetricWidget } from './agents/MetricWidget';
import { AlertCenter } from './agents/AlertCenter';
import { LiveLogTable } from './agents/LiveLogTable';
import { CampaignManager } from './agents/CampaignManager';
import { AgentConfigEditor } from './agents/AgentConfigEditor';
import { ReportSection } from './agents/ReportSection';
import { api } from '../../lib/api';

export default function AdminAgentTeam() {
    const { 
        agents, metrics, alerts, logs, campaigns, configs, reports,
        loading, error, refresh, toggleAgent, runAgentNow, resolveAlert, saveConfig 
    } = useAgentsDashboard();

    const [activeTab, setActiveTab] = useState('overview');

    if (loading && agents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin"></div>
                <p className="text-text-tertiary animate-pulse font-bold tracking-widest uppercase text-[10px]">Sincronizando Ecossistema Autónomo...</p>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Monitorização', icon: <Activity size={18} /> },
        { id: 'campaigns', label: 'Campanhas', icon: <Megaphone size={18} /> },
        { id: 'reporting', label: 'Relatórios & BI', icon: <BarChart3 size={18} /> },
        { id: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Extremo */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#FFB800] text-black rounded-lg">
                            <Bot size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase">Equipa de Agentes Autónomos</h1>
                    </div>
                    <p className="text-text-secondary font-medium">Controlo total sobre a inteligência de conversão da Conversio AI.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-surface/50 backdrop-blur-md border border-border-subtle p-1.5 rounded-2xl flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' 
                                    : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'
                                }`}
                            >
                                {tab.icon}
                                <span className="hidden lg:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={refresh}
                        className="p-3 bg-surface/50 border border-border-subtle rounded-2xl text-text-tertiary hover:text-[#FFB800] hover:border-[#FFB800] transition-all active:rotate-180 duration-500"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </header>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 text-red-500 text-sm font-bold"
                >
                    <ShieldAlert size={20} />
                    {error}
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div 
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-10"
                    >
                        {/* Section 1: Estado dos Agentes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                            {agents.map((agent) => (
                                <AgentStatusCard 
                                    key={agent.id} 
                                    agent={agent} 
                                    onToggle={toggleAgent}
                                    onRun={runAgentNow}
                                />
                            ))}
                        </div>

                        {/* Section 2: Métricas Rápidas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricWidget 
                                title="Lead Score Médio"
                                value="78.5"
                                trend="+12.4%"
                                isPositive={true}
                                icon={<Zap size={20} />}
                                data={[{value: 20}, {value: 45}, {value: 38}, {value: 65}, {value: 48}, {value: 78}]}
                                color="#FFB800"
                            />
                            <MetricWidget 
                                title="Recuperação Churn"
                                value="142"
                                trend="+8.2%"
                                isPositive={true}
                                icon={<RefreshCw size={20} />}
                                data={[{value: 10}, {value: 20}, {value: 15}, {value: 30}, {value: 25}, {value: 40}]}
                                color="#10B981"
                            />
                            <MetricWidget 
                                title="Conversão Campanha"
                                value="12.4%"
                                trend="+2.1%"
                                isPositive={true}
                                icon={<TrendingUp size={20} />}
                                data={[{value: 5}, {value: 8}, {value: 7}, {value: 12}, {value: 10}, {value: 13}]}
                                color="#3B82F6"
                            />
                            <MetricWidget 
                                title="Erros Técnicos (24h)"
                                value="04"
                                trend="-45%"
                                isPositive={true}
                                icon={<ShieldAlert size={20} />}
                                data={[{value: 20}, {value: 15}, {value: 10}, {value: 8}, {value: 5}, {value: 4}]}
                                color="#EF4444"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Section 3: Centro de Alertas */}
                            <div className="lg:col-span-1">
                                <AlertCenter alerts={alerts} onResolve={resolveAlert} />
                            </div>
                            
                            {/* Section 4: Live Logs */}
                            <div className="lg:col-span-2">
                                <LiveLogTable logs={logs} />
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'campaigns' && (
                    <motion.div 
                        key="campaigns"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <CampaignManager campaigns={campaigns} />
                    </motion.div>
                )}

                {activeTab === 'reporting' && (
                    <motion.div 
                        key="reporting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <ReportSection reports={reports} onGenerate={(type) => api.post('/admin/reports/generate', { type }).then(() => refresh())} />
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div 
                        key="settings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <AgentConfigEditor configs={configs} onSave={saveConfig} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
