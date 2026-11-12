import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { AnthropometryRecord, Patient } from '../../types';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Percent,
  Activity,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  ChevronRight,
  Award,
  Zap,
  CheckCircle2,
  Sliders,
  Target
} from 'lucide-react';
import { calculateBMI } from '../../utils/nutritionCalculations';

interface PatientEvolutionChartsProps {
  patient: Patient;
  records: AnthropometryRecord[];
  onNavigateToAnthropometry?: () => void;
}

export type ChartViewType =
  | 'triple_progression'
  | 'muscle_mass'
  | 'weight'
  | 'body_fat'
  | 'body_composition';

export const PatientEvolutionCharts: React.FC<PatientEvolutionChartsProps> = ({
  patient,
  records,
  onNavigateToAnthropometry,
}) => {
  const [viewType, setViewType] = useState<ChartViewType>('triple_progression');
  
  // Interactive series toggles
  const [showWeightSeries, setShowWeightSeries] = useState<boolean>(true);
  const [showBodyFatSeries, setShowBodyFatSeries] = useState<boolean>(true);
  const [showMuscleMassSeries, setShowMuscleMassSeries] = useState<boolean>(true);
  const [showFatMassSeries, setShowFatMassSeries] = useState<boolean>(false);
  const [showReferenceThresholds, setShowReferenceThresholds] = useState<boolean>(true);

  // Sort records chronologically (oldest to newest)
  const sortedRecords = useMemo(() => {
    return [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [records]);

  // If no records exist, create a baseline point from patient profile
  const effectiveRecords: AnthropometryRecord[] = useMemo(() => {
    if (sortedRecords.length > 0) return sortedRecords;
    if (patient.weightKg && patient.heightCm) {
      const initialBmi = Number((patient.weightKg / Math.pow(patient.heightCm / 100, 2)).toFixed(1));
      const estimatedBf = patient.gender === 'Feminino' ? 24.0 : 18.0;
      const initialFatKg = Number(((patient.weightKg * estimatedBf) / 100).toFixed(1));
      const initialLeanKg = Number((patient.weightKg - initialFatKg).toFixed(1));

      return [
        {
          id: `baseline-${patient.id}`,
          patientId: patient.id,
          date: patient.createdAt || '2026-06-01',
          consultationNumber: 1,
          assessmentType: 'dobras_pollock',
          weightKg: patient.weightKg,
          heightCm: patient.heightCm,
          skinfolds: {
            subscapular: 15,
            triceps: 14,
            pectoral: 12,
            midaxillary: 14,
            suprailiac: 18,
            abdominal: 20,
            thigh: 18,
          },
          circumferences: {
            waist: 80,
            abdomen: 86,
            hip: 98,
            rightArmRelaxed: 32,
            rightArmContracted: 35,
            rightThigh: 56,
            rightCalf: 37,
          },
          sumSkinfolds: 111,
          bodyDensity: 1.055,
          bodyFatPercentage: estimatedBf,
          fatMassKg: initialFatKg,
          leanMassKg: initialLeanKg,
          bmi: initialBmi,
          notes: 'Cadastro inicial do paciente (Ponto de partida)',
        },
      ];
    }
    return [];
  }, [sortedRecords, patient]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    return effectiveRecords.map((rec, index) => {
      // Format date label as DD/MM/YY
      const dateParts = rec.date.split('-');
      const formattedDate =
        dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0].slice(2)}` : rec.date;
      const fullDate =
        dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : rec.date;

      const consultationLabel =
        rec.consultationNumber !== undefined
          ? `${rec.consultationNumber}ª Avaliação`
          : `Consulta #${index + 1}`;

      const bmiVal = rec.bmi || (rec.heightCm ? Number((rec.weightKg / Math.pow(rec.heightCm / 100, 2)).toFixed(1)) : 0);
      const fatKg = rec.fatMassKg || Number(((rec.weightKg * rec.bodyFatPercentage) / 100).toFixed(1));
      const leanKg = rec.leanMassKg || Number((rec.weightKg - fatKg).toFixed(1));
      const skeletalKg = rec.bioimpedance?.skeletalMuscleMassKg || null;

      // Deltas relative to previous evaluation
      const prevRec = index > 0 ? effectiveRecords[index - 1] : null;
      const prevFatKg = prevRec ? (prevRec.fatMassKg || Number(((prevRec.weightKg * prevRec.bodyFatPercentage) / 100).toFixed(1))) : 0;
      const prevLeanKg = prevRec ? (prevRec.leanMassKg || Number((prevRec.weightKg - prevFatKg).toFixed(1))) : 0;

      const deltaWeightPrev = prevRec ? Number((rec.weightKg - prevRec.weightKg).toFixed(1)) : 0;
      const deltaBfPrev = prevRec ? Number((rec.bodyFatPercentage - prevRec.bodyFatPercentage).toFixed(1)) : 0;
      const deltaLeanPrev = prevRec ? Number((leanKg - prevLeanKg).toFixed(1)) : 0;
      const deltaFatPrev = prevRec ? Number((fatKg - prevFatKg).toFixed(1)) : 0;

      return {
        id: rec.id,
        rawDate: rec.date,
        formattedDate,
        fullDate,
        consultationLabel,
        consultationNum: rec.consultationNumber || index + 1,
        weightKg: rec.weightKg,
        bodyFatPercentage: rec.bodyFatPercentage,
        fatMassKg: fatKg,
        leanMassKg: leanKg,
        skeletalMuscleMassKg: skeletalKg,
        bmi: bmiVal,
        deltaWeightPrev,
        deltaBfPrev,
        deltaLeanPrev,
        deltaFatPrev,
        assessmentType: rec.assessmentType,
        notes: rec.notes || '',
        methodLabel:
          rec.assessmentType === 'bioimpedancia'
            ? 'Bioimpedância (InBody)'
            : rec.assessmentType === 'combinado'
            ? 'Combinado'
            : 'Pollock 7 Dobras',
      };
    });
  }, [effectiveRecords]);

  // Key metrics calculation (Evolution from 1st to Latest)
  const firstRecord = chartData[0];
  const latestRecord = chartData[chartData.length - 1];

  const weightDiff =
    firstRecord && latestRecord
      ? Number((latestRecord.weightKg - firstRecord.weightKg).toFixed(1))
      : 0;

  const bfDiff =
    firstRecord && latestRecord
      ? Number((latestRecord.bodyFatPercentage - firstRecord.bodyFatPercentage).toFixed(1))
      : 0;

  const leanDiff =
    firstRecord && latestRecord
      ? Number((latestRecord.leanMassKg - firstRecord.leanMassKg).toFixed(1))
      : 0;

  const fatDiff =
    firstRecord && latestRecord
      ? Number((latestRecord.fatMassKg - firstRecord.fatMassKg).toFixed(1))
      : 0;

  // Muscle to fat ratio (Ratio de Composição Muscular)
  const muscleToFatRatio =
    latestRecord && latestRecord.fatMassKg > 0
      ? (latestRecord.leanMassKg / latestRecord.fatMassKg).toFixed(2)
      : 'N/A';

  // Body recomposition clinical evaluation text
  const recompositionInsight = useMemo(() => {
    if (chartData.length <= 1) {
      return 'Ponto de partida registrado. Cadastre novas consultas para visualizar deltas de massa muscular e gordura.';
    }
    if (leanDiff > 0 && bfDiff < 0) {
      return `🎉 Recomposição Corporal Excelente! O paciente ganhou +${leanDiff} kg de massa muscular e reduziu ${Math.abs(bfDiff)}% de gordura corporal.`;
    }
    if (leanDiff >= 0 && weightDiff < 0) {
      return `💪 Perda de peso com preservação muscular: Emagrecimento saudável mantendo ou aumentando a massa magra (+${leanDiff} kg).`;
    }
    if (leanDiff > 0 && bfDiff >= 0) {
      return `⚡ Hipertrofia em andamento: Ganho expressivo de +${leanDiff} kg de massa magra.`;
    }
    if (leanDiff < 0 && bfDiff < 0) {
      return `📉 Redução global: O paciente perdeu gordura (-${Math.abs(bfDiff)}%), mas requer atenção proteica para reverter a perda de massa magra (${leanDiff} kg).`;
    }
    return `Evolução em acompanhamento longitudinal (${chartData.length} avaliações registradas).`;
  }, [chartData.length, leanDiff, bfDiff, weightDiff]);

  // Min and Max values for custom Y-Axis domains
  const weightDomain = useMemo(() => {
    if (chartData.length === 0) return [40, 100];
    const values = chartData.flatMap((d) => [d.weightKg, d.leanMassKg]);
    const min = Math.floor(Math.min(...values) - 3);
    const max = Math.ceil(Math.max(...values) + 3);
    return [Math.max(0, min), max];
  }, [chartData]);

  const bfDomain = useMemo(() => {
    if (chartData.length === 0) return [5, 35];
    const bfs = chartData.map((d) => d.bodyFatPercentage);
    const min = Math.floor(Math.min(...bfs) - 2);
    const max = Math.ceil(Math.max(...bfs) + 2);
    return [Math.max(0, min), max];
  }, [chartData]);

  // Ideal target threshold for body fat based on gender
  const idealBfTarget = patient.gender === 'Feminino' ? 22 : 15;

  // Custom Rich Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 text-xs space-y-2 min-w-[240px] pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-extrabold text-slate-200">{data.consultationLabel}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
              {data.fullDate}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {/* Peso Total */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                <span>Peso Total:</span>
              </span>
              <div className="text-right">
                <span className="font-bold text-sky-300 text-sm">{data.weightKg} kg</span>
                {data.deltaWeightPrev !== 0 && (
                  <span className={`text-[10px] ml-1.5 font-bold ${data.deltaWeightPrev < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({data.deltaWeightPrev > 0 ? `+${data.deltaWeightPrev}` : data.deltaWeightPrev} kg)
                  </span>
                )}
              </div>
            </div>

            {/* % de Gordura */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span>% de Gordura (BF):</span>
              </span>
              <div className="text-right">
                <span className="font-bold text-emerald-400 text-sm">{data.bodyFatPercentage}%</span>
                {data.deltaBfPrev !== 0 && (
                  <span className={`text-[10px] ml-1.5 font-bold ${data.deltaBfPrev < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({data.deltaBfPrev > 0 ? `+${data.deltaBfPrev}` : data.deltaBfPrev}%)
                  </span>
                )}
              </div>
            </div>

            {/* Massa Muscular / Magra */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                <span>Massa Muscular / Magra:</span>
              </span>
              <div className="text-right">
                <span className="font-bold text-indigo-300 text-sm">{data.leanMassKg} kg</span>
                {data.deltaLeanPrev !== 0 && (
                  <span className={`text-[10px] ml-1.5 font-bold ${data.deltaLeanPrev > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({data.deltaLeanPrev > 0 ? `+${data.deltaLeanPrev}` : data.deltaLeanPrev} kg)
                  </span>
                )}
              </div>
            </div>

            {/* Massa Gorda */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>Massa Gorda:</span>
              </span>
              <span className="font-semibold text-amber-300">{data.fatMassKg} kg</span>
            </div>

            {/* Skeletal Muscle Mass if available */}
            {data.skeletalMuscleMassKg && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Massa Muscular Esquelética (MME):</span>
                <span className="font-semibold text-purple-300">{data.skeletalMuscleMassKg} kg</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-800">
              <span className="text-slate-400">IMC Calculado:</span>
              <span className="font-semibold text-slate-300">{data.bmi}</span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Método: {data.methodLabel}</span>
          </div>

          {data.notes && (
            <p className="text-[10px] italic text-slate-300 bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/40">
              "{data.notes}"
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>Evolução Temporal: Peso, % Gordura & Massa Muscular</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {chartData.length} avaliações
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualização integrada via Recharts para avaliar recomposição corporal e resposta ao plano alimentar.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 self-start lg:self-auto overflow-x-auto max-w-full scrollbar-none">
          <button
            onClick={() => setViewType('triple_progression')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewType === 'triple_progression'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Tríplice (Peso + BF% + Músculo)</span>
          </button>

          <button
            onClick={() => setViewType('muscle_mass')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewType === 'muscle_mass'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Award className="w-3 h-3 text-indigo-500" />
            <span>Massa Muscular (kg)</span>
          </button>

          <button
            onClick={() => setViewType('body_fat')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewType === 'body_fat'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Percent className="w-3 h-3 text-emerald-500" />
            <span>% Gordura (BF)</span>
          </button>

          <button
            onClick={() => setViewType('weight')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewType === 'weight'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Scale className="w-3 h-3 text-sky-500" />
            <span>Peso (kg)</span>
          </button>

          <button
            onClick={() => setViewType('body_composition')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewType === 'body_composition'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3 text-amber-500" />
            <span>Composição (Massa)</span>
          </button>
        </div>
      </div>

      {/* Summary Milestone Cards (Delta from First to Latest Evaluation) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Peso Atual & Delta */}
        <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-100 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px] text-sky-800">PESO ATUAL</span>
            <Scale className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-black text-slate-900">
              {latestRecord ? `${latestRecord.weightKg} kg` : `${patient.weightKg} kg`}
            </span>
            {chartData.length > 1 && (
              <span
                className={`text-[11px] font-bold flex items-center ${
                  weightDiff < 0 ? 'text-emerald-600' : weightDiff > 0 ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {weightDiff < 0 ? (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                ) : weightDiff > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : null}
                {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Início: {firstRecord ? `${firstRecord.weightKg} kg` : '-'}
          </span>
        </div>

        {/* Card 2: % Gordura Corporal & Delta */}
        <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px] text-emerald-800">% GORDURA (BF)</span>
            <Percent className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-black text-emerald-700">
              {latestRecord ? `${latestRecord.bodyFatPercentage}%` : '-'}
            </span>
            {chartData.length > 1 && (
              <span
                className={`text-[11px] font-bold flex items-center ${
                  bfDiff < 0 ? 'text-emerald-600' : bfDiff > 0 ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {bfDiff < 0 ? (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                ) : bfDiff > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : null}
                {bfDiff > 0 ? `+${bfDiff}` : bfDiff}%
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Início: {firstRecord ? `${firstRecord.bodyFatPercentage}%` : '-'}
          </span>
        </div>

        {/* Card 3: Massa Muscular / Magra & Delta */}
        <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px] text-indigo-800">MASSA MUSCULAR / MAGRA</span>
            <Award className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-black text-indigo-950">
              {latestRecord ? `${latestRecord.leanMassKg} kg` : '-'}
            </span>
            {chartData.length > 1 && (
              <span
                className={`text-[11px] font-bold flex items-center ${
                  leanDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {leanDiff > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : leanDiff < 0 ? (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                ) : null}
                {leanDiff > 0 ? `+${leanDiff}` : leanDiff} kg
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Início: {firstRecord ? `${firstRecord.leanMassKg} kg` : '-'}
          </span>
        </div>

        {/* Card 4: Taxa Músculo / Gordura & Massa Gorda */}
        <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px] text-amber-800">MASSA GORDA & RATIO</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-black text-slate-900">
              {latestRecord ? `${latestRecord.fatMassKg} kg` : '-'}
            </span>
            {chartData.length > 1 && (
              <span
                className={`text-[11px] font-bold flex items-center ${
                  fatDiff <= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {fatDiff < 0 ? (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                ) : fatDiff > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : null}
                {fatDiff > 0 ? `+${fatDiff}` : fatDiff} kg
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
            Ratio Músculo/Gordura: <strong>{muscleToFatRatio}x</strong>
          </span>
        </div>
      </div>

      {/* Clinical Recomposition Insight Bar */}
      <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-sky-500/10 rounded-xl border border-emerald-200/60 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-slate-800 font-medium">
            <strong>Diagnóstico de Composição Corporal:</strong> {recompositionInsight}
          </span>
        </div>
      </div>

      {/* Interactive Series Toggles (for Tríplice view) */}
      {viewType === 'triple_progression' && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
          <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Sliders className="w-3 h-3 text-slate-400" />
            Séries no Gráfico:
          </span>

          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={showWeightSeries}
              onChange={(e) => setShowWeightSeries(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <span className="flex items-center gap-1 font-semibold text-sky-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
              Peso Total (kg)
            </span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={showMuscleMassSeries}
              onChange={(e) => setShowMuscleMassSeries(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="flex items-center gap-1 font-semibold text-indigo-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              Massa Muscular / Magra (kg)
            </span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={showBodyFatSeries}
              onChange={(e) => setShowBodyFatSeries(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              % de Gordura (BF %)
            </span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={showFatMassSeries}
              onChange={(e) => setShowFatMassSeries(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span className="flex items-center gap-1 font-semibold text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Massa Gorda (kg)
            </span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900 select-none ml-auto">
            <input
              type="checkbox"
              checked={showReferenceThresholds}
              onChange={(e) => setShowReferenceThresholds(e.target.checked)}
              className="rounded text-slate-600 focus:ring-slate-500 cursor-pointer"
            />
            <span className="font-semibold text-slate-500">
              Linha Meta BF ({idealBfTarget}%)
            </span>
          </label>
        </div>
      )}

      {/* Main Chart Canvas via Recharts */}
      <div className="h-80 w-full pt-1 relative">
        {chartData.length === 1 && (
          <div className="mb-2 p-2 px-3 bg-amber-50 border border-amber-200/80 rounded-lg flex items-center justify-between text-[11px] text-amber-800">
            <span className="flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Atenção:</strong> Apenas 1 registro antropométrico disponível (ponto de partida). O gráfico exibe este marco inicial. Realize uma 2ª avaliação para habilitar o cálculo de taxas de variação, curvas e deltas de composição.
              </span>
            </span>
            {onNavigateToAnthropometry && (
              <button
                onClick={onNavigateToAnthropometry}
                className="ml-2 font-bold underline hover:text-amber-950 shrink-0"
              >
                + Nova Medição
              </button>
            )}
          </div>
        )}

        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Scale className="w-8 h-8 text-slate-400" />
            <p className="text-xs font-semibold text-slate-600">
              Nenhuma avaliação antropométrica registrada para este paciente.
            </p>
            {onNavigateToAnthropometry && (
              <button
                onClick={onNavigateToAnthropometry}
                className="mt-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Cadastrar 1ª Avaliação Antropométrica
              </button>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {/* VIEW 1: TRIPLE PROGRESSION (WEIGHT, BODY FAT %, AND MUSCLE MASS) */}
            {viewType === 'triple_progression' ? (
              <ComposedChart data={chartData} margin={{ top: 12, right: 24, bottom: 10, left: -5 }}>
                <defs>
                  <linearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="muscleAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />

                {/* Left Y-Axis: kg (Weight and Muscle Mass) */}
                <YAxis
                  yAxisId="leftKg"
                  domain={weightDomain}
                  tick={{ fontSize: 11, fill: '#0284c7' }}
                  axisLine={false}
                  tickLine={false}
                  unit="kg"
                />

                {/* Right Y-Axis: % (Body Fat Percentage) */}
                <YAxis
                  yAxisId="rightPercent"
                  orientation="right"
                  domain={bfDomain}
                  tick={{ fontSize: 11, fill: '#10b981' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />

                <Tooltip content={<CustomTooltip />} />

                <Legend
                  verticalAlign="top"
                  height={38}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />

                {showReferenceThresholds && (
                  <ReferenceLine
                    yAxisId="rightPercent"
                    y={idealBfTarget}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Alvo BF (${idealBfTarget}%)`,
                      fill: '#10b981',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                )}

                {/* Weight Series (Area + Line) */}
                {showWeightSeries && (
                  <Area
                    yAxisId="leftKg"
                    type="monotone"
                    dataKey="weightKg"
                    name="Peso Corporal (kg)"
                    stroke="#0284c7"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#weightAreaGradient)"
                    dot={{ r: 4, stroke: '#0284c7', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#0284c7' }}
                  />
                )}

                {/* Muscle Mass Series (Line) */}
                {showMuscleMassSeries && (
                  <Line
                    yAxisId="leftKg"
                    type="monotone"
                    dataKey="leanMassKg"
                    name="Massa Muscular / Magra (kg)"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 5, stroke: '#6366f1', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 7, fill: '#6366f1' }}
                  />
                )}

                {/* Optional Fat Mass Series (Line) */}
                {showFatMassSeries && (
                  <Line
                    yAxisId="leftKg"
                    type="monotone"
                    dataKey="fatMassKg"
                    name="Massa Gorda (kg)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#f59e0b' }}
                  />
                )}

                {/* Body Fat Percentage (Line on secondary Y-Axis) */}
                {showBodyFatSeries && (
                  <Line
                    yAxisId="rightPercent"
                    type="monotone"
                    dataKey="bodyFatPercentage"
                    name="% Gordura Corporal (BF %)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                )}
              </ComposedChart>
            ) : viewType === 'muscle_mass' ? (
              /* VIEW 2: FOCUSED MUSCLE MASS PROGRESSION */
              <AreaChart data={chartData} margin={{ top: 12, right: 24, bottom: 10, left: -5 }}>
                <defs>
                  <linearGradient id="muscleOnlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 11, fill: '#6366f1' }}
                  axisLine={false}
                  tickLine={false}
                  unit="kg"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={38}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="leanMassKg"
                  name="Evolução da Massa Muscular / Magra (kg)"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#muscleOnlyGradient)"
                  dot={{ r: 5, stroke: '#6366f1', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#6366f1' }}
                />
              </AreaChart>
            ) : viewType === 'body_fat' ? (
              /* VIEW 3: BODY FAT PERCENTAGE PROGRESSION */
              <AreaChart data={chartData} margin={{ top: 12, right: 24, bottom: 10, left: -5 }}>
                <defs>
                  <linearGradient id="bfOnlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={bfDomain}
                  tick={{ fontSize: 11, fill: '#10b981' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={38}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <ReferenceLine
                  y={idealBfTarget}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Alvo Ideal (${idealBfTarget}%)`,
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bodyFatPercentage"
                  name="% de Gordura Corporal (BF %)"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#bfOnlyGradient)"
                  dot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#10b981' }}
                />
              </AreaChart>
            ) : viewType === 'weight' ? (
              /* VIEW 4: WEIGHT PROGRESSION ONLY */
              <AreaChart data={chartData} margin={{ top: 12, right: 24, bottom: 10, left: -5 }}>
                <defs>
                  <linearGradient id="weightOnlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 3', 'dataMax + 3']}
                  tick={{ fontSize: 11, fill: '#0284c7' }}
                  axisLine={false}
                  tickLine={false}
                  unit="kg"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={38}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="weightKg"
                  name="Evolução do Peso Corporal (kg)"
                  stroke="#0284c7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#weightOnlyGradient)"
                  dot={{ r: 5, stroke: '#0284c7', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#0284c7' }}
                />
              </AreaChart>
            ) : (
              /* VIEW 5: BODY COMPOSITION SPLIT (LEAN MASS VS FAT MASS) */
              <BarChart data={chartData} margin={{ top: 12, right: 24, bottom: 10, left: -5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  unit="kg"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={38}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar
                  dataKey="leanMassKg"
                  name="Massa Muscular / Magra (kg)"
                  stackId="composition"
                  fill="#6366f1"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="fatMassKg"
                  name="Massa Gorda (kg)"
                  stackId="composition"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* History Milestones Timeline Footer */}
      {chartData.length > 0 && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Histórico de Pesagens & Dobras:</span>
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              {chartData.map((rec) => (
                <span
                  key={rec.id}
                  className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-mono text-slate-700 border border-slate-200 whitespace-nowrap"
                >
                  {rec.consultationNum}ª ({rec.formattedDate}): <strong>{rec.weightKg}kg</strong> | <strong className="text-emerald-700">{rec.bodyFatPercentage}%</strong> | <strong className="text-indigo-700">{rec.leanMassKg}kg Músc</strong>
                </span>
              ))}
            </div>
          </div>

          {onNavigateToAnthropometry && (
            <button
              onClick={onNavigateToAnthropometry}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <span>Lançar Nova Medição</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
