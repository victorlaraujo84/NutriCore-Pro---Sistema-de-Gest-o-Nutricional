import React from 'react';
import { useNutrition } from '../context/NutritionContext';
import {
  Menu,
  Search,
  Plus,
  FileText,
  RotateCcw,
  Smartphone,
  ChevronDown,
  User,
  Users,
  Calendar,
  CheckCircle2,
  Crown,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  onOpenNewPatientModal: () => void;
  onOpenCalendarModal?: () => void;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewPatientModal,
  onOpenCalendarModal,
  onToggleMobileMenu,
}) => {
  const {
    currentView,
    setCurrentView,
    activeAdminTab,
    selectedPatientForDetail,
    patients,
    activePatientId,
    setActivePatientId,
    setSelectedPatientForDetail,
    setExportPlanModalOpen,
    mobileDeviceFrame,
    setMobileDeviceFrame,
    resetAllData,
    googleAuth,
    authUser,
    isSuperAdmin,
    switchAuthEmail,
    openDiagnosticsModal
  } = useNutrition();

  const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setActivePatientId(pId);
    const pat = patients.find((p) => p.id === pId);
    if (pat) {
      setSelectedPatientForDetail(pat);
    }
  };

  // Compute dynamic title based on active view/tab
  const getHeaderTitle = () => {
    if (currentView === 'patient') {
      return 'Portal do Paciente';
    }
    if (selectedPatientForDetail) {
      return `Prontuário: ${selectedPatientForDetail.name}`;
    }
    switch (activeAdminTab) {
      case 'dashboard':
        return 'Visão Geral';
      case 'patients':
        return 'Pacientes & Prontuários';
      case 'foods':
        return 'Tabela TACO / IBGE';
      case 'calculators':
        return 'Calculadoras & TMB';
      case 'billing':
        return 'Cobranças & Gestão Financeira';
      case 'system_admin':
        return 'Painel de Administração & Clínica';
      default:
        return 'Painel Clínico';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 no-print sticky top-0 z-30">
      {/* Left: Mobile hamburger & Dynamic page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg md:hidden hover:bg-slate-100 transition-colors"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight truncate">
          {getHeaderTitle()}
        </h1>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Patient Selector */}
        <div className="relative hidden lg:flex items-center">
          <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            id="active-patient-selector"
            value={activePatientId}
            onChange={handlePatientSelect}
            className="pl-8 pr-7 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                Paciente: {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>

        {/* Mobile Device Frame Toggle (When in Patient View) */}
        {currentView === 'patient' && (
          <button
            id="toggle-phone-frame-btn"
            onClick={() => setMobileDeviceFrame(!mobileDeviceFrame)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
              mobileDeviceFrame
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Alternar moldura de smartphone"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Moldura Mobile</span>
          </button>
        )}

        {/* Google Calendar Quick Button */}
        {currentView === 'admin' && (
          <button
            id="header-google-calendar-btn"
            onClick={() => onOpenCalendarModal && onOpenCalendarModal()}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors shadow-xs ${
              googleAuth.isConnected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Google Calendar & Agenda"
          >
            <Calendar className={`w-3.5 h-3.5 ${googleAuth.isConnected ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Google Agenda</span>
            {googleAuth.isConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
        )}

        {/* Diagnostics & Integrity Audit Button */}
        <button
          id="header-diagnostics-btn"
          onClick={openDiagnosticsModal}
          className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          title="Executar Auditoria de Integridade e Diagnóstico 100%"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Diagnóstico 100%</span>
        </button>

        {/* Super-Admin Authenticated Badge */}
        <div
          id="navbar-super-admin-badge"
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs transition-colors"
          title={`Autenticado: ${authUser.email} | Nível: ${authUser.role}`}
        >
          {isSuperAdmin ? (
            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          <span className="font-semibold text-slate-700 truncate max-w-[140px]">
            {authUser.displayName}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isSuperAdmin
                ? 'bg-amber-100 text-amber-800 border border-amber-300 font-mono'
                : 'bg-slate-200 text-slate-700 font-mono'
            }`}
          >
            {isSuperAdmin ? 'SUPER-ADMIN' : authUser.role.toUpperCase()}
          </span>
        </div>

        {/* Primary Action: Novo Paciente (in admin view) */}
        {currentView === 'admin' && (
          <button
            id="header-new-patient-btn"
            onClick={onOpenNewPatientModal}
            className="bg-emerald-600 text-white px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Paciente</span>
            <span className="sm:hidden">Novo</span>
          </button>
        )}

        {/* Export Plan PDF Button */}
        <button
          id="export-pdf-header-btn"
          onClick={() => setExportPlanModalOpen(true)}
          className="bg-slate-900 text-white px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
          title="Exportar Prescrição em PDF"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Exportar Plano</span>
          <span className="md:hidden">PDF</span>
        </button>

        {/* Reset Demo Data Button */}
        <button
          id="reset-demo-data-btn"
          onClick={() => {
            if (
              window.confirm('Deseja restaurar os dados de demonstração iniciais da clínica?')
            ) {
              resetAllData();
            }
          }}
          title="Restaurar dados de demonstração"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
