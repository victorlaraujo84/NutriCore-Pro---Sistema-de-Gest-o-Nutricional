import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { AnthropometryRecord, Patient } from '../../types';
import { calculateBMI } from '../../utils/nutritionCalculations';
import {
  Scale,
  Activity,
  TrendingDown,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Info,
  ArrowRight,
  Layers,
  HeartPulse
} from 'lucide-react';

interface PatientWeightBMITrendChartProps {
  patient: Patient;
  records: AnthropometryRecord[];
  onNavigateToAnthropometry?: () => void;
}

type TrendViewMode = 'combined' | 'weight' | 'bmi_zones';

export const PatientWeightBMITrendChart: React.FC<PatientWeightBMITrendChartProps> = ({
  patient,
  records,
  onNavigateToAnthropometry,
}) => {
  const [viewMode, setViewMode] = useState<TrendViewMode>('combined');
  const [showTargetWeight, setShowTargetWeight] = useState<boolean>(true);

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
      return [
        {
          id: `baseline-${patient.id}`,
          patientId: patient.id,
          date: patient.createdAt || new Date().toISOString().split('T')[0],
          consultationNumber: 1,
          assessmentType: 'dobras_pollock',
          weightKg: patient.weightKg,
          heightCm: patient.heightCm,
          skinfolds: {
            subscapular: 15,
            triceps: 15,
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
          sumSkinfolds: 112,
          bodyDensity: 1.055,
          bodyFatPercentage: 18.0,
          fatMassKg: Number(((patient.weightKg * 18.0) / 100).toFixed(1)),
          leanMassKg: Number((patient.weightKg * 0.82).toFixed(1)),
          bmi: initialBmi,
          notes: 'Cadastro inicial do paciente.',
        },
      ];
    }
    return [];
  }, [sortedRecords, patient]);

  // Healthy WHO BMI bounds for this patient's height
  const heightM = (patient.heightCm || 170) / 100;
  const idealWeightMin = Number((18.5 * heightM * heightM).toFixed(1));
  const idealWeightMax = Number((24.9 * heightM * heightM).toFixed(1));
  const idealWeightMid = Number((22.0 * heightM * heightM).toFixed(1));

  // Compute chart points with deltas
  const chartData = useMemo(() => {
    return effectiveRecords.map((rec, index) => {
      const dateParts = rec.date.split('-');
      const formattedDate =
        dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0].slice(2)}` : rec.date;

      const fullDate =
        dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : rec.date;

      const weight = rec.weightKg;
      const height = rec.heightCm || patient.heightCm || 170;
      const computedBmi = rec.bmi || Number((weight / Math.pow(height / 100, 2)).toFixed(1));
      const bmiClassification = calculateBMI(weight, height);

      // Delta from previous consultation
      const prevRec = index > 0 ? effectiveRecords[index - 1] : null;
      const deltaWeightPrev = prevRec ? Number((weight - prevRec.weightKg).toFixed(1)) : 0;
      const deltaBmiPrev = prevRec
        ? Number((computedBmi - (prevRec.bmi || (prevRec.weightKg / Math.pow(height / 100, 2)))).toFixed(1))
        : 0;

      // Delta from first consultation
      const firstRec = effectiveRecords[0];
      const deltaWeightFirst = Number((weight - firstRec.weightKg).toFixed(1));
      const deltaBmiFirst = Number(
        (computedBmi - (firstRec.bmi || (firstRec.weightKg / Math.pow(height / 100, 2)))).toFixed(1)
      );

      return {
        id: rec.id,
        rawDate: rec.date,
        formattedDate,
        fullDate,
        consultationLabel: rec.consultationNumber ? `${rec.consultationNumber}ª Consulta` : `Consulta #${index + 1}`,
        consultationNumber: rec.consultationNumber || index + 1,
        weightKg: weight,
        bmi: computedBmi,
        bmiClassification: bmiClassification.classification,
        bmiColor: bmiClassification.color,
        deltaWeightPrev,
        deltaBmiPrev,
        deltaWeightFirst,
        deltaBmiFirst,
        targetWeight: idealWeightMax,
        idealMid: idealWeightMid,
        assessmentType:
          rec.assessmentType === 'bioimpedancia'
            ? 'Bioimpedância'
            : rec.assessmentType === 'combinado'
            ? 'Combinado'
            : 'Pollock 7 Dobras',
        notes: rec.notes || '',
      };
    });
  }, [effectiveRecords, patient.heightCm, idealWeightMax, idealWeightMid]);

  // Summary Metrics
  const firstPoint = chartData[0];
  const latestPoint = chartData[chartData.length - 1];

  const totalWeightDelta =
    firstPoint && latestPoint ? Number((latestPoint.weightKg - firstPoint.weightKg).toFixed(1)) : 0;

  const totalWeightPercent =
    firstPoint && firstPoint.weightKg > 0
      ? Number(((totalWeightDelta / firstPoint.weightKg) * 100).toFixed(1))
      : 0;

  const totalBmiDelta =
    firstPoint && latestPoint ? Number((latestPoint.bmi - firstPoint.bmi).toFixed(1)) : 0;

  const latestBmiInfo = calculateBMI(
    latestPoint ? latestPoint.weightKg : patient.weightKg,
    patient.heightCm
  );

  // Domains for axes
  const weightDomain = useMemo(() => {
    if (chartData.length === 0) return [40, 100];
    const weights = chartData.map((d) => d.weightKg);
    weights.push(idealWeightMax, idealWeightMin);
    const min = Math.floor(Math.min(...weights) - 3);
    const max = Math.ceil(Math.max(...weights) + 3);
    return [Math.max(30, min), max];
  }, [chartData, idealWeightMax, idealWeightMin]);

  const bmiDomain = useMemo(() => {
    if (chartData.length === 0) return [16, 34];
    const bmis = chartData.map((d) => d.bmi);
    const min = Math.floor(Math.min(18.0, ...bmis) - 2);
    const max = Math.ceil(Math.max(26.0, ...bmis) + 2);
    return [Math.max(14, min), Math.min(45, max)];
  }, [chartData]);

  // Custom Rich Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl border border-slate-700/60 text-xs space-y-2.5 min-w-[240px] pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-extrabold text-slate-100">{data.consultationLabel}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 font-mono font-bold border border-slate-700">
              {data.fullDate}
            </span>
          </div>

          <div className="space-y-1.5">
            {/* Weight Metric */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-sky-400" /> Peso Corporal:
              </span>
              <span className="font-extrabold text-sky-300 text-sm">
                {data.weightKg} kg
              </span>
            </div>

            {/* BMI Metric */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-400" /> IMC:
              </span>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-emerald-300 text-sm">{data.bmi}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  kg/m²
                </span>
              </div>
            </div>

            {/* Classification */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">Classificação OMS:</span>
              <span className="font-bold text-slate-200">{data.bmiClassification}</span>
            </div>

            {/* Consultation Delta */}
            {data.deltaWeightPrev !== 0 && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Variação da última:</span>
                <span
                  className={`font-bold ${
                    data.deltaWeightPrev < 0
                      ? 'text-emerald-400'
                      : data.deltaWeightPrev > 0
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {data.deltaWeightPrev > 0 ? `+${data.deltaWeightPrev}` : data.deltaWeightPrev} kg (
                  {data.deltaBmiPrev > 0 ? `+${data.deltaBmiPrev}` : data.deltaBmiPrev} IMC)
                </span>
              </div>
            )}
          </div>

          {/* Clinical method & observation */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Método: {data.assessmentType}</span>
          </div>

          {data.notes && (
            <p className="text-[10px] italic text-slate-300 bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Trajetória de Peso & Índice de Massa Corporal (IMC)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-100">
                {chartData.length} {chartData.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Visualização longitudinal com estratificação de faixas de normalidade da OMS
            </p>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Peso & IMC (Eixo Duplo)
          </button>

          <button
            onClick={() => setViewMode('weight')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              viewMode === 'weight'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Evolução do Peso
          </button>

          <button
            onClick={() => setViewMode('bmi_zones')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              viewMode === 'bmi_zones'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            IMC & Faixas OMS
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Peso Atual e Delta */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px]">PESO ATUAL</span>
            <Scale className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-black text-slate-900">
              {latestPoint ? `${latestPoint.weightKg} kg` : `${patient.weightKg} kg`}
            </span>
            {chartData.length > 1 && (
              <span
                className={`text-[11px] font-bold flex items-center ${
                  totalWeightDelta < 0
                    ? 'text-emerald-600'
                    : totalWeightDelta > 0
                    ? 'text-amber-600'
                    : 'text-slate-500'
                }`}
              >
                {totalWeightDelta < 0 ? (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                ) : totalWeightDelta > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : null}
                {totalWeightDelta > 0 ? `+${totalWeightDelta}` : totalWeightDelta} kg
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {chartData.length > 1
              ? `Início: ${firstPoint.weightKg} kg (${totalWeightPercent > 0 ? `+${totalWeightPercent}` : totalWeightPercent}%)`
              : 'Linha de base inicial'}
          </span>
        </div>

        {/* Card 2: IMC Atual & Classificação OMS */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px]">IMC ATUAL</span>
            <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-black text-slate-900">
              {latestPoint ? latestPoint.bmi : latestBmiInfo.value}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">kg/m²</span>
            {chartData.length > 1 && (
              <span
                className={`text-[11px] font-bold ml-1 ${
                  totalBmiDelta < 0
                    ? 'text-emerald-600'
                    : totalBmiDelta > 0
                    ? 'text-amber-600'
                    : 'text-slate-500'
                }`}
              >
                {totalBmiDelta > 0 ? `+${totalBmiDelta}` : totalBmiDelta}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-bold block mt-0.5 ${latestBmiInfo.color}`}>
            {latestBmiInfo.classification}
          </span>
        </div>

        {/* Card 3: Faixa de Peso Saudável (Eutrofia 18.5 - 24.9) */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px]">FAIXA EUTRÓFICA (OMS)</span>
            <Target className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-sm font-black text-slate-900">
              {idealWeightMin} - {idealWeightMax} kg
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            IMC 22.0 (Mediana): {idealWeightMid} kg
          </span>
        </div>

        {/* Card 4: Distância / Status da Meta */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-[11px]">STATUS METABÓLICO</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          {latestPoint && latestPoint.bmi > 24.9 ? (
            <div>
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                <span>+{(latestPoint.weightKg - idealWeightMax).toFixed(1)} kg p/ Eutrofia</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Meta teto: ≤ {idealWeightMax} kg
              </span>
            </div>
          ) : latestPoint && latestPoint.bmi < 18.5 ? (
            <div>
              <span className="text-xs font-bold text-amber-700">
                -{(idealWeightMin - latestPoint.weightKg).toFixed(1)} kg p/ Eutrofia
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Meta piso: ≥ {idealWeightMin} kg
              </span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Peso em faixa adequada</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Manutenção e composição corporal
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="h-72 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Scale className="w-8 h-8 text-slate-400" />
            <p className="text-xs font-semibold text-slate-600">
              Nenhuma avaliação cadastrada para traçar a evolução temporal.
            </p>
            {onNavigateToAnthropometry && (
              <button
                onClick={onNavigateToAnthropometry}
                className="mt-1 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Cadastrar 1ª Avaliação Antropométrica
              </button>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {/* VIEW MODE 1: DUAL AXIS COMBINED (WEIGHT ON LEFT + BMI ON RIGHT) */}
            {viewMode === 'combined' ? (
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 25, bottom: 10, left: -10 }}
              >
                <defs>
                  <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
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
                {/* Left YAxis: Weight */}
                <YAxis
                  yAxisId="weight"
                  domain={weightDomain}
                  tick={{ fontSize: 11, fill: '#0284c7' }}
                  axisLine={false}
                  tickLine={false}
                  unit="kg"
                />
                {/* Right YAxis: BMI */}
                <YAxis
                  yAxisId="bmi"
                  orientation="right"
                  domain={bmiDomain}
                  tick={{ fontSize: 11, fill: '#10b981' }}
                  axisLine={false}
                  tickLine={false}
                  unit=""
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={34}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                {/* Reference Line for Healthy BMI Upper Threshold (24.9) */}
                <ReferenceLine
                  yAxisId="bmi"
                  y={24.9}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Limite Eutrofia (IMC 24.9)',
                    position: 'insideTopRight',
                    fill: '#059669',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                {/* Weight Area & Curve */}
                <Area
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weightKg"
                  name="Peso Corporal (kg)"
                  stroke="#0284c7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#weightAreaGrad)"
                  dot={{ r: 4, stroke: '#0284c7', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#0284c7' }}
                />
                {/* BMI Line */}
                <Line
                  yAxisId="bmi"
                  type="monotone"
                  dataKey="bmi"
                  name="IMC (kg/m²)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#10b981' }}
                />
              </ComposedChart>
            ) : viewMode === 'weight' ? (
              /* VIEW MODE 2: WEIGHT PROGRESSION ONLY */
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 20, bottom: 10, left: -10 }}
              >
                <defs>
                  <linearGradient id="weightPureGrad" x1="0" y1="0" x2="0" y2="1">
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
                  domain={weightDomain}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  unit="kg"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={34}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                {/* Upper normal weight limit */}
                <ReferenceLine
                  y={idealWeightMax}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Teto Eutrófico (${idealWeightMax} kg)`,
                    position: 'insideTopLeft',
                    fill: '#059669',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                {/* Weight Curve */}
                <Area
                  type="monotone"
                  dataKey="weightKg"
                  name="Peso do Paciente (kg)"
                  stroke="#0284c7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#weightPureGrad)"
                  dot={{ r: 5, stroke: '#0284c7', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 7, fill: '#0284c7' }}
                />
              </AreaChart>
            ) : (
              /* VIEW MODE 3: BMI TRAJECTORY WITH WHO CLASSIFICATION ZONES */
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, bottom: 10, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={bmiDomain}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  unit=""
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={34}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                {/* WHO Reference Lines */}
                <ReferenceLine
                  y={18.5}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Limite Abaixo do Peso (18.5)',
                    position: 'insideBottomLeft',
                    fill: '#b45309',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={24.9}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: 'Teto da Eutrofia (24.9)',
                    position: 'insideTopLeft',
                    fill: '#047857',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <ReferenceLine
                  y={29.9}
                  stroke="#ea580c"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Limite Sobrepeso (29.9)',
                    position: 'insideTopLeft',
                    fill: '#c2410c',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={34.9}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Obesidade Grau I (≥ 30.0)',
                    position: 'insideTopLeft',
                    fill: '#be123c',
                    fontSize: 10,
                  }}
                />
                {/* Patient BMI Line */}
                <Line
                  type="monotone"
                  dataKey="bmi"
                  name="Trajetória do IMC (kg/m²)"
                  stroke="#0f172a"
                  strokeWidth={3.5}
                  dot={{ r: 6, stroke: '#0f172a', strokeWidth: 2, fill: '#10b981' }}
                  activeDot={{ r: 8, fill: '#0f172a' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Timeline Footnote & Quick Access Table */}
      {chartData.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700">Histórico de Pesagens:</span>
              <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-0.5">
                {chartData.map((pt) => (
                  <span
                    key={pt.id}
                    className="px-2 py-0.5 bg-slate-50 rounded-md text-[11px] font-mono text-slate-700 border border-slate-200 whitespace-nowrap"
                  >
                    <strong>{pt.formattedDate}:</strong> {pt.weightKg}kg • IMC {pt.bmi}
                  </span>
                ))}
              </div>
            </div>

            {onNavigateToAnthropometry && (
              <button
                onClick={onNavigateToAnthropometry}
                className="inline-flex items-center space-x-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>Registrar Nova Pesagem ou Dobras</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
