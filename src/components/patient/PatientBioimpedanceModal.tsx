import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { AnthropometryRecord, BioimpedanceData } from '../../types';
import {
  Scale,
  UploadCloud,
  CheckCircle2,
  X,
  FileText,
  Activity,
  Droplets,
  HeartPulse,
  Flame,
  Sparkles
} from 'lucide-react';

interface PatientBioimpedanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export const PatientBioimpedanceModal: React.FC<PatientBioimpedanceModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
}) => {
  const { addAnthropometryRecord, activePatient } = useNutrition();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deviceModel, setDeviceModel] = useState<'inbody' | 'tanita' | 'omron' | 'manual_bioimpedance'>('inbody');
  const [weightKg, setWeightKg] = useState<number>(activePatient?.weightKg || 75.0);
  const [heightCm, setHeightCm] = useState<number>(activePatient?.heightCm || 175);
  const [bodyFatPercentage, setBodyFatPercentage] = useState<number>(18.5);
  const [skeletalMuscleMassKg, setSkeletalMuscleMassKg] = useState<number>(34.0);
  const [bodyWaterLiters, setBodyWaterLiters] = useState<number>(42.0);
  const [visceralFatLevel, setVisceralFatLevel] = useState<number>(4);
  const [basalMetabolicRateKcal, setBasalMetabolicRateKcal] = useState<number>(1700);
  const [inbodyScore, setInbodyScore] = useState<number>(82);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSimulatingPdf, setIsSimulatingPdf] = useState<boolean>(false);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setIsSimulatingPdf(true);
      setTimeout(() => {
        // Auto extract mock realistic values from uploaded report
        setWeightKg(81.8);
        setBodyFatPercentage(14.2);
        setSkeletalMuscleMassKg(38.6);
        setBodyWaterLiters(47.5);
        setVisceralFatLevel(3);
        setBasalMetabolicRateKcal(1820);
        setInbodyScore(85);
        setNotes(`Laudo importado automaticamente do arquivo ${file.name} (Balança InBody 270/370)`);
        setIsSimulatingPdf(false);
      }, 700);
    }
  };

  const handleSave = () => {
    const fatMassKg = Math.round(((weightKg * bodyFatPercentage) / 100) * 10) / 10;
    const leanMassKg = Math.round((weightKg - fatMassKg) * 10) / 10;
    const heightM = heightCm / 100;
    const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

    const bioData: BioimpedanceData = {
      method: deviceModel,
      rawPdfFileName: uploadedFileName || undefined,
      bodyWaterLiters,
      skeletalMuscleMassKg,
      visceralFatLevel,
      basalMetabolicRateKcal,
      inbodyScore,
    };

    const newRecord: AnthropometryRecord = {
      id: `anthro-pat-${Date.now()}`,
      patientId,
      date,
      assessmentType: 'bioimpedancia',
      weightKg,
      heightCm,
      skinfolds: {
        subscapular: 0,
        triceps: 0,
        pectoral: 0,
        midaxillary: 0,
        suprailiac: 0,
        abdominal: 0,
        thigh: 0,
      },
      sumSkinfolds: 0,
      bodyDensity: 1.06,
      bodyFatPercentage,
      fatMassKg,
      leanMassKg,
      bmi,
      bioimpedance: bioData,
      notes: notes || 'Avaliação por bioimpedância registrada pelo próprio paciente.',
      registeredBy: 'patient',
    };

    addAnthropometryRecord(newRecord);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl">
              <Scale className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Importar Resultado da Bioimpedância
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Envie o PDF do laudo (InBody/Tanita) ou preencha os valores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* PDF Upload */}
          <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 rounded-2xl p-4 text-center cursor-pointer transition-colors relative">
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handlePdfUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-800">
              {isSimulatingPdf
                ? 'Processando PDF da balança...'
                : uploadedFileName
                ? `Laudo carregado: ${uploadedFileName}`
                : 'Clique ou arraste o PDF do laudo InBody / Tanita'}
            </p>
            <span className="text-[11px] text-slate-500">
              Extração automática de peso, % de gordura e massa muscular
            </span>
          </div>

          {/* Date & Device model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Data do Exame
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Modelo da Balança
              </label>
              <select
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
              >
                <option value="inbody">InBody (Multi-frequência)</option>
                <option value="tanita">Tanita Profissional</option>
                <option value="omron">Omron Tetrapolar</option>
                <option value="manual_bioimpedance">Outra Balança de Bioimpedância</option>
              </select>
            </div>
          </div>

          {/* Main Measured Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Peso Total</span>
              <div className="flex items-baseline gap-1 mt-1">
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full text-base font-black text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-0.5"
                />
                <span className="text-xs text-slate-500 font-bold">kg</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">% Gordura</span>
              <div className="flex items-baseline gap-1 mt-1">
                <input
                  type="number"
                  step="0.1"
                  value={bodyFatPercentage}
                  onChange={(e) => setBodyFatPercentage(Number(e.target.value))}
                  className="w-full text-base font-black text-emerald-950 bg-white border border-emerald-300 rounded-lg px-2 py-0.5"
                />
                <span className="text-xs text-emerald-700 font-bold">%</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-800 uppercase block">Massa Muscular</span>
              <div className="flex items-baseline gap-1 mt-1">
                <input
                  type="number"
                  step="0.1"
                  value={skeletalMuscleMassKg}
                  onChange={(e) => setSkeletalMuscleMassKg(Number(e.target.value))}
                  className="w-full text-base font-black text-blue-950 bg-white border border-blue-300 rounded-lg px-2 py-0.5"
                />
                <span className="text-xs text-blue-700 font-bold">kg</span>
              </div>
            </div>

            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-2xl">
              <span className="text-[10px] font-bold text-cyan-800 uppercase block">Água Corporal</span>
              <div className="flex items-baseline gap-1 mt-1">
                <input
                  type="number"
                  step="0.1"
                  value={bodyWaterLiters}
                  onChange={(e) => setBodyWaterLiters(Number(e.target.value))}
                  className="w-full text-base font-black text-cyan-950 bg-white border border-cyan-300 rounded-lg px-2 py-0.5"
                />
                <span className="text-xs text-cyan-700 font-bold">L</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Gordura Visceral</span>
              <div className="flex items-baseline gap-1 mt-1">
                <input
                  type="number"
                  value={visceralFatLevel}
                  onChange={(e) => setVisceralFatLevel(Number(e.target.value))}
                  className="w-full text-base font-black text-amber-950 bg-white border border-amber-300 rounded-lg px-2 py-0.5"
                />
                <span className="text-xs text-amber-700 font-bold">Nvl</span>
              </div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl">
              <span className="text-[10px] font-bold text-purple-800 uppercase block">TMB Aparelho</span>
              <div className="flex items-baseline gap-1 mt-1">
                <input
                  type="number"
                  value={basalMetabolicRateKcal}
                  onChange={(e) => setBasalMetabolicRateKcal(Number(e.target.value))}
                  className="w-full text-base font-black text-purple-950 bg-white border border-purple-300 rounded-lg px-2 py-0.5"
                />
                <span className="text-xs text-purple-700 font-bold">kcal</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Observações do Paciente
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Exame feito em jejum pela manhã antes do treino..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Salvar Bioimpedância</span>
          </button>
        </div>
      </div>
    </div>
  );
};
