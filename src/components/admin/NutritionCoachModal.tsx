import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Flame,
  Scale,
  Activity,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Droplets,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Utensils,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Sliders,
  Send,
  MessageSquare,
  ShieldCheck,
  FileText,
  Pill,
  Lightbulb
} from 'lucide-react';
import { useNutrition } from '../../context/NutritionContext';
import {
  NutritionCoachAnalysis,
  Patient,
  DietPlan,
  AnthropometryRecord
} from '../../types';
import { requestNutritionCoachAnalysis } from '../../services/nutritionCoachService';
import confetti from 'canvas-confetti';

interface NutritionCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFocus?: string;
  onAppliedToDietPlan?: () => void;
}

export const NutritionCoachModal: React.FC<NutritionCoachModalProps> = ({
  isOpen,
  onClose,
  initialFocus,
  onAppliedToDietPlan,
}) => {
  const {
    selectedPatientForDetail,
    activePatient,
    patientAnthropometry,
    activeDietPlan,
    saveDietPlan,
    updatePatient,
  } = useNutrition();

  const patient = selectedPatientForDetail || activePatient;

  // Selected preset focus
  const [clinicalFocus, setClinicalFocus] = useState<string>(
    initialFocus || 'Recomposição Corporal & Otimização Nutricional'
  );
  const [customDirectives, setCustomDirectives] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<NutritionCoachAnalysis | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);
  const [copiedGeneral, setCopiedGeneral] = useState<boolean>(false);
  const [copiedPatientMsg, setCopiedPatientMsg] = useState<boolean>(false);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  // Latest vs previous anthropometry
  const latestAnthro = patientAnthropometry.length > 0
    ? patientAnthropometry[patientAnthropometry.length - 1]
    : null;

  const previousAnthro = patientAnthropometry.length > 1
    ? patientAnthropometry[patientAnthropometry.length - 2]
    : null;

  // Anthropometric deltas
  const weightDelta = previousAnthro && latestAnthro
    ? Number((latestAnthro.weightKg - previousAnthro.weightKg).toFixed(1))
    : 0;

  const fatPercDelta = previousAnthro && latestAnthro
    ? Number((latestAnthro.bodyFatPercentage - previousAnthro.bodyFatPercentage).toFixed(1))
    : 0;

  const leanMassDelta = previousAnthro && latestAnthro
    ? Number((latestAnthro.leanMassKg - previousAnthro.leanMassKg).toFixed(1))
    : 0;

  const fatMassDelta = previousAnthro && latestAnthro
    ? Number((latestAnthro.fatMassKg - previousAnthro.fatMassKg).toFixed(1))
    : 0;

  // Focus presets
  const focusPresets = [
    {
      id: 'recomp',
      title: '⚖️ Recomposição Corporal',
      desc: 'Equilíbrio isocalórico, perda gradual de gordura e ganho/manutenção de massa magra.',
      prompt: 'Recomposição Corporal: otimizar partição de nutrientes, proteína alta (2.0-2.2g/kg) e manutenção calórica.',
    },
    {
      id: 'plateau',
      title: '🎯 Quebra de Platô (Cutting)',
      desc: 'Reajuste do déficit energético e termogênese após desaceleração da perda de peso.',
      prompt: 'Quebra de Platô: reavaliar gasto metabólico atual, intensificar oxidação lipídica com déficit seguro e ciclagem de carboidratos.',
    },
    {
      id: 'lean_bulk',
      title: '💪 Superávit Limpo (Bulking)',
      desc: 'Aporte anabólico moderado (+200-300 kcal) minimizando acúmulo de tecido adiposo.',
      prompt: 'Superávit Limpo: foco em hipertrofia de qualidade com aumento progressivo de carboidratos complexos e recuperação muscular.',
    },
    {
      id: 'satiety',
      title: '🥦 Saciedade & Densidade',
      desc: 'Elevar fibras, volume alimentar e alimentos in natura para controle de fome e adesão.',
      prompt: 'Densidade Nutricional e Saciedade: aumentar fibras totais (>35g), vegetais volumosos e fracionamento proteico para conter ansiedade/fome.',
    },
    {
      id: 'timing',
      title: '⚡ Timing Pré/Pós-Treino',
      desc: 'Direcionamento de carboidratos e aminoácidos em torno da janela de treinamento.',
      prompt: 'Nutrient Timing: otimizar refeições pré e pós-treino para máxima performance, recuperação de glicogênio e preservação muscular.',
    },
  ];

  // Animated loading step simulator
  useEffect(() => {
    let timer: any;
    if (isLoading) {
      setLoadingStep(0);
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  if (!isOpen || !patient) return null;

  const handleGenerateAnalysis = async () => {
    setIsLoading(true);
    setAppliedSuccess(false);
    try {
      const response = await requestNutritionCoachAnalysis({
        patient,
        currentPlan: activeDietPlan,
        latestAnthropometry: latestAnthro,
        previousAnthropometry: previousAnthro,
        allAnthropometryHistory: patientAnthropometry,
        clinicalFocus,
        customDirectives,
      });

      if (response && response.data) {
        setAnalysisResult(response.data);
      }
    } catch (err) {
      console.error('Error generating Nutrition Coach analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToPlan = () => {
    if (!analysisResult || !patient) return;

    const newKcal = analysisResult.caloricRecommendation.recommendedKcal;
    const newProt = analysisResult.macroRecommendations.protein.targetG;
    const newCarbs = analysisResult.macroRecommendations.carbs.targetG;
    const newFats = analysisResult.macroRecommendations.fats.targetG;
    const newWater = analysisResult.macroRecommendations.waterMl.targetMl;

    // 1. Update patient profile targets
    updatePatient(patient.id, {
      targetCalories: newKcal,
      targetProteinG: newProt,
      targetCarbsG: newCarbs,
      targetFatsG: newFats,
      targetWaterMl: newWater,
    });

    // 2. Update active diet plan if present
    if (activeDietPlan) {
      const updatedGuidelines = activeDietPlan.generalGuidelines
        ? `${activeDietPlan.generalGuidelines}\n\n[Reajuste AI Nutrition Coach em ${new Date().toLocaleDateString('pt-BR')}]: ${analysisResult.caloricRecommendation.strategy} - ${analysisResult.caloricRecommendation.rationale}`
        : `[Reajuste AI Nutrition Coach em ${new Date().toLocaleDateString('pt-BR')}]: ${analysisResult.caloricRecommendation.strategy} - ${analysisResult.caloricRecommendation.rationale}`;

      saveDietPlan({
        ...activeDietPlan,
        targetCalories: newKcal,
        targetProteinG: newProt,
        targetCarbsG: newCarbs,
        targetFatsG: newFats,
        waterGoalMl: newWater,
        generalGuidelines: updatedGuidelines,
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }

    setAppliedSuccess(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });

    if (onAppliedToDietPlan) {
      onAppliedToDietPlan();
    }
  };

  const handleCopyFullReport = () => {
    if (!analysisResult || !patient) return;

    const report = `📋 RELATÓRIO DE AJUSTES - AI NUTRITION COACH
=============================================
Paciente: ${patient.name} (${patient.gender}, ${patient.age} anos)
Data: ${new Date().toLocaleDateString('pt-BR')}
Objetivo: ${patient.goal.toUpperCase()}

📊 DIAGNÓSTICO DA COMPOSIÇÃO CORPORAL:
${analysisResult.diagnosticSummary}
Status: ${analysisResult.bodyCompositionInsight.status}
Evolução de Gordura: ${analysisResult.bodyCompositionInsight.fatLossRating}
Massa Magra: ${analysisResult.bodyCompositionInsight.leanMassPreservation}

🔥 RECOMENDAÇÃO ENERGÉTICA & CALÓRICA:
- Meta Anterior: ${analysisResult.caloricRecommendation.currentKcal} kcal
- Nova Meta Recomendada: ${analysisResult.caloricRecommendation.recommendedKcal} kcal (${analysisResult.caloricRecommendation.deltaKcal > 0 ? `+${analysisResult.caloricRecommendation.deltaKcal}` : analysisResult.caloricRecommendation.deltaKcal} kcal)
- Estratégia: ${analysisResult.caloricRecommendation.strategy}
- Justificativa: ${analysisResult.caloricRecommendation.rationale}

🥗 REBALANCEAMENTO DE MACRONUTRIENTES:
- Proteínas: ${analysisResult.macroRecommendations.protein.targetG}g (${analysisResult.macroRecommendations.protein.gPerKg}g/kg) - ${analysisResult.macroRecommendations.protein.rationale}
- Carboidratos: ${analysisResult.macroRecommendations.carbs.targetG}g (${analysisResult.macroRecommendations.carbs.gPerKg}g/kg) - ${analysisResult.macroRecommendations.carbs.rationale}
- Gorduras: ${analysisResult.macroRecommendations.fats.targetG}g (${analysisResult.macroRecommendations.fats.gPerKg}g/kg) - ${analysisResult.macroRecommendations.fats.rationale}
- Hidratação: ${analysisResult.macroRecommendations.waterMl.targetMl} ml/dia

🍽️ AJUSTES ESPECÍFICOS POR REFEIÇÃO:
${analysisResult.mealSpecificAdjustments
  .map(
    (m) =>
      `• ${m.mealName}: ${m.suggestedAdjustment}\n  Modificações: ${
        m.modifications?.map((mod) => `${mod.foodName} (${mod.amount}) - ${mod.reason}`).join('; ') || 'Nenhuma'
      }`
  )
  .join('\n\n')}

💡 DICAS PRÁTICAS PARA O PACIENTE:
${analysisResult.actionablePatientTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

💊 SUPLEMENTAÇÃO SUGERIDA:
${
  analysisResult.supplementationSuggestions
    ?.map((s) => `• ${s.name} (${s.dosage}) - ${s.timing}: ${s.purpose}`)
    .join('\n') || 'Nenhuma suplementação adicional.'
}
`;

    navigator.clipboard.writeText(report);
    setCopiedGeneral(true);
    setTimeout(() => setCopiedGeneral(false), 2500);
  };

  const handleCopyWhatsAppMsg = () => {
    if (!analysisResult || !patient) return;

    const firstName = patient.name.split(' ')[0];
    const msg = `Olá, ${firstName}! Tudo bem? 😊

Analisei sua última avaliação física e preparei os seguintes ajustes no seu plano alimentar para acelerar seus resultados:

🎯 *Principais Ajustes do Seu Plano:*
• *Meta Calórica Diária:* ${analysisResult.caloricRecommendation.recommendedKcal} kcal
• *Proteínas:* ${analysisResult.macroRecommendations.protein.targetG}g por dia (${analysisResult.macroRecommendations.protein.gPerKg}g/kg)
• *Carboidratos:* ${analysisResult.macroRecommendations.carbs.targetG}g por dia
• *Gorduras Boas:* ${analysisResult.macroRecommendations.fats.targetG}g por dia
• *Meta de Água:* ${(analysisResult.macroRecommendations.waterMl.targetMl / 1000).toFixed(1)} Litros/dia 💧

✨ *Orientações Especiais para este Ciclo:*
${analysisResult.actionablePatientTips.slice(0, 3).map((tip) => `• ${tip}`).join('\n')}

Seu cardápio atualizado já está disponível no nosso aplicativo! Qualquer dúvida, estou à disposição! 🚀`;

    navigator.clipboard.writeText(msg);
    setCopiedPatientMsg(true);
    setTimeout(() => setCopiedPatientMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">AI Nutrition Coach Pro</h2>
                <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ajustes inteligentes de plano alimentar orientados pela antropometria de{' '}
                <strong className="text-white font-semibold">{patient.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Section 1: Anthropometric Evolution Snapshot */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Foto Antropométrica Atual & Histórico
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Última Avaliação: {latestAnthro?.date || 'Não realizada'} ({latestAnthro?.assessmentType === 'bioimpedancia' ? 'Bioimpedância' : 'Pollock 7D'})
              </span>
            </div>

            {latestAnthro ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Weight */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Peso Corporal</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-black text-slate-900 font-mono">{latestAnthro.weightKg}</span>
                    <span className="text-xs text-slate-500">kg</span>
                  </div>
                  {previousAnthro && (
                    <div className={`flex items-center text-[10px] font-bold mt-1 ${weightDelta < 0 ? 'text-emerald-600' : weightDelta > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {weightDelta < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5" />}
                      <span>{weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg</span>
                    </div>
                  )}
                </div>

                {/* Body Fat % */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Gordura Corporal</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-black text-slate-900 font-mono">{latestAnthro.bodyFatPercentage}%</span>
                    <span className="text-xs text-slate-500">({latestAnthro.fatMassKg} kg)</span>
                  </div>
                  {previousAnthro && (
                    <div className={`flex items-center text-[10px] font-bold mt-1 ${fatPercDelta < 0 ? 'text-emerald-600' : fatPercDelta > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {fatPercDelta < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5" />}
                      <span>{fatPercDelta > 0 ? `+${fatPercDelta}` : fatPercDelta}% gordura</span>
                    </div>
                  )}
                </div>

                {/* Lean Mass */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Massa Magra</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-black text-slate-900 font-mono">{latestAnthro.leanMassKg}</span>
                    <span className="text-xs text-slate-500">kg</span>
                  </div>
                  {previousAnthro && (
                    <div className={`flex items-center text-[10px] font-bold mt-1 ${leanMassDelta > 0 ? 'text-emerald-600' : leanMassDelta < 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {leanMassDelta > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                      <span>{leanMassDelta > 0 ? `+${leanMassDelta}` : leanMassDelta} kg magra</span>
                    </div>
                  )}
                </div>

                {/* Waist / Visceral */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cintura / Visceral</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {latestAnthro.circumferences?.waist ? `${latestAnthro.circumferences.waist} cm` : latestAnthro.bioimpedance?.visceralFatLevel ? `Nível ${latestAnthro.bioimpedance.visceralFatLevel}` : 'Normal'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Meta: {patient.goal.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Nenhuma avaliação antropométrica registrada ainda. O Coach usará as medidas do cadastro clínico.</span>
              </div>
            )}
          </div>

          {/* Section 2: Clinical Strategy Focus Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Selecione a Estratégia Clínica para Este Retorno
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Escolha uma diretriz ou personalize</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {focusPresets.map((preset) => {
                const isSelected = clinicalFocus.includes(preset.title.split(' ')[1]);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setClinicalFocus(preset.prompt)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">{preset.title}</span>
                    <span className="text-[11px] text-slate-500 block mt-1 leading-snug">{preset.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Notes / Specific Directives */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span>Diretrizes Adicionais ou Relatos do Paciente (Opcional):</span>
              </label>
              <textarea
                value={customDirectives}
                onChange={(e) => setCustomDirectives(e.target.value)}
                placeholder="Ex: Paciente treina às 18h, relatou fome no final da tarde; prefere fontes proteicas vegetais no almoço; meta de perder 1.5kg de gordura no próximo mês..."
                rows={2}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white"
              />
            </div>

            {/* Generate Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateAnalysis}
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2.5 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>
                      {loadingStep === 0 && 'Analisando evolução da composição corporal...'}
                      {loadingStep === 1 && 'Cruzando gasto metabólico (TMB) e metas...'}
                      {loadingStep === 2 && 'Calculando rebalanceamento de macronutrientes...'}
                      {loadingStep >= 3 && 'Formatando sugestões práticas por refeição...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      {analysisResult ? 'Recalcular Análise com AI Nutrition Coach' : 'Gerar Análise e Sugestões com AI Coach'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 3: AI Analysis Results */}
          {analysisResult && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Diagnostic Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      Diagnóstico & Resumo da Composição Corporal
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                      {analysisResult.bodyCompositionInsight.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {analysisResult.diagnosticSummary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Taxa de Queima de Gordura</span>
                    <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                      {analysisResult.bodyCompositionInsight.fatLossRating}
                    </span>
                  </div>
                  <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-xs">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Preservação de Massa Magra</span>
                    <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                      {analysisResult.bodyCompositionInsight.leanMassPreservation}
                    </span>
                  </div>
                  <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100 text-xs">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">Gordura Visceral & Riscos</span>
                    <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                      {analysisResult.bodyCompositionInsight.visceralFatAssessment || 'Faixa Segura'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Caloric Prescription & Macronutrient Rebalancing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Energy & Calories */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Recomendação Calórica (VET)
                        </h4>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        analysisResult.caloricRecommendation.deltaKcal > 0
                          ? 'bg-blue-100 text-blue-800'
                          : analysisResult.caloricRecommendation.deltaKcal < 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {analysisResult.caloricRecommendation.deltaKcal > 0
                          ? `+${analysisResult.caloricRecommendation.deltaKcal} kcal`
                          : `${analysisResult.caloricRecommendation.deltaKcal} kcal`}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-around bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Plano Anterior</span>
                        <span className="text-base font-black text-slate-600 font-mono">
                          {analysisResult.caloricRecommendation.currentKcal}
                        </span>
                        <span className="text-[10px] text-slate-400 block">kcal/dia</span>
                      </div>

                      <ArrowRight className="w-5 h-5 text-indigo-400" />

                      <div className="text-center">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase block">Nova Meta Sugerida</span>
                        <span className="text-2xl font-black text-emerald-700 font-mono">
                          {analysisResult.caloricRecommendation.recommendedKcal}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block">kcal/dia</span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <span className="text-xs font-bold text-slate-800 block">
                        Estratégia: {analysisResult.caloricRecommendation.strategy}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {analysisResult.caloricRecommendation.rationale}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Macronutrients Breakdown */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Metas de Macronutrientes
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Por peso corporal</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* Protein */}
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Proteínas</span>
                      <span className="text-lg font-black text-emerald-900 font-mono">
                        {analysisResult.macroRecommendations.protein.targetG}g
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5">
                        {analysisResult.macroRecommendations.protein.gPerKg} g/kg
                      </span>
                    </div>

                    {/* Carbs */}
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Carboidratos</span>
                      <span className="text-lg font-black text-amber-900 font-mono">
                        {analysisResult.macroRecommendations.carbs.targetG}g
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700 block mt-0.5">
                        {analysisResult.macroRecommendations.carbs.gPerKg} g/kg
                      </span>
                    </div>

                    {/* Fats */}
                    <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                      <span className="text-[10px] font-bold text-blue-800 uppercase block">Gorduras</span>
                      <span className="text-lg font-black text-blue-900 font-mono">
                        {analysisResult.macroRecommendations.fats.targetG}g
                      </span>
                      <span className="text-[10px] font-semibold text-blue-700 block mt-0.5">
                        {analysisResult.macroRecommendations.fats.gPerKg} g/kg
                      </span>
                    </div>
                  </div>

                  {/* Water Goal */}
                  <div className="flex items-center justify-between p-2.5 bg-sky-50 rounded-xl border border-sky-100 text-xs">
                    <div className="flex items-center space-x-2 text-sky-800">
                      <Droplets className="w-4 h-4 text-sky-600" />
                      <span className="font-bold">Meta de Hidratação Diária:</span>
                    </div>
                    <span className="font-extrabold text-sky-900 font-mono">
                      {analysisResult.macroRecommendations.waterMl.targetMl} ml/dia
                    </span>
                  </div>
                </div>
              </div>

              {/* Meal-by-Meal Specific Adjustments */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-slate-800 text-sm">
                      Sugestões de Ajustes Refeição por Refeição
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">Clique para expandir/recolher</span>
                </div>

                <div className="space-y-3">
                  {analysisResult.mealSpecificAdjustments.map((mealAdj, idx) => {
                    const isExpanded = expandedMeal === mealAdj.mealName || (!expandedMeal && idx === 0);
                    return (
                      <div
                        key={`meal-adj-${idx}`}
                        className="rounded-xl border border-slate-200 overflow-hidden transition-all bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedMeal(isExpanded ? '__none' : mealAdj.mealName)}
                          className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="font-bold text-xs text-slate-900">{mealAdj.mealName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-4 space-y-3 bg-white text-xs text-slate-600 border-t border-slate-100">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Diretriz da Refeição</span>
                              <p className="text-slate-800 font-semibold mt-0.5">{mealAdj.suggestedAdjustment}</p>
                            </div>

                            {mealAdj.modifications && mealAdj.modifications.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-indigo-700 uppercase block">Modificações Recomendadas:</span>
                                {mealAdj.modifications.map((mod, modIdx) => (
                                  <div
                                    key={`mod-${modIdx}`}
                                    className="flex items-start gap-2 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100/80"
                                  >
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      mod.action === 'add' ? 'bg-emerald-100 text-emerald-800' :
                                      mod.action === 'replace' ? 'bg-amber-100 text-amber-800' :
                                      'bg-indigo-100 text-indigo-800'
                                    }`}>
                                      {mod.action}
                                    </span>
                                    <div>
                                      <span className="font-bold text-slate-900">{mod.foodName}</span> ({mod.amount}):{' '}
                                      <span className="text-slate-600">{mod.reason}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actionable Tips & Strategic Supplementation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tips */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Dicas Comportamentais para o Paciente
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {analysisResult.actionablePatientTips.map((tip, tipIdx) => (
                      <li key={`tip-${tipIdx}`} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Supplementation */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <Pill className="w-4 h-4 text-purple-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Suplementação Estratégica
                    </h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    {analysisResult.supplementationSuggestions && analysisResult.supplementationSuggestions.length > 0 ? (
                      analysisResult.supplementationSuggestions.map((supp, sIdx) => (
                        <div key={`supp-${sIdx}`} className="p-2.5 bg-purple-50/50 rounded-xl border border-purple-100">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-900">{supp.name}</span>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                              {supp.dosage}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">
                            <strong>Momento:</strong> {supp.timing} • <em>{supp.purpose}</em>
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs">Nenhum suplemento necessário além da alimentação habitual.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Aplicar Ajustes ao Plano Alimentar</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Atualiza instantaneamente as calorias, macronutrientes e água no plano ativo do paciente.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  {/* Copy WhatsApp */}
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppMsg}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                    title="Copiar mensagem formatada para WhatsApp"
                  >
                    {copiedPatientMsg ? <Check className="w-4 h-4 text-emerald-400" /> : <MessageSquare className="w-4 h-4 text-emerald-400" />}
                    <span>{copiedPatientMsg ? 'Copiado!' : 'WhatsApp'}</span>
                  </button>

                  {/* Copy Full Report */}
                  <button
                    type="button"
                    onClick={handleCopyFullReport}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                  >
                    {copiedGeneral ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedGeneral ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  {/* Apply Action */}
                  <button
                    type="button"
                    onClick={handleApplyToPlan}
                    disabled={appliedSuccess}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-80"
                  >
                    {appliedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>Plano Atualizado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Aplicar ao Plano Alimentar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
