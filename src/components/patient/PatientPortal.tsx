import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { DietMealItem, FoodSubstitution, DietMealOption } from '../../types';
import confetti from 'canvas-confetti';
import {
  Utensils,
  Droplets,
  CheckCircle2,
  Circle,
  ArrowRightLeft,
  Flame,
  Award,
  Sparkles,
  Dumbbell,
  Clock,
  ChevronRight,
  Info,
  Calendar,
  Smile,
  X,
  FileDown,
  ShoppingCart,
  Video,
  MessageSquare,
  FileCheck,
  Activity,
  Pill,
  ExternalLink,
  Plus,
  Scale,
  Smartphone,
  Layers,
  Check,
  DollarSign,
  CreditCard,
  QrCode,
  Receipt
} from 'lucide-react';
import { PatientShoppingListModal } from './PatientShoppingListModal';
import { GoogleMeetModal } from '../common/GoogleMeetModal';
import { PatientAddExamModal } from './PatientAddExamModal';
import { PatientBioimpedanceModal } from './PatientBioimpedanceModal';
import { PwaInstallModal } from '../common/PwaInstallModal';
import { PatientSecurityModal } from './PatientSecurityModal';
import { PatientPinLockScreen } from './PatientPinLockScreen';
import { ShieldCheck, Lock, Unlock, KeyRound, ShieldAlert } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'segunda', label: 'Seg' },
  { id: 'terca', label: 'Ter' },
  { id: 'quarta', label: 'Qua' },
  { id: 'quinta', label: 'Qui' },
  { id: 'sexta', label: 'Sex' },
  { id: 'sabado', label: 'Sáb' },
  { id: 'domingo', label: 'Dom' },
];

export const PatientPortal: React.FC = () => {
  const {
    activePatient,
    patients,
    setActivePatientId,
    activeDietPlan,
    todayAdherence,
    toggleMealCompleted,
    logWaterIntake,
    logWorkout,
    setExportPlanModalOpen,
    prescriptions,
    labExams,
    patientAnthropometry,
    currentNutritionist,
    clinicConfig,
    openPaymentModal,
    patientPayments,
    updateItemInMeal,
    patientProgramEnrollments,
    programTemplates,
    programProgressReports,
    openReportModal,
  } = useNutrition();

  const [activeSubstitutionModal, setActiveSubstitutionModal] = useState<{
    item: DietMealItem;
    mealId: string;
    mealName: string;
  } | null>(null);

  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState<boolean>(false);
  const [isMeetModalOpen, setIsMeetModalOpen] = useState<boolean>(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState<boolean>(false);
  const [isBioimpedanceModalOpen, setIsBioimpedanceModalOpen] = useState<boolean>(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  // Patient PIN and Privacy Lock State
  const [patientPin, setPatientPin] = useState<string | null>(() => {
    return localStorage.getItem('nutricore_patient_pin') || null;
  });
  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);

  const [selectedDay, setSelectedDay] = useState<string>('hoje');
  const [selectedMealOptions, setSelectedMealOptions] = useState<Record<string, number>>({});
  const [activePatientSubTab, setActivePatientSubTab] = useState<'diet' | 'prescriptions' | 'exams' | 'evolution' | 'program'>('diet');
  const [workoutInputText, setWorkoutInputText] = useState<string>(
    todayAdherence?.workoutNotes || 'Treino de Musculação (Membros Superiores + 20min Cardio)'
  );

  const patient = activePatient || patients[0];
  const dietPlan = activeDietPlan;

  const handleSetPin = (newPin: string | null) => {
    if (newPin) {
      localStorage.setItem('nutricore_patient_pin', newPin);
      setPatientPin(newPin);
    } else {
      localStorage.removeItem('nutricore_patient_pin');
      setPatientPin(null);
      setIsPinLocked(false);
    }
  };

  const handleSecureLogout = () => {
    // Clear sensitive session storage and lock the view
    sessionStorage.clear();
    setIsPinLocked(true);
    if (!patientPin) {
      // Set temporary PIN 1234 so it locks
      setPatientPin('1234');
      localStorage.setItem('nutricore_patient_pin', '1234');
    }
  };

  const waterGoal = dietPlan?.waterGoalMl || patient?.targetWaterMl || 2500;
  const currentWater = todayAdherence?.waterDrankMl || 0;
  const waterPercent = Math.min(100, Math.round((currentWater / waterGoal) * 100));

  const totalMeals = dietPlan?.meals.length || 0;
  const completedMealsCount = todayAdherence?.completedMealIds.length || 0;
  const mealAdherencePercent = totalMeals > 0 ? Math.round((completedMealsCount / totalMeals) * 100) : 0;

  // Filter patient prescriptions and exams
  const myPrescriptions = prescriptions.filter((p) => p.patientId === patient?.id);
  const myExams = labExams.filter((e) => e.patientId === patient?.id);
  const myAnthroHistory = patientAnthropometry.filter((a) => a.patientId === patient?.id);
  const latestAnthro = myAnthroHistory[myAnthroHistory.length - 1];
  const myPayments = patientPayments(patient?.id);
  const myEnrollment = patientProgramEnrollments.find(
    (e) => e.patientId === patient?.id && e.status === 'ativo'
  );
  const myLatestReport = programProgressReports.find(
    (r) => r.patientId === patient?.id
  );

  const handleAddWater = (amount: number) => {
    const nextAmount = currentWater + amount;
    logWaterIntake(nextAmount);

    if (currentWater < waterGoal && nextAmount >= waterGoal) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#3b82f6'],
      });
    }
  };

  const handleToggleWorkout = () => {
    logWorkout(!todayAdherence?.trained, workoutInputText);
    if (!todayAdherence?.trained) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#f59e0b'],
      });
    }
  };

  const handleSelectOption = (mealId: string, optionIndex: number) => {
    setSelectedMealOptions((prev) => ({
      ...prev,
      [mealId]: optionIndex,
    }));
  };

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-500">
        Nenhum paciente cadastrado para visualização no Portal do Paciente.
      </div>
    );
  }

  // If Lock Screen is Active, render PinLockScreen
  if (isPinLocked && patientPin) {
    return (
      <div className="max-w-md mx-auto py-6 px-1">
        <PatientPinLockScreen
          patientName={patient.name}
          patientAvatar={patient.avatarUrl}
          correctPin={patientPin}
          onUnlock={() => setIsPinLocked(false)}
          onResetPin={() => {
            if (confirm('Deseja redefinir a proteção por PIN deste dispositivo?')) {
              handleSetPin(null);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-16 px-1">
      {/* Patient Switcher for Testing (Useful for Nutritionist) */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">Simulador de Paciente:</span>
        </div>
        <select
          value={patient.id}
          onChange={(e) => setActivePatientId(e.target.value)}
          className="bg-slate-800 text-white text-xs font-bold py-1 px-2.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.goal})
            </option>
          ))}
        </select>
      </div>

      {/* Patient Welcome Header Card */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={patient.avatarUrl}
              alt={patient.name}
              className="w-13 h-13 rounded-2xl object-cover border-2 border-white/40 shadow-md"
            />
            <div>
              <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold block">
                Portal do Paciente
              </span>
              <h1 className="text-base font-black tracking-tight">{patient.name}</h1>
              <span className="text-[11px] text-emerald-100 flex items-center space-x-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Meta: {patient.goal === 'emagrecimento' ? 'Emagrecimento' : patient.goal === 'hipertrofia' ? 'Hipertrofia' : 'Saúde & Manutenção'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="p-2 bg-white/15 hover:bg-white/25 text-white rounded-xl backdrop-blur-xs transition-colors"
              title="Segurança & Bloqueio por PIN (LGPD)"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
            </button>

            <button
              onClick={() => setIsPwaModalOpen(true)}
              className="p-2 bg-white/15 hover:bg-white/25 text-white rounded-xl backdrop-blur-xs transition-colors"
              title="Instalar App no Celular"
            >
              <Smartphone className="w-4 h-4 text-emerald-200" />
            </button>

            <button
              onClick={() => setIsMeetModalOpen(true)}
              className="p-2 bg-white/15 hover:bg-white/25 text-white rounded-xl backdrop-blur-xs transition-colors"
              title="Google Meet & Google Chat com Nutricionista"
            >
              <Video className="w-4 h-4 text-emerald-200" />
            </button>

            <button
              onClick={() => setIsShoppingModalOpen(true)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-xs transition-colors"
              title="Minha Lista de Compras"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>

            <button
              onClick={() => setExportPlanModalOpen(true)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-xs transition-colors"
              title="Baixar Cardápio em PDF"
            >
              <FileDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Daily Summary Pill Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-emerald-600/50 text-center">
          <div className="bg-emerald-950/40 p-2 rounded-xl backdrop-blur-xs">
            <span className="text-[10px] text-emerald-200 block">Meta Diária</span>
            <span className="text-xs font-black">{patient.targetCalories} kcal</span>
          </div>

          <div className="bg-emerald-950/40 p-2 rounded-xl backdrop-blur-xs">
            <span className="text-[10px] text-emerald-200 block">Refeições</span>
            <span className="text-xs font-black">
              {completedMealsCount}/{totalMeals} ({mealAdherencePercent}%)
            </span>
          </div>

          <div className="bg-emerald-950/40 p-2 rounded-xl backdrop-blur-xs">
            <span className="text-[10px] text-emerald-200 block">Água</span>
            <span className="text-xs font-black">
              {Math.round(currentWater / 1000 * 10) / 10}L / {Math.round(waterGoal / 1000 * 10) / 10}L
            </span>
          </div>
        </div>
      </div>

      {/* PWA Phone Install Quick Alert */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-emerald-100 shrink-0" />
          <span className="text-xs font-bold">Use como App no seu Smartphone</span>
        </div>
        <button
          onClick={() => setIsPwaModalOpen(true)}
          className="px-2.5 py-1 bg-white text-emerald-800 text-[11px] font-extrabold rounded-xl shadow-xs hover:bg-emerald-50 transition-colors"
        >
          Instalar
        </button>
      </div>

      {/* Security & LGPD Quick Protection Bar */}
      <div className="bg-slate-100/90 border border-slate-200/80 px-3.5 py-2 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${patientPin ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[11px] font-medium text-slate-700">
            {patientPin ? (
              <span className="flex items-center gap-1 font-semibold text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Proteção por PIN Ativada</span>
              </span>
            ) : (
              <span className="text-slate-600">Sessão Segura (LGPD)</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSecurityModalOpen(true)}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline"
          >
            Configurar
          </button>
          {patientPin && (
            <button
              type="button"
              onClick={() => setIsPinLocked(true)}
              className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg flex items-center gap-1 transition-colors"
              title="Bloquear aplicativo agora"
            >
              <Lock className="w-3 h-3" />
              <span>Bloquear</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation Pills (Dieta / Suplementos / Exames / Evolução / Pagamentos) */}
      <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl text-xs font-bold text-slate-600 overflow-x-auto gap-1">
        <button
          onClick={() => setActivePatientSubTab('diet')}
          className={`py-2 px-2.5 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1 shrink-0 ${
            activePatientSubTab === 'diet'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Cardápio</span>
        </button>

        <button
          onClick={() => setActivePatientSubTab('prescriptions')}
          className={`py-2 px-2.5 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1 shrink-0 ${
            activePatientSubTab === 'prescriptions'
              ? 'bg-white text-purple-700 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Suplementos ({myPrescriptions.length})</span>
        </button>

        <button
          onClick={() => setActivePatientSubTab('exams')}
          className={`py-2 px-2.5 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1 shrink-0 ${
            activePatientSubTab === 'exams'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Exames ({myExams.length})</span>
        </button>

        <button
          onClick={() => setActivePatientSubTab('evolution')}
          className={`py-2 px-2.5 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1 shrink-0 ${
            activePatientSubTab === 'evolution'
              ? 'bg-white text-teal-700 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Bioimpedância</span>
        </button>

        <button
          onClick={() => setActivePatientSubTab('program')}
          className={`py-2 px-2.5 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1 shrink-0 relative ${
            activePatientSubTab === 'program'
              ? 'bg-white text-amber-700 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>Meu Programa {myEnrollment ? '(Ativo)' : ''}</span>
        </button>
      </div>

      {/* PROGRAM PROGRESS REPORT NOTIFICATION BANNER */}
      {myLatestReport && (
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white rounded-2xl shadow-md border border-emerald-400/30 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs text-white shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 block">
                Novo Relatório de Evolução Disponível!
              </span>
              <span className="text-xs font-bold block leading-tight">
                {myLatestReport.programTitle} • Conclusão & Resultados
              </span>
              <span className="text-[11px] text-emerald-100 hidden sm:inline">
                Seu nutricionista consolidou suas medidas, fotos e conquistas.
              </span>
            </div>
          </div>
          <button
            onClick={() => openReportModal(myLatestReport)}
            className="px-3.5 py-2 bg-white text-emerald-950 text-xs font-black rounded-xl shadow-xs hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer"
          >
            Abrir Relatório
          </button>
        </div>
      )}

      {/* Active Continuous Program Banner if in a program */}
      {myEnrollment && activePatientSubTab !== 'program' && (
        <div className="p-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 text-white rounded-2xl shadow-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold block leading-tight">{myEnrollment.title}</span>
              <span className="text-[11px] text-amber-100 font-semibold">
                {myEnrollment.completedConsultations} de {myEnrollment.totalConsultations} consultas realizadas ({Math.round((myEnrollment.completedConsultations / myEnrollment.totalConsultations) * 100)}%)
              </span>
            </div>
          </div>
          <button
            onClick={() => setActivePatientSubTab('program')}
            className="px-3 py-1.5 bg-white text-slate-900 text-xs font-black rounded-xl shadow-xs hover:bg-amber-50 transition-colors shrink-0 cursor-pointer"
          >
            Ver Programa
          </button>
        </div>
      )}

      {/* DIET TAB */}
      {activePatientSubTab === 'diet' && (
        <>
          {/* Day of the Week Selector Bar */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dieta por Dia da Semana</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Selecione o dia</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = selectedDay === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDay(d.id)}
                    className={`py-1.5 px-1 text-[11px] font-bold rounded-xl transition-all text-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SMART HYDRATION TRACKER */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Controle de Hidratação</h2>
                  <p className="text-[10px] text-slate-500">
                    Meta: {waterGoal} ml/dia
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg">
                {waterPercent}%
              </span>
            </div>

            {/* Water Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{currentWater} ml</span>
                <span>Faltam {Math.max(0, waterGoal - currentWater)} ml</span>
              </div>
            </div>

            {/* Quick Add Cups Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => handleAddWater(250)}
                className="py-1.5 px-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 font-bold text-xs rounded-xl border border-cyan-200 transition-colors flex items-center justify-center space-x-1"
              >
                <span>+250 ml</span>
                <span className="text-[10px] text-cyan-600 font-normal">(copo)</span>
              </button>

              <button
                onClick={() => handleAddWater(500)}
                className="py-1.5 px-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 font-bold text-xs rounded-xl border border-cyan-200 transition-colors flex items-center justify-center space-x-1"
              >
                <span>+500 ml</span>
                <span className="text-[10px] text-cyan-600 font-normal">(garrafa)</span>
              </button>

              <button
                onClick={() => logWaterIntake(0)}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs rounded-xl border border-slate-200 transition-colors"
              >
                Zerar
              </button>
            </div>
          </div>

          {/* WORKOUT & ADHERENCE LOG */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Treino do Dia</h2>
                  <p className="text-[10px] text-slate-500">Mantenha a frequência semanal</p>
                </div>
              </div>

              <button
                onClick={handleToggleWorkout}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1 ${
                  todayAdherence?.trained
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {todayAdherence?.trained ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Treinei ✓</span>
                  </>
                ) : (
                  <span>Marcar Treino</span>
                )}
              </button>
            </div>

            <input
              type="text"
              value={workoutInputText}
              onChange={(e) => {
                setWorkoutInputText(e.target.value);
                logWorkout(todayAdherence?.trained || false, e.target.value);
              }}
              placeholder="Descreva o treino (ex: Musculação pernas + cardio)..."
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* MEALS LIST WITH MEAL ALTERNATIVES & SUBSTITUTIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cardápio Prescrito ({selectedDay === 'hoje' ? 'Hoje' : selectedDay.toUpperCase()})</span>
              </h2>
              <span className="text-[11px] text-slate-500">
                {completedMealsCount} de {totalMeals} concluídas
              </span>
            </div>

            {dietPlan && dietPlan.meals.length > 0 ? (
              dietPlan.meals.map((meal) => {
                const isCompleted = todayAdherence?.completedMealIds.includes(meal.id);
                const currentOptionIndex = selectedMealOptions[meal.id] || 0;

                // Determine active items: main items or alternative option items
                const activeItems = (currentOptionIndex > 0 && meal.options && meal.options[currentOptionIndex - 1]?.items)
                  ? meal.options[currentOptionIndex - 1].items
                  : (meal.items || []);

                const activeInstructions = (currentOptionIndex > 0 && meal.options && meal.options[currentOptionIndex - 1])
                  ? meal.options[currentOptionIndex - 1].instructions || meal.instructions
                  : meal.instructions;

                const mealCals = Math.round((activeItems || []).reduce((acc, it) => acc + (it.calories || 0), 0));

                return (
                  <div
                    key={meal.id}
                    className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                      isCompleted
                        ? 'border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-slate-200 shadow-xs'
                    }`}
                  >
                    {/* Meal Header */}
                    <div
                      onClick={() => toggleMealCompleted(meal.id)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                        isCompleted ? 'bg-emerald-50/50' : 'bg-slate-50/70 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <button
                          type="button"
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-slate-300 text-transparent hover:border-emerald-500'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs font-bold ${
                                isCompleted ? 'text-emerald-950 line-through' : 'text-slate-900'
                              }`}
                            >
                              {meal.name}
                            </span>
                            <div className="flex items-center space-x-1 text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              <span>{meal.time}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            {mealCals} kcal • {activeItems.length} alimentos
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                          isCompleted
                            ? 'bg-emerald-200/60 text-emerald-800'
                            : 'bg-slate-200/60 text-slate-600'
                        }`}
                      >
                        {isCompleted ? 'Concluída ✓' : 'Pendente'}
                      </span>
                    </div>

                    {/* Meal Alternative Options Switcher (Opção 1, Opção 2, Opção 3) */}
                    {meal.options && meal.options.length > 0 && (
                      <div className="px-3 pt-2.5 flex items-center gap-1.5 bg-slate-50/50 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">Opções:</span>
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                          <button
                            type="button"
                            onClick={() => handleSelectOption(meal.id, 0)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${
                              currentOptionIndex === 0
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Opção 1 (Principal)
                          </button>
                          {meal.options.map((opt, optIdx) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectOption(meal.id, optIdx + 1)}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                                currentOptionIndex === optIdx + 1
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {opt.optionTitle || `Opção ${optIdx + 2}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meal Items */}
                    <div className="p-3.5 divide-y divide-slate-100">
                      {activeItems.map((item) => (
                        <div
                          key={item.id}
                          className="py-2 flex items-start justify-between gap-2 text-xs first:pt-0 last:pb-0"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 block text-xs">
                                {item.foodName}
                              </span>
                              {item.substitutionGroupName && (
                                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-bold">
                                  {item.substitutionGroupName}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[10px]">
                              {item.amountG}g ({item.measureLabel || item.portionDescription}) • {Math.round(item.calories)} kcal
                            </span>
                          </div>

                          {item.possibleSubstitutions && item.possibleSubstitutions.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSubstitutionModal({ item, mealId: meal.id, mealName: meal.name });
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 flex items-center space-x-1 shrink-0 transition-colors"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Substituir</span>
                            </button>
                          )}
                        </div>
                      ))}

                      {activeInstructions && (
                        <div className="pt-2 text-[10px] text-slate-500 italic">
                          💡 <strong>Dica do Nutri:</strong> {activeInstructions}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                Nenhum plano alimentar ativo cadastrado pelo nutricionista.
              </div>
            )}
          </div>
        </>
      )}

      {/* PRESCRIPTIONS TAB IN PATIENT PORTAL */}
      {activePatientSubTab === 'prescriptions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Pill className="w-3.5 h-3.5 text-purple-600" />
              <span>Receituário de Suplementos & Fitoterapia</span>
            </h2>
            <span className="text-[11px] text-slate-500">{myPrescriptions.length} ativos</span>
          </div>

          {myPrescriptions.length > 0 ? (
            myPrescriptions.map((presc) => (
              <div key={presc.id} className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">{presc.title}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Prescrito em {presc.date}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    {presc.items?.length || 0} fórmulas
                  </span>
                </div>

                <div className="space-y-2">
                  {(presc.items || []).map((item) => (
                    <div key={item.id} className="p-2.5 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="text-xs">{item.name}</span>
                        <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[10px]">
                          {item.dosage}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        <strong>Posologia:</strong> {item.instructions}
                      </p>
                      {item.purpose && (
                        <p className="text-[10px] text-slate-400 italic">
                          Objetivo: {item.purpose}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {presc.notes && (
                  <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    ℹ️ <strong>Orientações:</strong> {presc.notes}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              Nenhuma prescrição de suplementos cadastrada no momento.
            </div>
          )}
        </div>
      )}

      {/* EXAMS TAB IN PATIENT PORTAL */}
      {activePatientSubTab === 'exams' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Meus Exames Laboratoriais</span>
            </h2>

            <button
              onClick={() => setIsAddExamModalOpen(true)}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Exame</span>
            </button>
          </div>

          {myExams.length > 0 ? (
            myExams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">{exam.title || exam.examName}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">{exam.date} • {exam.laboratoryName || 'Laboratório Clínico'}</span>
                  </div>
                  {exam.registeredBy === 'patient' ? (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Cadastrado por Você
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                      Nutricionista
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {(exam.items || exam.markers || []).map((m: any, idx: number) => {
                    const itemName = m.name || m.markerName;
                    const itemVal = m.value;
                    const itemUnit = m.unit;
                    const isOptimal = m.status === 'otimo' || m.status === 'optimal' || m.status === 'normal';

                    return (
                      <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">{itemName}</span>
                          <span className="text-[10px] text-slate-400">Ref: {m.minReference || m.referenceRange} - {m.maxReference || ''} {itemUnit}</span>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-slate-900">{itemVal} {itemUnit}</span>
                          <span
                            className={`block text-[10px] font-bold ${
                              isOptimal ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isOptimal ? 'Normal / Ótimo ✓' : 'Atenção ⚠️'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(exam.clinicalObservations || exam.notes) && (
                  <p className="text-[10px] text-slate-500 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                    🔬 <strong>Observações:</strong> {exam.clinicalObservations || exam.notes}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-2">
              <p>Nenhum exame laboratorial registrado no momento.</p>
              <button
                onClick={() => setIsAddExamModalOpen(true)}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors"
              >
                + Cadastrar Meus Primeiros Exames
              </button>
            </div>
          )}
        </div>
      )}

      {/* EVOLUTION & BIOIMPEDANCE TAB */}
      {activePatientSubTab === 'evolution' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-teal-600" />
              <span>Bioimpedância & Composição Corporal</span>
            </h2>

            <button
              onClick={() => setIsBioimpedanceModalOpen(true)}
              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Importar Laudo</span>
            </button>
          </div>

          {/* Latest Stats Card */}
          {latestAnthro ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">Última Avaliação ({latestAnthro.date})</h3>
                  <span className="text-[10px] text-slate-500">
                    {latestAnthro.bioimpedance ? 'Balança de Bioimpedância' : 'Dobras Cutâneas Pollock'}
                  </span>
                </div>
                {latestAnthro.bioimpedance?.inbodyScore && (
                  <span className="text-xs font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    Score: {latestAnthro.bioimpedance.inbodyScore}/100
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Peso Total</span>
                  <span className="font-extrabold text-slate-900">{latestAnthro.weightKg} kg</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <span className="text-[10px] text-emerald-700 block">% Gordura</span>
                  <span className="font-extrabold text-emerald-950">{latestAnthro.bodyFatPercentage}%</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-xl">
                  <span className="text-[10px] text-blue-700 block">Massa Magra</span>
                  <span className="font-extrabold text-blue-950">{latestAnthro.leanMassKg} kg</span>
                </div>
                <div className="p-2 bg-purple-50 rounded-xl">
                  <span className="text-[10px] text-purple-700 block">IMC</span>
                  <span className="font-extrabold text-purple-950">{latestAnthro.bmi}</span>
                </div>
              </div>

              {latestAnthro.bioimpedance && (
                <div className="pt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-2xl">
                  <div>
                    <span className="text-slate-400 block">Água Corporal:</span>
                    <span className="font-bold">{latestAnthro.bioimpedance.bodyWaterLiters || '—'} L</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gordura Visceral:</span>
                    <span className="font-bold">Nível {latestAnthro.bioimpedance.visceralFatLevel || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">TMB Aparelho:</span>
                    <span className="font-bold">{latestAnthro.bioimpedance.basalMetabolicRateKcal || '—'} kcal</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              Nenhuma avaliação cadastrada. Importe o PDF da sua balança de bioimpedância.
            </div>
          )}
        </div>
      )}

      {/* NUTRITION CARE PROGRAM SUBTAB */}
      {activePatientSubTab === 'program' && (
        <div className="space-y-4">
          {myEnrollment ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-5">
              {/* Program Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">
                      Programa de Acompanhamento Contínuo
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {myEnrollment.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {myEnrollment.durationMonths} meses • De {new Date(myEnrollment.startDate).toLocaleDateString('pt-BR')} até {new Date(myEnrollment.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <span className="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full">
                  Em Andamento ✓
                </span>
              </div>

              {/* Progress Bar Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Progresso do Tratamento:</span>
                  <span className="font-black text-emerald-700">
                    {myEnrollment.completedConsultations} de {myEnrollment.totalConsultations} consultas ({Math.round((myEnrollment.completedConsultations / myEnrollment.totalConsultations) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((myEnrollment.completedConsultations / myEnrollment.totalConsultations) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Início: {new Date(myEnrollment.startDate).toLocaleDateString('pt-BR')}</span>
                  <span>{myEnrollment.totalConsultations - myEnrollment.completedConsultations} consultas restantes</span>
                </div>
              </div>

              {/* Clinical Objectives if present */}
              {myEnrollment.clinicalObjectives && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <span>🎯 Metas Clínicas Definidas com seu Nutricionista:</span>
                  </span>
                  <p className="text-amber-900 leading-relaxed">
                    {myEnrollment.clinicalObjectives}
                  </p>
                </div>
              )}

              {/* Consultations Roadmap */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Consultas & Atendimentos do Programa ({myEnrollment.totalConsultations} sessões):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Array.from({ length: myEnrollment.totalConsultations }).map((_, idx) => {
                    const sessionNumber = idx + 1;
                    const session = myEnrollment.sessions.find((s) => s.sessionNumber === sessionNumber);
                    const isDone = sessionNumber <= myEnrollment.completedConsultations;

                    return (
                      <div
                        key={sessionNumber}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isDone
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span>Consulta {sessionNumber}</span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isDone ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isDone ? 'Realizada' : 'Prevista'}
                          </span>
                        </div>

                        <div className="mt-1.5 text-[11px]">
                          <span className="text-slate-500">
                            {session?.date ? `Data: ${new Date(session.date).toLocaleDateString('pt-BR')}` : isDone ? 'Realizada' : 'A agendar com seu nutri'}
                          </span>
                          {session?.notes && (
                            <p className="mt-1 text-slate-700 italic bg-white/70 p-1.5 rounded-lg border border-slate-100">
                              "{session.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receipts history from internal records */}
              {myPayments.length > 0 && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                    <span>Comprovantes e Recibos Emitidos:</span>
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {myPayments.map((p) => (
                      <div key={p.id} className="p-3 bg-white flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{p.title}</span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(p.createdAt).toLocaleDateString('pt-BR')} • {p.receiptNumber || 'Recibo Interno'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          {p.status === 'completed' ? 'Quitado' : p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Patient is in individual consultation mode */
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                      Modalidade Atual
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      Acompanhamento por Consultas Avulsas
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Você realiza atendimentos pontuais com seu nutricionista.
                    </p>
                  </div>
                </div>
              </div>

              {/* Showcase continuous programs */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Conheça os Programas de Acompanhamento Contínuo
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Tratamentos estruturados com duração de 3 a 6 meses, número programado de consultas e acompanhamento contínuo para atingir metas de longo prazo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {programTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 space-y-2.5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <h5 className="font-bold text-xs text-slate-900">{tpl.title}</h5>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full shrink-0 ml-1">
                          {tpl.durationMonths} meses
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                        {tpl.description}
                      </p>
                      <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span>{tpl.totalConsultations} consultas inclusas</span>
                        <span className="text-emerald-700">{tpl.suggestedFrequency}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <p className="text-xs text-slate-500">
                    Converse com seu nutricionista na próxima consulta para migrar para um programa contínuo!
                  </p>
                </div>
              </div>

              {/* Patient previous receipts */}
              {myPayments.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                    <span>Histórico de Atendimentos Anteriores:</span>
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {myPayments.map((p) => (
                      <div key={p.id} className="p-3 bg-white flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{p.title}</span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(p.createdAt).toLocaleDateString('pt-BR')} • {p.receiptNumber || 'Recibo'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          {p.status === 'completed' ? 'Quitado' : p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SMART SUBSTITUTION MODAL */}
      {activeSubstitutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs">Substituição Inteligente</span>
              </div>
              <button
                onClick={() => {
                  setActiveSubstitutionModal(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50/50 border-b border-emerald-100 text-xs">
              <span className="text-[10px] text-slate-500 block">Alimento Original:</span>
              <span className="font-bold text-slate-900">
                {activeSubstitutionModal.item.amountG}g de {activeSubstitutionModal.item.foodName} ({activeSubstitutionModal.item.calories} kcal)
              </span>
            </div>

            {activeSubstitutionModal.item.substitutionGroupName && (
              <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Regra Clínica: {activeSubstitutionModal.item.substitutionGroupName}</span>
                </div>
                {activeSubstitutionModal.item.substitutionRuleNote && (
                  <p className="text-[11px] text-emerald-900 leading-snug">
                    {activeSubstitutionModal.item.substitutionRuleNote}
                  </p>
                )}
              </div>
            )}

            <div className="p-4 overflow-y-auto space-y-2.5 max-h-80">
              <span className="text-[11px] font-bold text-slate-700 block">
                Escolha uma opção calculada com mesmo valor nutricional:
              </span>

              {activeSubstitutionModal.item.possibleSubstitutions?.map((sub, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-xs space-y-2 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="text-xs">{sub.name}</span>
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                      {sub.amountG}g
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>{sub.measureLabel}</span>
                    <span className="font-medium text-slate-700">{sub.calories} kcal</span>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                    <span className="text-blue-600 font-medium">P: {sub.protein}g</span>
                    <span>•</span>
                    <span className="text-amber-600 font-medium">C: {sub.carbs}g</span>
                    <span>•</span>
                    <span className="text-rose-600 font-medium">G: {sub.fats}g</span>
                  </div>

                  {sub.tip && (
                    <div className="text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-100 font-medium">
                      💡 {sub.tip}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!activeSubstitutionModal || !activeDietPlan) return;
                      const currentItem = activeSubstitutionModal.item;
                      const existingSubstitutions = currentItem.possibleSubstitutions || [];
                      const updatedSubstitutions = existingSubstitutions.map((s) => {
                        if (s.name === sub.name) {
                          return {
                            foodId: currentItem.foodId,
                            name: currentItem.foodName,
                            amountG: currentItem.amountG,
                            measureLabel: currentItem.measureLabel,
                            calories: currentItem.calories,
                            protein: currentItem.protein,
                            carbs: currentItem.carbs,
                            fats: currentItem.fats,
                            tip: 'Alimento original do cardápio'
                          };
                        }
                        return s;
                      });

                      updateItemInMeal(activeDietPlan.id, activeSubstitutionModal.mealId, currentItem.id, {
                        foodName: sub.name,
                        amountG: sub.amountG,
                        measureLabel: sub.measureLabel,
                        calories: sub.calories,
                        protein: sub.protein,
                        carbs: sub.carbs,
                        fats: sub.fats,
                        substitutionGroupId: currentItem.substitutionGroupId,
                        substitutionGroupName: currentItem.substitutionGroupName,
                        substitutionRuleNote: currentItem.substitutionRuleNote,
                        possibleSubstitutions: updatedSubstitutions
                      });

                      setActiveSubstitutionModal(null);
                    }}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Trocar por este alimento</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => {
                  setActiveSubstitutionModal(null);
                }}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PATIENT SHOPPING LIST MODAL */}
      <PatientShoppingListModal
        isOpen={isShoppingModalOpen}
        onClose={() => setIsShoppingModalOpen(false)}
        dietPlan={dietPlan}
        patientName={patient.name}
      />

      {/* GOOGLE MEET & CHAT CONSULTATION MODAL */}
      <GoogleMeetModal
        isOpen={isMeetModalOpen}
        onClose={() => setIsMeetModalOpen(false)}
        patientName={patient.name}
      />

      {/* PATIENT ADD LAB EXAM MODAL */}
      <PatientAddExamModal
        isOpen={isAddExamModalOpen}
        onClose={() => setIsAddExamModalOpen(false)}
        patientId={patient.id}
        patientName={patient.name}
      />

      {/* PATIENT BIOIMPEDANCE MODAL */}
      <PatientBioimpedanceModal
        isOpen={isBioimpedanceModalOpen}
        onClose={() => setIsBioimpedanceModalOpen(false)}
        patientId={patient.id}
        patientName={patient.name}
      />

      {/* PWA INSTALL MODAL */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        targetRole="patient"
      />

      {/* PATIENT SECURITY & PIN MODAL */}
      <PatientSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        patientName={patient.name}
        currentPin={patientPin}
        onSetPin={handleSetPin}
        onLockNow={() => {
          setIsPinLocked(true);
        }}
        onSecureLogout={handleSecureLogout}
      />
    </div>
  );
};

