import React, { useState, useEffect } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { Patient, Gender, ActivityLevel, BMRFormula, NutritionGoal } from '../../types';
import {
  calculateBMR,
  calculateTDEE,
  calculateBMI
} from '../../utils/nutritionCalculations';
import {
  UserPlus,
  UserCheck,
  X,
  Sparkles,
  Flame,
  Droplets,
  Activity,
  Scale,
  Calendar,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const PatientModal: React.FC = () => {
  const {
    isPatientModalOpen,
    patientModalMode,
    patientToEdit,
    closePatientModal,
    addPatient,
    updatePatient,
    setSelectedPatientForDetail,
    setActivePatientId,
    setActiveAdminTab,
    setActivePatientTab,
    setCurrentView,
    nutritionists,
    currentNutritionistId,
  } = useNutrition();

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('1995-06-15');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<Gender>('Masculino');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(1.55);
  const [bmrFormula, setBmrFormula] = useState<BMRFormula>('mifflin');
  const [goal, setGoal] = useState<NutritionGoal>('emagrecimento');
  const [assignedNutritionistId, setAssignedNutritionistId] = useState<string>(currentNutritionistId || '');
  const [notes, setNotes] = useState<string>('');

  // Target customization
  const [customTargets, setCustomTargets] = useState<boolean>(false);
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  const [targetProteinG, setTargetProteinG] = useState<number>(150);
  const [targetCarbsG, setTargetCarbsG] = useState<number>(200);
  const [targetFatsG, setTargetFatsG] = useState<number>(65);
  const [targetWaterMl, setTargetWaterMl] = useState<number>(2600);

  // Live calculations
  const liveBMR = calculateBMR(weightKg, heightCm, age, gender, bmrFormula);
  const liveTDEE = calculateTDEE(liveBMR, activityLevel);
  const liveBMI = calculateBMI(weightKg, heightCm);
  const liveWater = Math.round(weightKg * 35);

  // Synchronize target calories based on goal when not manual
  useEffect(() => {
    if (!customTargets) {
      let cals = liveTDEE;
      if (goal === 'emagrecimento') cals = Math.max(1200, liveTDEE - 400);
      if (goal === 'hipertrofia') cals = liveTDEE + 350;
      if (goal === 'saude_geral' || goal === 'manutencao') cals = liveTDEE;

      setTargetCalories(cals);

      const protG = Math.round(weightKg * (goal === 'hipertrofia' ? 2.2 : goal === 'emagrecimento' ? 2.0 : 1.8));
      const fatG = Math.round((cals * 0.25) / 9);
      const carbG = Math.max(50, Math.round((cals - (protG * 4 + fatG * 9)) / 4));

      setTargetProteinG(protG);
      setTargetFatsG(fatG);
      setTargetCarbsG(carbG);
      setTargetWaterMl(liveWater);
    }
  }, [weightKg, heightCm, age, gender, bmrFormula, activityLevel, goal, customTargets, liveTDEE, liveWater]);

  // Load patient data when editing
  useEffect(() => {
    if (patientModalMode === 'edit' && patientToEdit) {
      setName(patientToEdit.name);
      setEmail(patientToEdit.email || '');
      setPhone(patientToEdit.phone || '');
      setBirthDate(patientToEdit.birthDate || '1995-06-15');
      setAge(patientToEdit.age || 30);
      setGender(patientToEdit.gender || 'Masculino');
      setHeightCm(patientToEdit.heightCm || 175);
      setWeightKg(patientToEdit.weightKg || 75);
      setActivityLevel(patientToEdit.activityLevel || 1.55);
      setBmrFormula(patientToEdit.bmrFormula || 'mifflin');
      setGoal(patientToEdit.goal || 'emagrecimento');
      setAssignedNutritionistId(patientToEdit.nutritionistId || currentNutritionistId || '');
      setNotes(patientToEdit.notes || '');

      setTargetCalories(patientToEdit.targetCalories || 2000);
      setTargetProteinG(patientToEdit.targetProteinG || 150);
      setTargetCarbsG(patientToEdit.targetCarbsG || 200);
      setTargetFatsG(patientToEdit.targetFatsG || 65);
      setTargetWaterMl(patientToEdit.targetWaterMl || 2600);
      setCustomTargets(true);
    } else if (patientModalMode === 'create') {
      // Default reset for new patient
      setName('');
      setEmail('');
      setPhone('');
      setBirthDate('1995-06-15');
      setAge(30);
      setGender('Masculino');
      setHeightCm(175);
      setWeightKg(75);
      setActivityLevel(1.55);
      setBmrFormula('mifflin');
      setGoal('emagrecimento');
      setAssignedNutritionistId(currentNutritionistId || '');
      setNotes('');
      setCustomTargets(false);
    }
  }, [patientModalMode, patientToEdit, isPatientModalOpen, currentNutritionistId]);

  if (!isPatientModalOpen) return null;

  const handleSubmit = (openProntuarioAfterSave: boolean) => {
    if (!name.trim()) {
      alert('Por favor, informe o nome do paciente.');
      return;
    }

    const calculatedEmail = email.trim() || `${name.toLowerCase().trim().replace(/\s+/g, '.')}@email.com`;
    const calculatedPhone = phone.trim() || '(11) 99999-0000';

    if (patientModalMode === 'create') {
      const created = addPatient({
        nutritionistId: assignedNutritionistId || undefined,
        name: name.trim(),
        email: calculatedEmail,
        phone: calculatedPhone,
        birthDate,
        age: Math.max(1, age),
        gender,
        heightCm: Math.max(50, heightCm),
        weightKg: Math.max(20, weightKg),
        activityLevel,
        bmrFormula,
        goal,
        targetCalories,
        targetProteinG,
        targetCarbsG,
        targetFatsG,
        targetWaterMl,
        notes,
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      });

      closePatientModal();

      if (openProntuarioAfterSave) {
        setSelectedPatientForDetail(created);
        setActivePatientId(created.id);
        setCurrentView('admin');
        setActiveAdminTab('patients');
        setActivePatientTab('overview');
      }
    } else if (patientModalMode === 'edit' && patientToEdit) {
      updatePatient(patientToEdit.id, {
        nutritionistId: assignedNutritionistId || undefined,
        name: name.trim(),
        email: calculatedEmail,
        phone: calculatedPhone,
        birthDate,
        age: Math.max(1, age),
        gender,
        heightCm: Math.max(50, heightCm),
        weightKg: Math.max(20, weightKg),
        activityLevel,
        bmrFormula,
        goal,
        targetCalories,
        targetProteinG,
        targetCarbsG,
        targetFatsG,
        targetWaterMl,
        notes,
      });

      const updatedObj = {
        ...patientToEdit,
        nutritionistId: assignedNutritionistId || undefined,
        name: name.trim(),
        email: calculatedEmail,
        phone: calculatedPhone,
        birthDate,
        age: Math.max(1, age),
        gender,
        heightCm: Math.max(50, heightCm),
        weightKg: Math.max(20, weightKg),
        activityLevel,
        bmrFormula,
        goal,
        targetCalories,
        targetProteinG,
        targetCarbsG,
        targetFatsG,
        targetWaterMl,
        notes,
      };

      closePatientModal();

      if (openProntuarioAfterSave) {
        setSelectedPatientForDetail(updatedObj);
        setActivePatientId(updatedObj.id);
        setCurrentView('admin');
        setActiveAdminTab('patients');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              {patientModalMode === 'create' ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <UserCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {patientModalMode === 'create'
                  ? 'Cadastrar Novo Paciente'
                  : `Editar Cadastro: ${patientToEdit?.name || 'Paciente'}`}
              </h3>
              <p className="text-xs text-slate-300">
                {patientModalMode === 'create'
                  ? 'Cálculo instantâneo de TMB, VET e estimativas de macronutrientes'
                  : 'Atualize dados pessoais, biométricos e metas calóricas'}
              </p>
            </div>
          </div>
          <button
            onClick={closePatientModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(true);
          }}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-700"
        >
          {/* Section 1: Personal Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Dados Pessoais & Contato</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-800 block mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos.silva@email.com"
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> WhatsApp / Telefone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Data de Nascimento
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Idade (anos)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Biometrics & Activity */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Biometria & Nível de Atividade</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sexo Biológico</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Peso Atual (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Altura (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Fórmula TMB</label>
                <select
                  value={bmrFormula}
                  onChange={(e) => setBmrFormula(e.target.value as BMRFormula)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="mifflin">Mifflin-St Jeor (Padrão)</option>
                  <option value="harris">Harris-Benedict</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nível de Atividade Física (FA)</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(parseFloat(e.target.value) as ActivityLevel)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value={1.2}>Sedentário (1.20 - Pouco ou nenhum exercício)</option>
                  <option value={1.375}>Levemente Ativo (1.375 - 1 a 3 dias/semana)</option>
                  <option value={1.55}>Moderadamente Ativo (1.55 - 3 a 5 dias/semana)</option>
                  <option value={1.725}>Muito Ativo (1.725 - 6 a 7 dias/semana)</option>
                  <option value={1.9}>Extremamente Ativo (1.90 - Treino 2x ao dia)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Objetivo Clínico Principal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as NutritionGoal)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="emagrecimento">🎯 Emagrecimento / Déficit Calórico (-400 kcal)</option>
                  <option value="hipertrofia">💪 Hipertrofia / Superávit (+350 kcal)</option>
                  <option value="saude_geral">🌿 Saúde Geral / Reeducação Alimentar</option>
                  <option value="manutencao">⚖️ Manutenção de Peso / Eucalórica</option>
                </select>
              </div>
            </div>

            {/* Nutritionist Assignment */}
            {nutritionists.length > 0 && (
              <div className="mt-2">
                <label className="font-semibold text-slate-700 block mb-1">Nutricionista Responsável</label>
                <select
                  value={assignedNutritionistId}
                  onChange={(e) => setAssignedNutritionistId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {nutritionists.map((nutri) => (
                    <option key={nutri.id} value={nutri.id}>
                      {nutri.name} ({nutri.crn})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section 3: Live Energetic Summary */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-slate-50 to-emerald-50/40 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-950 text-xs">
                  Cálculo Científico Instantâneo
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-500">IMC:</span>
                <span className={`font-black text-xs ${liveBMI.color}`}>
                  {liveBMI.value} ({liveBMI.classification.split(' ')[0]})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">TMB Basal</span>
                <span className="font-black text-slate-800 text-sm">{liveBMR}</span>
                <span className="text-[9px] text-slate-400 block">kcal/dia</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Gasto Total (VET)</span>
                <span className="font-black text-slate-900 text-sm">{liveTDEE}</span>
                <span className="text-[9px] text-slate-400 block">kcal/dia</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Meta Diária</span>
                <span className="font-black text-emerald-700 text-sm">{targetCalories}</span>
                <span className="text-[9px] text-emerald-600 font-bold block">kcal</span>
              </div>
            </div>

            {/* Macronutrient Preview Pills */}
            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block">Proteína</span>
                <span className="font-bold text-emerald-800">{targetProteinG}g</span>
              </div>
              <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block">Carboidratos</span>
                <span className="font-bold text-amber-700">{targetCarbsG}g</span>
              </div>
              <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block">Gorduras</span>
                <span className="font-bold text-blue-700">{targetFatsG}g</span>
              </div>
              <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block">Água</span>
                <span className="font-bold text-sky-700">{(targetWaterMl / 1000).toFixed(1)}L</span>
              </div>
            </div>
          </div>

          {/* Section 4: Clinical Notes */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Observações Clínicas & Histórico Inicial
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pratica musculação 4x na semana, queixa de inchaço matinal, preferência por plano com pouca lactose..."
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
            />
          </div>
        </form>

        {/* Modal Footer with Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={closePatientModal}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 hover:bg-white text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Salvar Apenas
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {patientModalMode === 'create' ? 'Salvar e Abrir Prontuário' : 'Salvar e Ver Prontuário'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
