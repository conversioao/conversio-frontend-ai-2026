import React, { useState, useRef, useEffect } from 'react';
import { ParticlesBackground } from './ui/ParticlesBackground';
import { ImagePlus, Sparkles, Smartphone, Copy, Mic, Send, Download, ThumbsUp, MoreHorizontal, X, Plus, Maximize2, ArrowRight, Globe, Loader2, CheckCircle2, AlertCircle, Zap, Trash2, Layers, ChevronRight, Camera } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { useMobile } from '../hooks/useMobile';
import { ProductCamera } from './ui/ProductCamera';

const LOADING_PHRASES = [
  "Interpretando sua ideia...",
  "Ajustando iluminação e composição...",
  "Renderizando texturas em alta definição...",
  "Aplicando toques finais de magia..."
];

// New Agent Cores and Styles
const AGENT_CORES = [
  { id: 'ugc-realistic', name: 'UGC RealisticLife', style_id: 'CV-01', icon: Smartphone, description: 'Conteúdo autêntico e orgânico que converte.', credit_cost: 2 },
  { id: 'brand-visual', name: 'BrandVisual Pro', style_id: 'CV-02', icon: Sparkles, description: 'Estética premium para fortalecer a sua marca.', credit_cost: 4 },
  { id: 'impact-ads-pro', name: 'ImpactAds Pro', style_id: 'V-PRO', icon: Zap, description: 'Anúncios de alto impacto com inteligência visual.', credit_cost: 5 },
];

const AGENT_STYLES: Record<string, {name: string, credit_cost: number}[]> = {
  'ugc-realistic': [
    { name: 'Momento Real', credit_cost: 1 },
    { name: 'Descoberta Animada', credit_cost: 2 },
    { name: 'Rotina Integrada', credit_cost: 1 },
    { name: 'Recomendação de Amigo', credit_cost: 2 },
    { name: 'Transformação Pessoal', credit_cost: 3 },
  ],
  'brand-visual': [
    { name: 'Bold Bicolor', credit_cost: 2 },
    { name: 'Lifestyle Premium', credit_cost: 3 },
    { name: 'Minimalismo Poderoso', credit_cost: 2 },
    { name: 'Gradiente Vibrante', credit_cost: 4 },
    { name: 'Editorial Urbano', credit_cost: 3 },
  ],
  'impact-ads-pro': [
    { name: 'Produto Herói', credit_cost: 2 },
    { name: 'Pessoa e Emoção', credit_cost: 2 },
    { name: 'Oferta de Planos', credit_cost: 2 },
    { name: 'Lifestyle Activo', credit_cost: 2 },
    { name: 'Emoção Familiar', credit_cost: 2 },
    { name: 'UI Mockup e Pessoa', credit_cost: 2 },
  ],
};

const RATIOS = [
  { id: '1:1', name: '1:1', desc: 'Quadrado (Instagram)' },
  { id: '16:9', name: '16:9', desc: 'Widescreen (YouTube/TV)' },
  { id: '9:16', name: '9:16', desc: 'Vertical (TikTok/Stories)' },
  { id: '4:5', name: '4:5', desc: 'Retrato (Instagram Post)' },
];

const QUANTITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface ImageGeneratorProps {
  initialCore?: string;
  onClearCore?: () => void;
}

export function ImageGenerator({ initialCore, onClearCore }: ImageGeneratorProps = {}) {
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedCore, setSelectedCore] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [includeText, setIncludeText] = useState(false);
  const [useBrandColors, setUseBrandColors] = useState(false);
  const [brandData, setBrandData] = useState<any>(null);
  const [checkingBrand, setCheckingBrand] = useState(false);
  
  const [ratio, setRatio] = useState('9:16');
  const [quantity, setQuantity] = useState(4);
  const [prompt, setPrompt] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const getStyleCost = () => {
    if (!selectedCore || !selectedStyle) return 0;
    const styleObj = AGENT_STYLES[selectedCore.id]?.find(s => s.name === selectedStyle);
    return styleObj?.credit_cost || 0;
  };

  const totalCost = quantity * ((selectedModel?.credit_cost || 1) + (selectedCore?.credit_cost || 0) + getStyleCost());
  const [backgroundTasks, setBackgroundTasks] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'generating' | 'background' | 'done'>('idle');
  const [showToast, setShowToast] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]); // Store full objects
  const [expandedImage, setExpandedImage] = useState<any | null>(null);
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<{id: string, success: boolean, message: string} | null>(null);
  const [generationMode, setGenerationMode] = useState<'standard' | 'text-only'>('standard');
  const [showCoreModal, setShowCoreModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Agent, 2: Style, 3: Text/Prompt
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


  const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchModels = async () => {
    try {
      const modelsRes = await apiFetch('/models?category=model&type=image');
      const modelsData = await modelsRes.json();

      if (modelsData.success) {
        setAvailableModels(modelsData.models);
        setSelectedModel(modelsData.models[0]);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchModels();
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialCore) {
      const core = AGENT_CORES.find(m => m.style_id === initialCore);
      if (core) {
        setSelectedCore(core);
        setSelectedStyle(null);
        onClearCore?.();
      }
    }
  }, [initialCore]);

  const handleDropdownClick = (e: React.MouseEvent, dropdown: string) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file));
      setCapturedFile(null); // Clear captured if manual upload
    }
  };

  const handleCapture = (blob: Blob, url: string) => {
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setCapturedFile(file);
    setUploadedImage(url);
  };

  const handleGenerate = async () => {
    if (generationMode === 'text-only' ? !prompt.trim() : (!prompt.trim() && !uploadedImage)) return;
    
    // Validation: Require Core in Standard mode
    if (generationMode === 'standard') {
      if (!selectedCore) {
        setConfirmModalConfig({
          title: 'Agente Necessário',
          message: 'Por favor, selecione um Agente Conversio para gerar o seu anúncio.',
          type: 'warning',
          onConfirm: () => {
            setShowConfirmModal(false);
            setShowCoreModal(true);
          }
        });
        setShowConfirmModal(true);
        return;
      }
      if (!selectedStyle) {
        setConfirmModalConfig({
          title: 'Estilo Necessário',
          message: 'Por favor, selecione um Estilo específico para o Agente selecionado.',
          type: 'warning',
          onConfirm: () => setShowConfirmModal(false)
        });
        setShowConfirmModal(true);
        return;
      }
    }

    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('prompt', prompt);
    formData.append('model_id', selectedModel?.id || '');
    
    const isTextOnly = generationMode === 'text-only';
    
    // Core and style only in standard mode
    if (!isTextOnly) {
      formData.append('core_id', selectedCore?.id || '');
      formData.append('core_name', selectedCore?.name || '');
      formData.append('style', selectedStyle || '');
      formData.append('includeText', includeText.toString());
      
      if (selectedCore?.id === 'impact-ads-pro') {
        formData.append('use_brand_colors', useBrandColors.toString());
        if (brandData) {
          formData.append('brand_colors', JSON.stringify(brandData.brand_colors || brandData.colors || {}));
        }
      }

      if (fileInputRef.current?.files?.[0]) {
        formData.append('image', fileInputRef.current.files[0]);
      } else if (capturedFile) {
        formData.append('image', capturedFile);
      }
    } else {
      formData.append('core_id', '');
      formData.append('core_name', '');
      formData.append('style', '');
      formData.append('includeText', 'false');
    }
    
    formData.append('model_name', selectedModel?.name || 'Flux.1');
    formData.append('aspectRatio', ratio);
    formData.append('quantity', quantity.toString());

    setStatus('generating');

    // Reset overlay after exactly 3s
    setTimeout(() => {
      setStatus('idle');
    }, 3000);

    try {
      const response = await apiFetch('/generate/image', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        setShowToast(true);
        setPrompt('');
        setUploadedImage(null);
        setCapturedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setShowToast(false), 5000);
        if (data.batchId) pollGeneration(data.batchId);
      } else {
        setConfirmModalConfig({
          title: 'Erro ao Gerar',
          message: data.message || 'Ocorreu um erro inesperado ao processar sua geração.',
          type: 'error',
          onConfirm: () => setShowConfirmModal(false)
        });
        setShowConfirmModal(true);
      }
    } catch (err) {
      // Error handled by Toast usually, but keeping it simple
    }
  };


  const pollGeneration = (batchId: string) => {
    setBackgroundTasks(prev => prev + 1);
    const interval = setInterval(async () => {
      try {
      const res = await apiFetch(`/generations?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          const batch = data.generations.filter((g: any) => g.batch_id === batchId);
          const allFinished = batch.length > 0 && batch.every((g: any) => g.status === 'completed' || g.status === 'failed');
          
          if (allFinished) {
            clearInterval(interval);
            setBackgroundTasks(prev => Math.max(0, prev - 1));
            setGeneratedItems(batch.filter((g: any) => g.status === 'completed' || g.status === 'failed'));
            setStatus('done');
            
            const hasFailures = batch.some((g: any) => g.status === 'failed');
            if (hasFailures) {
              setConfirmModalConfig({
                title: 'Erro na Geração',
                message: 'Detectámos que a geração de imagem falhou. Os teus créditos foram devolvidos automaticamente.',
                type: 'error',
                onConfirm: () => setShowConfirmModal(false)
              });
              setShowConfirmModal(true);
            }
            
            // Sync credits across the app
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (e) {}
    }, 4000);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModalConfig({
      title: 'Eliminar Geração',
      message: 'Deseja eliminar permanentemente esta geração? Esta ação não pode ser desfeita.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/generations/${id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            setGeneratedItems(prev => prev.filter((g: any) => g.id !== id));
          } else {
            setConfirmModalConfig({
              title: 'Erro ao Eliminar',
              message: data.message || 'Não foi possível eliminar a geração.',
              type: 'error',
              onConfirm: () => setShowConfirmModal(false)
            });
            setShowConfirmModal(true);
          }
        } catch(err) { console.error('Erro ao deletar', err); }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handlePublish = async (item: any) => {
    if (!user.id || publishing) return;
    setPublishing(item.id);
    setPublishStatus(null);
    try {
      const res = await apiFetch('/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          generationId: item.id,
          type: item.type,
          imageUrl: item.result_url,
          prompt: item.prompt
        })
      });
      const data = await res.json();
      if (data.success) {
        setPublishStatus({ id: item.id, success: true, message: 'Publicado!' });
      } else {
        setPublishStatus({ id: item.id, success: false, message: data.message || 'Erro' });
      }
    } catch (err) {
      setPublishStatus({ id: item.id, success: false, message: 'Erro' });
    } finally {
      setPublishing(null);
      setTimeout(() => setPublishStatus(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] w-full max-w-6xl mx-auto relative px-4 sm:px-0">
      <ParticlesBackground type="image" />
      
      <div className="flex-1 flex flex-col justify-center w-full max-w-4xl mx-auto animate-in fade-in duration-700">

          <div className="w-full text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              O que vamos <span className="text-[#FFB800]">criar</span> hoje?
            </h1>
            <p className="text-text-secondary text-sm mt-2 opacity-80">Dê vida às suas ideias com a nossa inteligência artificial</p>
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
                       onClick={() => { setUploadedImage(null); setCapturedFile(null); }} 
                       className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                     >
                       <X size={14} className="text-white" />
                     </button>
                   </div>
                 )}
                 <textarea
                   value={prompt}
                   onChange={e => setPrompt(e.target.value)}
                   placeholder={generationMode === 'text-only' ? "Descreva a sua ideia (Obrigatório)..." : "Descreva a sua ideia em detalhes..."}
                   className="w-full bg-transparent text-text-primary placeholder:text-text-tertiary resize-none outline-none min-h-[80px] py-1 text-base scrollbar-hide"
                 />
               </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {generationMode === 'standard' && (
                      <>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        <div className="flex items-center gap-2">
                           <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full bg-bg-base border border-border-subtle text-text-secondary hover:text-[#FFB800] transition-colors"><ImagePlus size={18} /></button>
                           {isMobile && (
                             <button onClick={() => setIsCameraOpen(true)} className="p-2.5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] hover:bg-[#FFB800]/20 transition-all animate-pulse-glow">
                               <Camera size={18} />
                             </button>
                           )}
                        </div>
                      </>
                    )}

                   
                   <div className="relative">
                     <button onClick={(e) => handleDropdownClick(e, 'model')} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-base border border-border-subtle text-[10px] font-bold text-text-secondary hover:text-[#FFB800] transition-colors">
                       <Sparkles size={12} /> {selectedModel?.name || 'Modelo'}
                        {selectedModel?.credit_cost && <span className="px-1.5 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black">{selectedModel.credit_cost} CR.</span>}
                     </button>
                     {activeDropdown === 'model' && (
                       <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden z-[100] py-1 animate-in fade-in slide-in-from-top-2 duration-200" onClick={e => e.stopPropagation()}>
                         {availableModels.map(m => (
                           <button key={m.id} onClick={() => { setSelectedModel(m); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 transition-colors ${selectedModel?.id === m.id ? "bg-[#FFB800]/10" : "hover:bg-surface-hover"}`}>
                             <div className="flex items-center gap-2 mb-0.5">
                               <span className="text-[13px] font-bold text-text-primary">{m.name}</span>
                               {m.credit_cost && <span className="px-1 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black">{m.credit_cost} CR.</span>}
                             </div>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                   
                   {/* Core Models — Animated Wizard Button (Standard Only) */}
                    {generationMode === 'standard' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setWizardStep(1); setShowCoreModal(true); }}
                        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 overflow-hidden
                          ${selectedCore
                            ? 'bg-[#FFB800]/20 border border-[#FFB800]/50 text-[#FFB800] shadow-[0_0_12px_rgba(255,184,0,0.3)]'
                            : 'bg-bg-base border border-border-subtle text-text-secondary hover:text-[#FFB800] hover:border-[#FFB800]/30'}`}
                      >
                        {/* Animated ring when no core selected */}
                        {!selectedCore && (
                          <span className="absolute inset-0 rounded-full border border-[#FFB800]/30 animate-ping opacity-60" />
                        )}
                        <Layers size={12} className={selectedCore ? 'text-[#FFB800]' : 'animate-pulse'} />
                        <span className="flex items-center gap-1.5">
                          {selectedCore ? selectedCore.name : 'Configurar Design'}
                          {selectedStyle && (
                             <span className="hidden sm:inline opacity-60 font-medium border-l border-[#FFB800]/20 pl-1.5 ml-0.5">{selectedStyle}</span>
                          )}
                          {selectedCore && (
                             <span className="hidden sm:inline opacity-60 font-medium border-l border-[#FFB800]/20 pl-1.5">{includeText ? 'C/ Texto' : 'S/ Texto'}</span>
                          )}
                        </span>
                        {selectedCore && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#FFB800] text-black text-[8px] font-black">{selectedCore.style_id}</span>
                        )}
                        <ChevronRight size={10} className="opacity-50" />
                      </button>
                    )}
                  </div>

                 <div className="flex flex-col items-end gap-1">
                    <button 
                      onClick={handleGenerate}
                      disabled={generationMode === 'text-only' ? !prompt.trim() : (!prompt.trim() && !uploadedImage)}
                      className="px-6 py-3.5 rounded-full bg-[#FFB800] text-black animate-pulse-glow hover:scale-105 transition-all shadow-lg disabled:opacity-50 flex items-center gap-3"
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest border-r border-black/20 pr-3">{totalCost} CR.</span>
                      <span className="font-bold text-sm">Gerar</span>
                      <Send size={16} />
                    </button>
                 </div>
               </div>

              {/* Wizard handles styles and text options now, so the inline options are removed. */}




              {/* Options moved to Wizard */}


            </div>
          </div>
        </div>
      {expandedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300" onClick={() => setExpandedImage(null)}>
           <button className="absolute top-8 right-8 text-white hover:scale-110 transition-transform"><X size={32} /></button>
           <div className="max-w-[90vw] max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
              <img src={expandedImage.result_url} className="rounded-2xl shadow-2xl object-contain max-h-[85vh]" />
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex gap-4">
                 <button 
                   onClick={() => handlePublish(expandedImage)}
                   className="px-8 py-4 bg-[#FFB800] text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
                 >
                   <Globe size={18} /> Publicar na Comunidade
                 </button>
                 <a href={expandedImage.result_url} download className="px-8 py-4 bg-white/10 text-white rounded-full font-bold flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md"><Download size={18} /> Baixar</a>
              </div>
           </div>
         </div>
      )}

      {/* ===== CONVERSIO CORE WIZARD MODAL ===== */}
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
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {wizardStep === 1 && <>Escolher <span className="text-[#FFB800]">Agente</span></>}
                      {wizardStep === 2 && <>Escolher <span className="text-[#FFB800]">Estilo</span></>}
                      {wizardStep === 3 && <>Configurar <span className="text-[#FFB800]">Design</span></>}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {AGENT_CORES.map((core) => {
                    const isSelected = selectedCore?.id === core.id;
                    const Icon = core.icon;
                    return (
                      <button
                        key={core.id}
                        onClick={() => { setSelectedCore(core); setSelectedStyle(null); }}
                        className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col items-center text-center ${
                          isSelected
                            ? 'bg-[#FFB800]/10 border-[#FFB800]/50 shadow-[0_0_30px_rgba(255,184,0,0.1)]'
                            : 'bg-white/[0.02] border-white/5 hover:border-[#FFB800]/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${isSelected ? 'bg-[#FFB800] text-black shadow-lg' : 'bg-white/5 text-text-secondary group-hover:text-[#FFB800]'}`}>
                          <Icon size={24} strokeWidth={isSelected ? 2 : 1.5} />
                        </div>
                        <p className={`text-lg font-medium tracking-tight mb-1.5 ${isSelected ? 'text-[#FFB800]' : 'text-white'}`}>{core.name}</p>
                        <p className={`text-xs font-normal leading-relaxed opacity-80 ${isSelected ? 'text-[#FFB800]/80' : 'text-text-secondary'}`}>{core.description}</p>
                        {isSelected && <div className="absolute top-4 right-4 text-[#FFB800]"><CheckCircle2 size={18} /></div>}
                      </button>
                    );
                  })}
                </div>
              )}

              {wizardStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {AGENT_STYLES[selectedCore?.id || '']?.map((styleObj) => (
                    <button
                      key={styleObj.name}
                      onClick={() => setSelectedStyle(styleObj.name)}
                      className={`p-5 rounded-xl border text-left transition-all duration-200 flex flex-col gap-1.5 ${
                        selectedStyle === styleObj.name
                          ? 'bg-[#FFB800]/10 border-[#FFB800]/50 text-[#FFB800]'
                          : 'bg-white/[0.02] border-white/5 text-text-secondary hover:border-[#FFB800]/20'
                      }`}
                    >
                      <span className="text-base font-medium">{styleObj.name}</span>
                      <span className={`text-[10px] font-medium uppercase tracking-widest ${selectedStyle === styleObj.name ? 'text-[#FFB800]/70' : 'text-text-tertiary'}`}>Estilo Elite</span>
                    </button>
                  ))}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-widest px-1">Tipo de Design</h4>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIncludeText(false)}
                        className={`flex-1 p-6 rounded-2xl border transition-all flex items-center justify-center gap-4 ${!includeText ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]' : 'bg-white/[0.02] border-white/5 text-text-tertiary hover:border-white/10'}`}
                      >
                         <Layers size={20} strokeWidth={!includeText ? 2 : 1.5} />
                         <div className="text-left">
                            <span className="text-sm font-semibold block">Sem Texto</span>
                            <span className={`text-[10px] font-normal ${!includeText ? 'text-[#FFB800]/70' : 'text-text-tertiary/60'}`}>Foco total na imagem</span>
                         </div>
                      </button>
                      <button 
                        onClick={() => setIncludeText(true)}
                        className={`flex-1 p-6 rounded-2xl border transition-all flex items-center justify-center gap-4 ${includeText ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]' : 'bg-white/[0.02] border-white/5 text-text-tertiary hover:border-white/10'}`}
                      >
                         <Smartphone size={20} strokeWidth={includeText ? 2 : 1.5} />
                         <div className="text-left">
                            <span className="text-sm font-semibold block">Com Texto</span>
                            <span className={`text-[10px] font-normal ${includeText ? 'text-[#FFB800]/70' : 'text-text-tertiary/60'}`}>Para anúncios e social</span>
                         </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-widest px-1">Formato</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {RATIOS.map(r => (
                        <button 
                          key={r.id}
                          onClick={() => setRatio(r.id)}
                          className={`p-4 rounded-xl border text-center transition-all ${ratio === r.id ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]' : 'bg-white/[0.02] border-white/5 text-text-tertiary hover:border-white/10'}`}
                        >
                          <span className="text-sm font-medium">{r.name}</span>
                          <span className="text-[10px] block opacity-50 font-normal mt-0.5">{r.desc.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-widest px-1">Quantidade de Imagens</h4>
                    <div className="flex items-center gap-2">
                      {QUANTITIES.map(q => (
                        <button 
                          key={q} 
                          onClick={() => setQuantity(q)}
                          className={`flex-1 py-3 flex flex-col items-center justify-center rounded-xl transition-all ${
                            quantity === q 
                              ? 'bg-[#FFB800]/10 border border-[#FFB800]/40 text-[#FFB800]' 
                              : 'bg-white/[0.02] border border-white/5 text-text-tertiary hover:border-white/10'
                          }`}
                        >
                          <span className="text-base font-semibold">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedCore?.id === 'impact-ads-pro' && (
                    <div className="flex flex-col gap-4 p-6 rounded-[2rem] bg-accent/5 border border-accent/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                          <Zap size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Configuração de Cores Premium</h4>
                          <p className="text-[10px] text-text-tertiary">Escolha a paleta cromática para o ImpactAds Pro</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setUseBrandColors(false)}
                          className={`p-4 rounded-xl border transition-all text-center flex flex-col items-center gap-2 ${!useBrandColors ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]' : 'bg-white/[0.02] border-white/5 text-text-tertiary hover:border-white/10'}`}
                        >
                          <Layers size={18} />
                          <span className="text-xs font-bold uppercase tracking-wider">Cores do Produto</span>
                        </button>
                        <button 
                          onClick={async () => {
                            setCheckingBrand(true);
                            try {
                              const res = await apiFetch(`/brands/${user.id}`);
                              const data = await res.json();
                              if (data.success && data.brand) {
                                setBrandData(data.brand);
                                setUseBrandColors(true);
                              } else {
                                setConfirmModalConfig({
                                  title: 'Marca não Configurada',
                                  message: 'Ainda não tem uma identidade de marca configurada. Vá para Configurações > Identidade da Marca para configurar e usar as suas cores automáticas.',
                                  type: 'info',
                                  onConfirm: () => {
                                    setShowConfirmModal(false);
                                  }
                                });
                                setShowConfirmModal(true);
                              }
                            } catch (e) {
                              setUseBrandColors(false);
                            } finally {
                              setCheckingBrand(false);
                            }
                          }}
                          disabled={checkingBrand}
                          className={`p-4 rounded-xl border transition-all text-center flex flex-col items-center gap-2 ${useBrandColors ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]' : 'bg-white/[0.02] border-white/5 text-text-tertiary hover:border-white/10'}`}
                        >
                          {checkingBrand ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                          <span className="text-xs font-bold uppercase tracking-wider">Cores da Marca</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Navigation Footer */}
            <div className="shrink-0 px-10 py-6 border-t border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl">
              <button 
                onClick={() => wizardStep === 1 ? setShowCoreModal(false) : setWizardStep(prev => prev - 1)}
                className="px-6 py-2.5 rounded-full text-sm font-medium text-text-tertiary hover:text-white transition-all flex items-center gap-2"
              >
                {wizardStep === 1 ? 'Cancelar' : <><ArrowRight className="rotate-180" size={16} /> Voltar</>}
              </button>
              
              <button 
                onClick={() => {
                  if (wizardStep === 1 && selectedCore) setWizardStep(2);
                  else if (wizardStep === 2 && selectedStyle) setWizardStep(3);
                  else if (wizardStep === 3) setShowCoreModal(false);
                }}
                disabled={(wizardStep === 1 && !selectedCore) || (wizardStep === 2 && !selectedStyle)}
                className="px-8 py-3 rounded-full bg-[#FFB800] text-black text-sm font-bold uppercase tracking-wide flex items-center gap-2 shadow-[0_0_30px_rgba(255,184,0,0.2)] disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
              >
                {wizardStep === 3 ? 'Finalizar' : 'Próximo'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay Temporário (3 segundos) */}
      {status === 'generating' && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-base/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
           <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-[#FFB800]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#FFB800] rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <Sparkles className="text-[#FFB800] animate-pulse" size={32} />
              </div>
           </div>
           <h3 className="text-2xl font-black tracking-tight text-white mb-2">A iniciar geração...</h3>
           <p className="text-text-secondary text-sm">O seu pedido foi adicionado à fila.</p>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
           <div className="bg-surface/90 backdrop-blur-2xl border border-[#FFB800]/30 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFB800]/20 flex items-center justify-center">
                 <ImagePlus size={20} className="text-[#FFB800]" />
              </div>
              <div>
                 <p className="text-[13px] font-bold text-text-primary">Geração iniciada!</p>
                 <p className="text-[10px] text-text-tertiary">Acompanha o status no botão superior "A gerar".</p>
              </div>
           </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        type={confirmModalConfig.type}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ProductCamera 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
}
