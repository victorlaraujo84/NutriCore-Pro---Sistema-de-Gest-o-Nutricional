import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { Appointment } from '../../types';
import {
  Calendar,
  Clock,
  User,
  FileText,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  X,
  AlertCircle,
  LogIn,
  LogOut,
  CalendarCheck,
  MapPin,
  Sparkles,
  Copy
} from 'lucide-react';

export const GoogleCalendarManagerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    patients,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    googleAuth,
    isSyncingCalendar,
    connectGoogleAccount,
    connectDemoGoogleAccount,
    disconnectGoogleAccount,
    syncAppointmentsWithGoogle,
    googleClientId,
    setGoogleClientId,
    clinicConfig,
    patientProgramEnrollments
  } = useNutrition();

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Agendado' | 'Concluído' | 'Cancelado'>('all');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [customClientIdInput, setCustomClientIdInput] = useState<string>(googleClientId);

  // Form state
  const [patientId, setPatientId] = useState<string>(patients[0]?.id || '');
  const [customPatientName, setCustomPatientName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('09:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [type, setType] = useState<Appointment['type']>('Retorno');
  const [status, setStatus] = useState<Appointment['status']>('Agendado');
  const [notes, setNotes] = useState<string>('');
  const [syncToGoogleCheck, setSyncToGoogleCheck] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Internal Financial & Program Linking state
  const [isLinkedToProgram, setIsLinkedToProgram] = useState<boolean>(false);
  const [consultationFee, setConsultationFee] = useState<number>(250);
  const [internalPaymentStatus, setInternalPaymentStatus] = useState<'pago' | 'pendente' | 'isento' | 'incluso_no_programa'>('pago');

  if (!isOpen) return null;

  const handleConnect = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsConnecting(true);
    try {
      await connectGoogleAccount(customClientIdInput);
      setSuccessMsg('Conta Google conectada com sucesso! Acesso à agenda liberado.');
    } catch (err: any) {
      const isInvalidClient =
        err?.type === 'invalid_client' ||
        err?.isInvalidClient ||
        err?.message?.includes('invalid_client') ||
        err?.message?.includes('401');

      const isClosed =
        err?.type === 'popup_closed' ||
        err?.isPopupClosed ||
        err?.message?.includes('fechada') ||
        err?.message?.includes('Popup window closed');

      if (isInvalidClient) {
        setErrorMsg('Erro 401 (invalid_client): O Google Cloud Console requer a origem deste app em "Origens JavaScript autorizadas". Utilize o Modo Demonstração para testar agenda e Meet com 1 clique.');
      } else if (isClosed) {
        setErrorMsg('A janela de login do Google foi fechada antes da confirmação. Se visualizou erro 401: invalid_client, ative o Modo Demonstração para testar sem restrições.');
      } else {
        setErrorMsg(err?.message || 'Falha ao conectar com o Google. Verifique o Client ID ou ative o Modo Demonstração.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await syncAppointmentsWithGoogle();
      setSuccessMsg(`Sincronização concluída! ${res.exported} consultas exportadas e ${res.imported} eventos importados do Google Calendar.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao sincronizar com Google Agenda.');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingAppId(null);
    setPatientId(patients[0]?.id || '');
    setCustomPatientName('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('09:00');
    setDurationMinutes(60);
    setType('Retorno');
    setStatus('Agendado');
    setNotes('');
    setIsLinkedToProgram(false);
    setConsultationFee(250);
    setInternalPaymentStatus('pago');
  };

  const handleStartEdit = (app: Appointment) => {
    setIsEditing(true);
    setEditingAppId(app.id);
    setPatientId(app.patientId);
    setCustomPatientName(app.patientName);
    setDate(app.date);
    setTime(app.time);
    setDurationMinutes(app.durationMinutes || 60);
    setType(app.type);
    setStatus(app.status);
    setNotes(app.notes || '');
    setIsLinkedToProgram(!!app.isProgramSession);
    setConsultationFee(app.consultationFee !== undefined ? app.consultationFee : 250);
    setInternalPaymentStatus(app.internalPaymentStatus || 'pago');
  };

  const handleDelete = async (appId: string) => {
    if (confirm('Tem certeza que deseja excluir esta consulta? Se estiver vinculada ao Google Calendar, o evento será excluído de sua agenda.')) {
      try {
        await deleteAppointment(appId, true);
        setSuccessMsg('Consulta excluída com sucesso da base e do Google Calendar.');
      } catch (err: any) {
        setErrorMsg('Erro ao excluir consulta: ' + err?.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const selectedPatient = patients.find((p) => p.id === patientId);
      const finalPatientName = selectedPatient ? selectedPatient.name : customPatientName || 'Paciente';
      const activeProgramForPatient = patientProgramEnrollments.find(
        (e) => e.patientId === patientId && e.status === 'ativo'
      );

      const isProgram = isLinkedToProgram && !!activeProgramForPatient;

      const appDataToSave = {
        patientId,
        patientName: finalPatientName,
        date,
        time,
        durationMinutes,
        type: isProgram ? ('Sessão de Programa Contínuo' as const) : type,
        status,
        notes,
        consultationFee: isProgram ? 0 : consultationFee,
        internalPaymentStatus: isProgram ? ('incluso_no_programa' as const) : internalPaymentStatus,
        isProgramSession: isProgram,
        programEnrollmentId: isProgram ? activeProgramForPatient?.id : undefined,
        programTitle: isProgram ? activeProgramForPatient?.title : undefined,
        programSessionNumber: isProgram ? (activeProgramForPatient ? activeProgramForPatient.completedConsultations + 1 : undefined) : undefined,
      };

      if (isEditing && editingAppId) {
        await updateAppointment(
          editingAppId,
          appDataToSave,
          syncToGoogleCheck
        );
        setSuccessMsg('Consulta e evento no Google Calendar atualizados com sucesso!');
      } else {
        await addAppointment(
          appDataToSave,
          syncToGoogleCheck
        );
        setSuccessMsg('Nova consulta agendada e sincronizada com seu Google Calendar!');
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar consulta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    if (selectedFilter === 'all') return true;
    return app.status === selectedFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">Gestão de Agenda & Google Calendar</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sincronize consultas nutricionais em tempo real (criar, editar e excluir eventos)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Connection Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {googleAuth.isConnected ? (
              <div className="flex items-center space-x-3">
                {googleAuth.userAvatar ? (
                  <img
                    src={googleAuth.userAvatar}
                    alt={googleAuth.userName || 'Google User'}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full border border-emerald-400"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    G
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800">
                      {googleAuth.userName || 'Conta Google'}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Conectado à Agenda
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{googleAuth.userEmail}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-slate-600 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Conta Google não vinculada. Conecte para sincronizar eventos em tempo real.</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {googleAuth.isConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={isSyncingCalendar}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
                  <span>{isSyncingCalendar ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                </button>
                <button
                  type="button"
                  onClick={disconnectGoogleAccount}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isConnecting ? 'Conectando...' : 'Conectar Conta Google'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    connectDemoGoogleAccount();
                    setSuccessMsg('Agenda conectada com sucesso em modo demonstração!');
                    setErrorMsg(null);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Conectar modo teste/demonstração instantâneo"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modo Demonstração</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="px-2.5 py-1.5 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-medium"
              title="Configurações OAuth"
            >
              Config
            </button>
          </div>
        </div>

        {/* OAuth Client ID Settings Panel if toggled */}
        {showConfig && (
          <div className="bg-amber-50/80 border-b border-amber-200 p-4 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-amber-900">Configuração de Credencial OAuth Google:</p>
              <span className="text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                Resolução Erro 401: invalid_client
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customClientIdInput}
                onChange={(e) => setCustomClientIdInput(e.target.value)}
                placeholder="Ex: 914241741628-...apps.googleusercontent.com"
                className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  setGoogleClientId(customClientIdInput);
                  setSuccessMsg('Client ID atualizado!');
                  setShowConfig(false);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors cursor-pointer"
              >
                Salvar Client ID
              </button>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-slate-700 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-800">Origem JavaScript Autorizada necessária no Google Cloud Console:</p>
              <div className="flex items-center gap-2">
                <code className="bg-slate-100 px-2 py-1 rounded text-[11px] font-mono text-slate-900 select-all flex-1 truncate">
                  {typeof window !== 'undefined' ? window.location.origin : 'Origem do app'}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(window.location.origin);
                      setSuccessMsg('Origem copiada para a área de transferência!');
                    }
                  }}
                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[11px] flex items-center space-x-1 shrink-0 transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar Origem</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Se ocorrer <strong>Erro 401: invalid_client</strong>, basta adicionar a URL acima em <em>Origens JavaScript autorizadas</em> no seu projeto do Google Cloud, ou utilizar o <strong>Modo Demonstração</strong> para testar sem restrições.
              </p>
            </div>
          </div>
        )}

        {/* Notification Alerts */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-700 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              {!googleAuth.isConnected && (
                <button
                  type="button"
                  onClick={() => {
                    connectDemoGoogleAccount();
                    setSuccessMsg('Agenda conectada com sucesso em modo demonstração!');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  Usar Modo Demonstração
                </button>
              )}
              <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body: 2 Columns (Form left, Appointments list right) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column (5 cols): Create / Edit Form */}
          <div className="md:col-span-5 bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                {isEditing ? <Edit2 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
                <span>{isEditing ? 'Alterar Consulta' : 'Novo Agendamento'}</span>
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Paciente
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.goal})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Duração
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1h)</option>
                    <option value={90}>90 minutos (1h30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Tipo de Consulta
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Primeira Consulta">Primeira Consulta</option>
                    <option value="Retorno">Retorno</option>
                    <option value="Avaliação Física">Avaliação Física</option>
                    <option value="Ajuste de Plano">Ajuste de Plano</option>
                  </select>
                </div>
              </div>

              {/* Program Linking vs Consultation Fee */}
              {(() => {
                const activeProg = patientProgramEnrollments.find(
                  (e) => e.patientId === patientId && e.status === 'ativo'
                );

                if (activeProg) {
                  return (
                    <div className="bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl text-xs space-y-1.5">
                      <label className="flex items-center space-x-2 font-bold text-amber-950 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isLinkedToProgram}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setIsLinkedToProgram(val);
                            if (val) {
                              setType('Sessão de Programa Contínuo');
                              setConsultationFee(0);
                              setInternalPaymentStatus('incluso_no_programa');
                            } else {
                              setType('Retorno');
                              setConsultationFee(250);
                              setInternalPaymentStatus('pago');
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>Vincular ao Programa: {activeProg.title}</span>
                      </label>
                      {isLinkedToProgram ? (
                        <p className="text-[11px] text-amber-800 pl-6 leading-relaxed">
                          ✓ Consulta inclusa no plano do paciente ({activeProg.completedConsultations + 1} de {activeProg.totalConsultations} consultas). Sem custo avulso.
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 pl-6">
                          Desmarcado: Esta consulta será registrada de forma avulsa para controle interno.
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Controle Financeiro Interno (Consulta Avulsa):
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Valor da Consulta (R$):</label>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={consultationFee}
                          onChange={(e) => setConsultationFee(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Status Interno:</label>
                        <select
                          value={internalPaymentStatus}
                          onChange={(e) => setInternalPaymentStatus(e.target.value as any)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-emerald-800"
                        >
                          <option value="pago">Quitado (Pago)</option>
                          <option value="pendente">Pendente</option>
                          <option value="isento">Isento / Cortesia</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Agendado', 'Concluído', 'Cancelado'] as Appointment['status'][]).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setStatus(st)}
                      className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-colors ${
                        status === st
                          ? st === 'Agendado'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : st === 'Concluído'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Observações / Pauta
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Trazer exames de sangue recentes, conferir bioimpedância..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncToGoogleCheck}
                    onChange={(e) => setSyncToGoogleCheck(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Sincronizar automaticamente no Google Calendar</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{isEditing ? 'Salvar Alterações no Evento' : 'Criar e Agendar no Google'}</span>
              </button>
            </form>
          </div>

          {/* Right Column (7 cols): List of Appointments & Calendar Events */}
          <div className="md:col-span-7 flex flex-col space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Consultas Agendadas ({filteredAppointments.length})
              </h3>
              <div className="flex space-x-1 text-xs">
                {(['all', 'Agendado', 'Concluído', 'Cancelado'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      selectedFilter === filter
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'all' ? 'Todas' : filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-1">
              {filteredAppointments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  Nenhuma consulta encontrada com o filtro selecionado.
                </div>
              ) : (
                filteredAppointments.map((app) => (
                  <div
                    key={app.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      editingAppId === app.id
                        ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs">{app.patientName}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              app.status === 'Agendado'
                                ? 'bg-blue-100 text-blue-800'
                                : app.status === 'Concluído'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {app.status}
                          </span>
                          {app.googleEventId && (
                            <span className="inline-flex items-center text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <CalendarCheck className="w-2.5 h-2.5 mr-0.5" /> GCal Sincronizado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            {app.date} às {app.time} ({app.durationMinutes || 60}min)
                          </span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">{app.type}</span>
                        </div>

                        {/* Program or Fee Tag */}
                        <div className="pt-0.5">
                          {app.isProgramSession ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              🎯 Incluso no Programa {app.programTitle ? `(${app.programTitle})` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              🩺 Consulta Avulsa: R$ {app.consultationFee !== undefined ? app.consultationFee.toFixed(2) : '250.00'} •{' '}
                              <strong className={app.internalPaymentStatus === 'pago' ? 'text-emerald-700 ml-1' : 'text-amber-700 ml-1'}>
                                {app.internalPaymentStatus === 'pago' ? 'Quitado' : app.internalPaymentStatus === 'isento' ? 'Isento' : 'Pendente'}
                              </strong>
                            </span>
                          )}
                        </div>

                        {app.notes && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                            {app.notes}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1">
                        {app.googleEventLink && (
                          <a
                            href={app.googleEventLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-50"
                            title="Abrir no Google Calendar"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleStartEdit(app)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50"
                          title="Alterar Consulta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Excluir Consulta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Local: {clinicConfig.address}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
