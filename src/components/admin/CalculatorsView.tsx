import React, { useState } from 'react';
import {
  calculateBMR,
  calculateTDEE,
  calculateBMI,
  calculatePollock7,
  getBodyFatClassification
} from '../../utils/nutritionCalculations';
import { Gender, ActivityLevel, BMRFormula, SkinfoldMeasurements } from '../../types';
import {
  Calculator,
  Flame,
  Scale,
  Sparkles,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';

export const CalculatorsView: React.FC = () => {
  // Calculator 1: TMB & TDEE / VET
  const [weight, setWeight] = useState<number>(75);
  const [height, setHeight] = useState<number>(175);
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<Gender>('Masculino');
  const [activity, setActivity] = useState<ActivityLevel>(1.55);

  const mifflinBMR = calculateBMR(weight, height, age, gender, 'mifflin');
  const harrisBMR = calculateBMR(weight, height, age, gender, 'harris');
  const mifflinTDEE = calculateTDEE(mifflinBMR, activity);
  const harrisTDEE = calculateTDEE(harrisBMR, activity);
  const bmiResult = calculateBMI(weight, height);

  // Calculator 2: Pollock 7-Skinfold standalone
  const [pollockAge, setPollockAge] = useState<number>(28);
  const [pollockGender, setPollockGender] = useState<Gender>('Masculino');
  const [pollockWeight, setPollockWeight] = useState<number>(74);
  const [skinfolds, setSkinfolds] = useState<SkinfoldMeasurements>({
    subscapular: 11,
    triceps: 9,
    pectoral: 7,
    midaxillary: 10,
    suprailiac: 13,
    abdominal: 15,
    thigh: 12,
  });

  const pollockResult = calculatePollock7(skinfolds, pollockAge, pollockGender, pollockWeight);
  const bfClass = getBodyFatClassification(pollockResult.bodyFatPercentage, pollockGender);

  const handleSkinfold = (field: keyof SkinfoldMeasurements, val: string) => {
    setSkinfolds((prev) => ({ ...prev, [field]: Math.max(0, parseFloat(val) || 0) }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center space-x-3">
        <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
          <Calculator className="w-6 h-6" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Calculadora Científica Nutricional
          </h2>
          <p className="text-xs text-slate-500">
            Simulador ágil de fórmulas metabólicas (Harris-Benedict vs Mifflin-St Jeor) e Composição Corporal (Pollock 7D)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: TMB / TDEE Comparator */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              1. Comparador de TMB & Gasto Energético Total (VET)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Altura (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Idade (anos)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Sexo</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full p-2 border border-slate-200 rounded-lg font-semibold"
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Fator de Atividade Física Diária
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(parseFloat(e.target.value) as ActivityLevel)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-semibold bg-slate-50"
            >
              <option value={1.2}>Sedentário (Pouco ou nenhum exercício) - 1.2x</option>
              <option value={1.375}>Levemente Ativo (Exercício 1-3 dias/sem) - 1.375x</option>
              <option value={1.55}>Moderadamente Ativo (Exercício 3-5 dias/sem) - 1.55x</option>
              <option value={1.725}>Muito Ativo (Exercício pesado 6-7 dias/sem) - 1.725x</option>
              <option value={1.9}>Extremamente Ativo (Atleta profissional) - 1.9x</option>
            </select>
          </div>

          {/* Results Comparison Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-900 uppercase block">
                Mifflin-St Jeor (1990)
              </span>
              <span className="text-xs text-emerald-700 font-medium">Mais recomendada</span>
              <div className="mt-2">
                <span className="text-xs text-slate-500 block">TMB Basal:</span>
                <span className="text-xl font-black text-slate-900">{mifflinBMR} kcal</span>
              </div>
              <div className="mt-1 pt-1 border-t border-emerald-200">
                <span className="text-xs text-slate-500 block">Gasto Total VET:</span>
                <span className="text-2xl font-black text-emerald-700">{mifflinTDEE} kcal</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-800 uppercase block">
                Harris-Benedict (1984)
              </span>
              <span className="text-xs text-slate-500 font-medium">Clássica</span>
              <div className="mt-2">
                <span className="text-xs text-slate-500 block">TMB Basal:</span>
                <span className="text-xl font-black text-slate-900">{harrisBMR} kcal</span>
              </div>
              <div className="mt-1 pt-1 border-t border-slate-200">
                <span className="text-xs text-slate-500 block">Gasto Total VET:</span>
                <span className="text-2xl font-black text-slate-800">{harrisTDEE} kcal</span>
              </div>
            </div>
          </div>

          {/* IMC & Target Suggestions */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">IMC Calculado:</span>
              <span className={`font-bold ml-1 ${bmiResult.color}`}>
                {bmiResult.value} ({bmiResult.classification})
              </span>
            </div>
            <div>
              <span className="text-slate-500">Água Recomendada:</span>
              <span className="font-bold text-cyan-700 ml-1">
                {Math.round(weight * 35)} ml/dia
              </span>
            </div>
          </div>
        </div>

        {/* Module 2: Pollock 7-Skinfolds Quick Calculator */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Scale className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              2. Pollock 7 Dobras Cutâneas (Jackson & Pollock)
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Idade</label>
              <input
                type="number"
                value={pollockAge}
                onChange={(e) => setPollockAge(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Sexo</label>
              <select
                value={pollockGender}
                onChange={(e) => setPollockGender(e.target.value as Gender)}
                className="w-full p-2 border border-slate-200 rounded-lg font-semibold"
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.5"
                value={pollockWeight}
                onChange={(e) => setPollockWeight(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-600 block">Subescapular</label>
              <input
                type="number"
                step="0.5"
                value={skinfolds.subscapular}
                onChange={(e) => handleSkinfold('subscapular', e.target.value)}
                className="w-full p-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 block">Tríceps</label>
              <input
                type="number"
                step="0.5"
                value={skinfolds.triceps}
                onChange={(e) => handleSkinfold('triceps', e.target.value)}
                className="w-full p-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 block">Peitoral</label>
              <input
                type="number"
                step="0.5"
                value={skinfolds.pectoral}
                onChange={(e) => handleSkinfold('pectoral', e.target.value)}
                className="w-full p-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 block">Axilar Média</label>
              <input
                type="number"
                step="0.5"
                value={skinfolds.midaxillary}
                onChange={(e) => handleSkinfold('midaxillary', e.target.value)}
                className="w-full p-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 block">Supra-ilíaca</label>
              <input
                type="number"
                step="0.5"
                value={skinfolds.suprailiac}
                onChange={(e) => handleSkinfold('suprailiac', e.target.value)}
                className="w-full p-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 block">Abdominal</label>
              <input
                type="number"
                step="0.5"
                value={skinfolds.abdominal}
                onChange={(e) => handleSkinfold('abdominal', e.target.value)}
                className="w-full p-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 block">Coxa Medial</label>
              <input
                type="number"
                step="0.5"
                value={skinfolds.thigh}
                onChange={(e) => handleSkinfold('thigh', e.target.value)}
                className="w-full p-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex flex-col justify-center text-center">
              <span className="text-[10px] text-slate-400 block">Soma Dobras</span>
              <span className="font-black text-slate-800 text-xs">{pollockResult.sumSkinfolds} mm</span>
            </div>
          </div>

          {/* Pollock Outcome Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs text-center">
              <span className="text-[10px] font-semibold text-emerald-100 uppercase block">
                % Gordura (BF)
              </span>
              <span className="text-2xl font-black mt-0.5 block">
                {pollockResult.bodyFatPercentage}%
              </span>
              <span className="text-[10px] text-emerald-100 block truncate">
                {bfClass.label}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                Massa Magra
              </span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {pollockResult.leanMassKg} kg
              </span>
              <span className="text-[10px] text-emerald-600">
                {Number(((pollockResult.leanMassKg / (pollockWeight || 1)) * 100).toFixed(0))}% massa magra
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                Massa Gorda
              </span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {pollockResult.fatMassKg} kg
              </span>
              <span className="text-[10px] text-slate-400">Gordura total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
