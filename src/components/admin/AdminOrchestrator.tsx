import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ShieldAlert, Zap, RefreshCw, Megaphone, Bot, X, Activity, Server, Database, Headphones } from 'lucide-react';
import { useAgentsDashboard } from '../../hooks/useAgentsDashboard';

export default function AdminOrchestrator({ onClose }: { onClose: () => void }) {
    const { logs, refresh } = useAgentsDashboard();
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const [liveTerminalOutput, setLiveTerminalOutput] = useState<any[]>([]);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [liveTerminalOutput]);

    // Speed up polling for "live" feel in terminal
    useEffect(() => {
        const interval = setInterval(() => {
            refresh();
        }, 10000); // 10 seconds polling for log sweep
        return () => clearInterval(interval);
    }, [refresh]);

    // Feed terminal progressively so it looks "live"
    useEffect(() => {
        if (logs.length > 0) {
            setLiveTerminalOutput(logs.slice(0, 50).reverse());
        }
    }, [logs]);

    const systemAgents = [
        { 
            id: 'monitor', 
            name: 'Agente Monitor', 
            role: 'O Guarda / DevOps',
            desc: 'Vigia e pune comportamentos anormais. Ele corre ciclos constantemente a verificar a sanidade do sistema: limpa encravamentos de gerações antigas, gere o teu armazenamento se estiver absurdamente cheio, avalia latências altas das APIs  (como OpenAI ou KIE) e gera Alertas para o Admin.',
            icon: <ShieldAlert size={24} />, 
            color: 'red'
        },
        { 
            id: 'funil', 
            name: 'Agente Funil', 
            role: 'Diretor Comercial',
            desc: 'Acompanha o ciclo de vida de cada utilizador (Lead, Registo, Trial, Pago). O objetivo é garantir que os utilizadores evoluam e injetar lembretes automáticos no WhatsApp. Ex: se alguém se registou há 3 dias e nunca gerou, notifica-o.',
            icon: <Zap size={24} />, 
            color: 'emerald'
        },
        { 
            id: 'recuperacao', 
            name: 'Agente Recuperação', 
            role: 'O Negociador / Churn',
            desc: 'Cobra as contas ou recupera desistentes. Se ocorreu Churn (carrinhos não pagos), inicia uma "sequência" de reengajamento com as Leads durante X dias para recuperar vendas perdidas por distração.',
            icon: <RefreshCw size={24} />, 
            color: 'blue'
        },
        { 
            id: 'campanhas', 
            name: 'Agente Campanhas', 
            role: 'Marketer Master',
            desc: 'Ativa e despacha transmissões em massa. Se pretendes enviar um Broadcast de SMS/WhatsApp amanhã às 15:00 baseado num segmento dinâmico, é este Agente que acorda e dispara os dados de rajada de forma faseada.',
            icon: <Megaphone size={24} />, 
            color: 'purple'
        },
        { 
            id: 'envios', 
            name: 'Agente Envios', 
            role: 'Carteiro CRM',
            desc: 'Especialista em WhatsApp API. Não entra em marketing de massa, apenas gerencia follow-ups, conversas 1x1 da IA e disparos seguros (ex: recuperação de password) minimizando o risco de Rate Limits pela MEta/EvolutionAPI.',
            icon: <Bot size={24} />, 
            color: 'yellow'
        },
        { 
            id: 'atendimento', 
            name: 'Agente Atendimento', 
            role: 'Suporte & Triagem',
            desc: 'Especialista em SAC e Triagem com LLM adaptativo. Responde a dúvidas dos subscritores e clientes no WhatsApp, encaminha leads quentes para o fecho e notifica humanos em casos críticos sem falhar no Rate Limit.',
            icon: <Headphones size={24} />, 
            color: 'cyan'
        }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black text-white flex flex-col md:flex-row font-mono overflow-hidden"
        >
            {/* Header / Botão de fechar */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50 pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full animate-pulse backdrop-blur-md">
                        <Activity className="text-green-500" size={16} />
                        <span className="text-green-500 text-xs font-black tracking-widest">SISTEMA ONLINE - VARRENDO TAREFAS</span>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full transition-all pointer-events-auto backdrop-blur-md"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Lado Esquerdo: HUD Interativo de Agentes */}
            <div className="w-full md:w-1/2 h-full border-r border-[#FFB800]/20 bg-gradient-to-br from-black via-zinc-900 to-black p-10 flex flex-col pt-24 relative overflow-hidden">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-screen opacity-50" />
                
                <h1 className="text-4xl font-black text-[#FFB800] uppercase tracking-tighter mb-2 relative z-10">Orquestrador Central</h1>
                <p className="text-zinc-500 text-sm mb-12 max-w-md relative z-10">Clique num "Nó" Agente (Node) para interagir e descobrir qual é a sua diretiva atual no ecossistema.</p>

                <div className="flex-1 relative z-10 flex flex-col justify-center gap-8">
                    {/* Visualização de Rede */}
                    <div className="grid grid-cols-2 gap-6 relative">
                        {systemAgents.map(agent => (
                            <motion.button
                                key={agent.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedAgent(agent.id)}
                                className={`flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all ${
                                    selectedAgent === agent.id 
                                    ? 'bg-' + agent.color + '-500/20 border-' + agent.color + '-500 shadow-[0_0_30px_rgba(var(--color-' + agent.color + '-500),0.3)]' 
                                    : 'bg-zinc-900/50 border-zinc-700/50 hover:border-[#FFB800]/50'
                                }`}
                                style={{
                                    borderColor: selectedAgent === agent.id && agent.color === 'yellow' ? '#FFB800' : undefined,
                                    backgroundColor: selectedAgent === agent.id && agent.color === 'yellow' ? 'rgba(255, 184, 0, 0.1)' : undefined
                                }}
                            >
                                <div className={`p-4 rounded-full bg-black/50 border border-zinc-700 text-${agent.color}-500 shadow-inner relative`}>
                                    {agent.icon}
                                    {/* Pulse Indicator */}
                                    <div className={`absolute top-0 right-0 w-3 h-3 rounded-full bg-${agent.color}-500 animate-ping`} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-zinc-200 font-bold text-sm uppercase tracking-wider">{agent.name}</h3>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Descrição Detalhada em Modal/Caixa */}
                    <AnimatePresence mode="wait">
                        {selectedAgent ? (
                            <motion.div
                                key={selectedAgent}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mt-4 p-6 bg-zinc-900/80 border border-[#FFB800]/30 rounded-2xl backdrop-blur-xl relative"
                            >
                                {systemAgents.map(a => a.id === selectedAgent && (
                                    <div key={a.id} className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[#FFB800]">{a.icon}</span>
                                            <h4 className="text-xl font-bold text-white uppercase">{a.role}</h4>
                                        </div>
                                        <p className="text-zinc-400 text-sm leading-relaxed">{a.desc}</p>
                                        <div className="flex justify-end pt-2">
                                            <div className="flex items-center gap-2 text-xs text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-full uppercase">
                                                <Server size={12} /> Instância Ativa
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="mt-4 p-6 border border-zinc-800 border-dashed rounded-2xl flex items-center justify-center text-zinc-600 text-xs uppercase tracking-widest h-[160px]">
                                Selecione um Agente
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Lado Direito: Terminal Streaming */}
            <div className="w-full md:w-1/2 h-full bg-black flex flex-col pt-24 p-10 font-mono relative">
                <div className="flex justify-between items-end mb-6 border-b border-zinc-800 pb-4">
                    <div>
                        <h2 className="text-[#00FF41] text-lg font-bold flex items-center gap-3 uppercase tracking-widest"><Terminal size={20} /> Kernel Log Stream</h2>
                        <p className="text-zinc-600 text-[10px] uppercase">Monitorização live de atividades e varreduras do orquestrador</p>
                    </div>
                    <Database size={20} className="text-zinc-700 animate-pulse" />
                </div>

                <div className="flex-1 overflow-y-auto bg-zinc-950/50 border border-zinc-900 rounded-xl p-6 shadow-inner relative custom-scrollbar">
                    {liveTerminalOutput.length === 0 ? (
                        <div className="text-zinc-600 flex items-center gap-2">
                            <span className="w-2 h-2 bg-zinc-600 animate-pulse rounded-full" /> Aguardando inputs do sistema...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {liveTerminalOutput.map((log: any, index: number) => (
                                <div key={log.id || index} className="text-sm">
                                    <span className="text-zinc-500">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                    <span className="text-[#FFB800] ml-2">[{log.agent_name}]</span>
                                    {log.result === 'error' ? (
                                        <span className="text-red-500 ml-2">❌ ACHTUNG: {log.action} falhou!</span>
                                    ) : (
                                        <span className="text-[#00FF41] ml-2">✓ {log.action} varrido com sucesso.</span>
                                    )}
                                    {log.metadata && (
                                        <div className="pl-24 text-zinc-600 text-[11px] truncate mt-1">
                                            {`> SYS_PAYLOAD: ${JSON.stringify(log.metadata)}`}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={terminalEndRef} className="h-4" />
                            <div className="text-[#00FF41] animate-pulse">_</div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Custom Styles for Scrollbar in this component only */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
            `}</style>
        </motion.div>
    );    
}
