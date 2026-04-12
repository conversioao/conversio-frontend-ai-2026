import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Sparkles, Zap, CheckCircle2, Layers,
  Play, Video, Film, Sun, Flag, Monitor, Smile,
  RefreshCw, Gift, Star, Shield, TrendingUp, Eye
} from 'lucide-react';
import { SharedHeader } from './SharedHeader';
import { SharedFooter } from './SharedFooter';

interface VideoCoresPageProps {
  onEnter: () => void;
  onBack: () => void;
  onSelect?: (coreId: string) => void;
}

type VideoFilterType = 'all' | 'autentico' | 'cinematografico' | 'conversao' | 'criativo';

const VIDEO_CORES = [
  {
    id: 'VID-01',
    code: 'VID-01',
    name: 'UGC RealTalk',
    category: 'Conteúdo Autêntico de Utilizador',
    filter: 'autentico' as const,
    icon: Video,
    gradient: 'from-emerald-900 via-emerald-700 to-green-600',
    barColor: 'from-emerald-400 to-green-500',
    glowColor: 'rgba(16,185,129,0.2)',
    filterBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    conversionBadge: '⭐ Maior Autenticidade',
    conversionColor: 'bg-emerald-500/20 text-emerald-300',
    generates: 'Vídeo de 15 segundos que parece feito por uma pessoa real angolana — câmara treme ligeiramente, fala natural com hesitações reais, produto aparece de forma orgânica. Narração 100% em português de Luanda.',
    timeline: [
      { time: '0:00–0:03', desc: 'Gancho irresistível com expressão genuína' },
      { time: '0:03–0:06', desc: 'O problema mostrado visualmente' },
      { time: '0:06–0:10', desc: 'Produto em acção com detalhe de close' },
      { time: '0:10–0:12', desc: 'Reacção real com gesto angolano' },
      { time: '0:12–0:15', desc: 'CTA directo em PT Angola' },
    ],
    forWho: 'Qualquer produto que beneficie de recomendação espontânea e credibilidade de pessoa real — beleza, alimentação, moda, tech, saúde.',
    includes: ['Prompt Sora 2 completo em inglês', 'Narração completa em PT Angola', 'Copy (headline + corpo + CTA)', 'Versão Stories e WhatsApp', '15 hashtags segmentadas'],
  },
  {
    id: 'VID-02',
    code: 'VID-02',
    name: 'PSR Convert',
    category: 'Problema → Solução → Resultado',
    filter: 'conversao' as const,
    icon: TrendingUp,
    gradient: 'from-red-900 via-red-700 to-orange-600',
    barColor: 'from-red-400 to-orange-500',
    glowColor: 'rgba(239,68,68,0.2)',
    filterBadge: 'bg-red-500/20 text-red-300 border-red-500/30',
    conversionBadge: '🔥 Maior Taxa de Conversão',
    conversionColor: 'bg-red-500/20 text-red-300',
    generates: 'O formato de maior conversão da publicidade digital. Activa a dor do espectador, apresenta o produto como solução natural e entrega o resultado concreto. O espectador passa de "isso sou eu" para "preciso disto" em 15 segundos.',
    timeline: [
      { time: '0:00–0:03', desc: 'Gancho com o problema específico (luz fria)' },
      { time: '0:03–0:06', desc: 'Dor amplificada visualmente' },
      { time: '0:06–0:10', desc: 'Produto como solução natural (luz aquece)' },
      { time: '0:10–0:12', desc: 'Resultado concreto com emoção real' },
      { time: '0:12–0:15', desc: 'CTA directo e urgente' },
    ],
    forWho: 'Produtos que resolvem um problema específico — skincare, suplementos, limpeza, organização, qualquer produto com benefício mensurável.',
    includes: ['Prompt Sora 2 com arco de luz frio→quente', 'Narração com mudança de tom dor→alívio', 'Copy focada no contraste antes/depois', 'Versão Stories e WhatsApp', 'Hashtags de nicho + Angola'],
  },
  {
    id: 'VID-03',
    code: 'VID-03',
    name: 'CineHero',
    category: 'Cinematic Product Hero',
    filter: 'cinematografico' as const,
    icon: Film,
    gradient: 'from-slate-950 via-slate-800 to-blue-800',
    barColor: 'from-slate-400 to-blue-500',
    glowColor: 'rgba(59,130,246,0.2)',
    filterBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    conversionBadge: '💎 Maior Qualidade Visual',
    conversionColor: 'bg-blue-500/20 text-blue-300',
    generates: 'O produto é o protagonista absoluto — filmado com qualidade cinematográfica, dinâmico e com narração angolana. Cada detalhe da embalagem e textura em destaque máximo. Termina com CTA real e específico.',
    timeline: [
      { time: '0:00–0:02', desc: 'Produto emerge da escuridão' },
      { time: '0:02–0:04', desc: 'Reveal completo com ângulo héroe' },
      { time: '0:04–0:06', desc: 'Série de closes nos detalhes únicos' },
      { time: '0:06–0:08', desc: 'Produto em contexto natural de uso' },
      { time: '0:08–0:10', desc: 'Plano épico final com narração impactante' },
      { time: '0:10–0:15', desc: 'CTA com nome e canal de venda real' },
    ],
    forWho: 'Produtos premium, lançamentos, qualquer produto que mereça ser visto na sua melhor versão — tech, beleza, alimentação, moda.',
    includes: ['Prompt Sora 2 cinematográfico completo', 'Narração por cena em PT Angola', 'CTA específico com canal de venda real', 'Copy + Stories + WhatsApp', 'Hashtags de produto + Angola'],
  },
  {
    id: 'VID-04',
    code: 'VID-04',
    name: 'LifeStyle',
    category: 'Lifestyle Aspiracional',
    filter: 'cinematografico' as const,
    icon: Sun,
    gradient: 'from-amber-900 via-amber-700 to-yellow-600',
    barColor: 'from-amber-400 to-yellow-500',
    glowColor: 'rgba(245,158,11,0.2)',
    filterBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    conversionBadge: '✨ Maior Aspiração',
    conversionColor: 'bg-amber-500/20 text-amber-300',
    generates: 'Mostra a vida que o produto proporciona — com energia, dinamismo e narração em português de Angola. O produto está integrado naturalmente no estilo de vida angolano aspiracional de Luanda.',
    timeline: [
      { time: '0:00–0:02', desc: 'Ambiente aspiracional de Luanda' },
      { time: '0:02–0:04', desc: 'Personagem angolano com produto natural' },
      { time: '0:04–0:06', desc: 'Detalhe do produto integrado no lifestyle' },
      { time: '0:06–0:08', desc: 'Momento genuíno de prazer ou confiança' },
      { time: '0:08–0:10', desc: 'Close emocional no auge' },
      { time: '0:10–0:15', desc: 'CTA com nome e canal real' },
    ],
    forWho: 'Produtos de moda, beleza, alimentação premium, tecnologia — qualquer produto que se venda pelo estilo de vida que representa.',
    includes: ['Prompt Sora 2 com cenários reais de Luanda', 'Narração aspiracional PT Angola por cena', 'CTA específico ao produto', 'Copy + Stories + WhatsApp', 'Hashtags de lifestyle + Angola'],
  },
  {
    id: 'VID-05',
    code: 'VID-05',
    name: 'BrandStory',
    category: 'Campanha Institucional',
    filter: 'cinematografico' as const,
    icon: Flag,
    gradient: 'from-red-950 via-red-800 to-slate-900',
    barColor: 'from-red-400 to-slate-500',
    glowColor: 'rgba(220,38,38,0.2)',
    filterBadge: 'bg-red-500/20 text-red-300 border-red-500/30',
    conversionBadge: '🏆 Maior Impacto de Marca',
    conversionColor: 'bg-orange-500/20 text-orange-300',
    generates: 'Estilo TVC angolano — narrativa emocional com planos reais de Angola, voz off profissional angolana e produto integrado na vida local. Para marcas que querem construir identidade e confiança.',
    timeline: [
      { time: '0:00–0:02', desc: 'Angola em imagem cinematográfica' },
      { time: '0:02–0:04', desc: 'Personagens angolanos reais com produto' },
      { time: '0:04–0:06', desc: 'Produto na vida real com valores' },
      { time: '0:06–0:08', desc: 'Angola + produto em harmonia' },
      { time: '0:08–0:10', desc: 'Clímax emocional com tagline' },
      { time: '0:10–0:15', desc: 'CTA institucional com canal real' },
    ],
    forWho: 'Marcas que querem construir identidade em Angola — lançamentos de marca, campanhas sazonais, produtos com forte ligação à cultura angolana.',
    includes: ['Prompt Sora 2 com planos reais de Angola', 'Voz off completa em PT Angola orgulhoso', 'Tagline adaptada ao produto', 'Copy institucional + Stories + WhatsApp', 'Hashtags de identidade + Angola'],
  },
  {
    id: 'VID-06',
    code: 'VID-06',
    name: 'SplitCVO',
    category: 'Split Screen Dinâmico',
    filter: 'criativo' as const,
    icon: Monitor,
    gradient: 'from-violet-900 via-purple-800 to-blue-700',
    barColor: 'from-violet-400 to-blue-500',
    glowColor: 'rgba(139,92,246,0.2)',
    filterBadge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    conversionBadge: '🎬 Mais Visualmente Único',
    conversionColor: 'bg-violet-500/20 text-violet-300',
    generates: 'Múltiplas visões simultâneas do mesmo produto — sincronizadas com música angolana e narração em PT Angola. Cada painel mostra um ângulo diferente do produto. Visualmente impossível de ignorar.',
    timeline: [
      { time: '0:00–0:02', desc: 'Split imediato com produto em todos os painéis' },
      { time: '0:02–0:04', desc: 'Evolução com aspectos diferentes' },
      { time: '0:04–0:06', desc: 'Foco no detalhe principal do produto' },
      { time: '0:06–0:08', desc: 'Cortes rápidos no momento mais impactante' },
      { time: '0:08–0:10', desc: 'Painéis convergem para clímax' },
      { time: '0:10–0:15', desc: 'Ecrã único com CTA real' },
    ],
    forWho: 'Produtos com múltiplas variantes, cores ou usos — moda, tech, alimentação com vários sabores, qualquer produto que ganhe com múltiplas perspectivas.',
    includes: ['Prompt Sora 2 com descrição de cada painel', 'Narração sincronizada PT Angola', 'CTA com canal de venda real', 'Copy + Stories + WhatsApp', 'Hashtags de produto + Angola'],
  },
  {
    id: 'VID-07',
    code: 'VID-07',
    name: 'SketchCVO',
    category: 'Mini Sketch / Comédia Situacional',
    filter: 'criativo' as const,
    icon: Smile,
    gradient: 'from-yellow-800 via-amber-600 to-orange-500',
    barColor: 'from-yellow-400 to-orange-500',
    glowColor: 'rgba(251,191,36,0.2)',
    filterBadge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    conversionBadge: '😂 Maior Viral Potential',
    conversionColor: 'bg-yellow-500/20 text-yellow-300',
    generates: 'Uma situação cômica angolana real e reconhecível em 10 segundos. O problema é exagerado de forma hilariante. A tentativa falhada piora tudo. O produto resolve de forma satisfatória e engraçada. Diálogo 100% PT Angola.',
    timeline: [
      { time: '0:00–0:02', desc: 'Setup: situação já começa no caos' },
      { time: '0:02–0:04', desc: 'Escalada: tentativa falhada, pior' },
      { time: '0:04–0:06', desc: 'Caos: pico do problema cómico' },
      { time: '0:06–0:08', desc: 'Produto aparece e começa a resolver' },
      { time: '0:08–0:10', desc: 'Resolução engraçada e satisfatória' },
      { time: '0:10–0:15', desc: 'CTA com humor em PT Angola' },
    ],
    forWho: 'Produtos do dia a dia que resolvem problemas reconhecíveis — limpeza, alimentação, organização, beleza — qualquer produto com problema cómico associado.',
    includes: ['Prompt Sora 2 com situação cômica completa', 'Diálogos completos em PT Angola autêntico', 'CTA com humor integrado', 'Copy + Stories + WhatsApp', 'Hashtags de humor + nicho + Angola'],
  },
  {
    id: 'VID-08',
    code: 'VID-08',
    name: 'FlipCVO',
    category: 'Antes e Depois Visual',
    filter: 'conversao' as const,
    icon: RefreshCw,
    gradient: 'from-slate-800 via-slate-600 to-yellow-700',
    barColor: 'from-slate-400 to-yellow-500',
    glowColor: 'rgba(234,179,8,0.2)',
    filterBadge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    conversionBadge: '💡 Maior Impacto Visual',
    conversionColor: 'bg-yellow-500/20 text-yellow-300',
    generates: 'Transformação visual DRAMÁTICA e inequívoca em 15 segundos. O espectador vê o ANTES (frio, desaturado, pesado) e o DEPOIS (quente, vibrante, satisfatório) com uma transição impactante que cria o momento de decisão de compra.',
    timeline: [
      { time: '0:00–0:03', desc: 'ANTES: estado de dor (luz fria 3800K)' },
      { time: '0:03–0:05', desc: 'ANTES: close no problema específico' },
      { time: '0:05–0:08', desc: 'TRANSIÇÃO dramática + DEPOIS inicial' },
      { time: '0:08–0:12', desc: 'DEPOIS: resultado concreto (luz quente 6200K)' },
      { time: '0:12–0:15', desc: 'CTA capitaliza o momento de decisão' },
    ],
    forWho: 'Produtos com resultado visível — skincare, fitness, organização, limpeza, cuidado capilar, alimentação saudável — qualquer produto com transformação clara.',
    includes: ['Prompt Sora 2 com arco ANTES→DEPOIS detalhado', 'Narração com mudança de tom dor→satisfação', 'Descrição da transformação específica ao produto', 'Copy de contraste + Stories + WhatsApp', 'Hashtags de transformação + Angola'],
  },
  {
    id: 'VID-09',
    code: 'VID-09',
    name: 'UnboxCVO',
    category: 'Unboxing + Reveal Premium',
    filter: 'criativo' as const,
    icon: Gift,
    gradient: 'from-stone-800 via-amber-800 to-yellow-700',
    barColor: 'from-stone-400 to-yellow-400',
    glowColor: 'rgba(180,83,9,0.15)',
    filterBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    conversionBadge: '🎁 Maior Desejo Sensorial',
    conversionColor: 'bg-amber-500/20 text-amber-300',
    generates: 'Mãos negras angolanas revelam o produto de forma progressiva e sensorial com sons ASMR específicos à embalagem. Cada camada aberta cria antecipação. A revelação do produto é o clímax cinematográfico.',
    timeline: [
      { time: '0:00–0:03', desc: 'Embalagem fechada, mãos entram em frame' },
      { time: '0:03–0:07', desc: 'Abertura progressiva com sons ASMR' },
      { time: '0:07–0:10', desc: 'Revelação do produto (clímax)' },
      { time: '0:10–0:12', desc: 'Admiração e benefício mencionado' },
      { time: '0:12–0:15', desc: 'CTA elegante com canal de venda real' },
    ],
    forWho: 'Produtos com embalagem premium, presentes, lançamentos, kits — qualquer produto que ganhe valor com a experiência de ser aberto.',
    includes: ['Prompt Sora 2 com sons ASMR específicos', 'Narração íntima em PT Angola', 'Descrição dos movimentos das mãos por cena', 'Copy sensorial + Stories + WhatsApp', 'Hashtags de unboxing + produto + Angola'],
  },
  {
    id: 'VID-10',
    code: 'VID-10',
    name: 'TrustCVO',
    category: 'Prova Social + Depoimento Real',
    filter: 'conversao' as const,
    icon: Star,
    gradient: 'from-blue-950 via-blue-800 to-teal-700',
    barColor: 'from-blue-400 to-teal-500',
    glowColor: 'rgba(20,184,166,0.2)',
    filterBadge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    conversionBadge: '🏅 Maior Credibilidade',
    conversionColor: 'bg-teal-500/20 text-teal-300',
    generates: 'Um cliente real angolano (fictício mas hiper-credível) dá um testemunho específico com números concretos. Ambiente real de Luanda. Imperfeições naturais de fala. Resultado específico e verificável.',
    timeline: [
      { time: '0:00–0:03', desc: 'Gancho com resultado específico' },
      { time: '0:03–0:06', desc: 'Quem é + problema que tinha' },
      { time: '0:06–0:09', desc: 'A experiência + resultado com número' },
      { time: '0:09–0:12', desc: 'Recomendação directa para câmera' },
      { time: '0:12–0:15', desc: 'CTA com quote do cliente' },
    ],
    forWho: 'Qualquer produto que precise de superar o ceticismo — suplementos, skincare, serviços, cursos, qualquer produto onde a confiança é barreira de compra.',
    includes: ['Prompt Sora 2 com perfil angolano completo', 'Depoimento completo em PT Angola com imperfeições', 'Quote de impacto para texto sobreposto', 'Copy de prova social + Stories + WhatsApp', 'Hashtags de credibilidade + Angola'],
  },
];

const COMPARISON_TABLE = [
  { goal: 'Máxima autenticidade', core: 'VID-01 UGC RealTalk' },
  { goal: 'Máxima conversão directa', core: 'VID-02 PSR Convert' },
  { goal: 'Lançamento de produto premium', core: 'VID-03 CineHero' },
  { goal: 'Vender lifestyle e aspiração', core: 'VID-04 LifeStyle' },
  { goal: 'Construir identidade de marca', core: 'VID-05 BrandStory' },
  { goal: 'Produto com múltiplas variantes', core: 'VID-06 SplitCVO' },
  { goal: 'Produto do dia a dia e humor', core: 'VID-07 SketchCVO' },
  { goal: 'Produto com resultado visível', core: 'VID-08 FlipCVO' },
  { goal: 'Produto com embalagem premium', core: 'VID-09 UnboxCVO' },
  { goal: 'Superar ceticismo do comprador', core: 'VID-10 TrustCVO' },
];

const FILTER_LABELS: Record<VideoFilterType, string> = {
  all: 'Todos',
  autentico: 'Autêntico',
  cinematografico: 'Cinematográfico',
  conversao: 'Conversão',
  criativo: 'Criativo',
};

const FILTER_BADGE_COLORS: Record<string, string> = {
  autentico: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cinematografico: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  conversao: 'bg-red-500/20 text-red-300 border-red-500/30',
  criativo: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

const FILTER_LABEL_MAP: Record<string, string> = {
  autentico: 'Autêntico',
  cinematografico: 'Cinematográfico',
  conversao: 'Conversão',
  criativo: 'Criativo',
};

const VideoCard = ({ core, onUse, delay }: { core: typeof VIDEO_CORES[0]; onUse: () => void; delay: number }) => {
  const Icon = core.icon;
  const [hovered, setHovered] = useState(false);
  const [activeTimelineIdx, setActiveTimelineIdx] = useState(0);

  // Cycle through timeline items on hover
  React.useEffect(() => {
    if (!hovered) { setActiveTimelineIdx(0); return; }
    const interval = setInterval(() => {
      setActiveTimelineIdx(i => (i + 1) % core.timeline.length);
    }, 900);
    return () => clearInterval(interval);
  }, [hovered, core.timeline.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0f] shadow-2xl group"
      style={{ boxShadow: `0 0 40px ${core.glowColor}` }}
    >
      {/* Top Color Bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${core.barColor}`} />

      {/* Card Header with Gradient */}
      <div className={`relative px-6 pt-6 pb-8 bg-gradient-to-br ${core.gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/40" />
        {/* Play icon watermark */}
        <div className="absolute right-4 bottom-4 opacity-10">
          <Play size={80} className="text-white fill-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg flex-shrink-0">
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{core.code}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${FILTER_BADGE_COLORS[core.filter]}`}>
                  {FILTER_LABEL_MAP[core.filter]}
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">{core.name}</h3>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5">{core.category}</p>
            </div>
          </div>
          {/* Conversion badge */}
          <span className={`shrink-0 px-2 py-1 rounded-full text-[9px] font-black ${core.conversionColor}`}>
            {core.conversionBadge}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-6 gap-5">
        {/* Generates */}
        <div>
          <p className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest mb-2">O que gera</p>
          <p className="text-sm text-white/70 leading-relaxed">{core.generates}</p>
        </div>

        {/* Timeline / structure */}
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Estrutura do vídeo</p>
          <div className="space-y-1.5">
            {core.timeline.map((t, i) => (
              <motion.div
                key={i}
                animate={hovered && activeTimelineIdx === i
                  ? { backgroundColor: 'rgba(255,184,0,0.1)', borderColor: 'rgba(255,184,0,0.3)' }
                  : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }
                }
                className="flex items-start gap-2.5 px-3 py-2 rounded-xl border transition-colors"
              >
                <span className={`text-[9px] font-black shrink-0 tabular-nums pt-0.5 ${hovered && activeTimelineIdx === i ? 'text-[#FFB800]' : 'text-white/30'}`}>
                  ⏱ {t.time}
                </span>
                <span className="text-[11px] text-white/60 leading-snug">{t.desc}</span>
                {hovered && activeTimelineIdx === i && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto shrink-0"
                  >
                    <Play size={10} className="text-[#FFB800] fill-[#FFB800]" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* For Who */}
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Para quem</p>
          <p className="text-xs text-white/50 leading-relaxed">{core.forWho}</p>
        </div>

        {/* What's included */}
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">O que inclui</p>
          <div className="flex flex-col gap-1">
            {core.includes.map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-[11px] font-medium text-white/60">
                <CheckCircle2 size={10} className="text-[#FFB800] shrink-0" /> {item}
              </span>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-auto pt-2">
          <motion.button
            onClick={onUse}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all bg-white/5 border border-white/20 text-white hover:bg-[#FFB800]/10 hover:border-[#FFB800]/40 hover:text-[#FFB800]"
          >
            <Play size={14} className="fill-current" />
            Gerar com Este Core
            <ArrowRight size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export function VideoCoresPage({ onEnter, onBack, onSelect }: VideoCoresPageProps) {
  const [filter, setFilter] = useState<VideoFilterType>('all');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const handleUseCore = (core: typeof VIDEO_CORES[0]) => {
    if (onSelect) {
      onSelect(core.id);
    } else {
      onEnter();
    }
  };



  const filtered = VIDEO_CORES.filter(c => filter === 'all' || c.filter === filter);

  return (
    <div className="relative z-10 text-white min-h-screen flex flex-col">
      <SharedHeader onEnter={onEnter} onNavigateHome={onBack} onNavigatePage={(p) => {}} isLoggedIn={false} />
      {/* Ambient glow — blue/cinematic */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-900/10 blur-[180px] pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6 max-w-7xl mt-16 flex-grow">

        {/* ─── HERO ─── */}
        <section className="pt-32 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Sora 2 badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[11px] font-black mb-4 uppercase tracking-[0.2em]">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)] animate-pulse" />
              Powered by Sora 2 — OpenAI
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-6"
          >
            Escolhe o Core de<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-200 to-white">Vídeo Certo</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 font-light max-w-3xl mx-auto mb-6 leading-relaxed"
          >
            10 estilos de vídeo treinados para o mercado angolano — cada um com prompts  
            Sora 2 completos, narração em português de Angola e CTA real integrado.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="flex items-center justify-center gap-2 mb-12 text-white/40 text-sm"
          >
            <Play size={13} className="text-[#FFB800] fill-[#FFB800]" />
            <span>Cada core gera um prompt Sora 2 completo com 5 cenas de 15 segundos + copy + hashtags prontos a usar.</span>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="inline-flex items-center gap-8 px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-sm font-bold mb-14"
          >
            {[
              { n: '10', label: 'Cores de Vídeo', color: 'text-blue-400' },
              { n: '15s', label: 'Por Vídeo', color: 'text-white' },
              { n: '5', label: 'Cenas por Core', color: 'text-white' },
              { n: 'PT-AO', label: 'Narração', color: 'text-[#FFB800]' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <div className="text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.n}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">{s.label}</div>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 bg-white/10" />}
              </React.Fragment>
            ))}
          </motion.div>

          {/* Filter Tabs */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center flex-wrap gap-2"
          >
            <div className="inline-flex bg-white/5 border border-white/10 p-1.5 rounded-full gap-1 flex-wrap justify-center">
              {(Object.keys(FILTER_LABELS) as VideoFilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-full text-sm font-black transition-all ${
                    filter === f
                      ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ─── CARDS GRID ─── */}
        <AnimatePresence mode="wait">
          <motion.section
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-24"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((core, i) => (
                <VideoCard key={core.id} core={core} onUse={() => handleUseCore(core)} delay={i * 0.06} />
              ))}
            </div>
          </motion.section>
        </AnimatePresence>

        {/* ─── COMPARISON TABLE ─── */}
        <section className="pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
                Qual Core <span className="text-blue-400">Escolher?</span>
              </h2>
              <p className="text-white/50 text-lg font-light">Guia rápido por objectivo</p>
            </div>

            <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0f]">
              <div className="grid grid-cols-2 gap-0 bg-white/5 px-6 py-3 border-b border-white/10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Objectivo</p>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Core Recomendado</p>
              </div>
              {COMPARISON_TABLE.map((row, i) => (
                <motion.div
                  key={i}
                  onHoverStart={() => setHoveredRow(i)}
                  onHoverEnd={() => setHoveredRow(null)}
                  animate={hoveredRow === i ? { backgroundColor: 'rgba(59,130,246,0.06)' } : { backgroundColor: 'transparent' }}
                  className="grid grid-cols-2 gap-0 px-6 py-4 border-b border-white/5 last:border-0 cursor-default transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {hoveredRow === i && <Eye size={12} className="text-blue-400 shrink-0" />}
                    <span className="text-sm text-white/70 font-medium">{row.goal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black transition-colors ${hoveredRow === i ? 'text-blue-400' : 'text-white/50'}`}>
                      {row.core}
                    </span>
                    {hoveredRow === i && <ArrowRight size={12} className="text-blue-400" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ─── CTA FINAL ─── */}
        <section className="pb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-blue-900/30 via-[#0d0d12] to-[#0d0d12] border border-blue-500/20 p-12 md:p-20 text-center shadow-[0_0_80px_rgba(59,130,246,0.08)]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/8 blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-black mb-8 uppercase tracking-widest">
                <Sparkles size={12} />
                Não sabes qual escolher?
              </div>

              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
                Começa com o<br />
                <span className="text-blue-400">VID-02 PSR Convert</span>
              </h2>

              <p className="text-lg text-white/60 font-light max-w-2xl mx-auto mb-4 leading-relaxed">
                É o formato de maior conversão e funciona para qualquer produto.
              </p>

              <p className="text-sm text-white/30 mb-12">
                Cada core gera prompts Sora 2 completos prontos a usar — sem conhecimento técnico necessário.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={() => handleUseCore(VIDEO_CORES.find(c => c.code === 'VID-02') || VIDEO_CORES[1])}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-5 rounded-full bg-blue-500 text-white font-black text-base flex items-center gap-3 shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] transition-all"
                >
                  <Play size={18} className="fill-white" />
                  Começar Agora — É Grátis
                  <ArrowRight size={18} />
                </motion.button>
                <motion.button
                  onClick={onBack}
                  whileHover={{ scale: 1.02 }}
                  className="px-10 py-5 rounded-full border border-white/20 text-white font-bold text-base hover:border-white/40 hover:bg-white/5 transition-all"
                >
                  Ver Exemplos de Vídeos Gerados
                </motion.button>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
      <SharedFooter />
    </div>
  );
}
