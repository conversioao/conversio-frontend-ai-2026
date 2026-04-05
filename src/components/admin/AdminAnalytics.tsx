import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Zap, Clock, Calendar, ArrowUpRight, ArrowDownRight, UserCheck } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { apiFetch } from '../../lib/api';

export function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBehaviorStats = async () => {
    try {
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/behavior-stats?adminId=${adminId}`);
      const data = await res.json();
      if (data.success) {
        setData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBehaviorStats();
  }, []);

  if (loading) return <div className="p-12 text-center text-text-tertiary animate-pulse font-black uppercase tracking-widest">Analisando comportamentos...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Analytics de Utilizador</h1>
          <p className="text-text-secondary text-sm font-medium">Comportamento, conversão e retenção em tempo real.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border-subtle">
           <button className="px-4 py-2 bg-[#FFB800] text-black rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#FFB800]/20">Últimas 24h</button>
           <button className="px-4 py-2 text-text-tertiary hover:text-text-primary rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">7 Dias</button>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Clock size={64} className="text-[#FFB800]" />
            </div>
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-4">Horário de Pico</p>
            <h3 className="text-4xl font-black text-text-primary tracking-tighter mb-2">21:00 <span className="text-sm font-bold text-[#FFB800] ml-1">GMT</span></h3>
            <p className="text-xs text-emerald-500 font-bold flex items-center gap-1">
               <ArrowUpRight size={14} /> +12% vs Ontem
            </p>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <UserCheck size={64} className="text-purple-500" />
            </div>
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-4">Taxa de Retenção</p>
            <h3 className="text-4xl font-black text-text-primary tracking-tighter mb-2">68,4%</h3>
            <p className="text-xs text-emerald-500 font-bold flex items-center gap-1">
               <ArrowUpRight size={14} /> +4.2% este mês
            </p>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Zap size={64} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-4">Tempo Médio Geração</p>
            <h3 className="text-4xl font-black text-text-primary tracking-tighter mb-2">12.4s</h3>
            <p className="text-xs text-red-500 font-bold flex items-center gap-1">
               <ArrowDownRight size={14} /> -0.8s (Mais rápido)
            </p>
         </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Hourly Activity */}
         <div className="lg:col-span-2 bg-surface border border-border-subtle p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h4 className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#FFB800]" /> Atividade nas Últimas 24h
                  </h4>
                  <p className="text-xs text-text-tertiary font-medium">Total de gerações distribuídas por hora.</p>
               </div>
            </div>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.hourlyGens}>
                     <defs>
                        <linearGradient id="colorGens" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#FFB800" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                     <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#8F8F8F', fontSize: 10}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#8F8F8F', fontSize: 10}} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#FFB800', fontWeight: 'bold' }}
                     />
                     <Area type="monotone" dataKey="count" stroke="#FFB800" strokeWidth={3} fillOpacity={1} fill="url(#colorGens)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* New Registrations */}
         <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] shadow-sm">
            <div className="mb-8">
               <h4 className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                 <Users size={18} className="text-purple-500" /> Novos Registos
               </h4>
               <p className="text-xs text-text-tertiary font-medium">Acompanhamento dos últimos 30 dias.</p>
            </div>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyUsers}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                     <XAxis dataKey="day" hide />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                     />
                     <Bar dataKey="count" fill="#A855F7" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Top Active Users */}
      <div className="bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden">
         <div className="p-8 border-b border-border-subtle bg-surface-hover/30">
            <h4 className="text-base font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
               <Zap size={18} className="text-[#FFB800]" /> Top 10 Power Users
            </h4>
            <p className="text-xs text-text-tertiary">Utilizadores mais produtivos nos últimos 30 dias.</p>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] uppercase font-black tracking-widest text-text-tertiary border-b border-border-subtle">
                     <th className="px-8 py-4">Utilizador</th>
                     <th className="px-8 py-4">Volume de Gerações</th>
                     <th className="px-8 py-4 text-right">Impacto Infra</th>
                  </tr>
               </thead>
               <tbody>
                  {data.activeUsers.map((user: any, index: number) => (
                     <tr key={index} className="border-b border-border-subtle hover:bg-bg-base/50 transition-colors group">
                        <td className="px-8 py-4 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-bg-base text-[10px] font-bold flex items-center justify-center border border-border-subtle text-text-tertiary">
                              {index + 1}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-text-primary group-hover:text-[#FFB800] transition-colors">{user.name}</p>
                              <p className="text-[10px] text-text-tertiary">{user.email}</p>
                           </div>
                        </td>
                        <td className="px-8 py-4">
                           <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-[#FFB800]">{user.gen_count}</span>
                              <div className="flex-1 max-w-[100px] h-1.5 bg-bg-base rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-[#FFB800] rounded-full" 
                                    style={{ width: `${Math.min(100, (user.gen_count / data.activeUsers[0].gen_count) * 100)}%` }}
                                 ></div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">High Usage</span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
