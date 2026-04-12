import React, { useState, useEffect, useRef } from 'react';
import { Check, Zap, Clock, CreditCard, ChevronRight, Upload, X, Loader2, Landmark, Smartphone, ReceiptText, Sparkles, Image as ImageIcon, Video, Mic } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getUserPlan } from '../utils/planUtils';

export function Billing() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ credits: 0, totalGenerations: 0 });
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [mcxTxId, setMcxTxId] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [selectedBank, setSelectedBank] = useState<'bfa' | 'bai'>('bfa');
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [checkoutItem, setCheckoutItem] = useState<any | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('conversio_user') || localStorage.getItem('user') || '{}'));
  const localUser = user; // keep reference for existing code if needed
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!localUser.id) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [localUser.id]);

  const fetchData = async () => {
    try {
      const [sRes, tRes, cpRes, pRes] = await Promise.all([
        apiFetch(`/user/stats?userId=${localUser.id}`),
        apiFetch(`/user/transactions?userId=${localUser.id}`),
        apiFetch(`/credit-packages`),
        apiFetch(`/payment-info`)
      ]);
      
      const sData = await sRes.json();
      const tData = await tRes.json();
      const cpData = await cpRes.json();
      const pData = await pRes.json();

      if (sData.success) setStats({ credits: sData.credits, totalGenerations: sData.totalGenerations });
      if (tData.success) setTransactions(tData.transactions);
      if (cpData.success) setCreditPackages(cpData.packages);
      if (pData.success) setPaymentInfo(pData);

      // Update user data from server
      if (sData.success) {
        const updatedUser = { 
          ...user,
          credits: sData.credits
        };
        setUser(updatedUser);
        localStorage.setItem('conversio_user', JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.error('Fetch data error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheckout = (item: any) => {
    setCheckoutItem(item);
    setShowCheckout(true);
    setStep(1);
    setPaymentMethod(null);
    setProofFile(null);
    setMcxTxId('');
    setMessage(null);
    setSelectedBank('bfa');
  };

  const handleSelectMethod = (method: string) => {
    setPaymentMethod(method);
    setStep(2);
  };

  const handleCheckoutSubmit = async () => {
    if (!proofFile || (paymentMethod === 'MCX Express' && !mcxTxId)) {
       setMessage({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios e anexe o comprovativo.' });
       return;
    }

    setIsProcessing(true);
    try {
      const calculateTotalAmount = () => Number(checkoutItem!.price);
      const calculateTotalCredits = () => checkoutItem!.total_credits || checkoutItem!.credits || 0;

      const totalAmount = calculateTotalAmount();
      const totalCredits = calculateTotalCredits();

      console.log('Iniciando checkout:', { userId: localUser.id, planId: checkoutItem!.id, amount: totalAmount, credits: totalCredits });
      const res = await apiFetch('/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localUser.id,
          planId: checkoutItem!.id,
          amount: totalAmount,
          credits: totalCredits,
          paymentMethod,
          transactionId: paymentMethod === 'MCX Express' ? mcxTxId : undefined
        })
      });
      const data = await res.json();
      console.log('Resposta checkout:', data);
      
      if (data.success && data.transactionId) {
        console.log('Iniciando upload do comprovativo para transação:', data.transactionId);
        const formData = new FormData();
        formData.append('userId', localUser.id);
        formData.append('transactionId', String(data.transactionId)); 
        formData.append('proof', proofFile);

        const uploadRes = await apiFetch('/billing/upload-proof', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        console.log('Resposta upload:', uploadData);

        if (uploadData.success) {
           setMessage({ type: 'success', text: 'Pagamento e comprovativo enviados com sucesso! Aguarde a verificação.' });
           setTimeout(() => {
              setShowCheckout(false);
              fetchData();
           }, 3000);
        } else {
           setMessage({ type: 'error', text: 'Checkout feito, mas erro no comprovativo.' });
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Erro ao iniciar checkout' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };



  const itemsPerPage = 5;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-accent" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight mb-2">Créditos e Faturamento</h1>
          <p className="text-text-secondary">Gerencie os seus créditos de geração em Kwanzas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Available Balance */}
        <div className="lg:col-span-2 bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-[2rem] p-8 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="relative z-10 flex flex-col justify-center h-full">
            <h3 className="text-lg font-bold text-text-primary mb-6">Saldo Atual</h3>
            <div className="bg-bg-base/50 rounded-2xl p-6 border border-border-subtle">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-secondary">Créditos de Geração</span>
                <span className="text-2xl font-black text-[#FFB800]">
                  {stats.credits} <span className="text-sm text-text-tertiary">Créditos</span>
                </span>
              </div>
              
              <div className="mt-4">
                 <div className="flex justify-between text-[10px] font-bold text-text-tertiary mb-2 uppercase tracking-wider">
                    <span>Consumo Estimado (Total)</span>
                    <span>Disponível</span>
                 </div>
                 <div className="w-full h-3 bg-surface rounded-full overflow-hidden border border-border-subtle">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#FFB800] rounded-full transition-all duration-1000 relative overflow-hidden" 
                      style={{ width: `${Math.min(100, Math.max(5, (stats.credits / (stats.credits + (stats.totalGenerations * 15) + 1)) * 100))}%` }}
                    >
                       <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                 </div>
              </div>

              <p className="mt-4 text-[11px] text-text-tertiary font-medium italic">Seu consumo de créditos é atualizado automaticamente a cada geração. A compra de novos pacotes soma ao saldo atual.</p>
            </div>
          </div>
        </div>

        {/* Status Card / Topup */}
        <div className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-[2rem] p-8 shadow-lg relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10 text-center flex flex-col items-center">
            <h3 className="text-xl font-bold text-text-primary mb-5 flex items-center justify-center gap-2">
               <CreditCard size={24} className="text-[#FFB800]" strokeWidth={2.5} />
               Métodos Locais
            </h3>
            <div className="flex items-center justify-center gap-4 mb-4">
               <img src="/multicaixa.png" className="h-8 object-contain" alt="Multicaixa Express" onError={(e) => e.currentTarget.style.display = 'none'} />
               <div className="w-[1px] h-8 bg-border-subtle"></div>
               <Landmark size={24} className="text-emerald-500 opacity-80" />
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-[240px] mx-auto">Pagamento Seguro via Multicaixa Express e Transferência Bancária (IBAN).</p>
          </div>
        </div>
      </div>

      {/* Credit Packages */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
           <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest flex items-center gap-4">
              <Zap size={24} className="text-[#FFB800]" fill="currentColor" />
              Pacotes de Crédito
           </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {creditPackages.map((pkg, i) => {
                 const isPopular = i === 1;
                 const bonusCredits = Number(pkg.bonus_credits || 0);
                 const estImages = pkg.est_images || Math.floor(pkg.total_credits / 15);
                 const estVideos = pkg.est_videos || Math.floor(pkg.total_credits / 60);

                 const packagePlan = pkg.assigned_plan || (pkg.name.toLowerCase().includes('heavy') ? 'scale' : pkg.name.toLowerCase().includes('standard') ? 'growth' : 'starter');


                 return (
                 <div 
                   key={pkg.id} 
                   className={`backdrop-blur-xl border p-8 rounded-[2.5rem] relative flex flex-col h-full overflow-hidden transition-all duration-500 bg-[#0A0A0A] border-white/5 hover:border-[#FFB800]/50 group ${isPopular ? 'border-[#FFB800] shadow-[0_0_40px_rgba(255,184,0,0.15)]' : 'shadow-2xl'}`}
                 >

                    {isPopular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#FFB800] text-black text-[10px] font-black px-6 py-1.5 rounded-b-xl uppercase tracking-widest shadow-xl flex items-center gap-2 z-10">
                            <Sparkles size={14} /> DESTAQUE
                        </div>
                    )}
                    
                    <div className="mb-8 mt-4">
                        <h3 className="text-4xl font-black text-white mb-2 flex flex-wrap items-center gap-3 leading-tight">
                            {pkg.name}
                            {bonusCredits > 0 && <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">+{bonusCredits} BÓNUS</span>}
                        </h3>
                        <p className="text-text-tertiary text-sm font-medium">Pacote avulso. Sem validade.</p>
                    </div>

                    <div className="mb-10 p-6 bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden group-hover:bg-white/10 transition-colors">
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-black text-white tracking-tighter">
                                {Number(pkg.price).toLocaleString()} <span className="text-2xl ml-1 text-text-tertiary font-bold tracking-normal">Kz</span>
                            </span>
                        </div>
                        <div className="text-[10px] text-[#FFB800] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <CreditCard size={14} strokeWidth={2.5} /> PAGAMENTO ÚNICO
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFB800]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    </div>

                    <div className="mb-10">
                        <h4 className="text-[11px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6 border-b border-white/10 pb-3">VOLUME ESTIMADO</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-4 text-sm">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20"><ImageIcon size={16}/></div>
                                <span className="text-text-secondary">Até <span className="font-extrabold text-white">{estImages}</span> Imagens HD</span>
                            </li>
                            <li className="flex items-center gap-4 text-sm">
                                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20"><Video size={16}/></div>
                                <span className="text-text-secondary">Até <span className="font-extrabold text-white">{estVideos}</span> Vídeos 8s</span>
                            </li>
                            <li className="flex items-center gap-4 text-sm">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20"><Mic size={16}/></div>
                                <span className="text-text-secondary font-bold text-white">Centenas de Músicas e Vozes</span>
                            </li>
                        </ul>
                    </div>

                    <div className="mb-10 flex-grow">
                        <h4 className="text-[11px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6 border-b border-white/10 pb-3">RECURSOS INCLUÍDOS</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm">
                                <Check size={18} className="text-[#FFB800] mt-0.5 shrink-0" strokeWidth={3} />
                                <span className="text-white font-bold">{pkg.total_credits} Créditos (Sem Expiração)</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check size={18} className="text-[#FFB800] mt-0.5 shrink-0" strokeWidth={3} />
                                <span className="text-text-secondary">Acesso a <span className="text-white font-bold">Todos os Agentes</span> de Imagem</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check size={18} className="text-[#FFB800] mt-0.5 shrink-0" strokeWidth={3} />
                                <span className="text-text-secondary">Geração de <span className="text-white font-bold">Vídeos 8s</span> e <span className="text-white font-bold">Músicas AI</span></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check size={18} className="text-[#FFB800] mt-0.5 shrink-0" strokeWidth={3} />
                                <span className="text-text-secondary">Ferramentas de <span className="text-white font-bold">Branding</span> e <span className="text-white font-bold">Notificações</span></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm">
                                <Check size={18} className="text-[#FFB800] mt-0.5 shrink-0" strokeWidth={3} />
                                <span className="text-text-secondary">Até <span className="text-white font-bold">10 gerações</span> simultâneas</span>
                            </li>
                        </ul>
                    </div>

                    <button 
                        onClick={() => handleStartCheckout(pkg)}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-sm flex items-center justify-center gap-3 mt-auto ${isPopular ? 'bg-gradient-to-r from-[#FFB800] to-yellow-500 text-black hover:scale-[1.02] shadow-[0_15px_40px_rgba(255,184,0,0.3)]' : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black group-hover:border-[#FFB800]'}`}
                    >
                        <Zap size={18} className={!isPopular ? "text-[#FFB800] group-hover:text-black" : ""} fill={!isPopular ? "currentColor" : "none"} /> ADQUIRIR PACOTE
                    </button>
                 </div>
              );
            })}
        </div>
      </div>


      {/* History */}
      <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-[2rem] overflow-hidden shadow-lg">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <ReceiptText size={20} className="text-[#FFB800]" />
              Transações & Faturas
          </h2>
          <span className="text-xs text-text-tertiary">Últimas 10 atividades</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-base/30 text-[10px] uppercase tracking-widest text-text-tertiary border-b border-border-subtle">
                <th className="px-6 py-4 font-bold">Data</th>
                 <th className="px-6 py-4 font-bold">Descrição</th>
                 <th className="px-6 py-4 font-bold">Valor</th>
                 <th className="px-6 py-4 font-bold">Créditos</th>
                 <th className="px-6 py-4 font-bold">Status</th>
                 <th className="px-6 py-4 font-bold text-right">Fatura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((t: any) => (
                  <tr key={t.id} className="text-sm hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-4 text-text-secondary">{formatDate(t.created_at)}</td>
                    <td className="px-6 py-4 text-text-primary font-medium">{t.description || 'Pacote de Créditos'}</td>
                    <td className="px-6 py-4 font-bold text-accent">{Number(t.amount).toLocaleString('pt-AO')} Kz</td>
                    <td className="px-6 py-4">
                        <span className="font-bold text-[#FFB800]">{t.credits || 0}</span>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                         t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                         t.status === 'pending_verification' || t.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                         t.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                         'bg-blue-500/10 text-blue-500'
                       }`}>
                         {t.status === 'completed' ? 'Pago' : 
                          (t.status === 'pending' || t.status === 'pending_verification') ? 'Pendente' : 
                          t.status === 'rejected' ? 'Rejeitado' : 'Processando'}
                       </span>
                     </td>
                     <td className="px-6 py-4 flex justify-end">
                        {t.invoice_url ? (
                          <a 
                            href={t.invoice_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold text-[#FFB800] hover:text-black transition-colors bg-[#FFB800]/10 hover:bg-[#FFB800] px-3 py-1.5 rounded-lg border border-[#FFB800]/20"
                          >
                            <ReceiptText size={14} />
                            Fatura PDF
                          </a>
                        ) : (
                          <span className="text-xs text-text-tertiary italic">Indisponível</span>
                        )}
                     </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-tertiary text-sm italic">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 bg-bg-base/30 border-t border-border-subtle flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">Página {currentPage} de {totalPages}</span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2 rounded-xl border border-border-subtle text-xs font-bold hover:bg-surface hover:text-[#FFB800] hover:border-[#FFB800]/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-border-subtle disabled:hover:text-text-primary transition-all shadow-sm"
                >
                  Anterior
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-4 py-2 rounded-xl border border-border-subtle text-xs font-bold hover:bg-surface hover:text-[#FFB800] hover:border-[#FFB800]/50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-border-subtle disabled:hover:text-text-primary transition-all shadow-sm"
                >
                  Próximas
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-5xl bg-surface border border-border-subtle rounded-[2rem] shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col lg:flex-row overflow-hidden min-h-[600px] my-auto">
            <button 
              onClick={() => setShowCheckout(false)}
              className="absolute top-6 right-6 lg:right-6 lg:top-6 p-2 rounded-full bg-bg-base/80 hover:bg-bg-base text-text-tertiary hover:text-[#FFB800] transition-colors border border-border-subtle z-50 backdrop-blur-md"
            >
              <X size={20} />
            </button>

            {/* Left Column - Product Info */}
            <div className="w-full lg:w-5/12 bg-bg-base p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-border-subtle relative">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#FFB800]/5 to-transparent pointer-events-none"></div>
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex-1">

                     <div className="flex items-start justify-between mb-8 group">
                        <div className="flex gap-4">
                           <div className="w-14 h-14 rounded-2xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] border border-[#FFB800]/20 shadow-[0_0_15px_rgba(255,184,0,0.15)] group-hover:scale-105 transition-transform">
                              <Zap size={24} fill="currentColor" />
                           </div>
                           <div>
                              <h4 className="font-bold text-lg text-text-primary">{checkoutItem?.name}</h4>
                              <p className="text-sm text-text-secondary mt-1">
                                Pacote de Créditos
                                <span className="block font-bold text-[#FFB800] mt-1">
                                   {checkoutItem?.total_credits || 0} Créditos Totais
                                </span>
                              </p>
                           </div>
                        </div>
                        <span className="font-bold text-lg text-text-primary">
                          {Number(checkoutItem?.price).toLocaleString()} Kz
                        </span>
                     </div>

                     <div className="border-t border-border-subtle pt-6 space-y-4">
                        <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Detalhes do Pacote</h4>
                        <div className="flex justify-between text-sm text-text-secondary">
                           <span className="flex items-center gap-2"><ImageIcon size={14} className="text-blue-500" /> Imagens HD (Aprox.)</span>
                            <span className="font-bold text-text-primary px-3 py-1 bg-surface rounded-lg border border-border-subtle">{checkoutItem ? (checkoutItem.est_images || Math.floor((checkoutItem.total_credits || 0) / 15)) : 0} UND</span>
                        </div>
                        <div className="flex justify-between text-sm text-text-secondary">
                           <span className="flex items-center gap-2"><Video size={14} className="text-purple-500" /> Vídeos (Aprox.)</span>
                           <span className="font-bold text-text-primary px-3 py-1 bg-surface rounded-lg border border-border-subtle">{checkoutItem ? (checkoutItem.est_videos || Math.floor((checkoutItem.total_credits || 0) / 60)) : 0} UND</span>
                        </div>
                        <div className="flex justify-between text-sm text-text-secondary">
                           <span className="flex items-center gap-2"><Mic size={14} className="text-emerald-500" /> Dublagens</span>
                           <span className="font-bold text-text-primary px-3 py-1 bg-surface rounded-lg border border-border-subtle">Centenas</span>
                        </div>
                        <div className="flex justify-between text-sm text-text-secondary mt-6 pt-4 border-t border-border-subtle">
                           <span>Subtotal</span>
                           <span>{Number(checkoutItem?.price).toLocaleString()} Kz</span>
                        </div>
                     </div>
                  </div>

                  <div className="border-t border-border-subtle pt-6 mt-8">
                        <div className="flex justify-between items-center">
                        <span className="text-base font-medium text-text-secondary">Total a Pagar</span>
                        <span className="text-3xl font-black text-text-primary tracking-tight">
                          {Number(checkoutItem?.price).toLocaleString()} Kz
                        </span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column - Payment Flow */}
            <div className="w-full lg:w-7/12 bg-surface p-8 lg:p-12 relative">
              <div className="max-w-md mx-auto h-full flex flex-col justify-center">
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-text-primary">Método de Pagamento</h3>
                      <p className="text-text-secondary text-sm mt-2">Escolha como deseja pagar a sua assinatura.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <button onClick={() => handleSelectMethod('MCX Express')} className="flex items-center justify-between p-5 rounded-2xl bg-bg-base border-2 border-border-subtle hover:border-[#FFB800] hover:bg-[#FFB800]/5 transition-all group shadow-sm">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]"><Smartphone size={24} /></div>
                          <div className="text-left">
                            <span className="block font-bold text-text-primary text-base">Multicaixa Express</span>
                            <span className="block text-xs text-text-tertiary mt-1">Pagamento via número de telefone</span>
                          </div>
                        </div>
                        <ChevronRight className="text-text-tertiary group-hover:text-[#FFB800] group-hover:translate-x-1 transition-all" size={20} />
                      </button>

                      <button onClick={() => handleSelectMethod('Transferência')} className="flex items-center justify-between p-5 rounded-2xl bg-bg-base border-2 border-border-subtle hover:border-[#FFB800] hover:bg-[#FFB800]/5 transition-all group shadow-sm">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]"><Landmark size={24} /></div>
                          <div className="text-left">
                            <span className="block font-bold text-text-primary text-base">Transferência Bancária</span>
                            <span className="block text-xs text-text-tertiary mt-1">Depósito direto em conta bancária (IBAN)</span>
                          </div>
                        </div>
                        <ChevronRight className="text-text-tertiary group-hover:text-[#FFB800] group-hover:translate-x-1 transition-all" size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {(step === 2 || step === 3) && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
                     <div className="mb-6 flex items-center gap-3">
                        <button onClick={() => { setStep(1); setMcxTxId(''); setProofFile(null); setMessage(null); }} className="text-text-tertiary hover:text-[#FFB800] transition-colors shrink-0">
                           <ChevronRight className="rotate-180" size={20} />
                        </button>
                        <div>
                           <h3 className="text-xl font-bold text-text-primary">{paymentMethod}</h3>
                           <p className="text-text-secondary text-sm">Siga as instruções para concluir o pagamento.</p>
                        </div>
                     </div>

                     <div className="space-y-6 flex-1">
                        {/* MCX Instructions */}
                        {paymentMethod === 'MCX Express' && (
                           <div className="bg-[#FFB800]/5 border border-[#FFB800]/20 p-6 rounded-2xl space-y-3">
                             <div>
                                <p className="text-xs font-bold text-[#FFB800] uppercase tracking-wider">Instruções MCX</p>
                                <p className="text-sm font-medium text-text-secondary mt-1">Efetue o pagamento para um dos números:</p>
                             </div>
                             
                             <div className="space-y-3">
                                {Array.isArray(paymentInfo?.mcx_express) && paymentInfo.mcx_express.map((mcx: any, i: number) => (
                                   <div key={i} className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5 group hover:border-[#FFB800]/30 transition-all">
                                      <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{mcx.name}</span>
                                      <span className="text-xl font-black text-white tracking-widest">{mcx.number}</span>
                                   </div>
                                ))}
                                {(!paymentInfo?.mcx_express || !Array.isArray(paymentInfo?.mcx_express) || paymentInfo.mcx_express.length === 0) && (
                                   <div className="p-4 bg-black/40 rounded-xl border border-red-500/20 text-center">
                                      <p className="text-xs font-bold text-red-500">Contacte o suporte para número MCX</p>
                                   </div>
                                )}
                             </div>

                             <div className="pt-2 border-t border-[#FFB800]/10">
                                <p className="text-[10px] text-text-tertiary font-bold uppercase">Beneficiário: <span className="text-white">{paymentInfo?.beneficiary_name || 'CONVERSIO AO'}</span></p>
                             </div>
                           </div>
                        )}

                        {/* Transfer Instructions */}
                        {paymentMethod === 'Transferência' && (
                           <div className="space-y-4">
                             <p className="text-sm font-medium text-text-secondary mb-2">Dados Bancários para Transferência:</p>
                             
                             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {Array.isArray(paymentInfo?.bank_accounts) && paymentInfo.bank_accounts.map((acc: any, i: number) => (
                                   <div key={i} className="bg-bg-base p-6 rounded-2xl border border-[#FFB800]/20 shadow-inner group/bank hover:border-[#FFB800]/50 transition-all">
                                      <div className="flex justify-between items-center mb-4">
                                         <p className="text-xs font-black text-[#FFB800] uppercase tracking-widest flex items-center gap-2"><Landmark size={14}/> {acc.bank}</p>
                                         <span className="text-[9px] text-text-tertiary font-black uppercase tracking-wider">{paymentInfo.beneficiary_name}</span>
                                      </div>
                                      <div className="space-y-4">
                                         <div className="p-3 bg-black/20 rounded-xl border border-white/5 group-hover/bank:border-[#FFB800]/20 transition-all">
                                            <p className="text-[9px] text-text-tertiary uppercase font-black mb-1 opacity-60">IBAN para Cópia</p>
                                            <div className="flex items-center justify-between gap-4">
                                               <p className="text-sm font-mono font-bold text-text-primary select-all truncate">{acc.iban}</p>
                                               <button onClick={() => navigator.clipboard.writeText(acc.iban)} className="p-2 bg-white/5 rounded-lg text-[#FFB800] hover:bg-[#FFB800] hover:text-black transition-all">
                                                  <ReceiptText size={12} />
                                               </button>
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                ))}
                                {(!paymentInfo?.bank_accounts || !Array.isArray(paymentInfo?.bank_accounts) || paymentInfo.bank_accounts.length === 0) && (
                                   <p className="text-xs text-text-tertiary italic text-center py-8">Nenhuma conta configurada. Contacte o suporte.</p>
                                )}
                             </div>

                             <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                                <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-2">
                                   <Check size={12} /> NOME DO BENEFICIÁRIO: {paymentInfo?.beneficiary_name || 'CONVERSIO AO'}
                                </p>
                             </div>
                           </div>
                        )}
                        
                        {/* Transaction Inputs */}
                        <div className="space-y-5 pt-4 border-t border-border-subtle mt-6">
                           {paymentMethod === 'MCX Express' && (
                             <div className="space-y-2">
                               <label className="text-xs font-bold text-text-secondary tracking-wide flex justify-between">
                                 <span>ID da Transação / Referência<span className="text-red-500 ml-1">*</span></span>
                               </label>
                               <input 
                                 type="text" 
                                 value={mcxTxId}
                                 onChange={(e) => setMcxTxId(e.target.value)}
                                 className="w-full bg-bg-base border-2 border-border-subtle focus:border-[#FFB800] rounded-xl p-3.5 text-text-primary font-mono text-center text-lg outline-none transition-all placeholder:text-text-tertiary/50"
                                 placeholder="Ex: TX-12345678"
                               />
                             </div>
                           )}

                           <div 
                             onClick={() => fileInputRef.current?.click()}
                             className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${proofFile ? 'border-[#FFB800]/50 bg-[#FFB800]/5' : 'border-border-subtle hover:border-[#FFB800] hover:bg-[#FFB800]/5'}`}
                           >
                             <input type="file" ref={fileInputRef} onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="hidden" accept="image/*,application/pdf" />
                             {proofFile ? (
                                <div className="flex flex-col items-center">
                                  <Check size={24} className="text-[#FFB800] mb-2" />
                                  <p className="text-sm font-bold text-text-primary truncate max-w-[200px]">{proofFile.name}</p>
                                  <p className="text-[10px] text-[#FFB800] uppercase font-black mt-1">Comprovativo Anexado</p>
                                </div>
                             ) : (
                                <div className="flex flex-col items-center">
                                  <Upload size={24} className="text-text-tertiary mb-2" />
                                  <p className="text-sm font-bold text-text-primary">Anexar Comprovativo<span className="text-red-500 ml-1">*</span></p>
                                  <p className="text-xs text-text-tertiary mt-1">Obrigatório (PNG, JPG, PDF)</p>
                                </div>
                             )}
                           </div>
                        </div>

                        {message && (
                           <div className={`p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {message.type === 'success' ? <Check size={20} className="shrink-0 mt-0.5" /> : <X size={20} className="shrink-0 mt-0.5" />}
                              <p className="text-sm font-medium">{message.text}</p>
                           </div>
                        )}
                     </div>

                     <div className="mt-8 pt-6 border-t border-border-subtle">
                        <button 
                          onClick={handleCheckoutSubmit}
                          disabled={isProcessing || !proofFile || (paymentMethod === 'MCX Express' && !mcxTxId)}
                          className="w-full py-4 rounded-xl bg-[#FFB800] text-black font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[0_5px_20px_rgba(255,184,0,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                        >
                          {isProcessing ? <Loader2 className="animate-spin" size={24} /> : `Pagar ${Number(checkoutItem?.price).toLocaleString()} Kz`}
                        </button>
                        <p className="text-[11px] text-center text-text-tertiary mt-4 flex items-center justify-center gap-1">
                           <Check size={12} className="text-[#FFB800]"/> Pagamento 100% Seguro
                        </p>
                     </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}


