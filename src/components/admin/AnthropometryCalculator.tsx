import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import {
  calculatePollock7,
  calculateBMI,
  getBodyFatClassification
} from '../../utils/nutritionCalculations';
import { SkinfoldMeasurements, CircumferenceMeasurements, BioimpedanceData } from '../../types';
import {
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Activity,
  CheckCircle2,
  Calendar,
  Scale,
  Sparkles,
  Info,
  FileUp,
  Layers,
  ChevronRight,
  Droplets,
  Flame,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { BioimpedanceImportModal } from '../common/BioimpedanceImportModal';
import { NutritionCoachModal } from './NutritionCoachModal';

export const AnthropometryCalculator: React.FC = () => {
  const {
    selectedPatientForDetail,
    activePatient,
    patientAnthropometry,
    addAnthropometryRecord,
    deleteAnthropometryRecord,
  } = useNutrition();

  const patient = selectedPatientForDetail || activePatient;

  const [activeTab, setActiveTab] = useState<'pollock' | 'bioimpedance' | 'history'>('pollock');
  const [isBioModalOpen, setIsBioModalOpen] = useState<boolean>(false);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState<boolean>(false);

  const [weightKg, setWeightKg] = useState<number>(patient?.weightKg || 70);
  const [heightCm, setHeightCm] = useState<number>(patient?.heightCm || 170);
  const [evaluationDate, setEvaluationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [consultationNumber, setConsultationNumber] = useState<number>(
    patientAnthropometry.length + 1
  );

  // 7 skinfolds (mm)
  const [skinfolds, setSkinfolds] = useState<SkinfoldMeasurements>({
    subscapular: 12,
    triceps: 10,
    pectoral: 8,
    midaxillary: 11,
    suprailiac: 14,
    abdominal: 16,
    thigh: 14,
  });

  // Circumferences (cm)
  const [circumferences, setCircumferences] = useState<CircumferenceMeasurements>({
    neck: 38,
    chest: 100,
    waist: 80,
    abdomen: 84,
    hip: 98,
    rightArmRelaxed: 34,
    rightArmContracted: 37,
    rightThigh: 56,
    rightCalf: 37,
  });

  // Direct bioimpedance inputs (when using the bioimpedance tab)
  const [bioimpedanceInput, setBioimpedanceInput] = useState<{
    bodyFatPercent: number;
    skeletalMuscleMassKg: number;
    leanMassKg: number;
    fatMassKg: number;
    bodyWaterLiters: number;
    visceralFatLevel: number;
    basalMetabolicRateKcal: number;
    inbodyScore: number;
  }>({
    bodyFatPercent: 18.5,
    skeletalMuscleMassKg: 33.5,
    leanMassKg: 58.0,
    fatMassKg: 13.2,
    bodyWaterLiters: 42.5,
    visceralFatLevel: 4,
    basalMetabolicRateKcal: 1680,
    inbodyScore: 80,
  });

  const [notes, setNotes] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-500">
        Nenhum paciente selecionado para avaliação antropométrica.
      </div>
    );
  }

  // Live calculation based on current Pollock form inputs
  const livePollock = calculatePollock7(
    skinfolds,
    patient.age,
    patient.gender,
    weightKg
  );

  const liveBMI = calculateBMI(weightKg, heightCm);
  const bfClass = getBodyFatClassification(
    activeTab === 'bioimpedance' ? bioimpedanceInput.bodyFatPercent : livePollock.bodyFatPercentage,
    patient.gender
  );

  const handleSkinfoldChange = (field: keyof SkinfoldMeasurements, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setSkinfolds((prev) => ({ ...prev, [field]: num }));
  };

  const handleCircumferenceChange = (field: keyof CircumferenceMeasurements, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setCircumferences((prev) => ({ ...prev, [field]: num }));
  };

  const handleSavePollockRecord = (e: React.FormEvent) => {
    e.preventDefault();
    addAnthropometryRecord({
      patientId: patient.id,
      date: evaluationDate,
      consultationNumber: consultationNumber,
      assessmentType: 'dobras_pollock',
      weightKg,
      heightCm,
      skinfolds,
      circumferences,
      sumSkinfolds: livePollock.sumSkinfolds,
      bodyDensity: livePollock.bodyDensity,
      bodyFatPercentage: livePollock.bodyFatPercentage,
      fatMassKg: livePollock.fatMassKg,
      leanMassKg: livePollock.leanMassKg,
      bmi: liveBMI.value,
      notes: notes || `${consultationNumber}ª Consulta - Avaliação por Dobras Cutâneas (Pollock 7)`,
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
    setNotes('');
    setConsultationNumber((prev) => prev + 1);
  };

  const handleSaveBioimpedanceDirect = (e: React.FormEvent) => {
    e.preventDefault();
    const fatKg = Number(((weightKg * bioimpedanceInput.bodyFatPercent) / 100).toFixed(1));
    const leanKg = Number((weightKg - fatKg).toFixed(1));

    const bioData: BioimpedanceData = {
      method: 'inbody',
      bodyWaterLiters: bioimpedanceInput.bodyWaterLiters,
      dryLeanMassKg: leanKg,
      visceralFatLevel: bioimpedanceInput.visceralFatLevel,
      basalMetabolicRateKcal: bioimpedanceInput.basalMetabolicRateKcal,
      skeletalMuscleMassKg: bioimpedanceInput.skeletalMuscleMassKg,
      inbodyScore: bioimpedanceInput.inbodyScore,
    };

    addAnthropometryRecord({
      patientId: patient.id,
      date: evaluationDate,
      consultationNumber: consultationNumber,
      assessmentType: 'bioimpedancia',
      weightKg,
      heightCm,
      skinfolds: { subscapular: 0, triceps: 0, pectoral: 0, midaxillary: 0, suprailiac: 0, abdominal: 0, thigh: 0 },
      circumferences,
      sumSkinfolds: 0,
      bodyDensity: 0,
      bodyFatPercentage: bioimpedanceInput.bodyFatPercent,
      fatMassKg: fatKg,
      leanMassKg: leanKg,
      bmi: liveBMI.value,
      bioimpedance: bioData,
      notes: notes || `${consultationNumber}ª Consulta - Avaliação por Bioimpedância`,
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
    setNotes('');
    setConsultationNumber((prev) => prev + 1);
  };

  const handleApplyImportedBioData = (imported: {
    date: string;
    weightKg: number;
    heightCm: number;
    bodyFatPercentage: number;
    leanMassKg: number;
    fatMassKg: number;
    bmi: number;
    bioimpedance: BioimpedanceData;
    notes: string;
  }) => {
    addAnthropometryRecord({
      patientId: patient.id,
      date: imported.date,
      consultationNumber: consultationNumber,
      assessmentType: 'bioimpedancia',
      weightKg: imported.weightKg,
      heightCm: imported.heightCm,
      skinfolds: { subscapular: 0, triceps: 0, pectoral: 0, midaxillary: 0, suprailiac: 0, abdominal: 0, thigh: 0 },
      circumferences,
      sumSkinfolds: 0,
      bodyDensity: 0,
      bodyFatPercentage: imported.bodyFatPercentage,
      fatMassKg: imported.fatMassKg,
      leanMassKg: imported.leanMassKg,
      bmi: imported.bmi,
      bioimpedance: imported.bioimpedance,
      notes: imported.notes,
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
    setConsultationNumber((prev) => prev + 1);
  };

  // Evolution data formatted for Recharts
  const chartData = patientAnthropometry.map((rec, index) => {
    const formattedDate = rec.date && typeof rec.date === 'string' && rec.date.includes('-')
      ? rec.date.split('-').slice(1).join('/')
      : (rec.date || `${index + 1}`);
    return {
      label: `${index + 1}ª Cons (${formattedDate})`,
      date: rec.date,
      peso: rec.weightKg,
      gorduraPerc: rec.bodyFatPercentage,
      massaMagra: rec.leanMassKg,
      massaGorda: rec.fatMassKg,
      mme: rec.bioimpedance?.skeletalMuscleMassKg,
      somaDobras: rec.sumSkinfolds > 0 ? rec.sumSkinfolds : undefined,
      cintura: rec.circumferences?.waist,
      abdomen: rec.circumferences?.abdomen,
      metodo: rec.assessmentType === 'bioimpedancia' ? 'Bioimpedância' : 'Pollock 7D',
    };
  });

  const firstRec = patientAnthropometry[0];
  const lastRec = patientAnthropometry[patientAnthropometry.length - 1];
  const weightDiff = lastRec && firstRec && patientAnthropometry.length > 1
    ? Number((lastRec.weightKg - firstRec.weightKg).toFixed(1))
    : 0;
  const bfDiff = lastRec && firstRec && patientAnthropometry.length > 1
    ? Number((lastRec.bodyFatPercentage - firstRec.bodyFatPercentage).toFixed(1))
    : 0;
  const leanDiff = lastRec && firstRec && patientAnthropometry.length > 1
    ? Number((lastRec.leanMassKg - firstRec.leanMassKg).toFixed(1))
    : 0;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-emerald-500/50 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">
            Avaliação antropométrica registrada com sucesso no prontuário!
          </span>
        </div>
      )}

      {/* Top Banner: Protocol Info & Bioimpedance Import Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <Activity className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Avaliação Antropométrica & Bioimpedância
            </h2>
            <p className="text-xs text-slate-500">
              Registro longitudinal por consulta (Pollock 7 dobras, perímetros e importação de laudos InBody/Tanita)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCoachModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            title="Ajustar plano com IA orientada por dados antropométricos"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Nutrition Coach Pro</span>
          </button>

          <button
            onClick={() => setIsBioModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <FileUp className="w-4 h-4 text-emerald-400" />
            <span>Importar Laudo de Bioimpedância (PDF/TXT)</span>
          </button>
        </div>
      </div>

      {/* Live Calculation Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider block">
            % Gordura (BF)
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold mt-1 block">
            {activeTab === 'bioimpedance' ? bioimpedanceInput.bodyFatPercent : livePollock.bodyFatPercentage}%
          </span>
          <span className="text-[11px] text-emerald-100 font-medium mt-1 block truncate">
            {bfClass.label}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Massa Magra
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {activeTab === 'bioimpedance'
              ? Number((weightKg - (weightKg * bioimpedanceInput.bodyFatPercent) / 100).toFixed(1))
              : livePollock.leanMassKg}{' '}
            kg
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">
            {Number(
              (
                ((activeTab === 'bioimpedance'
                  ? weightKg - (weightKg * bioimpedanceInput.bodyFatPercent) / 100
                  : livePollock.leanMassKg) /
                  (weightKg || 1)) *
                100
              ).toFixed(1)
            )}
            % do total
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Massa Gorda
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {activeTab === 'bioimpedance'
              ? Number(((weightKg * bioimpedanceInput.bodyFatPercent) / 100).toFixed(1))
              : livePollock.fatMassKg}{' '}
            kg
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Gordura absoluta</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Consulta Atual
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {consultationNumber}ª Consulta
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Acompanhamento</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {activeTab === 'bioimpedance' ? 'Água Corporal' : 'Densidade (DC)'}
          </span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            {activeTab === 'bioimpedance'
              ? `${bioimpedanceInput.bodyWaterLiters} L`
              : `${livePollock.bodyDensity.toFixed(4)} g/cm³`}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {activeTab === 'bioimpedance' ? 'Hidratação tecidual' : 'Jackson & Pollock'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            IMC
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{liveBMI.value}</span>
          <span className={`text-[11px] font-semibold truncate block ${liveBMI.color}`}>
            {liveBMI.classification}
          </span>
        </div>
      </div>

      {/* Mode Tabs: Pollock 7 Dobras vs Bioimpedância Direta */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pollock')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'pollock'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Protocolo Pollock (7 Dobras Cutâneas)</span>
        </button>

        <button
          onClick={() => setActiveTab('bioimpedance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'bioimpedance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Lançamento Direto de Bioimpedância (InBody / Tanita)</span>
        </button>
      </div>

      {/* Main Grid: Form Inputs vs Evolution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Input Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>
                {activeTab === 'pollock'
                  ? `Avaliação Antropométrica (${consultationNumber}ª Consulta)`
                  : `Dados da Bioimpedância (${consultationNumber}ª Consulta)`}
              </span>
            </h3>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-lg">
              {activeTab === 'pollock' ? 'Pollock 7D' : 'InBody / Balança'}
            </span>
          </div>

          {activeTab === 'pollock' ? (
            <form onSubmit={handleSavePollockRecord} className="space-y-4">
              {/* Consultation Number, Date, Weight & Height */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                    Consulta Nº
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={consultationNumber}
                    onChange={(e) => setConsultationNumber(parseInt(e.target.value) || 1)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                    Peso Atual (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50"
                    required
                  />
                </div>
              </div>

              {/* 7 Skinfolds Grid */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    7 Dobras Cutâneas (milímetros - mm)
                  </span>
                  <span className="text-[10px] text-slate-500">Adipômetro Clínico</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-600 block">Subescapular</label>
                    <input
                      type="number"
                      step="0.5"
                      value={skinfolds.subscapular}
                      onChange={(e) => handleSkinfoldChange('subscapular', e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block">Tríceps</label>
                    <input
                      type="number"
                      step="0.5"
                      value={skinfolds.triceps}
                      onChange={(e) => handleSkinfoldChange('triceps', e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block">Peitoral</label>
                    <input
                      type="number"
                      step="0.5"
                      value={skinfolds.pectoral}
                      onChange={(e) => handleSkinfoldChange('pectoral', e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block">Axilar Média</label>
                    <input
                      type="number"
                      step="0.5"
                      value={skinfolds.midaxillary}
                      onChange={(e) => handleSkinfoldChange('midaxillary', e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block">Supra-ilíaca</label>
                    <input
                      type="number"
                      step="0.5"
                      value={skinfolds.suprailiac}
                      onChange={(e) => handleSkinfoldChange('suprailiac', e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block">Abdominal</label>
                    <input
                      type="number"
                      step="0.5"
                      value={skinfolds.abdominal}
                      onChange={(e) => handleSkinfoldChange('abdominal', e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block">Coxa Medial</label>
                    <input
                      type="number"
                      step="0.5"
                      value={skinfolds.thigh}
                      onChange={(e) => handleSkinfoldChange('thigh', e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Circumferences Grid */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Perímetros & Circunferências (cm)
                  </span>
                  <span className="text-[10px] text-slate-500">Fita Antropométrica</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Cintura</label>
                    <input
                      type="number"
                      step="0.5"
                      value={circumferences.waist}
                      onChange={(e) => handleCircumferenceChange('waist', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block">Abdômen</label>
                    <input
                      type="number"
                      step="0.5"
                      value={circumferences.abdomen}
                      onChange={(e) => handleCircumferenceChange('abdomen', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block">Quadril</label>
                    <input
                      type="number"
                      step="0.5"
                      value={circumferences.hip}
                      onChange={(e) => handleCircumferenceChange('hip', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block">Braço Cont.</label>
                    <input
                      type="number"
                      step="0.5"
                      value={circumferences.rightArmContracted}
                      onChange={(e) => handleCircumferenceChange('rightArmContracted', e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Observações Clínicas da Consulta
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Excelente perda de gordura nos flancos e melhora na postura..."
                  rows={2}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                id="save-anthropometry-btn"
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Avaliação da {consultationNumber}ª Consulta</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSaveBioimpedanceDirect} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                    Consulta Nº
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={consultationNumber}
                    onChange={(e) => setConsultationNumber(parseInt(e.target.value) || 1)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50"
                    required
                  />
                </div>
              </div>

              {/* Bioimpedance Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-800 block mb-1">
                    % Gordura Corporal (PGC)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bioimpedanceInput.bodyFatPercent}
                    onChange={(e) => setBioimpedanceInput({ ...bioimpedanceInput, bodyFatPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-emerald-300 bg-emerald-50/40 rounded-xl font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-blue-800 block mb-1">
                    Massa Muscular Esquelética (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bioimpedanceInput.skeletalMuscleMassKg}
                    onChange={(e) => setBioimpedanceInput({ ...bioimpedanceInput, skeletalMuscleMassKg: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-blue-200 bg-blue-50/40 rounded-xl font-bold text-blue-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Água Corporal Total (L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bioimpedanceInput.bodyWaterLiters}
                    onChange={(e) => setBioimpedanceInput({ ...bioimpedanceInput, bodyWaterLiters: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Gordura Visceral (Nível)
                  </label>
                  <input
                    type="number"
                    value={bioimpedanceInput.visceralFatLevel}
                    onChange={(e) => setBioimpedanceInput({ ...bioimpedanceInput, visceralFatLevel: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    TMB Aparelho (kcal)
                  </label>
                  <input
                    type="number"
                    value={bioimpedanceInput.basalMetabolicRateKcal}
                    onChange={(e) => setBioimpedanceInput({ ...bioimpedanceInput, basalMetabolicRateKcal: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Score InBody (1-100)
                  </label>
                  <input
                    type="number"
                    value={bioimpedanceInput.inbodyScore}
                    onChange={(e) => setBioimpedanceInput({ ...bioimpedanceInput, inbodyScore: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Observações da Consulta
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Bioimpedância realizada em jejum de 4h..."
                  rows={2}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Bioimpedância da {consultationNumber}ª Consulta</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column (7 cols): Evolution Charts and Historic Records */}
        <div className="lg:col-span-7 space-y-6">
          {/* Evolution Summary Pill Stats */}
          {patientAnthropometry.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Evolução entre Consultas (1ª Consulta em {firstRec?.date})</span>
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-500 block font-semibold">Variação de Peso</span>
                  <span
                    className={`text-base font-bold flex items-center justify-center ${
                      weightDiff < 0 ? 'text-emerald-600' : 'text-slate-800'
                    }`}
                  >
                    {weightDiff < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
                    {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-500 block font-semibold">Variação de % Gordura</span>
                  <span
                    className={`text-base font-bold flex items-center justify-center ${
                      bfDiff < 0 ? 'text-emerald-600' : 'text-slate-800'
                    }`}
                  >
                    {bfDiff < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
                    {bfDiff > 0 ? `+${bfDiff}` : bfDiff}% BF
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-500 block font-semibold">Massa Magra</span>
                  <span
                    className={`text-base font-bold flex items-center justify-center ${
                      leanDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {leanDiff > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : null}
                    {leanDiff > 0 ? `+${leanDiff}` : leanDiff} kg
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Chart 1: Weight & % Body Fat by Consultation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Evolução por Consulta: Peso (kg) e % de Gordura
                </h3>
                <p className="text-xs text-slate-500">Histórico sequencial das consultas e retornos</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="peso"
                      name="Peso Total (kg)"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="gorduraPerc"
                      name="% Gordura Corporal"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Nenhuma avaliação registrada ainda.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Body Composition (Lean vs Fat Mass) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Composição Corporal por Consulta: Massa Magra vs Massa Gorda (kg)
                </h3>
                <p className="text-xs text-slate-500">Distribuição absoluta de tecidos</p>
              </div>
            </div>

            <div className="h-56 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="massaMagra" name="Massa Magra (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="massaGorda" name="Massa Gorda (kg)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Nenhuma avaliação registrada.
                </div>
              )}
            </div>
          </div>

          {/* Historic Evaluations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Histórico de Avaliações Registradas por Consulta ({patientAnthropometry.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-2">Consulta</th>
                    <th className="py-2.5 px-2">Data</th>
                    <th className="py-2.5 px-2">Método</th>
                    <th className="py-2.5 px-2">Peso</th>
                    <th className="py-2.5 px-2">% BF</th>
                    <th className="py-2.5 px-2">Massa Magra</th>
                    <th className="py-2.5 px-2">Cintura</th>
                    <th className="py-2.5 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patientAnthropometry.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-2 font-bold text-slate-900">
                        {rec.consultationNumber ? `${rec.consultationNumber}ª Consulta` : `${idx + 1}ª Consulta`}
                      </td>
                      <td className="py-2.5 px-2 font-medium text-slate-600">{rec.date}</td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            rec.assessmentType === 'bioimpedancia'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rec.assessmentType === 'bioimpedancia' ? 'Bioimpedância' : 'Pollock 7D'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-bold text-slate-800">{rec.weightKg} kg</td>
                      <td className="py-2.5 px-2 font-bold text-emerald-600">{rec.bodyFatPercentage}%</td>
                      <td className="py-2.5 px-2 text-slate-700">{rec.leanMassKg} kg</td>
                      <td className="py-2.5 px-2 text-slate-600">
                        {rec.circumferences?.waist ? `${rec.circumferences.waist} cm` : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm('Deseja excluir este registro de avaliação?')) {
                              deleteAnthropometryRecord(rec.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Excluir avaliação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bioimpedance PDF/Text Importer Modal */}
      <BioimpedanceImportModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onApplyData={handleApplyImportedBioData}
      />

      {/* AI Nutrition Coach Pro Modal */}
      <NutritionCoachModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
      />
    </div>
  );
};
