import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import {
  NutritionProgramTemplate,
  PatientProgramEnrollment,
  NutritionGoal,
} from '../../types';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Edit2,
  Trash2,
  Check,
  ChevronRight,
  AlertCircle,
  FileText,
  UserCheck,
  Percent,
  PlayCircle,
  PauseCircle,
  CheckCheck,
  X,
  Target
} from 'lucide-react';

export const NutritionProgramsView: React.FC = () => {
  const {
    patients,
    programTemplates,
    patientProgramEnrollments,
    addProgramTemplate,
    updateProgramTemplate,
    deleteProgramTemplate,
    enrollPatientInProgram,
    updatePatientEnrollment,
    deletePatientEnrollment,
    registerProgramSession,
    setSelectedPatientForDetail,
    setActiveAdminTab,
    setActivePatientTab,
  } = useNutrition();

  const [activeTab, setActiveTab] = useState<'enrollments' | 'catalog'>('enrollments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'concluido' | 'pausado'>('all');

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isRecordSessionModalOpen, setIsRecordSessionModalOpen] = useState(false);
  const [selectedEnrollmentForSession, setSelectedEnrollmentForSession] = useState<PatientProgramEnrollment | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NutritionProgramTemplate | null>(null);

  // New Enrollment Form State
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState(programTemplates[0]?.id || '');
  const [enrollTitle, setEnrollTitle] = useState(programTemplates[0]?.title || 'Programa Emagrecimento Consciente');
  const [enrollDurationMonths, setEnrollDurationMonths] = useState<number>(programTemplates[0]?.durationMonths || 3);
  const [enrollTotalSessions, setEnrollTotalSessions] = useState<number>(programTemplates[0]?.totalConsultations || 6);
  const [enrollStartDate, setEnrollStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [enrollTotalValue, setEnrollTotalValue] = useState<number>(programTemplates[0]?.suggestedPrice || 1200);
  const [enrollPaymentStatus, setEnrollPaymentStatus] = useState<'pago' | 'pendente' | 'parcial' | 'cortesia'>('pago');
  const [enrollPaymentMethod, setEnrollPaymentMethod] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia' | 'parcelado_interno'>('pix');
  const [enrollInstallments, setEnrollInstallments] = useState<number>(1);
  const [enrollObjectives, setEnrollObjectives] = useState('');
  const [enrollNotes, setEnrollNotes] = useState('');

  // New/Edit Template Form State
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateDurationMonths, setTemplateDurationMonths] = useState<number>(3);
  const [templateTotalConsultations, setTemplateTotalConsultations] = useState<number>(6);
  const [templateFrequency, setTemplateFrequency] = useState('Quinzenal (a cada 15 dias)');
  const [templatePrice, setTemplatePrice] = useState<number>(1200);
  const [templateGoal, setTemplateGoal] = useState<NutritionGoal>('emagrecimento');
  const [templateFeaturesStr, setTemplateFeaturesStr] = useState(
    '6 Consultas clínicas periódicas com bioimpedância\nAjustes dinâmicos de plano alimentar\nSuporte direto via WhatsApp para dúvidas'
  );

  // Record Session Form State
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNotes, setSessionNotes] = useState('');

  // Handle template selection change in enrollment modal
  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found = programTemplates.find((t) => t.id === tplId);
    if (found) {
      setEnrollTitle(found.title);
      setEnrollDurationMonths(found.durationMonths);
      setEnrollTotalSessions(found.totalConsultations);
      setEnrollTotalValue(found.suggestedPrice);
    }
  };

  // Open Template Modal for creation or edit
  const handleOpenTemplateModal = (tpl?: NutritionProgramTemplate) => {
    if (tpl) {
      setEditingTemplate(tpl);
      setTemplateTitle(tpl.title);
      setTemplateDescription(tpl.description);
      setTemplateDurationMonths(tpl.durationMonths);
      setTemplateTotalConsultations(tpl.totalConsultations);
      setTemplateFrequency(tpl.suggestedFrequency);
      setTemplatePrice(tpl.suggestedPrice);
      setTemplateGoal((tpl.targetGoal as NutritionGoal) || 'emagrecimento');
      setTemplateFeaturesStr(tpl.includedFeatures.join('\n'));
    } else {
      setEditingTemplate(null);
      setTemplateTitle('');
      setTemplateDescription('');
      setTemplateDurationMonths(3);
      setTemplateTotalConsultations(6);
      setTemplateFrequency('Quinzenal (a cada 15 dias)');
      setTemplatePrice(1200);
      setTemplateGoal('emagrecimento');
      setTemplateFeaturesStr(
        'Consultas clínicas com antropometria\nAjustes ilimitados de cardápio\nCanal de dúvidas via WhatsApp\nPrescrições individualizadas'
      );
    }
    setIsTemplateModalOpen(true);
  };

  // Save Template
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateTitle.trim()) return;

    const featuresList = templateFeaturesStr
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    if (editingTemplate) {
      updateProgramTemplate(editingTemplate.id, {
        title: templateTitle,
        description: templateDescription,
        durationMonths: templateDurationMonths,
        durationDays: templateDurationMonths * 30,
        totalConsultations: templateTotalConsultations,
        suggestedFrequency: templateFrequency,
        suggestedPrice: templatePrice,
        targetGoal: templateGoal,
        includedFeatures: featuresList,
      });
    } else {
      addProgramTemplate({
        title: templateTitle,
        description: templateDescription,
        durationMonths: templateDurationMonths,
        durationDays: templateDurationMonths * 30,
        totalConsultations: templateTotalConsultations,
        suggestedFrequency: templateFrequency,
        suggestedPrice: templatePrice,
        targetGoal: templateGoal,
        isActive: true,
        includedFeatures: featuresList,
      });
    }

    setIsTemplateModalOpen(false);
  };

  // Save Enrollment
  const handleSaveEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !enrollTitle.trim()) return;

    enrollPatientInProgram({
      patientId: selectedPatientId,
      programTemplateId: selectedTemplateId,
      title: enrollTitle,
      startDate: enrollStartDate,
      durationMonths: enrollDurationMonths,
      totalConsultations: enrollTotalSessions,
      totalValue: enrollTotalValue,
      paymentStatus: enrollPaymentStatus,
      paymentMethod: enrollPaymentMethod,
      installments: enrollInstallments,
      clinicalObjectives: enrollObjectives,
      notes: enrollNotes,
    });

    setIsEnrollModalOpen(false);
    // Reset
    setEnrollObjectives('');
    setEnrollNotes('');
  };

  // Open Record Session Modal
  const handleOpenRecordSession = (enrollment: PatientProgramEnrollment) => {
    setSelectedEnrollmentForSession(enrollment);
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSessionNotes('');
    setIsRecordSessionModalOpen(true);
  };

  // Save Session
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentForSession) return;

    registerProgramSession(selectedEnrollmentForSession.id, {
      date: sessionDate,
      notes: sessionNotes || `Consulta de acompanhamento realizada no dia ${sessionDate}.`,
    });

    setIsRecordSessionModalOpen(false);
    setSelectedEnrollmentForSession(null);
  };

  // Filter enrollments
  const filteredEnrollments = patientProgramEnrollments.filter((enr) => {
    const matchesSearch =
      enr.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enr.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || enr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Metrics
  const activeEnrollments = patientProgramEnrollments.filter((e) => e.status === 'ativo');
  const completedEnrollments = patientProgramEnrollments.filter((e) => e.status === 'concluido');
  const totalSessionsDone = patientProgramEnrollments.reduce((acc, e) => acc + e.completedConsultations, 0);
  const totalSessionsContracted = patientProgramEnrollments.reduce((acc, e) => acc + e.totalConsultations, 0);
  const totalInternalRevenue = patientProgramEnrollments.reduce((acc, e) => acc + e.internalFinance.totalValue, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleNavigateToPatient = (patientId: string) => {
    const target = patients.find((p) => p.id === patientId);
    if (target) {
      setSelectedPatientForDetail(target);
      setActiveAdminTab('patients');
      setActivePatientTab('programs');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Programas de Acompanhamento Nutricional
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestão de tratamentos contínuos por período (tempo, pacote de consultas e controle financeiro interno), diferenciados de consultas avulsas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenTemplateModal()}
            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Criar Modelo de Programa</span>
          </button>

          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Matricular Paciente em Programa</span>
          </button>
        </div>
      </div>

      {/* Internal Control Note Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-900">
        <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold">Acompanhamento Contínuo & Controle Interno de Consultas:</span>{' '}
          Diferente das consultas avulsas, os programas cobrem um ciclo fechado de tratamento (ex: 3 a 6 meses com retornos periódicos). O valor acordado é informado diretamente pelo nutricionista para gestão interna, e cada atendimento realizado desconta da cota do programa sem gerar cobrança avulsa.
        </div>
      </div>

      {/* Top Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pacientes em Tratamento
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{activeEnrollments.length}</span>
            <span className="text-xs font-semibold text-emerald-600">ativos</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {completedEnrollments.length} tratamentos já concluídos com êxito
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Consultas dos Programas
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-indigo-900">{totalSessionsDone}</span>
            <span className="text-xs font-semibold text-slate-500">de {totalSessionsContracted} realizadas</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{
                width: `${totalSessionsContracted > 0 ? (totalSessionsDone / totalSessionsContracted) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Receita Interna dos Programas
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{formatCurrency(totalInternalRevenue)}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Informado para controle interno do consultório
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Catálogo de Tratamentos
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{programTemplates.length}</span>
            <span className="text-xs font-semibold text-amber-700">modelos configurados</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Prontos para contratação com 1 clique
          </p>
        </div>
      </div>

      {/* Main Tabs (Enrollments vs Templates Catalog) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('enrollments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'enrollments'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pacientes em Acompanhamento ({patientProgramEnrollments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'catalog'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Catálogo de Modelos de Programas ({programTemplates.length})</span>
        </button>
      </div>

      {/* Tab 1: Enrollments List */}
      {activeTab === 'enrollments' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por paciente ou programa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="all">Todos os Status</option>
                <option value="ativo">Ativo (Em Andamento)</option>
                <option value="concluido">Concluído</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
          </div>

          {/* Cards of enrolled patients */}
          {filteredEnrollments.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Nenhum programa de acompanhamento encontrado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Matricule um paciente em um tratamento contínuo com número definido de consultas e acompanhamento programado.
              </p>
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Matricular Paciente</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEnrollments.map((enr) => {
                const progressPct = Math.round(
                  (enr.completedConsultations / enr.totalConsultations) * 100
                );
                const remaining = enr.totalConsultations - enr.completedConsultations;
                const targetPatient = patients.find((p) => p.id === enr.patientId);

                return (
                  <div
                    key={enr.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Top Row: Patient info & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={targetPatient?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={enr.patientName}
                          className="w-12 h-12 rounded-xl object-cover border border-emerald-500/20"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                              {enr.patientName}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                enr.status === 'ativo'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : enr.status === 'concluido'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {enr.status === 'ativo' ? '🟢 Em Andamento' : enr.status === 'concluido' ? '🏁 Concluído' : '⏸️ Pausado'}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-emerald-700 block mt-0.5">
                            {enr.title}
                          </span>
                        </div>
                      </div>

                      {/* Financial info pill */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold block">CONTROLE FINANCEIRO</span>
                          <span className="font-black text-slate-900">
                            {formatCurrency(enr.internalFinance.totalValue)}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1.5">
                            ({enr.internalFinance.paymentStatus === 'pago' ? 'Quitado' : enr.internalFinance.paymentStatus} • {enr.internalFinance.paymentMethod})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Consultations Counter */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          Progresso de Consultas: {enr.completedConsultations} de {enr.totalConsultations} realizadas
                        </span>
                        <span className="font-bold text-emerald-700">{progressPct}% concluído</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>Início: {enr.startDate} • Término Previsto: {enr.endDate}</span>
                        <span className="font-semibold text-slate-600">
                          {remaining > 0 ? `${remaining} consultas restantes no plano` : 'Todas as consultas realizadas'}
                        </span>
                      </div>
                    </div>

                    {/* Sessions Visual Timeline Tracker */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Histórico de Atendimentos do Programa:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {Array.from({ length: enr.totalConsultations }).map((_, idx) => {
                          const sessionNumber = idx + 1;
                          const sessionRecord = enr.sessions.find((s) => s.sessionNumber === sessionNumber);
                          const isDone = sessionNumber <= enr.completedConsultations;

                          return (
                            <div
                              key={sessionNumber}
                              className={`p-2 rounded-lg border text-center transition-all ${
                                isDone
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                  : sessionRecord?.status === 'agendada'
                                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                                  : 'bg-white border-slate-200 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-1">
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                                )}
                                <span className="text-[11px] font-bold">
                                  Sessão {sessionNumber}
                                </span>
                              </div>
                              <span className="text-[10px] block mt-0.5 font-medium truncate">
                                {sessionRecord?.date ? sessionRecord.date : isDone ? 'Concluída' : 'Pendente'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenRecordSession(enr)}
                          disabled={enr.completedConsultations >= enr.totalConsultations}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Registrar Consulta Realizada (+1)</span>
                        </button>

                        <button
                          onClick={() => handleNavigateToPatient(enr.patientId)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver no Prontuário</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        {enr.status === 'ativo' ? (
                          <button
                            onClick={() => updatePatientEnrollment(enr.id, { status: 'concluido' })}
                            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium transition-colors"
                            title="Marcar como Concluído"
                          >
                            <CheckCheck className="w-3.5 h-3.5 inline mr-1" />
                            <span>Concluir</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => updatePatientEnrollment(enr.id, { status: 'ativo' })}
                            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 text-xs font-medium transition-colors"
                            title="Reativar Programa"
                          >
                            <PlayCircle className="w-3.5 h-3.5 inline mr-1" />
                            <span>Reativar</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (confirm(`Remover matrícula do programa para ${enr.patientName}?`)) {
                              deletePatientEnrollment(enr.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir Matrícula"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Catalog of Program Templates */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Modelos padronizados com duração, pacote de consultas e precificação pré-configurada para facilitar a venda e o acompanhamento contínuo no consultório.
            </p>
            <button
              onClick={() => handleOpenTemplateModal()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Modelo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                        {tpl.targetGoal === 'emagrecimento'
                          ? 'Perda de Peso'
                          : tpl.targetGoal === 'hipertrofia'
                          ? 'Ganho de Massa'
                          : 'Saúde & Longevidade'}
                      </span>
                      <h3 className="font-black text-slate-900 text-base mt-1.5">
                        {tpl.title}
                      </h3>
                    </div>
                    <span className="text-lg font-black text-slate-900 shrink-0">
                      {formatCurrency(tpl.suggestedPrice)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {tpl.description}
                  </p>

                  {/* Highlights info pills */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">DURAÇÃO</span>
                      <span className="font-bold text-slate-800">{tpl.durationMonths} meses</span>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">CONSULTAS</span>
                      <span className="font-bold text-slate-800">{tpl.totalConsultations} sessões</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">FREQUÊNCIA</span>
                      <span className="font-bold text-slate-800 truncate block px-1">
                        {tpl.suggestedFrequency.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Included features checklist */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      O que está incluído no programa:
                    </span>
                    {tpl.includedFeatures.map((feat, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenTemplateModal(tpl)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar Modelo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir modelo "${tpl.title}"?`)) {
                          deleteProgramTemplate(tpl.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir Modelo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setEnrollTitle(tpl.title);
                      setEnrollDurationMonths(tpl.durationMonths);
                      setEnrollTotalSessions(tpl.totalConsultations);
                      setEnrollTotalValue(tpl.suggestedPrice);
                      setIsEnrollModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Matricular Paciente</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Enroll Patient in Program */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Award className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Matricular Paciente em Programa Contínuo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cadastre o tratamento contínuo com número fixo de consultas e acompanhamento programado.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEnrollment} className="space-y-4">
              {/* Select Patient */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Paciente a ser Matriculado: *
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.goal})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select or Base Template */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Modelo Base de Programa:
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {programTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.durationMonths} meses, {t.totalConsultations} consultas - {formatCurrency(t.suggestedPrice)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome do Tratamento / Programa Contínuo: *
                </label>
                <input
                  type="text"
                  value={enrollTitle}
                  onChange={(e) => setEnrollTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  required
                />
              </div>

              {/* Duration and Consultations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nº de Consultas: *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={enrollTotalSessions}
                    onChange={(e) => setEnrollTotalSessions(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-800"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Data de Início:
                  </label>
                  <input
                    type="date"
                    value={enrollStartDate}
                    onChange={(e) => setEnrollStartDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Internal Finance Section */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Controle Financeiro Interno do Programa:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Valor Total Acordado (R$): *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={enrollTotalValue}
                      onChange={(e) => setEnrollTotalValue(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Forma Informada:
                    </label>
                    <select
                      value={enrollPaymentMethod}
                      onChange={(e) => setEnrollPaymentMethod(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2"
                    >
                      <option value="pix">PIX</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="transferencia">Transferência Bancária</option>
                      <option value="parcelado_interno">Parcelamento Direto</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Status Interno:
                    </label>
                    <select
                      value={enrollPaymentStatus}
                      onChange={(e) => setEnrollPaymentStatus(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-semibold text-emerald-800"
                    >
                      <option value="pago">Quitado (Pago)</option>
                      <option value="pendente">Pendente</option>
                      <option value="parcial">Parcial</option>
                      <option value="cortesia">Cortesia / Parceria</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Objectives & Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Objetivos Clínicos do Tratamento:
                </label>
                <textarea
                  rows={2}
                  value={enrollObjectives}
                  onChange={(e) => setEnrollObjectives(e.target.value)}
                  placeholder="Ex: Redução de 5% de gordura corporal, regulação do trânsito intestinal e aumento de disposição."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
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
                  Salvar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Program Template */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingTemplate ? 'Editar Modelo de Programa' : 'Novo Modelo de Programa Nutricional'}
              </h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título do Programa: *
                </label>
                <input
                  type="text"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="Ex: Programa Hipertrofia Máxima (6 Meses)"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descrição Clínica:
                </label>
                <textarea
                  rows={2}
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Descrição das etapas do tratamento e público indicado..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Meses:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={templateDurationMonths}
                    onChange={(e) => setTemplateDurationMonths(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Consultas:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={templateTotalConsultations}
                    onChange={(e) => setTemplateTotalConsultations(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-bold text-emerald-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Preço (R$):
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={templatePrice}
                    onChange={(e) => setTemplatePrice(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Objetivo:
                  </label>
                  <select
                    value={templateGoal}
                    onChange={(e) => setTemplateGoal(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-2"
                  >
                    <option value="emagrecimento">Emagrecimento</option>
                    <option value="hipertrofia">Hipertrofia</option>
                    <option value="saude_geral">Saúde Geral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Periodicidade Sugerida:
                </label>
                <input
                  type="text"
                  value={templateFrequency}
                  onChange={(e) => setTemplateFrequency(e.target.value)}
                  placeholder="Ex: Quinzenal (a cada 15 dias)"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Itens Inclusos (1 por linha):
                </label>
                <textarea
                  rows={4}
                  value={templateFeaturesStr}
                  onChange={(e) => setTemplateFeaturesStr(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  {editingTemplate ? 'Salvar Alterações' : 'Criar Modelo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Consultation Session */}
      {isRecordSessionModalOpen && selectedEnrollmentForSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Registrar Atendimento do Programa
                  </h3>
                  <span className="text-xs text-emerald-700 font-semibold block">
                    {selectedEnrollmentForSession.patientName} • Sessão {selectedEnrollmentForSession.completedConsultations + 1} de {selectedEnrollmentForSession.totalConsultations}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsRecordSessionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Data do Atendimento / Consulta: *
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Anotações da Consulta / Evolução Clínica:
                </label>
                <textarea
                  rows={3}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Ex: Reavaliação de dobras, perda de 1.4kg de gordura e novo ajuste calórico no café da manhã."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                Esta consulta será computada como a <strong>Sessão {selectedEnrollmentForSession.completedConsultations + 1}</strong> do pacote do paciente, sem gerar cobrança avulsa.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordSessionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Confirmar Consulta Realizada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
