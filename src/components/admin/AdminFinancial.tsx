import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Package, Users, Activity, Image as ImageIcon, Video, Mic, Zap, RefreshCw, AlertCircle, BarChart2, Music, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { apiFetch } from '../../lib/api';

const COLORS = ['#FFB800','#4ADE80','#818CF8','#F87171','#38BDF8','#FB923C','#A78BFA','#34D399'];

function StatCard({ icon, label, value, sub, color }: any) {
  return (
    <div className="bg-surface border border-border-subtle rounded-3xl p-6 flex flex-col gap-2">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${color}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{label}</p>
      <h3 className="text-3xl font-black text-text-primary tracking-tighter">{value}</h3>
      {sub && <p className="text-xs text-text-secondary">{sub}</p>}
    </div>
  );
}

function formatKz(val: number) {
  return new Intl.NumberFormat('pt-AO').format(val) + ' Kz';
}

export function AdminFinancial() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userStr = localStorage.getItem('conversio_user');
  const adminId = userStr ? JSON.parse(userStr).id : null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`http://localhost:3003/api/admin/financial?adminId=${adminId}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.message || 'Erro ao carregar dados financeiros.');
      }
    } catch (e: any) {
      setError('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw size={48} className="animate-spin text-[#FFB800]" />
        <span className="text-xs font-black uppercase tracking-[0.3em] text-text-tertiary">Carregando dados financeiros...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle size={48} className="text-red-500 opacity-50" />
        <p className="text-text-secondary font-medium">{error}</p>
        <button onClick={fetchData} className="px-6 py-3 bg-[#FFB800] text-black font-black uppercase text-xs rounded-2xl">Tentar novamente</button>
      </div>
    </div>
  );

  const typeIconMap: Record<string, any> = {
    image: <ImageIcon size={14} className="text-blue-400" />,
    video: <Video size={14} className="text-purple-400" />,
    audio: <Mic size={14} className="text-emerald-400" />,
    voice: <Mic size={14} className="text-orange-400" />,
    musica: <Music size={14} className="text-pink-400" />,
  };

  const totalGenCount = (data?.genByType || []).reduce((a: number, b: any) => a + Number(b.count), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter flex items-center gap-3">
            <BarChart2 className="text-[#FFB800]" size={40} />
            Controlo Financeiro
          </h1>
          <p className="text-text-secondary mt-2 font-medium">Dashboard de receita, consumo de pacotes e motores IA.</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-6 py-3 bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 rounded-2xl font-black uppercase text-xs hover:bg-[#FFB800] hover:text-black transition-all">
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={<DollarSign size={20} />}
          label="MRR (Este Mês)"
          value={formatKz(data?.mrr || 0)}
          sub="Transações aprovadas"
          color="bg-[#FFB800]/10 text-[#FFB800]"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Online Agora"
          value={data?.onlineUsers || 0}
          sub="Ativos nos últ. 5 min"
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Transações"
          value={data?.totalTransactions || 0}
          sub={`${data?.pendingTransactions || 0} pendentes`}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          icon={<Package size={20} />}
          label="Pacotes Ativos"
          value={data?.packageStats?.length || 0}
          sub="Configurações em uso"
          color="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Utilizadores"
          value={data?.totalUsers || 0}
          sub={`${data?.activeUsers || 0} ativos (7d)`}
          color="bg-orange-500/10 text-orange-500"
        />
      </div>

      {/* Pending Payments Alert */}
      {data?.pendingPayments?.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4 text-red-500">
              <AlertCircle size={32} />
              <div>
                 <h4 className="font-black uppercase text-sm tracking-widest">Pagamentos Pendentes</h4>
                 <p className="text-xs font-medium text-text-secondary">Existem {data.pendingTransactions} transações aguardando a sua aprovação manual.</p>
              </div>
           </div>
           <div className="flex -space-x-3">
              {data.pendingPayments.map((p: any, i: number) => (
                <div key={i} className="w-10 h-10 rounded-full bg-surface border-2 border-bg-base flex items-center justify-center text-[10px] font-bold text-text-primary" title={p.user_name}>
                  {p.user_name?.charAt(0) || 'U'}
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-[2.5rem] p-8">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-8 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#FFB800]" /> Evolução da Receita
          </h3>
          {data?.monthlyRevenue?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.monthlyRevenue} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#666', fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,184,0,0.05)' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" radius={[12,12,0,0]}>
                  {data.monthlyRevenue.map((_: any, i: number) => (
                    <Cell key={i} fill={i === data.monthlyRevenue.length - 1 ? '#FFB800' : '#FFB800' + '44'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-text-tertiary text-sm italic">Sem dados históricos disponíveis</div>
          )}
        </div>

        {/* Device Stats */}
        <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8">
           <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-8 flex items-center gap-2">
              <Activity size={16} className="text-[#FFB800]" /> Dispositivos
           </h3>
           <div className="space-y-6">
              {data?.deviceStats?.length > 0 ? data.deviceStats.map((d: any, i: number) => {
                 const total = data.deviceStats.reduce((a: number, b: any) => a + b.count, 0);
                 const pct = Math.round((d.count / total) * 100);
                 return (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between items-center text-xs">
                          <span className="font-black uppercase tracking-widest text-text-secondary">{d.device}</span>
                          <span className="font-bold text-text-primary">{pct}%</span>
                       </div>
                       <div className="h-2 bg-bg-base rounded-full overflow-hidden">
                          <div className="h-full bg-[#FFB800] rounded-full" style={{ width: `${pct}%`, opacity: 1 - (i * 0.3) }}></div>
                       </div>
                    </div>
                 );
              }) : <p className="text-center py-10 text-text-tertiary italic">Aguardando dados...</p>}
           </div>
        </div>
      </div>

      {/* Top Consumers & Model Stats */}
      <div className="grid lg:grid-cols-2 gap-8">
         {/* Top Consumers Ranking */}
         <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
               <TrendingUp size={16} className="text-[#FFB800]" /> Ranking de Consumo (Power Users)
            </h3>
            <div className="space-y-4">
               {data?.topConsumers?.map((u: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-bg-base/30 border border-border-subtle rounded-2xl group hover:border-[#FFB800]/30 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface border border-border-subtle flex items-center justify-center font-black text-[#FFB800]">
                           {i + 1}
                        </div>
                        <div>
                           <p className="text-sm font-black text-text-primary group-hover:text-[#FFB800] transition-colors">{u.name}</p>
                           <p className="text-[10px] font-bold text-text-tertiary uppercase">{u.generations} Gerações</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-black text-[#FFB800]">{Number(u.total_spent).toLocaleString()} Kz</p>
                        <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Créditos Gastos</p>
                     </div>
                  </div>
               ))}
               {!data?.topConsumers?.length && <p className="text-center py-10 text-text-tertiary">Nenhum dado de consumo disponível.</p>}
            </div>
         </div>

         {/* Model Consumption (Existing but enhanced) */}
         <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap size={16} className="text-[#FFB800]" /> Motores IA mais usados (30d)
            </h3>
            <div className="space-y-5">
              {data?.modelStats?.slice(0, 6).map((m: any, i: number) => {
                const max = data.modelStats[0]?.count || 1;
                const pct = Math.round((m.count / max) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                      <span className="text-text-primary">{m.model}</span>
                      <span className="text-text-tertiary">{m.count} logs</span>
                    </div>
                    <div className="h-1.5 bg-bg-base rounded-full">
                      <div className="h-full bg-[#FFB800] rounded-full transition-all duration-1000" style={{ width: `${pct}%`, opacity: 0.4 + (pct/200) }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
         </div>
      </div>

        {/* Generations by Type */}
        <div className="bg-surface border border-border-subtle rounded-3xl p-6">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
            <Zap size={16} className="text-[#FFB800]" /> Gerações por Tipo (Total)
          </h3>
          <div className="space-y-4">
            {data?.genByType?.length > 0 ? data.genByType.map((g: any, i: number) => {
              const pct = totalGenCount > 0 ? Math.round((g.count / totalGenCount) * 100) : 0;
              return (
                <div key={i} className="bg-bg-base/50 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: COLORS[i % COLORS.length] + '20' }}>
                      {typeIconMap[g.type] || <Zap size={16} style={{ color: COLORS[i % COLORS.length] }} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-primary capitalize">{g.type}</p>
                      <p className="text-[10px] text-text-tertiary">{pct}% do total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black" style={{ color: COLORS[i % COLORS.length] }}>{Number(g.count).toLocaleString()}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center text-text-tertiary text-sm py-8">Nenhuma geração registada.</div>
            )}
            <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
              <span className="text-xs text-text-tertiary uppercase font-black tracking-widest">Total Gerações</span>
              <span className="text-xl font-black text-[#FFB800]">{totalGenCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
    </div>
  );
}
