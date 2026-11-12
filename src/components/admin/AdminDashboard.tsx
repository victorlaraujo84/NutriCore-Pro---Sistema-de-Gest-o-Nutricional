import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import {
  Users,
  Calendar,
  Activity,
  Flame,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  UserPlus,
  Scale,
  Utensils,
  CheckCircle2,
  DollarSign,
  CreditCard,
  BellRing,
  Award,
  ShieldCheck
} from 'lucide-react';
import { calculateBMI } from '../../utils/nutritionCalculations';
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts';
import { NutritionalAlertsPanel } from './NutritionalAlertsPanel';

interface AdminDashboardProps {
  onOpenNewPatientModal: () => void;
  onOpenCalendarModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenNewPatientModal,
  onOpenCalendarModal,
}) => {
  const {
    patients,
    appointments,
    updateAppointmentStatus,
    adherenceRecords,
    setSelectedPatientForDetail,
    setActiveAdminTab,
    setActivePatientTab,
    anthropometryRecords,
    setCurrentView,
    setActivePatientId,
    googleAuth,
    isSyncingCalendar,
    syncAppointmentsWithGoogle,
    payments,
    openPaymentModal,
    patientProgramEnrollments,
    openDiagnosticsModal,
  } = useNutrition();

  const [filterAppStatus, setFilterAppStatus] = useState<string>('all');

  // Stats calculation
  const totalPatients = patients.length;
  const activeConsultations = appointments.filter((a) => a.status === 'Agendado').length;

  // Payments / Financial calculations
  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0);
  const pendingRevenue = payments
    .filter((p) => p.status === 'pending')
    .reduce((acc, p) => acc + p.amount, 0);

  // Average body fat from latest records
  const allBfs = anthropometryRecords.map((r) => r.bodyFatPercentage);
  const avgBf = allBfs.length
    ? (allBfs.reduce((a, b) => a + b, 0) / allBfs.length).toFixed(1)
    : '18.4';

  // Average TDEE
  const avgTdee = patients.length
    ? Math.round(patients.reduce((acc, p) => acc + p.targetCalories, 0) / patients.length)
    : 2250;

  // Average adherence calculation (last 7 days records)
  const adherencePercentages = adherenceRecords.map((rec) => {
    const mealScore = Math.min(100, (rec.completedMealIds.length / 5) * 100);
    const waterScore = Math.min(100, (rec.waterDrankMl / 2500) * 100);
    const workoutScore = rec.trained ? 100 : 50;
    return mealScore * 0.5 + waterScore * 0.3 + workoutScore * 0.2;
  });
  const avgAdherence = adherencePercentages.length
    ? Math.round(adherencePercentages.reduce((a, b) => a + b, 0) / adherencePercentages.length)
    : 88;

  // Nutritional Alerts calculation (> 30 days without update)
  const now = new Date();
  const overdueAlertsList = patients.filter((patient) => {
    const records = anthropometryRecords.filter((r) => r.patientId === patient.id);
    if (records.length === 0) return true;
    const sorted = [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const diffDays = Math.floor(
      (now.getTime() - new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 30;
  });
  const overdueAlertsCount = overdueAlertsList.length;

  const handleSelectPatient = (patientId: string, tab: any = 'overview') => {
    const pat = patients.find((p) => p.id === patientId);
    if (pat) {
      setSelectedPatientForDetail(pat);
      setActivePatientId(pat.id);
      setActiveAdminTab('patients');
      setActivePatientTab(tab);
    }
  };

  const handleOpenPatientApp = (patientId: string) => {
    setActivePatientId(patientId);
    setCurrentView('patient');
  };

  const filteredAppointments = appointments.filter((app) => {
    if (filterAppStatus === 'all') return true;
    return app.status === filterAppStatus;
  });

  return (
    <div className="space-y-6">
      {/* Internal Financial Tracking & Nutritional Programs Quick Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-400">
                Controle Financeiro Interno
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-600">
                Acompanhamento Interno
              </span>
            </div>
            <div className="flex items-baseline space-x-3 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-white">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-300">
                lançados no período
              </span>
              {pendingRevenue > 0 && (
                <span className="text-xs text-amber-300 font-semibold">
                  (R$ {pendingRevenue.toFixed(2)} pendentes)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nutritional Programs Stats */}
        <div className="hidden md:flex items-center space-x-3 border-l border-slate-700/60 pl-4">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 block">
              Programas Contínuos
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-white">
                {patientProgramEnrollments.filter((e) => e.status === 'ativo').length}
              </span>
              <span className="text-xs text-slate-300">
                em tratamento contínuo
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openDiagnosticsModal}
            className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Abrir Painel de Auditoria e Integridade"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Diagnóstico do Sistema</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('programs')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-amber-400/30 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Programas Nutricionais</span>
          </button>

          <button
            onClick={() => {
              const firstPatient = patients[0];
              if (firstPatient) {
                openPaymentModal({
                  patientId: firstPatient.id,
                  patientName: firstPatient.name,
                  amount: 250,
                  title: 'Consulta Nutricional Clínica (Avulsa)',
                  description: 'Valor informado pelo nutricionista para acompanhamento financeiro interno.',
                });
              }
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Informar Valor da Consulta</span>
          </button>
        </div>
      </div>

      {/* 5 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Pacientes Ativos
          </p>
          <p className="text-3xl font-bold mt-1 text-slate-900">{totalPatients}</p>
          <div className="mt-2 flex items-center text-emerald-600 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>+12% este mês</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Consultas do Mês
          </p>
          <p className="text-3xl font-bold mt-1 text-slate-900">
            {appointments.length < 10 ? `0${appointments.length}` : appointments.length}
          </p>
          <p className="mt-2 text-slate-400 text-xs">
            {activeConsultations} agendadas para hoje
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            % Gordura Médio
          </p>
          <p className="text-3xl font-bold mt-1 text-slate-900">{avgBf}%</p>
          <div className="mt-2 flex items-center text-blue-600 text-xs font-semibold">
            <span className="mr-1">↓</span>
            <span>-2.1% v. último ciclo</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Meta Calórica Média
          </p>
          <p className="text-3xl font-bold mt-1 text-slate-900">
            {avgTdee.toLocaleString('pt-BR')}
          </p>
          <p className="mt-2 text-slate-400 text-xs">Kcal / dia prescritas</p>
        </div>

        {/* Card 5: Nutritional Alerts */}
        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Alertas Nutricionais
            </p>
            <BellRing className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black mt-1 text-amber-700">{overdueAlertsCount}</p>
          <div className="mt-2 flex items-center text-amber-700 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
            <span>&gt; 30d sem medição</span>
          </div>
        </div>
      </div>

      {/* Dedicated Nutritional Alerts System Panel */}
      <NutritionalAlertsPanel
        patients={patients}
        anthropometryRecords={anthropometryRecords}
        onSelectPatient={handleSelectPatient}
        onOpenCalendarModal={onOpenCalendarModal}
      />

      {/* Patient Growth Trends & Average VET/TMB Metrics (Recharts) */}
      <AdminAnalyticsCharts />

      {/* Main Grid: Recent Patients Table (2 cols) & Macronutrient / Clinical Panel (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Patients Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Pacientes Recentes</h2>
              <p className="text-xs text-slate-500">
                Acompanhe o status das metas calóricas, IMC e prescrições
              </p>
            </div>
            <button
              id="view-all-patients-btn"
              onClick={() => setActiveAdminTab('patients')}
              className="text-emerald-600 text-xs font-bold hover:underline flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0">
                <tr>
                  <th className="px-6 py-3 border-b border-slate-100">Paciente</th>
                  <th className="px-6 py-3 border-b border-slate-100">Última Consulta & Dobras</th>
                  <th className="px-6 py-3 border-b border-slate-100">Status Meta</th>
                  <th className="px-6 py-3 border-b border-slate-100">IMC</th>
                  <th className="px-6 py-3 border-b border-slate-100 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {patients.map((patient) => {
                  const bmi = calculateBMI(patient.weightKg, patient.heightCm);

                  // Anthropometry recency for this patient
                  const patRecords = anthropometryRecords.filter((r) => r.patientId === patient.id);
                  const sortedPatRecords = [...patRecords].sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
                  const latestPatRecord = sortedPatRecords[0] || null;
                  const daysSinceAnthro = latestPatRecord
                    ? Math.floor((now.getTime() - new Date(latestPatRecord.date).getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  const isAnthroOverdue = !latestPatRecord || (daysSinceAnthro !== null && daysSinceAnthro > 30);

                  // Determine badge styling based on goal / state
                  let badgeClass = 'bg-emerald-100 text-emerald-700';
                  let badgeText = 'DENTRO DA META';
                  if (patient.goal === 'hipertrofia') {
                    badgeClass = 'bg-blue-100 text-blue-700';
                    badgeText = 'GANHO MASSA';
                  } else if (bmi.value > 29) {
                    badgeClass = 'bg-amber-100 text-amber-700';
                    badgeText = 'ALERTA CALORIAS';
                  }

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient.id)}
                      className="hover:bg-slate-50/75 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={patient.avatarUrl}
                            alt={patient.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {patient.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {patient.gender} • {patient.age} anos
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <span className="text-slate-700 block font-medium">
                          {patient.lastConsultationDate || 'Recente'}
                        </span>
                        {isAnthroOverdue ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1 cursor-pointer hover:bg-amber-100 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPatient(patient.id, 'anthropometry');
                            }}
                            title="Medição pendente há mais de 30 dias. Clique para registrar."
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            <span>{daysSinceAnthro !== null ? `Dobras: há ${daysSinceAnthro}d` : 'Sem dobras'}</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-1"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Dobras: há {daysSinceAnthro}d</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold tracking-tight inline-block ${badgeClass}`}
                        >
                          {badgeText}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <span className={`font-semibold ${bmi.color}`}>{bmi.value}</span>
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleSelectPatient(patient.id, 'overview')}
                            className="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
                            title="Abrir Prontuário Completo"
                          >
                            <span>Abrir Prontuário</span>
                          </button>
                          <button
                            onClick={() => handleSelectPatient(patient.id, 'body_evolution')}
                            className="px-2 py-1 text-xs font-semibold bg-indigo-50 text-indigo-800 hover:bg-indigo-100 rounded-md transition-colors"
                            title="Evolução Corporal (Peso, Gordura & Músculo)"
                          >
                            Evolução
                          </button>
                          <button
                            onClick={() => handleSelectPatient(patient.id, 'diet_planner')}
                            className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-md transition-colors"
                            title="Planejador de Dieta"
                          >
                            Dieta
                          </button>
                          <button
                            onClick={() => handleSelectPatient(patient.id, 'anthropometry')}
                            className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                            title="Antropometria"
                          >
                            Dobras
                          </button>
                          <button
                            onClick={() => handleOpenPatientApp(patient.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                            title="Abrir no App do Paciente"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Macronutrient Panel & Highlight of the Day */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-800 text-base">
                Painel de Macronutrientes
              </h2>
              <span className="text-xs text-slate-400">Médias Atuais</span>
            </div>

            <div className="space-y-5">
              {/* Protein bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700">Proteínas (180g)</span>
                  <span className="text-slate-400 font-medium">85% alcançado</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[85%] rounded-full transition-all duration-500" />
                </div>
              </div>

              {/* Carbs bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700">Carboidratos (220g)</span>
                  <span className="text-slate-400 font-medium">102% alcançado</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-full rounded-full transition-all duration-500" />
                </div>
              </div>

              {/* Fats bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700">Gorduras (65g)</span>
                  <span className="text-slate-400 font-medium">60% alcançado</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[60%] rounded-full transition-all duration-500" />
                </div>
              </div>

              {/* Water bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700">Água Diária (3.5L)</span>
                  <span className="text-slate-400 font-medium">2.8L consumidos</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-400 h-full w-[80%] rounded-full transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Destaque do Dia Footer Box */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                Destaque Clínico do Dia
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                O paciente <span className="font-bold text-slate-900">Roberto Nunes</span> atingiu
                a meta de perda de 2.4kg de gordura no primeiro ciclo do plano alimentar.
                Considere reavaliação do VET no próximo retorno.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Calendar Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-base">Agenda & Google Calendar</h3>
                {googleAuth.isConnected ? (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sincronizado
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    OAuth Google Disponível
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Criar, alterar, sincronizar e excluir eventos da agenda</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => onOpenCalendarModal && onOpenCalendarModal()}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerenciar Agenda</span>
            </button>

            <div className="flex space-x-1.5">
              <button
                onClick={() => setFilterAppStatus('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterAppStatus === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({appointments.length})
              </button>
              <button
                onClick={() => setFilterAppStatus('Agendado')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterAppStatus === 'Agendado'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Agendadas ({activeConsultations})
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{app.patientName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    app.status === 'Agendado'
                      ? 'bg-blue-100 text-blue-800'
                      : app.status === 'Concluído'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {app.status}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {app.date} às {app.time} • {app.type}
                </span>
              </div>

              {app.notes && (
                <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                  "{app.notes}"
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-xs">
                <div className="flex items-center gap-2">
                  {app.status === 'Agendado' ? (
                    <button
                      onClick={() => updateAppointmentStatus(app.id, 'Concluído')}
                      className="text-emerald-600 hover:text-emerald-700 font-bold"
                    >
                      ✓ Concluir
                    </button>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Finalizada</span>
                  )}
                  {app.meetLink && (
                    <a
                      href={app.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 text-[11px]"
                      title="Entrar na sala Google Meet"
                    >
                      Meet ↗
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPatient(app.patientId)}
                  className="text-slate-700 hover:text-slate-900 font-semibold"
                >
                  Abrir Prontuário →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
