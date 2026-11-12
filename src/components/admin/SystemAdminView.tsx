import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { NutritionistUser, ClinicConfig } from '../../types';
import {
  ShieldCheck,
  Users,
  Plus,
  Building2,
  Mail,
  Phone,
  Award,
  Trash2,
  Edit2,
  Database,
  CheckCircle2,
  Lock,
  UserCheck,
  Calendar,
  Sparkles,
  Crown,
  AlertTriangle,
  RotateCcw,
  X
} from 'lucide-react';
import { BackupModal } from '../common/BackupModal';

export const SystemAdminView: React.FC = () => {
  const {
    nutritionists,
    addNutritionist,
    updateNutritionist,
    deleteNutritionist,
    currentNutritionistId,
    setCurrentNutritionistId,
    patients,
    dietPlans,
    appointments,
    clinicConfig,
    setClinicConfig,
    currentRole,
    setCurrentRole,
    isMasterAdmin,
    masterAdminEmail,
    masterAdminUser,
    deleteAllNutritionists,
    deleteAllPatients,
    deleteAllDatabase,
    resetAllData,
    authUser,
    isSuperAdmin,
    switchAuthEmail
  } = useNutrition();

  const [isNewNutriModalOpen, setIsNewNutriModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [editingNutri, setEditingNutri] = useState<NutritionistUser | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    actionText: string;
    dangerLevel: 'high' | 'critical';
  } | null>(null);

  const [operationFeedback, setOperationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testEmailInput, setTestEmailInput] = useState('');

  // Clinic config form state
  const [clinicName, setClinicName] = useState(clinicConfig.name);
  const [clinicCrn, setClinicCrn] = useState(clinicConfig.crn);
  const [clinicEmail, setClinicEmail] = useState(clinicConfig.email);
  const [clinicPhone, setClinicPhone] = useState(clinicConfig.phone);
  const [clinicAddress, setClinicAddress] = useState(clinicConfig.address);
  const [savedClinicSuccess, setSavedClinicSuccess] = useState(false);

  // New Nutritionist Form State
  const [name, setName] = useState('');
  const [crn, setCrn] = useState('CRN-3 ');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState('Nutrição Clínica, Esportiva & Emagrecimento');
  const [bio, setBio] = useState('');

  const handleSaveClinicSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setClinicConfig({
      ...clinicConfig,
      name: clinicName,
      crn: clinicCrn,
      email: clinicEmail,
      phone: clinicPhone,
      address: clinicAddress,
    });
    setSavedClinicSuccess(true);
    setTimeout(() => setSavedClinicSuccess(false), 3000);
  };

  const handleCreateNutritionist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const specsArray = specialties.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingNutri) {
      updateNutritionist(editingNutri.id, {
        name,
        crn,
        email,
        phone,
        specialties: specsArray,
        bio
      });
      setEditingNutri(null);
    } else {
      addNutritionist({
        name,
        crn,
        email,
        phone,
        role: 'nutritionist',
        specialties: specsArray,
        bio: bio || 'Especialista em planejamento dietético individualizado e prescrição personalizada.'
      });
    }

    setIsNewNutriModalOpen(false);
    setName('');
    setCrn('CRN-3 ');
    setEmail('');
    setPhone('');
    setBio('');
  };

  const handleOpenEdit = (nutri: NutritionistUser) => {
    setEditingNutri(nutri);
    setName(nutri.name);
    setCrn(nutri.crn);
    setEmail(nutri.email);
    setPhone(nutri.phone || '');
    const specs = Array.isArray(nutri.specialties)
      ? nutri.specialties.join(', ')
      : (typeof nutri.specialties === 'string' ? nutri.specialties : (nutri.specialty || ''));
    setSpecialties(specs);
    setBio(nutri.bio || '');
    setIsNewNutriModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-slate-900 text-white rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Painel do Administrador Geral da Clínica
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Gerencie o corpo clínico de nutricionistas, permissões de acesso, dados da clínica e backups globais do sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Backup & Restaurar</span>
          </button>

          <button
            onClick={() => {
              setEditingNutri(null);
              setName('');
              setCrn('CRN-3 ');
              setEmail('');
              setPhone('');
              setBio('');
              setIsNewNutriModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nutricionista</span>
          </button>
        </div>
      </div>

      {/* Operation Feedback Toast */}
      {operationFeedback && (
        <div
          id="system-operation-feedback"
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium ${
            operationFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {operationFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{operationFeedback.message}</span>
          </div>
          <button
            onClick={() => setOperationFeedback(null)}
            className="text-xs p-1 rounded hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Master Admin Identity & Control Zone */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Super-Admin Supremo: Victor L. Araújo
                </h3>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3" /> ROLE: 'super-admin'
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  {masterAdminEmail}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Controle irrestrito da base clínica e regras de segurança Firestore. O e-mail <strong className="text-white">{masterAdminEmail}</strong> possui privilégios totais de exclusão na base de dados.
              </p>
            </div>
          </div>

          {/* Master Admin Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Excluir Toda a Base de Dados (Super-Admin Exclusivo) */}
            <button
              id="btn-wipe-all-database"
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Wipe Total: Excluir Toda a Base de Dados',
                  description: `ATENÇÃO CRÍTICA (SUPER-ADMIN): Esta ação excluirá de forma irrestrita e definitiva TODOS os nutricionistas, pacientes, prontuários, dietas e registros do sistema no Firestore e no armazenamento local. Apenas ${masterAdminEmail} pode autorizar esta operação.`,
                  actionText: 'Confirmar Wipe Total da Base',
                  dangerLevel: 'critical',
                  action: async () => {
                    try {
                      const res = await deleteAllDatabase();
                      setOperationFeedback({ type: 'success', message: res.message });
                    } catch (err: any) {
                      setOperationFeedback({ type: 'error', message: err.message });
                    }
                    setConfirmModal(null);
                  }
                });
              }}
              className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer border border-red-500/50"
              title="Exclusão total irrestrita da base de dados (Super-Admin)"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Wipe Total da Base</span>
            </button>

            {/* Excluir Todos os Nutricionistas */}
            <button
              id="btn-delete-all-nutritionists"
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Excluir Todos os Nutricionistas',
                  description: `Atenção: Esta ação removerá TODOS os ${nutritionists.length} nutricionistas cadastrados na clínica. Somente o super-admin (${masterAdminEmail}) pode autorizar.`,
                  actionText: 'Confirmar Exclusão de Todos',
                  dangerLevel: 'critical',
                  action: () => {
                    try {
                      deleteAllNutritionists();
                      setOperationFeedback({ type: 'success', message: 'Todos os nutricionistas foram excluídos com sucesso pelo super-admin.' });
                    } catch (err: any) {
                      setOperationFeedback({ type: 'error', message: err.message });
                    }
                    setConfirmModal(null);
                  }
                });
              }}
              disabled={nutritionists.length === 0}
              className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Nutricionistas ({nutritionists.length})</span>
            </button>

            {/* Excluir Todos os Pacientes */}
            <button
              id="btn-delete-all-patients"
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Excluir Todos os Pacientes',
                  description: `Atenção: Esta ação removerá TODOS os ${patients.length} pacientes cadastrados, incluindo todos os prontuários e dietas. Somente o super-admin (${masterAdminEmail}) pode autorizar.`,
                  actionText: 'Confirmar Exclusão de Todos',
                  dangerLevel: 'critical',
                  action: () => {
                    try {
                      deleteAllPatients();
                      setOperationFeedback({ type: 'success', message: 'Todos os pacientes foram excluídos com sucesso pelo super-admin.' });
                    } catch (err: any) {
                      setOperationFeedback({ type: 'error', message: err.message });
                    }
                    setConfirmModal(null);
                  }
                });
              }}
              disabled={patients.length === 0}
              className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Excluir Pacientes ({patients.length})</span>
            </button>

            {/* Restaurar Base Padrão */}
            <button
              id="btn-restore-demo-data"
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Restaurar Base de Dados Padrão (Demo)',
                  description: 'Deseja restaurar a base de dados clínica de demonstração com nutricionistas, pacientes e planos padrão da NutriCore Pro?',
                  actionText: 'Restaurar Dados Padrão',
                  dangerLevel: 'high',
                  action: () => {
                    resetAllData();
                    setOperationFeedback({ type: 'success', message: 'Base de dados restaurada com os registros padrão.' });
                    setConfirmModal(null);
                  }
                });
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restaurar dados demo caso tenha excluído tudo"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restaurar Base Padrão</span>
            </button>
          </div>
        </div>
      </div>

      {/* RBAC Security & Authentication Verification Context Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isSuperAdmin
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Contexto de Autenticação & Verificação de Privilégios (RBAC)
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  isSuperAdmin
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {isSuperAdmin ? 'SUPER-ADMIN ATIVO' : 'PERMISSÕES LIMITADAS'}
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Validação de segurança em tempo real do e-mail do usuário autenticado e seus privilégios no banco de dados.
              </p>
            </div>
          </div>

          {/* Quick Authenticated User Switcher (For Demo & Verification Testing) */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Testar Sessão:</span>
            <button
              id="switch-super-admin-btn"
              onClick={() => {
                switchAuthEmail('victorlaraujo@gmail.com', 'Victor L. Araújo');
                setOperationFeedback({
                  type: 'success',
                  message: 'Sessão alternada para victorlaraujo@gmail.com (Super-Admin com privilégios totais de exclusão).'
                });
              }}
              className={`px-2.5 py-1 rounded font-semibold text-xs transition-colors cursor-pointer ${
                authUser.email === 'victorlaraujo@gmail.com'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              👑 victorlaraujo@gmail.com
            </button>
            <button
              id="switch-regular-user-btn"
              onClick={() => {
                switchAuthEmail('nutri.convidado@clinica.com.br', 'Nutri Convidado');
                setOperationFeedback({
                  type: 'error',
                  message: 'Sessão alternada para nutri.convidado@clinica.com.br (Nutricionista comum sem privilégios de exclusão total).'
                });
              }}
              className={`px-2.5 py-1 rounded font-semibold text-xs transition-colors cursor-pointer ${
                authUser.email !== 'victorlaraujo@gmail.com'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              👤 Outro E-mail (Sem Wipe)
            </button>
          </div>
        </div>

        {/* Current Auth Credentials & Permissions Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">E-mail Autenticado</div>
            <div className="text-sm font-bold text-slate-900 mt-1 font-mono truncate" title={authUser.email}>
              {authUser.email}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-500" />
              {authUser.displayName}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Papel / Role</div>
            <div className="text-sm font-bold mt-1 flex items-center gap-1.5 font-mono">
              <span className={`px-2 py-0.5 rounded text-xs ${
                authUser.role === 'super-admin'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
                '{authUser.role}'
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {authUser.role === 'super-admin' ? 'Acesso absoluto de sistema' : 'Acesso clínico padrão'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Privilégios de Exclusão Total</div>
            <div className="text-sm font-bold mt-1 flex items-center gap-1.5">
              {authUser.permissions.canDeleteAllDatabase ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> TOTALMENTE LIBERADO
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <Lock className="w-4 h-4 text-rose-500" /> BLOQUEADO
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {authUser.permissions.canDeleteAllDatabase ? 'Exclusão irrestrita na base' : 'Requer victorlaraujo@gmail.com'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Firestore Security Rules</div>
            <div className="text-sm font-bold text-slate-900 mt-1 font-mono text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              isSuperAdmin() Ativo
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Implantado no Firebase Project
            </div>
          </div>
        </div>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Corpo Clínico</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{nutritionists.length}</div>
          <span className="text-[11px] text-slate-400">Nutricionistas credenciados</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total de Pacientes</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><UserCheck className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{patients.length}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Cadastrados na clínica</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Planos Ativos</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Sparkles className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{dietPlans.filter(p => p.isActive).length}</div>
          <span className="text-[11px] text-slate-400">Prescrições em andamento</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Consultas Marcadas</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{appointments.length}</div>
          <span className="text-[11px] text-purple-600 font-medium">Presenciais & Teleconsultas</span>
        </div>
      </div>

      {/* Main Grid: Nutritionists Management + Clinic Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Nutritionists List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Nutricionistas Cadastrados ({nutritionists.length})
            </h3>
            <span className="text-xs text-slate-500">
              Cada nutricionista acessa e gerencia seus próprios pacientes
            </span>
          </div>

          <div className="space-y-3">
            {nutritionists.map((nutri) => {
              const nutPatients = patients.filter((p) => !p.nutritionistId || p.nutritionistId === nutri.id);
              const isActiveCurrent = currentNutritionistId === nutri.id;

              return (
                <div
                  key={nutri.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isActiveCurrent
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={nutri.avatarUrl}
                        alt={nutri.name}
                        className="w-12 h-12 rounded-full border border-slate-200 bg-slate-100 object-cover shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{nutri.name}</h4>
                          {isActiveCurrent && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Nutricionista em Uso
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono font-semibold text-emerald-700">
                          {nutri.crn}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(nutri)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar nutricionista"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja realmente excluir o(a) nutricionista ${nutri.name}?`)) {
                            deleteNutritionist(nutri.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir nutricionista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{nutri.email}</span>
                    </div>
                    {nutri.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{nutri.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {(Array.isArray(nutri.specialties) ? nutri.specialties : (nutri.specialty ? [nutri.specialty] : [])).map((spec, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">
                      {nutPatients.length} pacientes vinculados
                    </span>

                    {!isActiveCurrent && (
                      <button
                        onClick={() => setCurrentNutritionistId(nutri.id)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
                      >
                        Atuar como este Nutricionista
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Clinic Master Configuration */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Dados Globais da Clínica & Cabeçalho Timbrado
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <form onSubmit={handleSaveClinicSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Clínica / Consultório:
                </label>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CRN Padrão / Responsável:
                  </label>
                  <input
                    type="text"
                    required
                    value={clinicCrn}
                    onChange={(e) => setClinicCrn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone de Contato:
                  </label>
                  <input
                    type="text"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Oficial:
                </label>
                <input
                  type="email"
                  required
                  value={clinicEmail}
                  onChange={(e) => setClinicEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Completo:
                </label>
                <textarea
                  rows={2}
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {savedClinicSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Configurações salvas com sucesso no sistema!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
              >
                Salvar Configurações da Clínica
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* New/Edit Nutritionist Modal */}
      {isNewNutriModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                {editingNutri ? 'Editar Nutricionista' : 'Cadastrar Novo Nutricionista'}
              </h3>
              <button
                onClick={() => setIsNewNutriModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNutritionist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo com Titulação:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Mariana Costa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registro CRN:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CRN-3 52.314/SP"
                    value={crn}
                    onChange={(e) => setCrn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp:
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99876-5432"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Profissional:
                </label>
                <input
                  type="email"
                  required
                  placeholder="mariana.nutri@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Especialidades (separadas por vírgula):
                </label>
                <input
                  type="text"
                  placeholder="Nutrição Esportiva, Emagrecimento, Hipertrofia"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Breve Mini-Bio / Apresentação:
                </label>
                <textarea
                  rows={2}
                  placeholder="Resumo da formação e atuação clínica..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewNutriModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {editingNutri ? 'Salvar Alterações' : 'Cadastrar Nutricionista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backup Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {/* Critical Master Admin Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className={`p-5 flex items-center justify-between text-white ${
              confirmModal.dangerLevel === 'critical' ? 'bg-rose-600' : 'bg-slate-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">{confirmModal.title}</h3>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-900 font-medium leading-relaxed">
                {confirmModal.description}
              </div>

              <div className="text-slate-500 text-[11px]">
                Esta ação é autorizada exclusivamente para o Administrador Master (<span className="font-mono font-semibold text-slate-700">{masterAdminEmail}</span>).
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => confirmModal.action()}
                  className={`px-4 py-2 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer ${
                    confirmModal.dangerLevel === 'critical'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {confirmModal.actionText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
