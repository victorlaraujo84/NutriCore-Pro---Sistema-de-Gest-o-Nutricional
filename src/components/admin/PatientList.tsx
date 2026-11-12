import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { Patient } from '../../types';
import {
  calculateBMR,
  calculateTDEE,
  calculateBMI
} from '../../utils/nutritionCalculations';
import {
  Search,
  Plus,
  Trash2,
  ChevronRight,
  UserPlus,
  Scale,
  Utensils,
  Smartphone,
  Sparkles,
  Flame,
  Droplets,
  Activity,
  ArrowUpDown,
  FileText,
  Edit3,
  Users,
  ClipboardList,
  FolderOpen,
  DollarSign
} from 'lucide-react';

interface PatientListProps {
  onSelectPatient: (patient: Patient) => void;
  isNewPatientModalOpen?: boolean;
  setIsNewPatientModalOpen?: (open: boolean) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ onSelectPatient }) => {
  const {
    patients,
    deletePatient,
    setCurrentView,
    setActivePatientId,
    setActivePatientTab,
    openNewPatientModal,
    openEditPatientModal,
    openPaymentModal,
  } = useNutrition();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredPatients = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);
    const matchGoal = goalFilter === 'all' || p.goal === goalFilter;
    const matchGender = genderFilter === 'all' || p.gender === genderFilter;
    return matchSearch && matchGoal && matchGender;
  });

  const handleOpenMobile = (pId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePatientId(pId);
    setCurrentView('patient');
  };

  const handleOpenProntuario = (patient: Patient, tab: any = 'overview', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActivePatientId(patient.id);
    setActivePatientTab(tab);
    onSelectPatient(patient);
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Round Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paciente por nome, e-mail ou telefone..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full bg-slate-50/60 hover:bg-white transition-all"
            />
          </div>

          {/* Goal & Gender Filters */}
          <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-2">
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os Objetivos</option>
              <option value="emagrecimento">🎯 Emagrecimento</option>
              <option value="hipertrofia">💪 Hipertrofia</option>
              <option value="saude_geral">🌿 Saúde Geral</option>
              <option value="manutencao">⚖️ Manutenção</option>
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Sexo: Todos</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end lg:self-auto shrink-0">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              Tabela
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              Cards
            </button>
          </div>

          {/* Primary Action Button: Novo Paciente */}
          <button
            id="btn-novo-paciente-list"
            onClick={openNewPatientModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Patient Stats Badge Strip */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Exibindo <strong className="text-slate-800">{filteredPatients.length}</strong> de{' '}
          <strong className="text-slate-800">{patients.length}</strong> pacientes cadastrados
        </span>
        <span className="hidden sm:inline text-[11px] text-slate-400">
          Clique no paciente ou em <strong>"Abrir Prontuário"</strong> para acessar o prontuário completo
        </span>
      </div>

      {/* Empty Search Fallback */}
      {filteredPatients.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhum paciente encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não encontramos pacientes com os filtros selecionados. Experimente limpar os filtros ou cadastre um novo paciente.
          </p>
          <button
            onClick={openNewPatientModal}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700 transition-colors"
          >
            + Cadastrar Novo Paciente
          </button>
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && filteredPatients.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Paciente</th>
                  <th className="px-5 py-3.5">Idade / Sexo</th>
                  <th className="px-5 py-3.5">Peso / Altura</th>
                  <th className="px-5 py-3.5">Objetivo</th>
                  <th className="px-5 py-3.5">IMC</th>
                  <th className="px-5 py-3.5">Meta Diária</th>
                  <th className="px-5 py-3.5 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {filteredPatients.map((patient) => {
                  const bmi = calculateBMI(patient.weightKg, patient.heightCm);

                  let badgeClass = 'bg-emerald-100 text-emerald-800';
                  let badgeText = 'SAÚDE GERAL';
                  if (patient.goal === 'emagrecimento') {
                    badgeClass = 'bg-amber-100 text-amber-800';
                    badgeText = 'EMAGRECIMENTO';
                  } else if (patient.goal === 'hipertrofia') {
                    badgeClass = 'bg-blue-100 text-blue-800';
                    badgeText = 'HIPERTROFIA';
                  } else if (patient.goal === 'manutencao') {
                    badgeClass = 'bg-slate-100 text-slate-800';
                    badgeText = 'MANUTENÇÃO';
                  }

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => handleOpenProntuario(patient, 'overview')}
                      className="hover:bg-slate-50/90 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={patient.avatarUrl}
                            alt={patient.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-emerald-700 transition-colors">
                              {patient.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block">{patient.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600">
                        {patient.age} anos • {patient.gender}
                      </td>

                      <td className="px-5 py-4 text-xs font-bold text-slate-800">
                        {patient.weightKg} kg <span className="text-slate-400 font-normal">/ {patient.heightCm} cm</span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-tight inline-block ${badgeClass}`}
                        >
                          {badgeText}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <span className={`font-bold ${bmi.color}`}>{bmi.value}</span>
                        <span className="text-[10px] text-slate-400 block">{bmi.classification.split(' ')[0]}</span>
                      </td>

                      <td className="px-5 py-4 text-xs font-black text-slate-900">
                        {patient.targetCalories} kcal
                      </td>

                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* PRIMARY: Abrir Prontuário */}
                          <button
                            onClick={(e) => handleOpenProntuario(patient, 'overview', e)}
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
                            title="Abrir Prontuário do Paciente"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Abrir Prontuário</span>
                          </button>

                          {/* Quick: Dieta */}
                          <button
                            onClick={(e) => handleOpenProntuario(patient, 'diet_planner', e)}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Planejador de Dieta"
                          >
                            Dieta
                          </button>

                          {/* Quick: Dobras */}
                          <button
                            onClick={(e) => handleOpenProntuario(patient, 'anthropometry', e)}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Dobras e Antropometria"
                          >
                            Dobras
                          </button>

                          {/* Quick: Editar Cadastro */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditPatientModal(patient);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar Cadastro do Paciente"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick: App Mobile */}
                          <button
                            onClick={(e) => handleOpenMobile(patient.id, e)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Abrir no App do Paciente"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Deseja excluir o paciente ${patient.name}?`)) {
                                deletePatient(patient.id);
                              }
                            }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir paciente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && filteredPatients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((patient) => {
            const bmr = calculateBMR(
              patient.weightKg,
              patient.heightCm,
              patient.age,
              patient.gender,
              patient.bmrFormula
            );
            const tdee = calculateTDEE(bmr, patient.activityLevel);
            const bmi = calculateBMI(patient.weightKg, patient.heightCm);

            return (
              <div
                key={patient.id}
                onClick={() => handleOpenProntuario(patient, 'overview')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-500/80 hover:shadow-md transition-all cursor-pointer space-y-4 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={patient.avatarUrl}
                        alt={patient.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {patient.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {patient.age} anos • {patient.gender}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        patient.goal === 'emagrecimento'
                          ? 'bg-amber-50 text-amber-800'
                          : patient.goal === 'hipertrofia'
                          ? 'bg-indigo-50 text-indigo-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {patient.goal === 'emagrecimento'
                        ? 'Emagrecimento'
                        : patient.goal === 'hipertrofia'
                        ? 'Hipertrofia'
                        : 'Saúde Geral'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-xs mt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Peso</span>
                      <span className="font-black text-slate-800">{patient.weightKg} kg</span>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">IMC</span>
                      <span className={`font-black ${bmi.color}`}>{bmi.value}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Gasto VET</span>
                      <span className="font-black text-slate-900">{tdee} kcal</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Primary Open Prontuário Button */}
                  <button
                    onClick={(e) => handleOpenProntuario(patient, 'overview', e)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Abrir Prontuário</span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleOpenProntuario(patient, 'diet_planner', e)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                      >
                        <Utensils className="w-3 h-3" />
                        <span>Dieta</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenProntuario(patient, 'anthropometry', e)}
                        className="text-slate-600 hover:text-slate-900 font-bold flex items-center space-x-1"
                      >
                        <Scale className="w-3 h-3" />
                        <span>Dobras</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditPatientModal(patient);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Cadastro"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleOpenMobile(patient.id, e)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Abrir no App do Paciente"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Deseja excluir o paciente ${patient.name}?`)) {
                            deletePatient(patient.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir paciente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
