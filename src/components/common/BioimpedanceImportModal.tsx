import React, { useState, useRef } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import {
  FileUp,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Scale,
  Zap,
  Trash2,
  Layers,
  Flame,
  Droplets,
  Calendar
} from 'lucide-react';
import { parseBioimpedanceText, BioimpedanceParseResult } from '../../utils/bioimpedanceParser';
import { BioimpedanceData } from '../../types';

interface BioimpedanceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: {
    date: string;
    weightKg: number;
    heightCm: number;
    bodyFatPercentage: number;
    leanMassKg: number;
    fatMassKg: number;
    bmi: number;
    bioimpedance: BioimpedanceData;
    notes: string;
  }) => void;
}

export const BioimpedanceImportModal: React.FC<BioimpedanceImportModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
}) => {
  const { selectedPatientForDetail, activePatient } = useNutrition();
  const patient = selectedPatientForDetail || activePatient;

  const [rawText, setRawText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<BioimpedanceParseResult | null>(null);
  const [evaluationDate, setEvaluationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Editable parsed fields
  const [weightKg, setWeightKg] = useState<number>(patient?.weightKg || 70);
  const [heightCm, setHeightCm] = useState<number>(patient?.heightCm || 170);
  const [bodyFatPercentage, setBodyFatPercentage] = useState<number>(18);
  const [skeletalMuscleMassKg, setSkeletalMuscleMassKg] = useState<number>(32);
  const [leanMassKg, setLeanMassKg] = useState<number>(55);
  const [fatMassKg, setFatMassKg] = useState<number>(15);
  const [bodyWaterLiters, setBodyWaterLiters] = useState<number>(40);
  const [visceralFatLevel, setVisceralFatLevel] = useState<number>(5);
  const [basalMetabolicRateKcal, setBasalMetabolicRateKcal] = useState<number>(1650);
  const [inbodyScore, setInbodyScore] = useState<number>(78);
  const [notes, setNotes] = useState<string>('Laudo de Bioimpedância importado');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Simple text parser trigger
  const handleAnalyzeText = (textToParse: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = parseBioimpedanceText(textToParse);
      setParseResult(result);
      if (result.success) {
        if (result.extractedWeightKg) setWeightKg(result.extractedWeightKg);
        if (result.extractedHeightCm) setHeightCm(result.extractedHeightCm);
        if (result.extractedBodyFatPercentage) setBodyFatPercentage(result.extractedBodyFatPercentage);
        if (result.extractedLeanMassKg) setLeanMassKg(result.extractedLeanMassKg);
        if (result.extractedFatMassKg) setFatMassKg(result.extractedFatMassKg);
        if (result.data?.skeletalMuscleMassKg) setSkeletalMuscleMassKg(result.data.skeletalMuscleMassKg);
        if (result.data?.bodyWaterLiters) setBodyWaterLiters(result.data.bodyWaterLiters);
        if (result.data?.visceralFatLevel) setVisceralFatLevel(result.data.visceralFatLevel);
        if (result.data?.basalMetabolicRateKcal) setBasalMetabolicRateKcal(result.data.basalMetabolicRateKcal);
        if (result.data?.inbodyScore) setInbodyScore(result.data.inbodyScore);
      }
      setIsProcessing(false);
    }, 400);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    // Read text from file (works for text/PDF reports exported as text)
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        handleAnalyzeText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleInBody = () => {
    const sampleInBody = `INBODY 270 - AVALIAÇÃO DE COMPOSIÇÃO CORPORAL
Paciente: ${patient?.name || 'Paciente'}
Idade: ${patient?.age || 28} anos | Sexo: ${patient?.gender || 'Masculino'}
Data do Exame: ${new Date().toLocaleDateString('pt-BR')}

--- ANÁLISE DE COMPOSIÇÃO CORPORAL ---
Peso Corporal: ${patient?.weightKg || 74.5} kg
Altura: ${patient?.heightCm || 175} cm
Massa Livre de Gordura (MLG): 61.2 kg
Massa Muscular Esquelética (MME): 34.8 kg
Massa de Gordura: 13.3 kg
Água Corporal Total (ACT): 45.1 L
Minerais: 3.8 kg

--- DIAGNÓSTICO DE OBESIDADE ---
IMC: 24.3 kg/m²
Percentual de Gordura Corporal (PGC): 17.8 %
Nível de Gordura Visceral: 4
Taxa Metabólica Basal: 1720 kcal
Pontuação InBody: 82 / 100

--- CONTROLE DE GORDURA & MÚSCULO ---
Peso Ideal: 72.0 kg
Controle de Gordura: -1.5 kg
Controle de Músculo: +0.0 kg`;

    setRawText(sampleInBody);
    handleAnalyzeText(sampleInBody);
  };

  const handleConfirmApply = () => {
    const bmiVal = heightCm > 0 ? Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1)) : 22;

    const bioData: BioimpedanceData = {
      method: parseResult?.detectedBrand === 'InBody' ? 'inbody' : 'manual_bioimpedance',
      rawPdfFileName: selectedFile?.name,
      bodyWaterLiters,
      dryLeanMassKg: leanMassKg,
      visceralFatLevel,
      basalMetabolicRateKcal,
      skeletalMuscleMassKg,
      inbodyScore,
    };

    onApplyData({
      date: evaluationDate,
      weightKg,
      heightCm,
      bodyFatPercentage,
      leanMassKg,
      fatMassKg,
      bmi: bmiVal,
      bioimpedance: bioData,
      notes: `${notes} (${parseResult?.detectedBrand || 'Bioimpedância'})`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Importar Laudo de Bioimpedância (PDF / TXT)</h3>
              <p className="text-xs text-slate-300">
                Compatível com InBody (270/370/770), Tanita, Omron e laudos clínicos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Upload & Fast Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 rounded-2xl cursor-pointer text-center space-y-1 transition-all"
            >
              <FileUp className="w-6 h-6 text-emerald-600 mx-auto" />
              <span className="text-xs font-bold text-slate-800 block">
                {selectedFile ? selectedFile.name : 'Selecionar Arquivo do Laudo (PDF / TXT)'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Clique para carregar o arquivo exportado da balança
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.csv,.doc"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="p-4 border border-slate-200 bg-slate-50 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Leitor Inteligente / Teste</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Carregue um exemplo padrão InBody para testar a extração instantânea.
                </p>
              </div>
              <button
                onClick={handleLoadSampleInBody}
                className="mt-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Carregar Exemplo InBody</span>
              </button>
            </div>
          </div>

          {/* Raw Text Input / Parser */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">
                Texto do Laudo (cole aqui ou carregue o arquivo acima):
              </label>
              {rawText && (
                <button
                  onClick={() => handleAnalyzeText(rawText)}
                  className="text-[11px] text-emerald-700 font-semibold hover:underline"
                >
                  Reanalisar Texto
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                handleAnalyzeText(e.target.value);
              }}
              placeholder="Ex: Cole o texto do exame de bioimpedância aqui (Peso: 74kg, PGC: 18%, MME: 34kg...)"
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono bg-slate-50"
            />
          </div>

          {/* Extracted / Editable Metrics Preview */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">
                  Parâmetros Extraídos do Exame
                </span>
              </div>
              {parseResult && (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Aparelho Detectado: {parseResult.detectedBrand}</span>
                </span>
              )}
            </div>

            {/* Date & Core Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Data da Avaliação
                </label>
                <input
                  type="date"
                  value={evaluationDate}
                  onChange={(e) => setEvaluationDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  % Gordura (BF)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bodyFatPercentage}
                  onChange={(e) => setBodyFatPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-emerald-300 text-emerald-700 font-black rounded-xl bg-emerald-50/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Músculo Esquelético (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={skeletalMuscleMassKg}
                  onChange={(e) => setSkeletalMuscleMassKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold text-blue-700"
                />
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Massa Magra (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={leanMassKg}
                  onChange={(e) => setLeanMassKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Massa Gorda (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={fatMassKg}
                  onChange={(e) => setFatMassKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Água Corporal (L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bodyWaterLiters}
                  onChange={(e) => setBodyWaterLiters(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Gordura Visceral (Nível)
                </label>
                <input
                  type="number"
                  value={visceralFatLevel}
                  onChange={(e) => setVisceralFatLevel(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white font-semibold text-amber-700"
                />
              </div>
            </div>

            {/* InBody / Clinic Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  TMB Aparelho (kcal) / Score
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={basalMetabolicRateKcal}
                    onChange={(e) => setBasalMetabolicRateKcal(parseInt(e.target.value) || 0)}
                    placeholder="TMB"
                    className="p-2 border border-slate-200 rounded-xl bg-white"
                  />
                  <input
                    type="number"
                    value={inbodyScore}
                    onChange={(e) => setInbodyScore(parseInt(e.target.value) || 0)}
                    placeholder="Pontos (ex: 80)"
                    className="p-2 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Observações da Consulta
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmApply}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Salvar como Nova Avaliação no Prontuário</span>
          </button>
        </div>
      </div>
    </div>
  );
};
