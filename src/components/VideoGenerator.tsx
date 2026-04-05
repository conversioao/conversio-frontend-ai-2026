import React, { useState, useRef, useEffect } from 'react';
import { ParticlesBackground } from './ui/ParticlesBackground';
import {
  ImagePlus, Sparkles, Smartphone, Copy, Mic, Send, Download,
  X, Plus, Maximize2, Video, Play, Loader2, CheckCircle2, AlertCircle,
  FolderOpen, Upload, ChevronDown, ArrowLeft, Zap, Trash2, Layers, ChevronRight, Music
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { useMobile } from '../hooks/useMobile';
import { ProductCamera } from './ui/ProductCamera';
import { Camera } from 'lucide-react';

const API_URL = '';

const VIDEO_CORES = [
  { id: 'campanha-institucional', name: 'Campanha Institucional', desc: 'Ideal para vídeos de marca e institucionais.' },
  { id: 'antes-depois-visual', name: 'Antes e Depois Visual', desc: 'Perfeito para mostrar transformações e resultados.' },
  { id: 'problema-solucao-lifestyle', name: 'Problema Solução ResultadoLifestyle', desc: 'Foco em dor, solução e lifestyle do cliente.' },
  { id: 'cinematic-product-hero', name: 'Cinematic Product Hero', desc: 'Vídeos de produto com alta fidelidade cinematográfica.' },
  { id: 'ugc-influencer', name: 'UGC Influencer', desc: 'Estilo autêntico para redes sociais e influenciadores.' }
];

const VIDEO_STYLES_MAP: Record<string, string[]> = {
  'campanha-institucional': ['Cinematic Corporate', 'História da Marca', 'Visão de Futuro', 'Minimalista Profissional'],
  'antes-depois-visual': ['Split Screen Reveal', 'Transição Suave', 'Swipe Dinâmico', 'Comparação Side-by-side'],
  'problema-solucao-lifestyle': ['Demo de Produto', 'Storytelling Emocional', 'Testemunho Real', 'Estilo Lifestyle'],
  'cinematic-product-hero': ['Macro 4K Detalhe', 'Movimento Circular', 'Iluminação Dramática', 'Tech Minimalista'],
  'ugc-influencer': ['Vlog Autêntico', 'Unboxing Style', 'Review Vertical', 'Selfie Testimonial']
};

const RATIOS = [
  { id: '16:9', name: '16:9', desc: 'Widescreen (YouTube)' },
  { id: '9:16', name: '9:16', desc: 'Vertical (TikTok/Reels)' },
  { id: '1:1', name: '1:1', desc: 'Quadrado (Instagram)' }
];

const QUANTITIES = [1, 2, 3, 4];

interface VideoGeneratorProps {
  initialCore?: string | null;
  onClearCore?: () => void;
}

export function VideoGenerator({ initialCore, onClearCore }: VideoGeneratorProps = {}) {
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [availableStyles, setAvailableStyles] = useState<any[]>([]);
  const [availableCoreModels, setAvailableCoreModels] = useState<any[]>([]);
  
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedCore, setSelectedCore] = useState<any>(null);
  
  const [ratio, setRatio] = useState('16:9');
  const [quantity, setQuantity] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [backgroundTasks, setBackgroundTasks] = useState<number>(0);

  // Gallery picker modal
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Wizard state
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [showCoreModal, setShowCoreModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  }>({ title: '', message: '', onConfirm: () => {} });
  const isMobile = useMobile();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');

  const fetchModels = async () => {
    try {
      const [modelsRes, stylesRes, coreRes] = await Promise.all([
        apiFetch(`/models?type=video&category=model`),
        apiFetch(`/models?type=video&category=style`),
        apiFetch(`/models?type=video&category=core`)
      ]);
      
      const [modelsData, stylesData, coreData] = await Promise.all([
        modelsRes.json(),
        stylesRes.json(),
        coreRes.json()
      ]);

      if (modelsData.success) {
        setAvailableModels(modelsData.models);
        setSelectedModel(modelsData.models[0]);
      }
      if (stylesData.success) {
        setAvailableStyles(stylesData.models);
        setSelectedStyle(stylesData.models[0]);
      }
      if (coreData.success) {
        setAvailableCoreModels(coreData.models);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchModels();
    const handleClickOutside = () => { setActiveDropdown(null); setShowSourcePicker(false); };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialCore && availableCoreModels.length > 0) {
      const core = availableCoreModels.find(m => m.style_id === initialCore);
      if (core) {
        setSelectedCore(core);
        onClearCore?.();
      }
    }
  }, [initialCore, availableCoreModels]);

  const handleImageButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSourcePicker(!showSourcePicker);
  };

  const handleFileUpload = () => {
    setShowSourcePicker(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadedImage(URL.createObjectURL(file));
      setCapturedFile(null); // Clear captured if manual upload
    }
  };

  const handleCapture = (blob: Blob, url: string) => {
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setCapturedFile(file);
    setUploadedFile(file);
    setUploadedImage(url);
  };

  const handleOpenGallery = async () => {
    setShowSourcePicker(false);
    setLoadingGallery(true);
    setShowGalleryPicker(true);
    try {
      const res = await apiFetch(`/generations?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setGalleryItems(data.generations.filter((g: any) => g.status === 'completed' && g.type === 'image'));
      }
    } catch {}
    setLoadingGallery(false);
  };

  const handleSelectFromGallery = async (item: any) => {
    try {
      const response = await fetch(item.result_url);
      const blob = await response.blob();
      const file = new File([blob], `gallery-${item.id}.jpg`, { type: blob.type });
      setUploadedFile(file);
      setUploadedImage(item.result_url);
    } catch {
      setUploadedImage(item.result_url);
    }
    setShowGalleryPicker(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedImage) return;

    if (!selectedCore) {
      setConfirmModalConfig({
        title: 'Core Necessário',
        message: 'Por favor, selecione um "Conversio Core" para gerar o seu vídeo com a melhor qualidade.',
        type: 'warning',
        onConfirm: () => {
          setShowConfirmModal(false);
          setWizardStep(1);
          setShowCoreModal(true);
        }
      });
      setShowConfirmModal(true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('prompt', prompt);
      formData.append('model', selectedModel?.name || 'Sora');
      formData.append('core_model', selectedCore?.name || '');
      formData.append('core_name', String(selectedCore?.name || '')); // Ensure name is sent as requested
      formData.append('style', selectedStyle || '');
      formData.append('aspectRatio', ratio);
      formData.append('quantity', quantity.toString());
      formData.append('mode', 'image');

      if (uploadedFile) {
        formData.append('image', uploadedFile);
      }
      
      setStatus('generating');
      setTimeout(() => setStatus('idle'), 3000);

      const res = await apiFetch(`/generate/video`, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        setShowToast(true);
        setPrompt('');
        setUploadedImage(null);
        setUploadedFile(null);
        setTimeout(() => setShowToast(false), 5000);
        if (data.batchId) pollGeneration(data.batchId);
      } else {
        setConfirmModalConfig({
          title: 'Erro ao Gerar',
          message: data.message || 'Ocorreu um erro inesperado ao processar sua geração de vídeo.',
          type: 'error',
          onConfirm: () => setShowConfirmModal(false)
        });
        setShowConfirmModal(true);
      }
    } catch (err: any) {
      setErrorMessage('Erro de conexão com o servidor');
    }
  };

  const pollGeneration = (batchId: string) => {
    setBackgroundTasks(prev => prev + 1);
    let elapsedSeconds = 0;
    const interval = setInterval(async () => {
      elapsedSeconds += 5;
      
      // 9 Minute Timeout Check (540 seconds)
      if (elapsedSeconds > 540) {
        clearInterval(interval);
        setBackgroundTasks(prev => Math.max(0, prev - 1));
        setConfirmModalConfig({
          title: 'Servidores Sobrecarregados',
          message: 'Os nossos servidores estão sobrecarregados no momento. Por favor, tente novamente mais tarde. Os teus créditos já foram devolvidos.',
          type: 'warning',
          onConfirm: () => setShowConfirmModal(false)
        });
        setShowConfirmModal(true);
        window.dispatchEvent(new Event('storage'));
        return;
      }

      try {
        const res = await apiFetch(`/generations?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          const batch = data.generations.filter((g: any) => g.batch_id === batchId);
          const allFinished = batch.length > 0 && batch.every((g: any) => g.status === 'completed' || g.status === 'failed');
          
          if (allFinished) {
            clearInterval(interval);
            setBackgroundTasks(prev => Math.max(0, prev - 1));
            
            const hasFailures = batch.some((g: any) => g.status === 'failed');
            if (hasFailures) {
              setConfirmModalConfig({
                title: 'Erro na Geração',
                message: 'Detectámos que um ou mais vídeos falharam durante o processamento. Os teus créditos foram devolvidos automaticamente.',
                type: 'error',
                onConfirm: () => setShowConfirmModal(false)
              });
              setShowConfirmModal(true);
            }
            
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (e) {}
    }, 5000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] w-full max-w-6xl mx-auto relative px-4 sm:px-0">
      <ParticlesBackground type="video" />
      <div className="flex-1 flex flex-col justify-center w-full max-w-4xl mx-auto animate-in fade-in duration-700 px-4">

          <div className="w-full text-center mb-10">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              Dê vida à sua <span className="text-[#FFB800]">imaginação</span>
            </h1>
            <p className="text-text-secondary text-sm mt-3 opacity-80 flex items-center justify-center gap-2">
              Gere vídeos profissionais em segundos • <span className="bg-[#FFB800]/10 text-[#FFB800] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-[#FFB800]/20">15 segundos</span>
            </p>
          </div>
          
          <div className="relative w-full rounded-[2rem] p-[1px] shadow-2xl group transition-all">
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-30"></div>
            </div>
            
            <div className="relative bg-surface/95 backdrop-blur-2xl rounded-[calc(2rem-1px)] p-4 flex flex-col gap-3 h-full w-full border border-border-subtle hover:border-accent/30 transition-colors">
               <div className="flex gap-4 items-start">
                 {uploadedImage && (
                   <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-accent/20 shrink-0 group/img shadow-xl">
                     <img src={uploadedImage} alt="Upload" className="w-full h-full object-cover" />
                     <button 
                       onClick={() => { setUploadedImage(null); setUploadedFile(null); setCapturedFile(null); }} 
                       className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                     >
                       <X size={14} className="text-white" />
                     </button>
                   </div>
                 )}
                 <textarea
                   value={prompt}
                   onChange={e => setPrompt(e.target.value)}
                   placeholder="Qual vídeo deseja criar hoje?"
                   className="w-full bg-transparent text-text-primary placeholder:text-text-tertiary resize-none outline-none min-h-[80px] py-1 text-base scrollbar-hide"
                   onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                 />
               </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                   {/* Image Upload Source Picker */}
                   <div className="relative">
                     <button 
                       onClick={handleImageButtonClick}
                       className="p-2.5 rounded-full bg-bg-base border border-border-subtle text-text-secondary hover:text-[#FFB800] transition-colors"
                     >
                       <ImagePlus size={18} />
                     </button>
                     {showSourcePicker && (
                       <div className="absolute top-full left-0 mt-2 w-52 bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200" onClick={e => e.stopPropagation()}>
                         <button onClick={handleOpenGallery} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors">
                           <FolderOpen size={16} className="text-[#FFB800]" /> Carregar da Galeria
                         </button>
                         <button onClick={handleFileUpload} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors border-t border-border-subtle/50">
                           <Upload size={16} className="text-[#FFB800]" /> Carregar Arquivo
                         </button>
                         {isMobile && (
                           <button onClick={() => setIsCameraOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors border-t border-border-subtle/50">
                             <Camera size={16} className="text-[#FFB800]" /> Tirar Foto (Scanner)
                           </button>
                         )}
                       </div>
                     )}
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                   </div>

                   {/* Wizard Trigger Button */}
                   <button
                    onClick={(e) => { e.stopPropagation(); setWizardStep(1); setShowCoreModal(true); }}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 overflow-hidden
                      ${selectedCore
                        ? 'bg-[#FFB800]/20 border border-[#FFB800]/50 text-[#FFB800] shadow-[0_0_12px_rgba(255,184,0,0.3)]'
                        : 'bg-bg-base border border-border-subtle text-text-secondary hover:text-[#FFB800] hover:border-[#FFB800]/30'}`}
                   >
                    {!selectedCore && (
                      <span className="absolute inset-0 rounded-full border border-[#FFB800]/30 animate-ping opacity-60" />
                    )}
                    <Layers size={12} className={selectedCore ? 'text-[#FFB800]' : 'animate-pulse'} />
                    <span className="flex items-center gap-1.5">
                      {selectedCore ? String(selectedCore.name || '') : 'Configurar Vídeo'}
                      {selectedStyle && (
                         <span className="hidden sm:inline opacity-60 font-medium border-l border-[#FFB800]/20 pl-1.5 ml-0.5">{String(selectedStyle)}</span>
                      )}
                      {selectedCore && (
                         <span className="hidden sm:inline opacity-60 font-medium border-l border-[#FFB800]/20 pl-1.5">{ratio} • 15s • Qty: {quantity}</span>
                      )}
                    </span>
                    <ChevronRight size={10} className="opacity-50" />
                   </button>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={!prompt.trim() && !uploadedImage}
                  className="px-6 py-3.5 rounded-full bg-[#FFB800] text-black animate-pulse-glow hover:scale-105 transition-all shadow-lg disabled:opacity-50 flex items-center gap-3"
                >
                  <span className="text-[11px] font-black uppercase tracking-widest border-r border-black/20 pr-3">
                    {quantity * ((selectedModel?.credit_cost || 10) + (selectedCore?.credit_cost || 0))} CR.
                  </span>
                  <span className="font-bold text-sm">Gerar</span>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

      {expandedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setExpandedVideo(null)}>
          <button className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white" onClick={() => setExpandedVideo(null)}><X size={24} /></button>
          <video src={expandedVideo} className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()} controls autoPlay />
        </div>
      )}

      {/* GALLERY PICKER MODAL */}
      {showGalleryPicker && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface border border-border-subtle rounded-[2.5rem] w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-text-primary">Carregar da Galeria</h2>
                <p className="text-text-secondary text-xs mt-0.5">Escolha uma imagem gerada como referência.</p>
              </div>
              <button onClick={() => setShowGalleryPicker(false)} className="p-2 rounded-full hover:bg-surface-hover text-text-tertiary hover:text-white"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-bg-base/50">
              {loadingGallery ? (
                <div className="flex flex-col items-center py-12"><Loader2 className="animate-spin text-[#FFB800] mb-3" size={32} /><p className="text-text-tertiary text-xs uppercase tracking-widest font-bold">Carregando...</p></div>
              ) : galleryItems.length === 0 ? (
                <div className="text-center py-12"><p className="text-text-secondary">Ainda não tens imagens geradas.</p></div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {galleryItems.map(item => (
                    <div key={item.id} onClick={() => handleSelectFromGallery(item)} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-[#FFB800] transition-all">
                      <img src={item.result_url} alt="Gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <CheckCircle2 size={28} className="text-[#FFB800]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GENERATION OVERLAY */}
      {status === 'generating' && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-base/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
           <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-[#FFB800]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#FFB800] rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <Video className="text-[#FFB800] animate-pulse" size={32} />
              </div>
           </div>
           <h3 className="text-2xl font-black tracking-tight text-white mb-2">A iniciar geração...</h3>
           <p className="text-text-secondary text-sm">O seu pedido foi adicionado à fila.</p>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
           <div className="bg-surface/90 backdrop-blur-2xl border border-[#FFB800]/30 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFB800]/20 flex items-center justify-center">
                 <Video size={20} className="text-[#FFB800]" />
              </div>
              <div>
                 <p className="text-[13px] font-bold text-text-primary">Geração de vídeo iniciada!</p>
                 <p className="text-[10px] text-text-tertiary">Avisaremos quando estiver pronto.</p>
              </div>
           </div>
        </div>
      )}

      {/* BACKGROUND TASKS INDICATOR */}
      {backgroundTasks > 0 && status !== 'generating' && (
        <div className="fixed top-24 right-8 z-[60] animate-in slide-in-from-right-5 fade-in duration-500">
           <div className="bg-surface/80 backdrop-blur-xl border border-border-subtle p-3 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="relative">
                 <div className="w-6 h-6 rounded-lg border-2 border-[#FFB800]/30 border-t-[#FFB800] animate-spin" />
                 <Video size={10} className="absolute inset-0 m-auto text-[#FFB800]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Processando {backgroundTasks} {backgroundTasks === 1 ? 'Vídeo' : 'Vídeos'}</span>
           </div>
        </div>
      )}

      {/* ===== CONVERSIO VIDEO WIZARD MODAL ===== */}
      {showCoreModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-500"
          onClick={() => setShowCoreModal(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0A0A0A]/60 backdrop-blur-[40px] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-500"
            onClick={e => e.stopPropagation()}
          >
            {/* Wizard Progress Indicator */}
            <div className="flex items-center px-10 pt-6 gap-3 shrink-0">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex-1 flex flex-col gap-2">
                  <div className={`h-1 rounded-full transition-all duration-700 ${wizardStep >= step ? 'bg-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.4)]' : 'bg-white/10'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${wizardStep === step ? 'text-[#FFB800]' : 'text-text-tertiary'}`}>
                    Passo 0{step}
                  </span>
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between px-10 pt-8 pb-6 shrink-0">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB800] flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.3)]">
                    {wizardStep === 1 && <Layers size={20} className="text-black" />}
                    {wizardStep === 2 && <Sparkles size={20} className="text-black" />}
                    {wizardStep === 3 && <Smartphone size={20} className="text-black" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-none">
                      {wizardStep === 1 && <>Escolher <span className="text-[#FFB800]">Agente</span></>}
                      {wizardStep === 2 && <>Escolher <span className="text-[#FFB800]">Estilo</span></>}
                      {wizardStep === 3 && <>Configurar <span className="text-[#FFB800]">Finalização</span></>}
                    </h2>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowCoreModal(false)} 
                className="p-2.5 rounded-xl bg-white/5 text-text-tertiary hover:text-white transition-all border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto px-10 pb-10 flex-1 custom-scrollbar">
              
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {VIDEO_CORES.map((core) => {
                    const dbCore = availableCoreModels.find(m => m.name === core.name);
                    const isSelected = selectedCore?.name === core.name;
                    return (
                      <button
                        key={core.id}
                        onClick={() => { 
                          setSelectedCore(dbCore || core); 
                          setSelectedStyle(null); 
                          setWizardStep(2); 
                        }}
                        className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 flex items-center gap-5 ${
                          isSelected
                            ? 'bg-[#FFB800]/10 border-[#FFB800]/50 shadow-[0_0_30px_rgba(255,184,0,0.1)]'
                            : 'bg-white/[0.02] border-white/5 hover:border-[#FFB800]/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${isSelected ? 'bg-[#FFB800] text-black shadow-lg' : 'bg-white/5 text-text-secondary group-hover:text-[#FFB800]'}`}>
                          <Video size={28} strokeWidth={isSelected ? 2 : 1.5} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-lg font-bold tracking-tight mb-0.5 ${isSelected ? 'text-[#FFB800]' : 'text-white'}`}>{core.name}</p>
                          <p className="text-xs font-normal opacity-60 text-text-secondary line-clamp-2">{core.desc}</p>
                        </div>
                        {isSelected && <div className="absolute top-4 right-4 text-[#FFB800]"><CheckCircle2 size={18} /></div>}
                      </button>
                    );
                  })}
                </div>
              )}

              {wizardStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {selectedCore && VIDEO_STYLES_MAP[VIDEO_CORES.find(c => c.name === selectedCore.name)?.id || '']?.map((styleName) => (
                    <button
                      key={styleName}
                      onClick={() => { setSelectedStyle(styleName); setWizardStep(3); }}
                      className={`p-5 rounded-xl border text-left transition-all duration-200 flex flex-col gap-1.5 ${
                        selectedStyle === styleName
                          ? 'bg-[#FFB800]/10 border-[#FFB800]/50 text-[#FFB800]'
                          : 'bg-white/[0.02] border-white/5 text-text-secondary hover:border-[#FFB800]/20'
                      }`}
                    >
                      <span className="text-base font-medium">{styleName}</span>
                      <span className={`text-[10px] font-medium uppercase tracking-widest ${selectedStyle === styleName ? 'text-[#FFB800]/70' : 'text-text-tertiary'}`}>Estilo Customizado</span>
                    </button>
                  ))}
                  <button
                    onClick={() => { setSelectedStyle(null); setWizardStep(3); }}
                    className={`p-5 rounded-xl border text-left transition-all duration-200 flex flex-col gap-1.5 ${
                      !selectedStyle
                        ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]'
                        : 'bg-white/[0.02] border-white/5 text-text-secondary hover:border-[#FFB800]/20'
                    }`}
                  >
                    <span className="text-base font-medium">Livre / Neutro</span>
                    <span className="text-[10px] font-medium uppercase tracking-widest opacity-50">Sem Estilo Aplicado</span>
                  </button>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-widest px-1">Formato do Vídeo</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {RATIOS.map(r => (
                        <button 
                          key={r.id}
                          onClick={() => setRatio(r.id)}
                          className={`p-6 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${ratio === r.id ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]' : 'bg-white/[0.02] border-white/5 text-text-tertiary hover:border-white/10'}`}
                        >
                          <span className="text-lg font-black">{r.name}</span>
                          <span className="text-[10px] opacity-60 font-medium">{r.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-widest px-1">Quantidade de Vídeos</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {QUANTITIES.map(q => (
                        <button 
                          key={q} 
                          onClick={() => setQuantity(q)}
                          className={`py-4 rounded-2xl border transition-all text-center ${
                            quantity === q 
                              ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]' 
                              : 'bg-white/[0.02] border-white/5 text-text-tertiary hover:border-white/10'
                          }`}
                        >
                          <span className="text-xl font-black">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-10 py-6 border-t border-white/5 flex items-center justify-between bg-black/20">
              <button 
                onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
                disabled={wizardStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${wizardStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
              >
                <ArrowLeft size={18} /> Voltar
              </button>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                  {wizardStep === 3 ? 'Finalizar Configuração' : 'Próximo Passo'}
                </span>
                {wizardStep < 3 ? (
                  <button 
                    onClick={() => setWizardStep(prev => Math.min(3, prev + 1))}
                    className="p-3.5 rounded-full bg-[#FFB800] text-black shadow-lg hover:scale-110 transition-transform animate-pulse-glow"
                  >
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowCoreModal(false)}
                    className="px-8 py-3.5 rounded-2xl bg-[#FFB800] text-black font-black text-sm uppercase tracking-tight shadow-lg hover:scale-105 transition-transform"
                  >
                    Continuar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          type={confirmModalConfig.type}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      <ProductCamera 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
}
