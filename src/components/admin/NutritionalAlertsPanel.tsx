import React, { useState, useMemo, useEffect } from 'react';
import {
  Patient,
  AnthropometryRecord
} from '../../types';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  Scale,
  Activity,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Copy,
  ExternalLink,
  Search,
  Filter,
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Bell,
  BellRing,
  RotateCcw,
  UserCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface NutritionalAlertItem {
  patient: Patient;
  latestRecord: AnthropometryRecord | null;
  daysSinceUpdate: number;
  daysOverdue: number; // days beyond 30
  status: 'critical' | 'warning' | 'initial_pending' | 'up_to_date';
  formattedLastDate: string;
  weightKg: number;
  bodyFatPercentage: number | null;
  leanMassKg: number | null;
}

interface NutritionalAlertsPanelProps {
  patients: Patient[];
  anthropometryRecords: AnthropometryRecord[];
  onSelectPatient: (patientId: string, tab?: any) => void;
  onOpenCalendarModal?: () => void;
}

type AlertFilterTab = 'all_alerts' | 'critical' | 'warning' | 'initial_pending' | 'up_to_date';

export const NutritionalAlertsPanel: React.FC<NutritionalAlertsPanelProps> = ({
  patients,
  anthropometryRecords,
  onSelectPatient,
  onOpenCalendarModal,
}) => {
  const [activeFilter, setActiveFilter] = useState<AlertFilterTab>('all_alerts');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Persistent snooze state (stored in localStorage with expiration timestamp)
  const [snoozedMap, setSnoozedMap] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('nutricore_snoozed_alerts_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        const nowMs = Date.now();
        // Filter out expired snoozes
        const valid: Record<string, number> = {};
        Object.entries(parsed).forEach(([id, expireMs]) => {
          if (typeof expireMs === 'number' && expireMs > nowMs) {
            valid[id] = expireMs;
          }
        });
        return valid;
      }
    } catch {
      // fallback if storage access fails
    }
    return {};
  });

  // Selected WhatsApp template mode
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<'routine' | 'hypertrophy' | 'short'>('routine');
  const [selectedPatientForWhatsApp, setSelectedPatientForWhatsApp] = useState<NutritionalAlertItem | null>(null);
  const [isCopiedWhatsApp, setIsCopiedWhatsApp] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Sync snooze map to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nutricore_snoozed_alerts_v1', JSON.stringify(snoozedMap));
    } catch {
      // ignore storage quota errors
    }
  }, [snoozedMap]);

  const snoozedPatientIds = useMemo(() => Object.keys(snoozedMap), [snoozedMap]);

  // Reference timestamp (simulated or real now)
  const now = useMemo(() => new Date(), []);

  // Compute alerts for all patients
  const allAlertItems: NutritionalAlertItem[] = useMemo(() => {
    return patients.map((patient) => {
      // Find all records for this patient
      const records = anthropometryRecords.filter((r) => r.patientId === patient.id);
      
      // Sort to find the latest
      const sortedRecords = [...records].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestRecord = sortedRecords[0] || null;

      let daysSinceUpdate = 0;
      let formattedLastDate = 'Nunca realizada';
      let status: 'critical' | 'warning' | 'initial_pending' | 'up_to_date' = 'up_to_date';

      if (latestRecord) {
        const recordDate = new Date(latestRecord.date);
        const diffMs = Math.max(0, now.getTime() - recordDate.getTime());
        daysSinceUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        const dateParts = latestRecord.date.split('-');
        if (dateParts.length === 3) {
          formattedLastDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        } else {
          formattedLastDate = latestRecord.date;
        }

        if (daysSinceUpdate > 60) {
          status = 'critical';
        } else if (daysSinceUpdate > 30) {
          status = 'warning';
        } else {
          status = 'up_to_date';
        }
      } else {
        // Patient has never had an anthropometric record
        const createdDate = patient.createdAt ? new Date(patient.createdAt) : new Date(2026, 5, 1);
        const diffMs = Math.max(0, now.getTime() - createdDate.getTime());
        daysSinceUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        status = 'initial_pending';
        formattedLastDate = 'Nenhuma medição';
      }

      const daysOverdue = Math.max(0, daysSinceUpdate - 30);
      const weightKg = latestRecord?.weightKg ?? patient.weightKg;
      const bodyFatPercentage = latestRecord?.bodyFatPercentage ?? null;
      const leanMassKg = latestRecord?.leanMassKg ?? null;

      return {
        patient,
        latestRecord,
        daysSinceUpdate,
        daysOverdue,
        status,
        formattedLastDate,
        weightKg,
        bodyFatPercentage,
        leanMassKg,
      };
    });
  }, [patients, anthropometryRecords, now]);

  // Overdue alerts (status is critical, warning, or initial_pending)
  const overdueAlerts = useMemo(() => {
    return allAlertItems.filter(
      (item) => item.status !== 'up_to_date' && !snoozedPatientIds.includes(item.patient.id)
    );
  }, [allAlertItems, snoozedPatientIds]);

  const criticalCount = useMemo(
    () => allAlertItems.filter((i) => i.status === 'critical' && !snoozedPatientIds.includes(i.patient.id)).length,
    [allAlertItems, snoozedPatientIds]
  );

  const warningCount = useMemo(
    () => allAlertItems.filter((i) => i.status === 'warning' && !snoozedPatientIds.includes(i.patient.id)).length,
    [allAlertItems, snoozedPatientIds]
  );

  const initialPendingCount = useMemo(
    () => allAlertItems.filter((i) => i.status === 'initial_pending' && !snoozedPatientIds.includes(i.patient.id)).length,
    [allAlertItems, snoozedPatientIds]
  );

  const upToDateCount = useMemo(
    () => allAlertItems.filter((i) => i.status === 'up_to_date').length,
    [allAlertItems]
  );

  // Filtered items based on active tab and search query
  const filteredItems = useMemo(() => {
    let list: NutritionalAlertItem[] = [];

    if (activeFilter === 'all_alerts') {
      list = allAlertItems.filter(
        (i) => i.status !== 'up_to_date' && !snoozedPatientIds.includes(i.patient.id)
      );
    } else if (activeFilter === 'critical') {
      list = allAlertItems.filter(
        (i) => i.status === 'critical' && !snoozedPatientIds.includes(i.patient.id)
      );
    } else if (activeFilter === 'warning') {
      list = allAlertItems.filter(
        (i) => i.status === 'warning' && !snoozedPatientIds.includes(i.patient.id)
      );
    } else if (activeFilter === 'initial_pending') {
      list = allAlertItems.filter(
        (i) => i.status === 'initial_pending' && !snoozedPatientIds.includes(i.patient.id)
      );
    } else if (activeFilter === 'up_to_date') {
      list = allAlertItems.filter((i) => i.status === 'up_to_date');
    }

    // Sort: most overdue first
    list.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.patient.name.toLowerCase().includes(q) ||
          i.patient.email.toLowerCase().includes(q) ||
          i.patient.phone.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allAlertItems, activeFilter, searchQuery, snoozedPatientIds]);

  const handleSnooze = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expireTimestamp = Date.now() + sevenDaysInMs;
    setSnoozedMap((prev) => ({
      ...prev,
      [patientId]: expireTimestamp,
    }));
  };

  const handleRestoreSnoozed = () => {
    setSnoozedMap({});
  };

  const handleOpenWhatsAppModal = (item: NutritionalAlertItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPatientForWhatsApp(item);
    setIsCopiedWhatsApp(false);
  };

  const getWhatsAppMessage = (item: NutritionalAlertItem, template = whatsAppTemplate) => {
    const firstName = item.patient.name.split(' ')[0];
    if (item.status === 'initial_pending') {
      if (template === 'short') {
        return `Olá, ${firstName}! Aqui é da NutriCore Pro. Vamos agendar sua 1ª avaliação física completa para iniciarmos seu plano alimentar?`;
      }
      return `Olá, ${firstName}! Tudo bem? Aqui é da Clínica NutriCore Pro. Vimos que seu cadastro está ativo, mas ainda não agendamos sua primeira avaliação antropométrica completa (dobras cutâneas e bioimpedância). Essa etapa é fundamental para personalizarmos seu plano alimentar com exatidão. Vamos agendar seu horário?`;
    }

    if (template === 'short') {
      return `Olá, ${firstName}! Tudo bem? Sua última avaliação antropométrica foi há ${item.daysSinceUpdate} dias. Que tal agendarmos seu retorno para atualizar as medidas e ajustar o plano?`;
    }

    if (template === 'hypertrophy') {
      return `Olá, ${firstName}! Tudo bem? Aqui é da Clínica NutriCore Pro. Notamos que sua última avaliação física foi há ${item.daysSinceUpdate} dias (${item.formattedLastDate}). Para avaliarmos se você ganhou massa muscular e perdeu gordura nesse ciclo, é essencial medirmos novamente. Podemos agendar seu retorno nesta semana?`;
    }

    // Default 'routine'
    return `Olá, ${firstName}! Tudo bem? Aqui é da Clínica NutriCore Pro. Notamos que sua última avaliação física e medição antropométrica foi realizada há ${item.daysSinceUpdate} dias (${item.formattedLastDate}). Para acompanharmos sua evolução de peso, percentual de gordura e massa magra de perto, o recomendado é reavaliarmos a cada 30 dias. Que tal agendarmos seu retorno para atualizar suas medidas e ajustar o cardápio?`;
  };

  const handleCopyWhatsApp = () => {
    if (!selectedPatientForWhatsApp) return;
    const msg = getWhatsAppMessage(selectedPatientForWhatsApp);
    navigator.clipboard.writeText(msg);
    setIsCopiedWhatsApp(true);
    setTimeout(() => setIsCopiedWhatsApp(false), 2500);
  };

  const handleSendWhatsAppWeb = () => {
    if (!selectedPatientForWhatsApp) return;
    const msg = getWhatsAppMessage(selectedPatientForWhatsApp);
    const cleanPhone = selectedPatientForWhatsApp.patient.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200/90 shadow-xs overflow-hidden transition-all">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-slate-50 p-4 sm:p-5 border-b border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 flex items-center justify-center animate-pulse">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Alertas Nutricionais & Antropométricos</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300">
                {overdueAlerts.length} pacientes &gt; 30 dias
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Identificação automática de pacientes sem reavaliação física há mais de 30 dias para evitar desatualização do plano alimentar.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {snoozedPatientIds.length > 0 && (
            <button
              onClick={handleRestoreSnoozed}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-1 cursor-pointer"
              title="Restaurar alertas dispensados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar ({snoozedPatientIds.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={isPanelCollapsed ? 'Expandir painel' : 'Recolher painel'}
          >
            {isPanelCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isPanelCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Controls: Filter Tabs & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveFilter('all_alerts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  activeFilter === 'all_alerts'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Todos com Alerta</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'all_alerts' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {overdueAlerts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('critical')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  activeFilter === 'critical'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Críticos (&gt; 60 dias)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'critical' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
                }`}>
                  {criticalCount}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('warning')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  activeFilter === 'warning'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Atenção (31-60 dias)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'warning' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {warningCount}
                </span>
              </button>

              {initialPendingCount > 0 && (
                <button
                  onClick={() => setActiveFilter('initial_pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                    activeFilter === 'initial_pending'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-purple-500" />
                  <span>Sem Medição Inicial</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === 'initial_pending' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {initialPendingCount}
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveFilter('up_to_date')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  activeFilter === 'up_to_date'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Em Dia (≤ 30 dias)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'up_to_date' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {upToDateCount}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar paciente nos alertas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Alert Cards Grid */}
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                {activeFilter === 'up_to_date'
                  ? 'Nenhum paciente cadastrado como em dia nesta visualização.'
                  : 'Nenhum paciente pendente nesta categoria!'}
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {activeFilter === 'all_alerts'
                  ? 'Todas as medições antropométricas estão atualizadas no período recomendado de 30 dias.'
                  : 'Alterne os filtros acima para consultar outros estados de reavaliação.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredItems.map((item) => {
                const isCritical = item.status === 'critical';
                const isWarning = item.status === 'warning';
                const isPendingInitial = item.status === 'initial_pending';
                const isUpToDate = item.status === 'up_to_date';

                let borderClass = 'border-slate-200';
                let badgeClass = 'bg-slate-100 text-slate-700';
                let statusLabel = 'Em dia';

                if (isCritical) {
                  borderClass = 'border-rose-300 bg-rose-50/20 hover:border-rose-400';
                  badgeClass = 'bg-rose-100 text-rose-800 border border-rose-200';
                  statusLabel = `CRÍTICO: ${item.daysSinceUpdate} dias sem medir`;
                } else if (isWarning) {
                  borderClass = 'border-amber-300 bg-amber-50/20 hover:border-amber-400';
                  badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200';
                  statusLabel = `ATENÇÃO: ${item.daysSinceUpdate} dias sem medir`;
                } else if (isPendingInitial) {
                  borderClass = 'border-purple-300 bg-purple-50/20 hover:border-purple-400';
                  badgeClass = 'bg-purple-100 text-purple-800 border border-purple-200';
                  statusLabel = `INICIAL: Sem medição registrada`;
                } else if (isUpToDate) {
                  borderClass = 'border-emerald-200 bg-emerald-50/15 hover:border-emerald-300';
                  badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                  statusLabel = `EM DIA: há ${item.daysSinceUpdate} dias`;
                }

                return (
                  <div
                    key={item.patient.id}
                    onClick={() => onSelectPatient(item.patient.id, 'overview')}
                    className={`p-4 rounded-2xl border transition-all hover:shadow-sm cursor-pointer space-y-3 bg-white ${borderClass}`}
                  >
                    {/* Header: Patient identity & overdue badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.patient.avatarUrl}
                          alt={item.patient.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-slate-900 text-sm">{item.patient.name}</h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.patient.goal === 'emagrecimento'
                                  ? 'bg-amber-100 text-amber-800'
                                  : item.patient.goal === 'hipertrofia'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.patient.goal === 'emagrecimento'
                                ? 'Emagrecimento'
                                : item.patient.goal === 'hipertrofia'
                                ? 'Hipertrofia'
                                : 'Saúde Geral'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {item.patient.gender} • {item.patient.age} anos • {item.patient.phone}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0 ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Metrics snapshot row */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">ÚLTIMO PESO</span>
                        <span className="text-xs font-black text-slate-800">{item.weightKg} kg</span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">% GORDURA</span>
                        <span className="text-xs font-black text-emerald-700">
                          {item.bodyFatPercentage !== null ? `${item.bodyFatPercentage}%` : 'Pendente'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">ÚLTIMA MEDIÇÃO</span>
                        <span className="text-[11px] font-bold text-slate-700 truncate block">
                          {item.formattedLastDate}
                        </span>
                      </div>
                    </div>

                    {/* Clinical Note on Overdue Impact */}
                    <div className="text-[11px] text-slate-600 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20 flex items-start space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        {item.daysOverdue > 0 ? (
                          <span>
                            <strong>{item.daysOverdue} dias de atraso</strong> além da recomendação clínica de 30 dias. A composição corporal pode ter variado significativamente.
                          </span>
                        ) : (
                          <span>Avaliação dentro do intervalo ótimo de acompanhamento (30 dias).</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-100 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(item.patient.id, 'anthropometry');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1 transition-colors shadow-2xs cursor-pointer"
                          title="Registrar nova avaliação de dobras / bioimpedância"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>Lançar Dobras</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(item.patient.id, 'body_evolution');
                          }}
                          className="px-2.5 py-1.5 bg-sky-50 text-sky-800 hover:bg-sky-100 rounded-lg font-semibold flex items-center space-x-1 transition-colors border border-sky-200 cursor-pointer"
                          title="Visualizar gráfico de evolução temporal de peso, gordura e massa magra"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                          <span>Ver Evolução</span>
                        </button>

                        <button
                          onClick={(e) => handleOpenWhatsAppModal(item, e)}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-semibold flex items-center space-x-1 transition-colors border border-emerald-200 cursor-pointer"
                          title="Lembrete pré-formatado via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lembrete</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-1">
                        {!isUpToDate && (
                          <button
                            onClick={(e) => handleSnooze(item.patient.id, e)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Dispensar alerta temporariamente nesta sessão"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(item.patient.id, 'overview');
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Abrir Prontuário Completo"
                        >
                          <ChevronRight className="w-4 h-4" />
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

      {/* WhatsApp Reminder Modal */}
      {selectedPatientForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Lembrete de Reavaliação Antropométrica
                  </h3>
                  <p className="text-xs text-slate-500">
                    Para: <strong>{selectedPatientForWhatsApp.patient.name}</strong> ({selectedPatientForWhatsApp.patient.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForWhatsApp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Modelo da Mensagem:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWhatsAppTemplate('routine');
                    setIsCopiedWhatsApp(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                    whatsAppTemplate === 'routine'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Rotina (30 Dias)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWhatsAppTemplate('hypertrophy');
                    setIsCopiedWhatsApp(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                    whatsAppTemplate === 'hypertrophy'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Foco Evolução/Músculo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWhatsAppTemplate('short');
                    setIsCopiedWhatsApp(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                    whatsAppTemplate === 'short'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Mensagem Curta
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Mensagem Personalizada Gerada:
                </label>
                <span className="text-[11px] text-slate-500">
                  {whatsAppTemplate === 'routine' && 'Padrão Clínico'}
                  {whatsAppTemplate === 'hypertrophy' && 'Foco em Hipertrofia & Composição'}
                  {whatsAppTemplate === 'short' && 'Direta & Objetiva'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans select-all whitespace-pre-wrap">
                {getWhatsAppMessage(selectedPatientForWhatsApp)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyWhatsApp}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                {isCopiedWhatsApp ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copiado para Área de Transferência!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedPatientForWhatsApp(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Fechar
                </button>
                <button
                  onClick={handleSendWhatsAppWeb}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir WhatsApp Web</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
