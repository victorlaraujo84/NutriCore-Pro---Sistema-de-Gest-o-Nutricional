import React, { useState, useMemo } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { LabExamRecord, LabExamItem } from '../../types';
import {
  Activity,
  Plus,
  Trash2,
  Calendar,
  Building,
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

interface PatientAddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

const COMMON_PATIENT_PRESETS = [
  { name: 'Glicemia de Jejum', category: 'Glicemia & Insulina', unit: 'mg/dL', min: 70, max: 99, defaultVal: 85 },
  { name: 'Insulina Basal', category: 'Glicemia & Insulina', unit: 'uUI/mL', min: 2.0, max: 15.0, defaultVal: 5.5 },
  { name: 'Hemoglobina Glicada (HbA1c)', category: 'Glicemia & Insulina', unit: '%', min: 4.0, max: 5.6, defaultVal: 5.1 },
  { name: 'Colesterol Total', category: 'Perfil Lipídico', unit: 'mg/dL', min: 120, max: 190, defaultVal: 165 },
  { name: 'HDL Colesterol (Bom)', category: 'Perfil Lipídico', unit: 'mg/dL', min: 40, max: 90, defaultVal: 55 },
  { name: 'LDL Colesterol', category: 'Perfil Lipídico', unit: 'mg/dL', min: 50, max: 130, defaultVal: 95 },
  { name: 'VLDL Colesterol', category: 'Perfil Lipídico', unit: 'mg/dL', min: 10, max: 30, defaultVal: 18 },
  { name: 'Triglicerídeos', category: 'Perfil Lipídico', unit: 'mg/dL', min: 40, max: 150, defaultVal: 90 },
  { name: 'Vitamina D (25-OH)', category: 'Vitaminas & Minerais', unit: 'ng/mL', min: 20, max: 100, defaultVal: 45 },
  { name: 'Vitamina B12', category: 'Vitaminas & Minerais', unit: 'pg/mL', min: 200, max: 900, defaultVal: 480 },
  { name: 'Ácido Fólico (B9)', category: 'Vitaminas & Minerais', unit: 'ng/mL', min: 3.0, max: 20.0, defaultVal: 12.0 },
  { name: 'Zinco Sérico', category: 'Vitaminas & Minerais', unit: 'ug/dL', min: 70, max: 120, defaultVal: 95 },
  { name: 'Magnésio Sérico', category: 'Vitaminas & Minerais', unit: 'mg/dL', min: 1.7, max: 2.5, defaultVal: 2.1 },
  { name: 'TSH Ultra Sensível', category: 'Tireoide & Hormônios', unit: 'uUI/mL', min: 0.4, max: 4.5, defaultVal: 1.8 },
  { name: 'T4 Livre', category: 'Tireoide & Hormônios', unit: 'ng/dL', min: 0.8, max: 1.8, defaultVal: 1.2 },
  { name: 'Testosterona Total', category: 'Tireoide & Hormônios', unit: 'ng/dL', min: 250, max: 900, defaultVal: 520 },
  { name: 'Cortisol Basal (8h)', category: 'Tireoide & Hormônios', unit: 'ug/dL', min: 5.0, max: 20.0, defaultVal: 12.5 },
  { name: 'Creatinina Sérica', category: 'Função Renal & Hepática', unit: 'mg/dL', min: 0.6, max: 1.2, defaultVal: 0.9 },
  { name: 'Ureia', category: 'Função Renal & Hepática', unit: 'mg/dL', min: 15, max: 45, defaultVal: 28 },
  { name: 'Ácido Úrico', category: 'Função Renal & Hepática', unit: 'mg/dL', min: 2.5, max: 7.0, defaultVal: 4.5 },
  { name: 'TGO (AST)', category: 'Função Renal & Hepática', unit: 'U/L', min: 10, max: 40, defaultVal: 22 },
  { name: 'TGP (ALT)', category: 'Função Renal & Hepática', unit: 'U/L', min: 10, max: 40, defaultVal: 24 },
  { name: 'Gama GT', category: 'Função Renal & Hepática', unit: 'U/L', min: 8, max: 50, defaultVal: 20 },
  { name: 'Ferritina Sérica', category: 'Hemograma & Inflamatórios', unit: 'ng/mL', min: 30, max: 300, defaultVal: 110 },
  { name: 'Proteína C Reativa (PCR)', category: 'Hemograma & Inflamatórios', unit: 'mg/L', min: 0.1, max: 3.0, defaultVal: 0.6 },
  { name: 'Hemoglobina', category: 'Hemograma & Inflamatórios', unit: 'g/dL', min: 12.0, max: 17.0, defaultVal: 14.5 },
  { name: 'Hematócrito', category: 'Hemograma & Inflamatórios', unit: '%', min: 36, max: 52, defaultVal: 43 },
];

const CATEGORIES = [
  'Todos',
  'Glicemia & Insulina',
  'Perfil Lipídico',
  'Vitaminas & Minerais',
  'Tireoide & Hormônios',
  'Função Renal & Hepática',
  'Hemograma & Inflamatórios',
];

export const PatientAddExamModal: React.FC<PatientAddExamModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
}) => {
  const { addLabExam } = useNutrition();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState<string>('Exames Laboratoriais de Sangue');
  const [laboratoryName, setLaboratoryName] = useState<string>('Laboratório Dasa / Fleury / Lavoisier');
  const [clinicalObservations, setClinicalObservations] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [items, setItems] = useState<LabExamItem[]>([
    {
      id: `item-${Date.now()}-1`,
      name: 'Glicemia de Jejum',
      category: 'Glicemia & Insulina',
      value: 86,
      unit: 'mg/dL',
      minReference: 70,
      maxReference: 99,
      optimalMin: 75,
      optimalMax: 89,
      status: 'otimo',
    },
    {
      id: `item-${Date.now()}-2`,
      name: 'Colesterol Total',
      category: 'Perfil Lipídico',
      value: 172,
      unit: 'mg/dL',
      minReference: 120,
      maxReference: 190,
      optimalMin: 140,
      optimalMax: 180,
      status: 'normal',
    },
    {
      id: `item-${Date.now()}-3`,
      name: 'Vitamina D (25-OH)',
      category: 'Vitaminas & Minerais',
      value: 42,
      unit: 'ng/mL',
      minReference: 20,
      maxReference: 100,
      optimalMin: 40,
      optimalMax: 60,
      status: 'otimo',
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [presetValueInput, setPresetValueInput] = useState<number>(85);

  const filteredPresets = useMemo(() => {
    return COMMON_PATIENT_PRESETS.filter((p) => {
      const matchCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchSearch = searchTerm.trim() === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  const calculateStatus = (val: number, min: number, max: number): 'baixo' | 'normal' | 'otimo' | 'elevado' | 'critico' => {
    if (val < min) return 'baixo';
    if (val > max) return 'elevado';
    return 'otimo';
  };

  const handleAddPreset = (presetToAdd?: typeof COMMON_PATIENT_PRESETS[0], customVal?: number) => {
    const targetPreset = presetToAdd || COMMON_PATIENT_PRESETS[selectedPresetIndex];
    if (!targetPreset) return;

    const val = customVal !== undefined ? customVal : Number(presetValueInput);

    const newItem: LabExamItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: targetPreset.name,
      category: targetPreset.category as any,
      value: val,
      unit: targetPreset.unit,
      minReference: targetPreset.min,
      maxReference: targetPreset.max,
      status: calculateStatus(val, targetPreset.min, targetPreset.max),
    };

    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const handleSave = () => {
    if (!title.trim() || items.length === 0) {
      alert('Por favor, informe um título e pelo menos um resultado de exame.');
      return;
    }

    const newExamRecord: LabExamRecord = {
      id: `exam-${Date.now()}`,
      patientId,
      date,
      title,
      examName: title,
      laboratoryName,
      items,
      markers: items,
      clinicalObservations,
      notes: clinicalObservations,
      registeredBy: 'patient',
      fileName: uploadedFileName || 'Laudo_Laboratorial.pdf',
      createdAt: new Date().toISOString(),
    };

    addLabExam(newExamRecord);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-2xl">
              <Activity className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Cadastrar Meus Exames
              </h3>
              <p className="text-xs text-indigo-200">
                Seus resultados serão sincronizados direto com seu nutricionista
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* File Upload Box */}
          <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 rounded-2xl p-4 text-center cursor-pointer transition-colors relative">
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-800">
              {uploadedFileName ? `Arquivo anexado: ${uploadedFileName}` : 'Anexar Laudo em PDF ou Foto do Exame'}
            </p>
            <span className="text-[11px] text-slate-500">
              PDF, JPG ou PNG (opcional, para conferência do nutricionista)
            </span>
          </div>

          {/* Basic Exam Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Data de Coleta
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Laboratório
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={laboratoryName}
                  onChange={(e) => setLaboratoryName(e.target.value)}
                  placeholder="Ex: Fleury, Dasa, Hermes Pardini..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Título / Descrição do Exame
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Check-up Bioquímico Semestral"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Fast Preset Marker Adder with Categories & Search */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Marcadores Pré-definidos & Busca Rápida</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {filteredPresets.length} marcadores disponíveis
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar marcador (ex: Glicemia, Ferritina, TSH, Vitamina D...)"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selector + Value Input + Add Button */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
              <select
                value={selectedPresetIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setSelectedPresetIndex(idx);
                  const p = COMMON_PATIENT_PRESETS[idx];
                  if (p) setPresetValueInput(p.defaultVal || 50);
                }}
                className="sm:col-span-6 px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {filteredPresets.map((p) => {
                  const globalIdx = COMMON_PATIENT_PRESETS.findIndex((x) => x.name === p.name);
                  return (
                    <option key={p.name} value={globalIdx >= 0 ? globalIdx : 0}>
                      {p.name} ({p.unit})
                    </option>
                  );
                })}
              </select>

              <input
                type="number"
                step="0.1"
                value={presetValueInput}
                onChange={(e) => setPresetValueInput(Number(e.target.value))}
                placeholder="Valor"
                className="sm:col-span-3 px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-center"
              />

              <button
                type="button"
                onClick={() => handleAddPreset()}
                className="sm:col-span-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inserir</span>
              </button>
            </div>
          </div>

          {/* List of Registered Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Resultados Cadastrados ({items.length})
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(items || []).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-indigo-300 transition-colors shadow-2xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{item.name}</span>
                    <span className="text-[10px] text-slate-500">
                      Ref: {item.minReference} - {item.maxReference} {item.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-indigo-950">
                      {item.value} {item.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Observations */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Observações / Sintomas (Opcional)
            </label>
            <textarea
              value={clinicalObservations}
              onChange={(e) => setClinicalObservations(e.target.value)}
              rows={2}
              placeholder="Ex: Coleta feita em jejum de 12 horas. Sem sintomas no dia."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
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
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Salvar e Enviar ao Nutricionista</span>
          </button>
        </div>
      </div>
    </div>
  );
};
