import React from 'react';
import { useNutrition } from '../context/NutritionContext';
import {
  LayoutDashboard,
  Users,
  Utensils,
  Smartphone,
  Calculator,
  Calendar,
  BookOpen,
  ShieldCheck,
  Building2,
  Database,
  DollarSign,
  Crown,
  Award
} from 'lucide-react';

interface SidebarProps {
  onOpenNewPatientModal: () => void;
  onOpenCalendarModal?: () => void;
  onOpenBackupModal?: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewPatientModal,
  onOpenCalendarModal,
  onOpenBackupModal,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const {
    currentView,
    setCurrentView,
    activeAdminTab,
    setActiveAdminTab,
    setSelectedPatientForDetail,
    clinicConfig,
    patients,
    filteredPatients,
    googleAuth,
    currentRole,
    setCurrentRole,
    currentNutritionist,
    nutritionists,
    currentNutritionistId,
    setCurrentNutritionistId,
    isSuperAdmin,
    authUser,
    anthropometryRecords,
    patientProgramEnrollments,
    openDiagnosticsModal
  } = useNutrition();

  const now = new Date();
  const overdueAlertsCount = patients.filter((patient) => {
    const records = anthropometryRecords.filter((r) => r.patientId === patient.id);
    if (records.length === 0) return true;
    const sorted = [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const diffDays = Math.floor(
      (now.getTime() - new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 30;
  }).length;

  const handleNavClick = (tab: 'dashboard' | 'patients' | 'programs' | 'billing' | 'templates' | 'calculators' | 'foods' | 'system_admin') => {
    setCurrentView('admin');
    setActiveAdminTab(tab);
    if (tab === 'patients') {
      setSelectedPatientForDetail(null);
    }
    setIsOpenMobile(false);
  };

  const handlePatientPortalClick = () => {
    setCurrentView('patient');
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div className="overflow-hidden">
            <span className="text-white font-bold text-base tracking-tight block truncate">
              {clinicConfig.name}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold block uppercase tracking-wider">
              Nutrição & Antropometria
            </span>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="px-4 pt-3 pb-1">
          <div className="bg-slate-800/90 p-1 rounded-lg flex items-center gap-1 text-[11px] font-medium border border-slate-700/60">
            <button
              onClick={() => setCurrentRole('nutritionist')}
              className={`flex-1 py-1 px-2 rounded font-semibold transition-colors text-center ${
                currentRole === 'nutritionist'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nutricionista
            </button>
            <button
              onClick={() => {
                setCurrentRole('admin');
                setActiveAdminTab('system_admin');
              }}
              className={`flex-1 py-1 px-2 rounded font-semibold transition-colors text-center ${
                currentRole === 'admin'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Master
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <div
            id="sidebar-nav-dashboard"
            onClick={() => handleNavClick('dashboard')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              currentView === 'admin' && activeAdminTab === 'dashboard'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </div>
            {overdueAlertsCount > 0 && (
              <span
                className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold"
                title={`${overdueAlertsCount} pacientes com medição pendente (>30 dias)`}
              >
                {overdueAlertsCount}
              </span>
            )}
          </div>

          {/* Pacientes */}
          <div
            id="sidebar-nav-patients"
            onClick={() => handleNavClick('patients')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              currentView === 'admin' && activeAdminTab === 'patients'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 shrink-0" />
              <span>Pacientes</span>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
              {filteredPatients.length}
            </span>
          </div>

          {/* Programas de Acompanhamento Nutricional */}
          <div
            id="sidebar-nav-programs"
            onClick={() => handleNavClick('programs')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              currentView === 'admin' && activeAdminTab === 'programs'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Award className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Programas Nutricionais</span>
            </div>
            {patientProgramEnrollments.filter((e) => e.status === 'ativo').length > 0 ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
                {patientProgramEnrollments.filter((e) => e.status === 'ativo').length}
              </span>
            ) : (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold">
                Contínuo
              </span>
            )}
          </div>

          {/* Modelos de Cardápio (Templates) */}
          <div
            id="sidebar-nav-templates"
            onClick={() => handleNavClick('templates')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              currentView === 'admin' && activeAdminTab === 'templates'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Modelos de Cardápio</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold">
              1-Clique
            </span>
          </div>

          {/* Google Agenda & Meet */}
          <div
            id="sidebar-nav-calendar"
            onClick={() => {
              if (onOpenCalendarModal) onOpenCalendarModal();
              setIsOpenMobile(false);
            }}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Google Agenda & Meet</span>
            </div>
            {googleAuth.isConnected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-950" title="Google Calendar Conectado" />
            ) : (
              <span className="text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded">
                OAuth
              </span>
            )}
          </div>

          {/* Avaliações / Calculadoras */}
          <div
            id="sidebar-nav-calculators"
            onClick={() => handleNavClick('calculators')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              currentView === 'admin' && activeAdminTab === 'calculators'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            <span>Avaliações & TMB</span>
          </div>

          {/* Planos Alimentares / Tabela TACO */}
          <div
            id="sidebar-nav-foods"
            onClick={() => handleNavClick('foods')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              currentView === 'admin' && activeAdminTab === 'foods'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4 shrink-0" />
            <span>Tabela TACO / IBGE</span>
          </div>

          {/* Controle Financeiro Interno */}
          <div
            id="sidebar-nav-billing"
            onClick={() => handleNavClick('billing')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              currentView === 'admin' && activeAdminTab === 'billing'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Financeiro Interno</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">
              Controle
            </span>
          </div>

          {/* Admin Master Panel */}
          <div
            id="sidebar-nav-system-admin"
            onClick={() => handleNavClick('system_admin')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              currentView === 'admin' && activeAdminTab === 'system_admin'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Painel Admin & Clínica</span>
            </div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-semibold">
              Admin
            </span>
          </div>

          {/* System Diagnostics & Integrity */}
          <div
            id="sidebar-nav-diagnostics"
            onClick={() => {
              openDiagnosticsModal();
              if (isOpenMobile) setIsOpenMobile(false);
            }}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Diagnóstico 100%</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
              Auditoria
            </span>
          </div>

          <div className="pt-3 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3">
              Visão do Paciente
            </span>
          </div>

          {/* Patient App Mode */}
          <div
            id="sidebar-nav-patient-portal"
            onClick={handlePatientPortalClick}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              currentView === 'patient'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>App do Paciente</span>
            </div>
            <span
              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                currentView === 'patient'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-800 text-emerald-400'
              }`}
            >
              Mobile
            </span>
          </div>
        </nav>

        {/* Doctor / Clinic / Super Admin Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            {isSuperAdmin || currentRole === 'super-admin' || currentRole === 'admin' ? (
              <div className="w-10 h-10 rounded-full border border-amber-500/40 bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
            ) : (
              <img
                src={currentNutritionist?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=DrRicardo`}
                alt={currentNutritionist?.name || 'Nutricionista'}
                className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 object-cover shrink-0"
              />
            )}
            <div className="overflow-hidden flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">
                  {isSuperAdmin || currentRole === 'super-admin' || currentRole === 'admin'
                    ? (authUser?.displayName || 'Victor L. Araújo')
                    : (currentNutritionist?.name || clinicConfig.nutritionistName)}
                </p>
                {isSuperAdmin && (
                  <span className="text-[9px] font-bold bg-amber-500/25 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40">
                    SUPER
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-emerald-400 truncate">
                {isSuperAdmin || currentRole === 'super-admin' || currentRole === 'admin'
                  ? (authUser?.email || 'victorlaraujo@gmail.com')
                  : (currentNutritionist?.crn || clinicConfig.crn)}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
