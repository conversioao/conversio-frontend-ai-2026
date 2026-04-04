import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, XCircle, Eye, Trash2, X, AlertCircle, Ban, History, User, ReceiptText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../lib/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export function AdminPayments() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
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

  const fetchTransactions = async () => {
    try {
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`http://localhost:3003/api/admin/transactions?adminId=${adminId}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleApprove = async (txId: string) => {
    setModal({
      isOpen: true,
      title: 'Aprovar Pagamento',
      message: 'Deseja aprovar este pagamento e libertar os créditos para o utilizador?',
      type: 'confirm',
      onConfirm: async () => {
        setIsProcessing(txId);
        try {
          const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
          const res = await apiFetch(`http://localhost:3003/api/admin/transactions/${txId}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId })
          });
          const data = await res.json();
          if (data.success) {
            fetchTransactions();
            setModal(prev => ({ ...prev, isOpen: false }));
          } else {
            setModal({
              isOpen: true,
              title: 'Erro na Aprovação',
              message: data.message || 'Falha ao aprovar o pagamento.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsProcessing(null);
        }
      }
    });
  };

  const handleReject = async (txId: string) => {
    setModal({
      isOpen: true,
      title: 'Rejeitar Pagamento',
      message: 'Tem certeza que deseja rejeitar este pagamento? O utilizador será notificado.',
      type: 'confirm',
      onConfirm: async () => {
        setIsProcessing(txId);
        try {
          const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
          const res = await apiFetch(`http://localhost:3003/api/admin/transactions/${txId}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId })
          });
          const data = await res.json();
          if (data.success) {
            fetchTransactions();
            setModal(prev => ({ ...prev, isOpen: false }));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsProcessing(null);
        }
      }
    });
  };

  const handleDelete = async (txId: string) => {
    setModal({
      isOpen: true,
      title: 'Eliminar Registo',
      message: 'Tem certeza que deseja eliminar permanentemente este registo? Esta ação não pode ser desfeita.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
          const res = await apiFetch(`http://localhost:3003/api/admin/transactions/${txId}?adminId=${adminId}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            fetchTransactions();
            setModal(prev => ({ ...prev, isOpen: false }));
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Gestão Financeira</h1>
          <p className="text-text-secondary text-sm font-medium">Controlo e verificação de fluxo de caixa.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-2xl border border-border-subtle">
           <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
              {transactions.filter(t => t.status === 'completed').length} Pagos
           </div>
           <div className="px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-xl text-xs font-bold uppercase tracking-wider border border-yellow-500/20">
              {transactions.filter(t => t.status === 'pending_verification').length} Pendentes
           </div>
        </div>
      </div>

      <div className="bg-surface border border-border-subtle rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-hover/50 text-text-tertiary text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">
                <th className="p-6">Transação</th>
                 <th className="p-6">Utilizador</th>
                 <th className="p-6">Valor</th>
                 <th className="p-6">Créditos</th>
                 <th className="p-6">Estado</th>
                 <th className="p-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-text-tertiary animate-pulse font-bold uppercase">Acedendo ao livro de registos...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-text-secondary font-medium">Nenhuma movimentação financeira encontrada.</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border-subtle hover:bg-surface-hover/30 transition-all text-sm group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-bg-base border border-border-subtle flex items-center justify-center text-text-tertiary group-hover:border-[#FFB800]/50 transition-colors">
                            <History size={18} />
                         </div>
                         <div>
                            <p className="font-bold text-text-primary line-clamp-1">{tx.description || `Plano ${tx.type}`}</p>
                            <p className="text-[10px] text-text-tertiary">{new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-text-tertiary" />
                        <div>
                          <p className="font-medium text-text-primary">{tx.user_name}</p>
                          <p className="text-[10px] text-text-tertiary">{tx.user_email}</p>
                        </div>
                      </div>
                    </td>
                     <td className="p-6">
                        <p className="font-black text-text-primary tracking-tight">{Number(tx.amount).toLocaleString()} <span className="text-[10px] text-text-tertiary uppercase ml-0.5">{tx.currency}</span></p>
                     </td>
                     <td className="p-6 text-center">
                        <span className="font-bold text-[#FFB800]">{tx.credits || 0}</span>
                     </td>
                     <td className="p-6">
                      {tx.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Aprovado
                        </span>
                      ) : tx.status === 'pending_verification' ? (
                        <span className="inline-flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-yellow-500/20 animate-pulse">
                          <Clock size={12} /> Em Análise
                        </span>
                      ) : tx.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-500/20">
                          <Ban size={12} /> Rejeitado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-text-tertiary bg-surface-hover/80 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-border-subtle">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {tx.proof_url && (
                          <button 
                            onClick={() => setSelectedProof(tx.proof_url)}
                            className="p-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-secondary hover:text-[#FFB800] transition-all hover:border-[#FFB800]/50"
                            title="Ver Comprovativo"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {tx.invoice_url && (
                          <a 
                            href={tx.invoice_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-secondary hover:text-emerald-500 transition-all hover:border-emerald-500/50"
                            title="Ver Fatura PDF"
                          >
                            <ReceiptText size={16} />
                          </a>
                        )}
                                                {(tx.status === 'pending_verification' || tx.status === 'pending') && (
                           <>
                             <button 
                               disabled={isProcessing === tx.id}
                               onClick={() => handleApprove(tx.id)}
                               className="px-4 py-2.5 bg-[#FFB800] hover:bg-yellow-400 text-black font-black rounded-xl transition-all shadow-lg shadow-[#FFB800]/10 text-[10px] uppercase flex items-center gap-2 disabled:opacity-50"
                             >
                               {isProcessing === tx.id ? <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <CheckCircle2 size={14} />} 
                               Aprovar
                             </button>
                             <button 
                               disabled={isProcessing === tx.id}
                               onClick={() => handleReject(tx.id)}
                               className="p-2.5 bg-bg-base border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                               title="Rejeitar Pagamento"
                             >
                               <Ban size={16} />
                             </button>
                           </>
                         )}

                        <button 
                          onClick={() => handleDelete(tx.id)}
                          className="p-2.5 rounded-xl text-text-tertiary hover:text-red-500 hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar Registo"
                        >
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
      </div>

      <AnimatePresence>
        {/* Proof Viewer Modal */}
        {selectedProof && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProof(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
               <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-bg-base/30">
                  <div className="flex items-center gap-3">
                     <AlertCircle size={20} className="text-[#FFB800]" />
                     <h3 className="font-black text-text-primary uppercase tracking-widest text-sm">Verificação de Comprovativo S3</h3>
                  </div>
                  <button onClick={() => setSelectedProof(null)} className="p-2 hover:bg-surface-hover rounded-xl text-text-tertiary transition-colors">
                     <X size={24} />
                  </button>
               </div>
               <div className="p-8 bg-bg-base/20 flex justify-center items-center min-h-[400px] max-h-[70vh] overflow-hidden">
                  {selectedProof.toLowerCase().includes('.pdf') ? (
                    <iframe 
                      src={selectedProof} 
                      className="w-full h-full min-h-[500px] rounded-xl border-2 border-border-subtle shadow-2xl"
                      title="Comprovativo PDF"
                    />
                  ) : (
                    <img 
                      src={selectedProof} 
                      alt="Comprovativo de Pagamento" 
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border-2 border-border-subtle"
                    />
                  )}
               </div>
               <div className="p-6 border-t border-border-subtle bg-bg-base/30 flex justify-center">
                  <p className="text-xs text-text-tertiary font-medium">Verifique se o ID da transação e os valores coincidem com o extracto bancário.</p>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
}
