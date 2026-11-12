import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import {
  calculateBMR,
  calculateTDEE,
  calculateBMI,
  getBodyFatClassification
} from '../../utils/nutritionCalculations';
import { AnthropometryCalculator } from './AnthropometryCalculator';
import { DietPlanner } from './DietPlanner';
import { ShoppingListView } from './ShoppingListView';
import { AnamnesisForm } from './AnamnesisForm';
import { LabExamsView } from './LabExamsView';
import { PrescriptionsView } from './PrescriptionsView';
import { PatientEvolutionCharts } from './PatientEvolutionCharts';
import { PatientWeightBMITrendChart } from './PatientWeightBMITrendChart';
import { PatientEvolutionPhotosView } from './PatientEvolutionPhotosView';
import { GoogleMeetModal } from '../common/GoogleMeetModal';
import { NutritionCoachModal } from './NutritionCoachModal';
import {
  User,
  Activity,
  Camera,
  Utensils,
  ShoppingCart,
  ClipboardList,
  Calendar,
  Smartphone,
  FileText,
  TrendingUp,
  Droplets,
  Flame,
  Scale,
  CheckCircle2,
  ChevronLeft,
  FileCheck,
  Video,
  MessageSquare,
  Sparkles,
  Bot,
  DollarSign,
  Edit3,
  UserCheck,
  Printer,
  Download,
  Award,
  Plus,
  Clock,
  Target,
  X
} from 'lucide-react';
import { generatePatientPlanPDF, printPatientPlanSummary } from '../../utils/planPdfGenerator';

interface PatientDetailProps {
  onBackToList: () => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ onBackToList }) => {
  const {
    selectedPatientForDetail,
    activePatientTab,
    setActivePatientTab,
    setCurrentView,
    setActivePatientId,
    setExportPlanModalOpen,
    patientAnthropometry,
    adherenceRecords,
    activeDietPlan,
    openPaymentModal,
    patientPayments,
    openEditPatientModal,
    clinicConfig,
    patientProgramEnrollments,
    registerProgramSession,
    enrollPatientInProgram,
    updatePatientEnrollment,
    programTemplates,
    openReportModal
  } = useNutrition();

  const [isMeetModalOpen, setIsMeetModalOpen] = useState(false);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [overviewChartMode, setOverviewChartMode] = useState<'weight_bmi' | 'body_fat'>('weight_bmi');

  // Program session modal state
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionDateInput, setSessionDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNotesInput, setSessionNotesInput] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(programTemplates[0]?.id || '');
  const [enrollTitle, setEnrollTitle] = useState(programTemplates[0]?.title || 'Programa Emagrecimento Consciente');
  const [enrollDurationMonths, setEnrollDurationMonths] = useState(programTemplates[0]?.durationMonths || 3);
  const [enrollTotalConsultations, setEnrollTotalConsultations] = useState(programTemplates[0]?.totalConsultations || 6);
  const [enrollTotalValue, setEnrollTotalValue] = useState(programTemplates[0]?.suggestedPrice || 1200);
  const [enrollPaymentMethod, setEnrollPaymentMethod] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia' | 'parcelado_interno'>('pix');
  const [enrollPaymentStatus, setEnrollPaymentStatus] = useState<'pago' | 'pendente' | 'parcial' | 'cortesia'>('pago');

  const patient = selectedPatientForDetail;

  if (!patient) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-sm text-slate-500">Nenhum paciente selecionado.</p>
        <button
          onClick={onBackToList}
          className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Voltar para Lista de Pacientes
        </button>
      </div>
    );
  }

  // TMB & VET calculations
  const bmr = calculateBMR(
    patient.weightKg,
    patient.heightCm,
    patient.age,
    patient.gender,
    patient.bmrFormula
  );
  const tdee = calculateTDEE(bmr, patient.activityLevel);
  const bmi = calculateBMI(patient.weightKg, patient.heightCm);

  // Latest Anthropometry record
  const latestAnthro = patientAnthropometry[patientAnthropometry.length - 1];

  // Adherence records for this patient
  const patientAdherences = adherenceRecords.filter((a) => a.patientId === patient.id);

  const handleOpenMobileApp = () => {
    setActivePatientId(patient.id);
    setCurrentView('patient');
  };

  // Active Continuous Care Program for this patient
  const activeEnrollment = patientProgramEnrollments.find(
    (e) => e.patientId === patient.id && e.status === 'ativo'
  );
  const allPatientEnrollments = patientProgramEnrollments.filter(
    (e) => e.patientId === patient.id
  );

  return (
    <div className="space-y-6">
      {/* Back Button & Top Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onBackToList}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar para Lista de Pacientes</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Edit Patient Info Button */}
            <button
              onClick={() => openEditPatientModal(patient)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
              title="Editar dados cadastrais, peso, altura e metas"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>Editar Cadastro</span>
            </button>

            {/* AI Nutrition Coach Pro */}
            <button
              onClick={() => setIsCoachModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs transition-all cursor-pointer"
              title="Ajustar plano com base na antropometria usando AI Coach"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Nutrition Coach</span>
            </button>

            {/* Internal Financial Registration Button */}
            <button
              onClick={() =>
                openPaymentModal({
                  patientId: patient.id,
                  patientName: patient.name,
                  amount: activeEnrollment ? 0 : 250,
                  title: activeEnrollment
                    ? `Atendimento: ${activeEnrollment.title}`
                    : 'Consulta Nutricional Clínica',
                  description: activeEnrollment
                    ? `Consulta coberta pelo programa de acompanhamento (${activeEnrollment.completedConsultations + 1}/${activeEnrollment.totalConsultations})`
                    : 'Registro de valor de consulta para controle financeiro interno.',
                })
              }
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Informar valor da consulta ou programa para controle interno"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Lançamento Financeiro</span>
            </button>

            {/* Google Meet & Chat Consultation Room */}
            <button
              onClick={() => setIsMeetModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
              title="Iniciar Teleconsulta via Google Meet & Chat"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Teleconsulta Meet</span>
            </button>

            <button
              onClick={handleOpenMobileApp}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Ver no App</span>
            </button>

            {/* Printable PDF Summary & Quick Print */}
            <button
              onClick={() =>
                printPatientPlanSummary(patient, activeDietPlan, {
                  clinicConfig,
                  anthroRecord: latestAnthro,
                })
              }
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
              title="Imprimir resumo do plano alimentar com metas calóricas e macros"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Imprimir Resumo</span>
            </button>

            <button
              onClick={() =>
                generatePatientPlanPDF(patient, activeDietPlan, {
                  clinicConfig,
                  anthroRecord: latestAnthro,
                  action: 'download',
                })
              }
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
              title="Baixar resumo do plano alimentar em PDF com macros e metas"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Resumo</span>
            </button>

            <button
              onClick={() => setExportPlanModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Personalizar e exportar relatório completo em PDF"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Relatório Completo</span>
            </button>
          </div>
        </div>

        {/* Patient Hero Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="flex items-center space-x-4">
            <img
              src={patient.avatarUrl}
              alt={patient.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/30 shadow-xs"
            />
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{patient.name}</h1>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                    patient.goal === 'emagrecimento'
                      ? 'bg-amber-100 text-amber-800'
                      : patient.goal === 'hipertrofia'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {patient.goal === 'emagrecimento'
                    ? '🎯 Emagrecimento'
                    : patient.goal === 'hipertrofia'
                    ? '💪 Hipertrofia'
                    : '🌿 Saúde & Manutenção'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                <span>{patient.gender} • {patient.age} anos</span>
                <span>•</span>
                <span>{patient.email}</span>
                <span>•</span>
                <span>{patient.phone}</span>
              </div>

              {/* Active Program Badge */}
              {activeEnrollment && (
                <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-xl text-xs">
                  <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-bold text-amber-950">{activeEnrollment.title}</span>
                  <span className="text-amber-800 font-semibold">• {activeEnrollment.completedConsultations}/{activeEnrollment.totalConsultations} consultas</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                    {Math.round((activeEnrollment.completedConsultations / activeEnrollment.totalConsultations) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Tag Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs">
            <div className="px-2 py-1">
              <span className="text-[10px] text-slate-400 block font-semibold">PESO & ALTURA</span>
              <span className="font-bold text-slate-800">{patient.weightKg} kg / {patient.heightCm} cm</span>
            </div>
            <div className="px-2 py-1 border-l border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">IMC ATUAL</span>
              <span className={`font-bold ${bmi.color}`}>{bmi.value} ({bmi.classification.split(' ')[0]})</span>
            </div>
            <div className="px-2 py-1 border-l border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">GASTO TOTAL (VET)</span>
              <span className="font-bold text-slate-900">{tdee} kcal</span>
            </div>
            <div className="px-2 py-1 border-l border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">META CALÓRICA</span>
              <span className="font-bold text-emerald-700">{patient.targetCalories} kcal</span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center space-x-2 border-t border-slate-100 pt-3 overflow-x-auto text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setActivePatientTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setActivePatientTab('programs')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'programs'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Programas de Acompanhamento {activeEnrollment ? '(Ativo)' : ''}</span>
          </button>

          <button
            onClick={() => setActivePatientTab('weight_trends')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'weight_trends'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span>Tendência Peso & IMC</span>
          </button>

          <button
            onClick={() => setActivePatientTab('body_evolution')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'body_evolution'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Evolução: Peso, Gordura & Músculo</span>
          </button>

          <button
            onClick={() => setActivePatientTab('evolution_photos')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'evolution_photos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fotos & Comparador Corporal</span>
          </button>

          <button
            onClick={() => setActivePatientTab('anthropometry')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'anthropometry'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Antropometria (Pollock 7D)</span>
          </button>

          <button
            onClick={() => setActivePatientTab('diet_planner')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'diet_planner'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Planejador de Dieta</span>
          </button>

          <button
            onClick={() => setActivePatientTab('lab_exams')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'lab_exams'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Exames Laboratoriais</span>
          </button>

          <button
            onClick={() => setActivePatientTab('prescriptions')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'prescriptions'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Receituário & Suplementos</span>
          </button>

          <button
            onClick={() => setActivePatientTab('shopping_list')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'shopping_list'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Lista de Compras</span>
          </button>

          <button
            onClick={() => setActivePatientTab('anamnesis')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'anamnesis'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Anamnese Clínica</span>
          </button>

          <button
            onClick={() => setActivePatientTab('adherence')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePatientTab === 'adherence'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Diário de Adesão</span>
          </button>
        </div>
      </div>

      {/* Render Active Tab */}
      {activePatientTab === 'overview' && (
        <div className="space-y-6">
          {/* Patient Evolution History Visualizations */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Monitoramento Longitudinal:
              </span>
              <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
                <button
                  onClick={() => setOverviewChartMode('weight_bmi')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                    overviewChartMode === 'weight_bmi'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-sky-500" />
                  <span>Trajetória Peso & IMC (OMS)</span>
                </button>
                <button
                  onClick={() => setOverviewChartMode('body_fat')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                    overviewChartMode === 'body_fat'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Evolução: Peso, Gordura & Músculo</span>
                </button>
              </div>
            </div>

            {overviewChartMode === 'weight_bmi' ? (
              <PatientWeightBMITrendChart
                patient={patient}
                records={patientAnthropometry}
                onNavigateToAnthropometry={() => setActivePatientTab('anthropometry')}
              />
            ) : (
              <PatientEvolutionCharts
                patient={patient}
                records={patientAnthropometry}
                onNavigateToAnthropometry={() => setActivePatientTab('anthropometry')}
              />
            )}
          </div>

          {/* Overview Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Energy & Metabolism */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Metabolismo & Gasto</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-500">{patient.bmrFormula}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Taxa Metabólica Basal (TMB):</span>
                  <span className="font-bold text-slate-900">{bmr} kcal</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Fator de Atividade:</span>
                  <span className="font-semibold text-slate-700">
                    {patient.activityLevel}x FA
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Gasto Energético Total (VET):</span>
                  <span className="font-bold text-slate-900">{tdee} kcal</span>
                </div>
                <div className="flex justify-between py-1 text-emerald-700 font-bold bg-emerald-50/60 px-2 rounded">
                  <span>Déficit / Superávit Prescrito:</span>
                  <span>{patient.targetCalories - tdee > 0 ? `+${patient.targetCalories - tdee}` : patient.targetCalories - tdee} kcal</span>
                </div>
              </div>
            </div>

            {/* Card 2: Composition & Anthropometry */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>Composição Corporal</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  {latestAnthro ? latestAnthro.date : 'Sem registro'}
                </span>
              </div>
              {latestAnthro ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">% Gordura Atual:</span>
                    <span className="font-bold text-slate-900">{latestAnthro.bodyFatPercent}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Massa Magra:</span>
                    <span className="font-semibold text-slate-700">{latestAnthro.leanMassKg} kg</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Massa Gorda:</span>
                    <span className="font-semibold text-slate-700">{latestAnthro.fatMassKg} kg</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Classificação:</span>
                    <span className={`font-bold ${getBodyFatClassification(latestAnthro.bodyFatPercent, patient.gender).color}`}>
                      {getBodyFatClassification(latestAnthro.bodyFatPercent, patient.gender).label}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">
                  <p>Nenhuma dobra ou bioimpedância lançada.</p>
                  <button
                    onClick={() => setActivePatientTab('anthropometry')}
                    className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    + Lançar Avaliação Antropométrica
                  </button>
                </div>
              )}
            </div>

            {/* Card 3: Active Diet Plan */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Utensils className="w-4 h-4 text-purple-600" />
                  <span>Plano Alimentar Atual</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {activeDietPlan ? 'Plano Ativo' : 'Sem Plano'}
                </span>
              </div>
              {activeDietPlan ? (
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="font-semibold text-slate-900">{activeDietPlan.title}</p>
                  <p className="text-slate-500">
                    Contém {activeDietPlan.meals.length} refeições estruturadas.
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 mt-2">
                    <button
                      onClick={() =>
                        generatePatientPlanPDF(patient, activeDietPlan, {
                          clinicConfig,
                          anthroRecord: latestAnthro,
                          action: 'download',
                        })
                      }
                      className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      title="Baixar resumo do plano com metas calóricas e macros"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar PDF</span>
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() =>
                        printPatientPlanSummary(patient, activeDietPlan, {
                          clinicConfig,
                          anthroRecord: latestAnthro,
                        })
                      }
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                      title="Imprimir resumo"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setActivePatientTab('diet_planner')}
                    className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 block"
                  >
                    Abrir Planejador de Dieta →
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActivePatientTab('diet_planner')}
                  className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  + Montar Primeiro Plano Alimentar
                </button>
              )}
            </div>

            {/* Card 4: Payments & Billing Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Controle Financeiro Interno</span>
                </h3>
                <button
                  onClick={() =>
                    openPaymentModal({
                      patientId: patient.id,
                      patientName: patient.name,
                      amount: 280,
                      title: 'Consulta Nutricional + Plano',
                      description: 'Valor informado pelo nutricionista para acompanhamento interno.',
                    })
                  }
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                >
                  + Informar Valor
                </button>
              </div>

              {patientPayments(patient.id).length > 0 ? (
                <div className="space-y-2 text-xs">
                  {patientPayments(patient.id).slice(0, 2).map((tx) => (
                    <div key={tx.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 truncate block max-w-[150px]">{tx.title}</span>
                        <span className="text-[11px] text-slate-500">
                          {tx.method === 'pix' ? 'PIX' : tx.method === 'credit_card' ? 'Cartão Crédito' : tx.method === 'dinheiro' ? 'Dinheiro' : tx.method} • {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block">R$ {tx.amount.toFixed(2)}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {tx.status === 'completed' ? 'Quitado' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">
                  <p>Nenhum lançamento financeiro registrado.</p>
                  <button
                    onClick={() =>
                      openPaymentModal({
                        patientId: patient.id,
                        patientName: patient.name,
                        amount: 280,
                        title: 'Consulta Nutricional + Plano',
                        description: 'Valor informado pelo nutricionista para acompanhamento interno.',
                      })
                    }
                    className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    Informar Valor da Consulta →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activePatientTab === 'programs' && (
        <div className="space-y-6">
          {activeEnrollment ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Active Program Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                      <Award className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">
                        Programa de Acompanhamento Ativo
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900">
                        {activeEnrollment.title}
                      </h2>
                    </div>
                  </div>
                  {activeEnrollment.description && (
                    <p className="text-xs text-slate-600 mt-2 max-w-2xl leading-relaxed">
                      {activeEnrollment.description}
                    </p>
                  )}
                </div>

                {/* Internal Finance Badge */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs shrink-0 sm:text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Controle Financeiro Interno
                  </span>
                  <span className="text-base font-black text-slate-900 block mt-0.5">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeEnrollment.internalFinance.totalValue)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    Status: <strong className="text-emerald-700">{activeEnrollment.internalFinance.paymentStatus === 'pago' ? 'Quitado' : activeEnrollment.internalFinance.paymentStatus}</strong> ({activeEnrollment.internalFinance.paymentMethod})
                  </span>
                </div>
              </div>

              {/* Progress and Key Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Consultas Realizadas
                  </span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block">
                    {activeEnrollment.completedConsultations} de {activeEnrollment.totalConsultations}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {activeEnrollment.totalConsultations - activeEnrollment.completedConsultations} restantes no tratamento
                  </span>
                </div>

                <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Período do Programa
                  </span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {activeEnrollment.startDate} até {activeEnrollment.endDate}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Duração total de {activeEnrollment.durationMonths} meses
                  </span>
                </div>

                <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Taxa de Conclusão
                  </span>
                  <span className="text-lg font-black text-emerald-700 mt-0.5 block">
                    {Math.round((activeEnrollment.completedConsultations / activeEnrollment.totalConsultations) * 100)}%
                  </span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${(activeEnrollment.completedConsultations / activeEnrollment.totalConsultations) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {activeEnrollment.clinicalObjectives && (
                <div className="bg-amber-50/60 border border-amber-200/70 p-3.5 rounded-xl text-xs text-amber-950">
                  <span className="font-bold block mb-1">🎯 Objetivos Clínicos do Tratamento Contínuo:</span>
                  <p className="leading-relaxed">{activeEnrollment.clinicalObjectives}</p>
                </div>
              )}

              {/* Action Strip: Progress Report & Certificate */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <Award className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      Relatório de Conclusão & Evolução do Programa
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Consolide deltas antropométricos, fotos antes/depois e envie notificação ao portal do paciente.
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openReportModal(undefined, activeEnrollment)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Award className="w-4 h-4 text-emerald-300" />
                  <span>Gerar Relatório de Progresso</span>
                </button>
              </div>

              {/* Sessions Timeline & Registration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Registro de Atendimentos do Programa ({activeEnrollment.sessions.length} registrados):
                  </h3>

                  <button
                    onClick={() => {
                      setSessionDateInput(new Date().toISOString().split('T')[0]);
                      setSessionNotesInput('');
                      setIsSessionModalOpen(true);
                    }}
                    disabled={activeEnrollment.completedConsultations >= activeEnrollment.totalConsultations}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Consulta Realizada</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: activeEnrollment.totalConsultations }).map((_, idx) => {
                    const sessionNumber = idx + 1;
                    const sessionData = activeEnrollment.sessions.find((s) => s.sessionNumber === sessionNumber);
                    const isDone = sessionNumber <= activeEnrollment.completedConsultations;

                    return (
                      <div
                        key={sessionNumber}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center space-x-1">
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>Consulta {sessionNumber}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isDone ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'}`}>
                            {isDone ? 'Concluída' : 'Pendente'}
                          </span>
                        </div>

                        <div className="mt-2 text-xs">
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Data: {sessionData?.date || (isDone ? 'Realizada' : 'A agendar')}
                          </span>
                          {sessionData?.notes && (
                            <p className="mt-1 text-[11px] text-slate-700 italic line-clamp-2">
                              "{sessionData.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="text-xs text-slate-500">
                  Os atendimentos realizados neste programa estão inclusos no pacote e não geram duplicidade financeira.
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updatePatientEnrollment(activeEnrollment.id, { status: 'concluido' })}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Marcar como Concluído
                  </button>
                  <button
                    onClick={() => updatePatientEnrollment(activeEnrollment.id, { status: 'pausado' })}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    Pausar Tratamento
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* No Active Program: Call to Action to Enroll */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
                <Award className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Nenhum Programa de Acompanhamento Ativo
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No momento, este paciente é atendido por <strong>Consultas Avulsas</strong>. Matricular em um Programa Contínuo permite estipular prazo (ex: 3 a 6 meses), cota de consultas, objetivos de longo prazo e controle financeiro interno do pacote.
                </p>
              </div>

              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Matricular em Programa de Acompanhamento</span>
              </button>
            </div>
          )}

          {/* Past/Archived Programs History */}
          {allPatientEnrollments.filter((e) => e.status !== 'ativo').length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Histórico de Programas Anteriores ({allPatientEnrollments.filter((e) => e.status !== 'ativo').length})
              </h3>
              <div className="divide-y divide-slate-100">
                {allPatientEnrollments.filter((e) => e.status !== 'ativo').map((pastEnr) => (
                  <div key={pastEnr.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{pastEnr.title}</span>
                      <div className="text-slate-500 mt-0.5">
                        {pastEnr.startDate} até {pastEnr.endDate} • {pastEnr.completedConsultations} de {pastEnr.totalConsultations} consultas realizadas
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {pastEnr.status === 'concluido' ? '🏁 Concluído' : 'Pausado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Register Program Consultation Session */}
      {isSessionModalOpen && activeEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Registrar Consulta do Programa
                </h3>
                <span className="text-xs text-emerald-700 font-semibold block">
                  Sessão {activeEnrollment.completedConsultations + 1} de {activeEnrollment.totalConsultations} ({activeEnrollment.title})
                </span>
              </div>
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerProgramSession(activeEnrollment.id, {
                  date: sessionDateInput,
                  notes: sessionNotesInput || `Atendimento nutricional do programa realizado em ${sessionDateInput}.`,
                });
                setIsSessionModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Data do Atendimento: *
                </label>
                <input
                  type="date"
                  value={sessionDateInput}
                  onChange={(e) => setSessionDateInput(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Anotações da Sessão / Conduta Adotada:
                </label>
                <textarea
                  rows={3}
                  value={sessionNotesInput}
                  onChange={(e) => setSessionNotesInput(e.target.value)}
                  placeholder="Ex: Dobras cutâneas registradas, perda de 1.2kg de gordura e novos ajustes na dieta."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                Esta consulta é coberta pelo plano contínuo do paciente e incrementará a contagem de atendimentos realizados.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Salvar Consulta Realizada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enroll this patient in a Program */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Matricular {patient.name} em Programa
                </h3>
                <p className="text-xs text-slate-500">
                  Configure o acompanhamento contínuo por período e número de consultas.
                </p>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                enrollPatientInProgram({
                  patientId: patient.id,
                  programTemplateId: selectedTemplateId,
                  title: enrollTitle,
                  startDate: new Date().toISOString().split('T')[0],
                  durationMonths: enrollDurationMonths,
                  totalConsultations: enrollTotalConsultations,
                  totalValue: enrollTotalValue,
                  paymentStatus: enrollPaymentStatus,
                  paymentMethod: enrollPaymentMethod,
                });
                setIsEnrollModalOpen(false);
                setActivePatientTab('programs');
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Modelo Base de Programa:
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedTemplateId(id);
                    const found = programTemplates.find((t) => t.id === id);
                    if (found) {
                      setEnrollTitle(found.title);
                      setEnrollDurationMonths(found.durationMonths);
                      setEnrollTotalConsultations(found.totalConsultations);
                      setEnrollTotalValue(found.suggestedPrice);
                    }
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                >
                  {programTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.durationMonths} meses, {t.totalConsultations} consultas - R$ {t.suggestedPrice.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título do Programa: *
                </label>
                <input
                  type="text"
                  value={enrollTitle}
                  onChange={(e) => setEnrollTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Duração (Meses):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={enrollDurationMonths}
                    onChange={(e) => setEnrollDurationMonths(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Total de Consultas:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={enrollTotalConsultations}
                    onChange={(e) => setEnrollTotalConsultations(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-emerald-800"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Controle Financeiro Interno:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Valor Total (R$):
                    </label>
                    <input
                      type="number"
                      step="10"
                      value={enrollTotalValue}
                      onChange={(e) => setEnrollTotalValue(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Forma:
                    </label>
                    <select
                      value={enrollPaymentMethod}
                      onChange={(e) => setEnrollPaymentMethod(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                    >
                      <option value="pix">PIX</option>
                      <option value="cartao_credito">Cartão Crédito</option>
                      <option value="cartao_debito">Cartão Débito</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="transferencia">Transferência</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Status:
                    </label>
                    <select
                      value={enrollPaymentStatus}
                      onChange={(e) => setEnrollPaymentStatus(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-emerald-800"
                    >
                      <option value="pago">Quitado</option>
                      <option value="pendente">Pendente</option>
                      <option value="parcial">Parcial</option>
                      <option value="cortesia">Cortesia</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Confirmar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activePatientTab === 'weight_trends' && (
        <div className="space-y-6">
          <PatientWeightBMITrendChart
            patient={patient}
            records={patientAnthropometry}
            onNavigateToAnthropometry={() => setActivePatientTab('anthropometry')}
          />
        </div>
      )}

      {activePatientTab === 'body_evolution' && (
        <div className="space-y-6">
          <PatientEvolutionCharts
            patient={patient}
            records={patientAnthropometry}
            onNavigateToAnthropometry={() => setActivePatientTab('anthropometry')}
          />
        </div>
      )}

      {activePatientTab === 'evolution_photos' && (
        <div className="space-y-6">
          <PatientEvolutionPhotosView patient={patient} />
        </div>
      )}

      {activePatientTab === 'anthropometry' && <AnthropometryCalculator />}

      {activePatientTab === 'diet_planner' && <DietPlanner />}

      {activePatientTab === 'lab_exams' && <LabExamsView />}

      {activePatientTab === 'prescriptions' && <PrescriptionsView />}

      {activePatientTab === 'shopping_list' && <ShoppingListView />}

      {activePatientTab === 'anamnesis' && <AnamnesisForm />}

      {activePatientTab === 'adherence' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Registro de Adesão & Cumprimento de Metas do Paciente
          </h3>
          <p className="text-xs text-slate-500">
            Histórico diário sincronizado a partir do portal mobile do paciente.
          </p>

          <div className="divide-y divide-slate-100">
            {patientAdherences.length > 0 ? (
              patientAdherences.map((adh) => (
                <div key={adh.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{adh.date}</span>
                    <div className="text-slate-500 mt-0.5">
                      {adh.completedMealIds.length} refeições cumpridas • {adh.waterDrankMl} ml de água
                    </div>
                    {adh.workoutNotes && (
                      <div className="text-emerald-700 italic text-[11px] mt-0.5">
                        💪 {adh.workoutNotes}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      {adh.trained ? 'Treinou ✓' : 'Descanso'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Nenhum registro de adesão recente para este paciente.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google Meet & Chat Modal */}
      <GoogleMeetModal
        isOpen={isMeetModalOpen}
        onClose={() => setIsMeetModalOpen(false)}
        patientName={patient.name}
      />

      {/* AI Nutrition Coach Modal */}
      <NutritionCoachModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
        onAppliedToDietPlan={() => {
          setActivePatientTab('diet_planner');
        }}
      />
    </div>
  );
};
