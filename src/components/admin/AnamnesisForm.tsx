import React, { useState, useEffect } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { Anamnesis } from '../../types';
import {
  ClipboardList,
  Save,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Moon,
  Droplets,
  Pill,
  Clock
} from 'lucide-react';

export const AnamnesisForm: React.FC = () => {
  const {
    selectedPatientForDetail,
    activePatient,
    anamnesisMap,
    saveAnamnesis,
  } = useNutrition();

  const patient = selectedPatientForDetail || activePatient;

  const [formData, setFormData] = useState<Anamnesis>(() => {
    return (
      (patient && anamnesisMap[patient.id]) || {
        id: `anam-${patient?.id || 'new'}`,
        patientId: patient?.id || '',
        updatedAt: new Date().toISOString().split('T')[0],
        mainObjective: '',
        clinicalHistory: '',
        foodAllergies: '',
        foodAversions: '',
        foodPreferences: '',
        bowelFunction: 'Regular (1x ao dia)',
        sleepHours: 8,
        waterIntakeCurrentLiters: 2.0,
        medicationsSupplements: '',
        twentyFourHourRecall: '',
        routineNotes: '',
      }
    );
  });

  const [toastSaved, setToastSaved] = useState<boolean>(false);

  useEffect(() => {
    if (patient && anamnesisMap[patient.id]) {
      setFormData(anamnesisMap[patient.id]);
    } else if (patient) {
      setFormData({
        id: `anam-${patient.id}`,
        patientId: patient.id,
        updatedAt: new Date().toISOString().split('T')[0],
        mainObjective: patient.notes || '',
        clinicalHistory: '',
        foodAllergies: '',
        foodAversions: '',
        foodPreferences: '',
        bowelFunction: 'Regular',
        sleepHours: 8,
        waterIntakeCurrentLiters: 2.0,
        medicationsSupplements: '',
        twentyFourHourRecall: '',
        routineNotes: '',
      });
    }
  }, [patient?.id, anamnesisMap]);

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-500">
        Nenhum paciente selecionado para preenchimento de anamnese.
      </div>
    );
  }

  const handleChange = (field: keyof Anamnesis, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveAnamnesis(patient.id, formData);
    setToastSaved(true);
    setTimeout(() => setToastSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {toastSaved && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-emerald-500/50">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">
            Anamnese digital atualizada e gravada com sucesso!
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <ClipboardList className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Anamnese Clínica & Comportamental Personalizada
            </h2>
            <p className="text-xs text-slate-500">
              Histórico de saúde, hábitos, aversões e recordatório 24 horas de {patient.name}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-end sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Anamnese</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Objective & Clinical Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>1. Objetivo Principal & Histórico Clínico</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Queixa Principal / Motivo da Consulta
              </label>
              <textarea
                value={formData.mainObjective}
                onChange={(e) => handleChange('mainObjective', e.target.value)}
                rows={3}
                placeholder="Ex: Busca emagrecimento saudável, relata cansaço ao final da tarde..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Histórico Patológico & Exames Bioquímicos
              </label>
              <textarea
                value={formData.clinicalHistory}
                onChange={(e) => handleChange('clinicalHistory', e.target.value)}
                rows={3}
                placeholder="Ex: Histórico familiar de diabetes tipo 2, exames de glicemia 85 mg/dL..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Food Sensitivities, Allergies & Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>2. Alergias, Aversões & Preferências Alimentares</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Alergias ou Intolerâncias (Glúten, Lactose...)
              </label>
              <textarea
                value={formData.foodAllergies}
                onChange={(e) => handleChange('foodAllergies', e.target.value)}
                rows={3}
                placeholder="Ex: Nenhuma diagnosticada / Sensibilidade a leite puro..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Aversões Alimentares (Alimentos que não consome)
              </label>
              <textarea
                value={formData.foodAversions}
                onChange={(e) => handleChange('foodAversions', e.target.value)}
                rows={3}
                placeholder="Ex: Fígado, quiabo, frutos do mar..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Preferências Alimentares (Gosta de incluir)
              </label>
              <textarea
                value={formData.foodPreferences}
                onChange={(e) => handleChange('foodPreferences', e.target.value)}
                rows={3}
                placeholder="Ex: Frutas cítricas, ovos mexidos, café expresso, pasta de amendoim..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Lifestyle, Sleep & Hydration */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            <span>3. Estilo de Vida, Sono, Hidratação & Trato Gastrointestinal</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center space-x-1">
                <Moon className="w-3.5 h-3.5 text-slate-400" />
                <span>Horas de Sono / Noite</span>
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.sleepHours}
                onChange={(e) => handleChange('sleepHours', parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center space-x-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>Consumo Atual de Água (L)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.waterIntakeCurrentLiters}
                onChange={(e) =>
                  handleChange('waterIntakeCurrentLiters', parseFloat(e.target.value) || 0)
                }
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Hábito Intestinal
              </label>
              <select
                value={formData.bowelFunction}
                onChange={(e) => handleChange('bowelFunction', e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="Regular (1x ao dia)">Regular (1x ao dia)</option>
                <option value="Constipado (a cada 2-3 dias)">Constipado (a cada 2-3 dias)</option>
                <option value="Muito Acelerado (2-3x ao dia)">Muito Acelerado (2-3x ao dia)</option>
                <option value="Irregular com distensão abdominal">Irregular com distensão</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center space-x-1">
                <Pill className="w-3.5 h-3.5 text-purple-500" />
                <span>Medicamentos / Suplementos</span>
              </label>
              <input
                type="text"
                value={formData.medicationsSupplements}
                onChange={(e) => handleChange('medicationsSupplements', e.target.value)}
                placeholder="Ex: Creatina 5g, Vitamina D..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: 24h Dietary Recall & Routine */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>4. Recordatório Alimentar 24 Horas & Rotina Diária</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Recordatório 24 Horas (O que o paciente costuma comer)
              </label>
              <textarea
                value={formData.twentyFourHourRecall || ''}
                onChange={(e) => handleChange('twentyFourHourRecall', e.target.value)}
                rows={4}
                placeholder="Café da manhã: ... &#10;Almoço: ... &#10;Lanche: ... &#10;Jantar: ..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Horários de Trabalho, Treino e Rotina
              </label>
              <textarea
                value={formData.routineNotes || ''}
                onChange={(e) => handleChange('routineNotes', e.target.value)}
                rows={4}
                placeholder="Ex: Acorda 06h30, almoça 12h, treina musculação 18h às 19h15, dorme 23h..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Alterações da Anamnese</span>
          </button>
        </div>
      </form>
    </div>
  );
};
