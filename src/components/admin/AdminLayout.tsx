import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Shield, ChevronRight, BarChart2, ShieldAlert, Megaphone, History, Box, Layers, ShieldCheck, TrendingUp, Bot, MessageSquare, ExternalLink, Sparkles, Layout, Activity } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminPayments } from './AdminPayments';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminSettings } from './AdminSettings';
import { AdminPlans } from './AdminPlans';
import { AdminModeration } from './AdminModeration';
import { AdminBroadcasts } from './AdminBroadcasts';
import { AdminAudit } from './AdminAudit';
import { AdminModels } from './AdminModels';
import { AdminFinancial } from './AdminFinancial';
import AdminCRM from './AdminCRM';
import AdminOrchestrator from './AdminOrchestrator';
import AdminWhatsAppControl from './AdminWhatsAppControl';
import AdminWhatsAppLeads from './AdminWhatsAppLeads';
import { AdminAgentsPanel } from './AdminAgentsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../lib/api';

interface AdminLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user: any;
}

export function AdminLayout({ currentPage, onNavigate, onLogout, user }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const handleOpenMonitor = () => setIsMonitorOpen(true);
    window.addEventListener('open-monitor-dashboard', handleOpenMonitor);
    return () => window.removeEventListener('open-monitor-dashboard', handleOpenMonitor);
  }, []);

  React.useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${BASE_URL}/monitor/alerts`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
        });
        const data = await res.json();
        if (data.success) {
          setAlertCount(data.alerts.filter((a: any) => a.status === 'active').length);
        }
      } catch (e) {
        console.error('Error fetching alerts for badge:', e);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Check alerts every minute
    return () => clearInterval(interval);
  }, []);
  const navItems = [
    { id: 'admin-dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'admin-agents-panel', icon: <Sparkles size={20} />, label: 'Painel de Agentes' },
    { id: 'admin-agents', icon: <Bot size={20} />, label: 'Orquestrador' },
    { id: 'admin-users', icon: <Users size={20} />, label: 'CRM Usuários' },
    { id: 'admin-payments', icon: <CreditCard size={20} />, label: 'Pagamentos' },
    { id: 'admin-analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
    { id: 'admin-financial', icon: <TrendingUp size={20} />, label: 'Financeiro' },
    { id: 'admin-plans', icon: <Box size={20} />, label: 'Gestão Pacotes' },
    { id: 'admin-leads', icon: <Layers size={20} />, label: 'Leads WhatsApp' },
    { id: 'admin-whatsapp', icon: <MessageSquare size={20} />, label: 'Controlo WhatsApp' },
    { id: 'admin-settings', icon: <Settings size={20} />, label: 'Configurações' },
    { id: 'home', icon: <Shield size={20} />, label: 'Modo Usuário' },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'admin-dashboard': return <AdminDashboard />;
      case 'admin-agents': return <AdminDashboard />; // Render dashboard behind the fullscreen overlay
      case 'admin-users': return <AdminCRM />;
      case 'admin-payments': return <AdminPayments />;
      case 'admin-analytics': return <AdminAnalytics />;
      case 'admin-financial': return <AdminFinancial />;
      case 'admin-plans': return <AdminPlans />;
      case 'admin-moderation': return <AdminModeration />;
      case 'broadcasts': return <AdminBroadcasts />;
      case 'models': return <AdminModels />;
      case 'audit': return <AdminAudit />;
      case 'admin-leads': return <AdminWhatsAppLeads />;
      case 'admin-whatsapp': return <AdminWhatsAppControl />;
      case 'admin-agents-panel': return <AdminAgentsPanel />;
      case 'admin-settings': return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex selection:bg-accent/30 selection:text-text-primary text-text-primary overflow-hidden">
      
      {/* HUD DASHBOARD OVERLAY */}
      <AnimatePresence>
        {currentPage === 'admin-agents' && (
          <AdminOrchestrator onClose={() => onNavigate('admin-dashboard')} />
        )}
      </AnimatePresence>

      {/* Sidebar Admin */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-surface/80 backdrop-blur-2xl border-r border-border-subtle z-50 transform transition-all duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col shadow-2xl md:shadow-none`}>
        <div className="p-8 border-b border-border-subtle relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFB800]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
           <h1 className="flex items-center gap-2 relative z-10 cursor-pointer" onClick={() => window.location.href = '/'}>
              <img src="/logo.png" alt="Conversio.Admin" className="h-8 w-auto object-contain" />
              <span className="text-xs font-black bg-accent/20 text-accent px-2 py-1 rounded-md ml-1 tracking-widest uppercase">Admin</span>
           </h1>
        </div>
        
        <nav className="flex-1 p-6 space-y-3">
           <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-4 ml-2">Menu Principal</p>
           {navItems.map((item) => (
             <button
               key={item.id}
               onClick={() => {
                   onNavigate(item.id);
                   setIsSidebarOpen(false);
               }}
               className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm group relative ${
                 currentPage === item.id 
                   ? 'bg-[#FFB800] text-black shadow-[0_10px_20px_rgba(255,184,0,0.2)]' 
                   : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
               }`}
             >
               <span className={`${currentPage === item.id ? 'text-black' : 'text-text-tertiary group-hover:text-[#FFB800]'} transition-colors`}>
                 {item.icon}
               </span>
               {item.label}
               {item.id === 'admin-agents' && alertCount > 0 && (
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-surface animate-pulse shadow-lg shadow-red-500/20">
                   {alertCount}
                 </span>
               )}
               {currentPage === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
             </button>
           ))}
        </nav>

        <div className="p-6 border-t border-border-subtle bg-bg-base/30">
           <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FFB800] to-yellow-200 border-2 border-surface flex items-center justify-center text-black font-black text-xs shadow-sm">
                {user?.name?.substring(0,2).toUpperCase() || 'AD'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-text-primary truncate">{user?.name || 'Administrador'}</span>
                <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span> Sistema Online
                </span>
              </div>
           </div>
           <button onClick={onLogout} className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm border border-transparent hover:border-red-500/20">
              <LogOut size={18} />
              Sair do Painel
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 bg-bg-base relative min-h-screen overflow-y-auto">
         {/* Background Ornaments */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFB800]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

         {/* Mobile Header */}
         <div className="md:hidden sticky top-0 bg-surface/80 backdrop-blur-md z-40 flex items-center justify-between p-6 border-b border-border-subtle">
             <div className="flex items-center gap-2" onClick={() => window.location.href = '/'}>
               <img src="/logo.png" alt="Conversio.Admin" className="h-7 w-auto object-contain" />
               <span className="text-[10px] font-black bg-accent/20 text-accent px-1.5 py-0.5 rounded ml-1 uppercase">Admin</span>
             </div>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-bg-base border border-border-subtle rounded-xl text-[#FFB800]">
                <LayoutDashboard size={20} />
             </button>
         </div>

         <div className="p-8 lg:p-12 relative z-10">
             <div className="max-w-6xl mx-auto">
                 {renderContent()}
             </div>
         </div>
      </main>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in transition-all" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}
