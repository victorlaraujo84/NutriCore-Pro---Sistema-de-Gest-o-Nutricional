import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { LabExamRecord, LabExamItem } from '../../types';
import {
  Activity,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';

const COMMON_EXAM_PRESETS: Omit<LabExamItem, 'id' | 'value' | 'status'>[] = [
  {
    name: 'Glicemia de Jejum',
    category: 'Glicemia & Insulina',
    unit: 'mg/dL',
    minReference: 70,
    maxReference: 99,
    optimalMin: 75,
    optimalMax: 89,
    notes: 'Avaliação do metabolismo glicídico basal.'
  },
  {
    name: 'Hemoglobina Glicada (HbA1c)',
    category: 'Glicemia & Insulina',
    unit: '%',
    minReference: 4.0,
    maxReference: 5.6,
    optimalMin: 4.5,
    optimalMax: 5.2,
    notes: 'Média ponderada da glicose dos últimos 90 dias.'
  },
  {
    name: 'Insulina Basal',
    category: 'Glicemia & Insulina',
    unit: 'uUI/mL',
    minReference: 2.0,
    maxReference: 24.9,
    optimalMin: 2.5,
    optimalMax: 8.0,
    notes: 'Índice de sensibilidade à insulina (HOMA-IR).'
  },
  {
    name: 'Colesterol Total',
    category: 'Perfil Lipídico',
    unit: 'mg/dL',
    minReference: 120,
    maxReference: 190,
    optimalMin: 140,
    optimalMax: 180,
  },
  {
    name: 'HDL Colesterol (Bom)',
    category: 'Perfil Lipídico',
    unit: 'mg/dL',
    minReference: 40,
    maxReference: 90,
    optimalMin: 55,
    optimalMax: 80,
  },
  {
    name: 'LDL Colesterol',
    category: 'Perfil Lipídico',
    unit: 'mg/dL',
    minReference: 50,
    maxReference: 130,
    optimalMin: 60,
    optimalMax: 100,
  },
  {
    name: 'Triglicerídeos',
    category: 'Perfil Lipídico',
    unit: 'mg/dL',
    minReference: 40,
    maxReference: 150,
    optimalMin: 50,
    optimalMax: 100,
  },
  {
    name: 'Vitamina D (25-OH)',
    category: 'Vitaminas & Minerais',
    unit: 'ng/mL',
    minReference: 20,
    maxReference: 100,
    optimalMin: 40,
    optimalMax: 60,
    notes: 'Essencial para imunidade, fixação óssea e síntese proteica.'
  },
  {
    name: 'Vitamina B12',
    category: 'Vitaminas & Minerais',
    unit: 'pg/mL',
    minReference: 200,
    maxReference: 900,
    optimalMin: 500,
    optimalMax: 850,
  },
  {
    name: 'Ferritina Sérica',
    category: 'Hemograma & Inflamatórios',
    unit: 'ng/mL',
    minReference: 30,
    maxReference: 400,
    optimalMin: 80,
    optimalMax: 200,
  },
  {
    name: 'TSH Ultra Sensível',
    category: 'Tireoide & Hormônios',
    unit: 'uUI/mL',
    minReference: 0.4,
    maxReference: 4.5,
    optimalMin: 1.0,
    optimalMax: 2.5,
  },
  {
    name: 'T4 Livre',
    category: 'Tireoide & Hormônios',
    unit: 'ng/dL',
    minReference: 0.8,
    maxReference: 1.8,
    optimalMin: 1.1,
    optimalMax: 1.5,
  },
  {
    name: 'Creatinina Sérica',
    category: 'Função Renal & Hepática',
    unit: 'mg/dL',
    minReference: 0.7,
    maxReference: 1.3,
    optimalMin: 0.8,
    optimalMax: 1.15,
  },
  {
    name: 'TGO (AST)',
    category: 'Função Renal & Hepática',
    unit: 'U/L',
    minReference: 10,
    maxReference: 40,
    optimalMin: 15,
    optimalMax: 30,
  },
  {
    name: 'TGP (ALT)',
    category: 'Função Renal & Hepática',
    unit: 'U/L',
    minReference: 10,
    maxReference: 40,
    optimalMin: 15,
    optimalMax: 30,
  },
  {
    name: 'Proteína C Reativa (PCR Ultrassensível)',
    category: 'Hemograma & Inflamatórios',
    unit: 'mg/L',
    minReference: 0.0,
    maxReference: 3.0,
    optimalMin: 0.0,
    optimalMax: 1.0,
    notes: 'Marcador inflamatório sistêmico e risco cardiovascular.'
  }
];

export const LabExamsView: React.FC = () => {
  const {
    patientLabExams,
    addLabExam,
    deleteLabExam,
    selectedPatientForDetail,
    activePatientId,
    patients,
    clinicConfig,
    currentNutritionist
  } = useNutrition();

  const targetPatient = selectedPatientForDetail || patients.find((p) => p.id === activePatientId) || patients[0];

  const [isNewExamModalOpen, setIsNewExamModalOpen] = useState(false);
  const [selectedExamRecord, setSelectedExamRecord] = useState<LabExamRecord | null>(
    patientLabExams[0] || null
  );

  // Form State
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examTitle, setExamTitle] = useState('Painel Bioquímico de Rotina');
  const [laboratoryName, setLaboratoryName] = useState('Laboratório de Análises Clínicas');
  const [clinicalObservations, setClinicalObservations] = useState('');
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>('Todos');
  const [presetSearchTerm, setPresetSearchTerm] = useState<string>('');
  const [examItems, setExamItems] = useState<Omit<LabExamItem, 'id'>[]>(
    COMMON_EXAM_PRESETS.slice(0, 6).map((preset) => ({
      ...preset,
      value: preset.minReference + (preset.maxReference - preset.minReference) * 0.4,
      status: 'normal'
    }))
  );

  const filteredExamPresets = COMMON_EXAM_PRESETS.filter((preset) => {
    const matchCat = presetCategoryFilter === 'Todos' || preset.category === presetCategoryFilter;
    const matchSearch = presetSearchTerm.trim() === '' ||
      preset.name.toLowerCase().includes(presetSearchTerm.toLowerCase()) ||
      preset.category.toLowerCase().includes(presetSearchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const calculateStatus = (value: number, item: Omit<LabExamItem, 'id'>): LabExamItem['status'] => {
    if (value < item.minReference) return 'baixo';
    if (value > item.maxReference) return 'elevado';
    if (item.optimalMin !== undefined && item.optimalMax !== undefined) {
      if (value >= item.optimalMin && value <= item.optimalMax) return 'otimo';
    }
    return 'normal';
  };

  const handleItemValueChange = (index: number, val: number) => {
    setExamItems((prev) =>
      prev.map((it, idx) => {
        if (idx === index) {
          const status = calculateStatus(val, it);
          return { ...it, value: val, status };
        }
        return it;
      })
    );
  };

  const handleAddPresetItem = (preset: typeof COMMON_EXAM_PRESETS[0]) => {
    const exists = examItems.some((it) => it.name === preset.name);
    if (exists) return;
    const defaultVal = preset.optimalMin || preset.minReference;
    const status = calculateStatus(defaultVal, { ...preset, value: defaultVal, status: 'normal' });
    setExamItems((prev) => [...prev, { ...preset, value: defaultVal, status }]);
  };

  const handleRemoveItem = (index: number) => {
    setExamItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatient || examItems.length === 0) return;

    const created = addLabExam({
      patientId: targetPatient.id,
      date: examDate,
      title: examTitle,
      laboratoryName,
      requestingProfessional: currentNutritionist?.name || clinicConfig.nutritionistName,
      clinicalObservations,
      items: examItems.map((it, idx) => ({
        ...it,
        id: `li-${Date.now()}-${idx}`
      }))
    });

    setSelectedExamRecord(created);
    setIsNewExamModalOpen(false);
  };

  const getStatusBadge = (status: LabExamItem['status']) => {
    switch (status) {
      case 'otimo':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Ótimo
          </span>
        );
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full">
            Normal
          </span>
        );
      case 'baixo':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            <TrendingDown className="w-3 h-3" /> Abaixo da Ref.
          </span>
        );
      case 'elevado':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" /> Elevado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Exames Laboratoriais & Perfil Bioquímico
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Acompanhe a evolução de marcadores de glicemia, perfil lipídico, vitaminas e função metabólica de <strong>{targetPatient?.name}</strong>.
          </p>
        </div>

        <button
          onClick={() => setIsNewExamModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Novos Exames</span>
        </button>
      </div>

      {patientLabExams.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Exam Records History Timeline */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Histórico de Laudos ({patientLabExams.length})
            </div>

            <div className="space-y-3">
              {patientLabExams.map((record) => {
                const isSelected = selectedExamRecord?.id === record.id;
                const optimalCount = record.items.filter((i) => i.status === 'otimo' || i.status === 'normal').length;
                const alertCount = record.items.filter((i) => i.status === 'baixo' || i.status === 'elevado' || i.status === 'critico').length;

                return (
                  <div
                    key={record.id}
                    onClick={() => setSelectedExamRecord(record)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {record.title}
                      </span>
                      <span className="text-[11px] font-mono font-medium text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                      <span className="truncate">{record.laboratoryName || 'Laboratório Clínico'}</span>
                      {record.registeredBy === 'patient' && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                          Enviado pelo Paciente
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        {optimalCount} normais/ótimos
                      </span>
                      {alertCount > 0 && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium">
                          {alertCount} alterados
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Exam Detailed Values */}
          <div className="lg:col-span-8">
            {selectedExamRecord ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                          Laudo de {new Date(selectedExamRecord.date).toLocaleDateString('pt-BR')}
                        </span>
                        {selectedExamRecord.laboratoryName && (
                          <span className="text-xs text-slate-500">
                            • {selectedExamRecord.laboratoryName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mt-1.5">
                        {selectedExamRecord.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => deleteLabExam(selectedExamRecord.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir este laudo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedExamRecord.clinicalObservations && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold block text-slate-900 mb-0.5">Observações Clínicas & Conduta:</span>
                      {selectedExamRecord.clinicalObservations}
                    </div>
                  )}
                </div>

                {/* Table of Biomarkers */}
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="pb-3">Exame / Marcador</th>
                        <th className="pb-3">Categoria</th>
                        <th className="pb-3 text-right">Resultado</th>
                        <th className="pb-3 text-center">Faixa de Referência</th>
                        <th className="pb-3 text-center">Faixa Ótima</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedExamRecord.items || []).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 font-semibold text-slate-900">
                            <div>{item.name}</div>
                            {item.notes && <div className="text-[11px] text-slate-400 font-normal">{item.notes}</div>}
                          </td>
                          <td className="py-3 text-slate-500">
                            {item.category}
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-sm text-slate-900">
                            {item.value} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                          </td>
                          <td className="py-3 text-center font-mono text-slate-600">
                            {item.minReference} – {item.maxReference} {item.unit}
                          </td>
                          <td className="py-3 text-center font-mono text-emerald-700 font-medium">
                            {item.optimalMin !== undefined && item.optimalMax !== undefined
                              ? `${item.optimalMin} – ${item.optimalMax} ${item.unit}`
                              : '—'}
                          </td>
                          <td className="py-3 text-right">
                            {getStatusBadge(item.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                Selecione um exame à esquerda para visualizar a tabela de resultados.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <Activity className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhum exame laboratorial registrado ainda</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cadastre os laudos de sangue, perfil lipídico e hormonal para acompanhar os parâmetros bioquímicos do paciente de forma comparativa.
          </p>
          <button
            onClick={() => setIsNewExamModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Lançar Primeiro Exame
          </button>
        </div>
      )}

      {/* New Exam Modal */}
      {isNewExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Lançamento de Laudo Laboratorial — {targetPatient?.name}
              </h3>
              <button
                onClick={() => setIsNewExamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 overflow-y-auto pr-1 py-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Coleta / Exame:
                  </label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título / Descrição do Laudo:
                  </label>
                  <input
                    type="text"
                    required
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Laboratório Responsável:
                  </label>
                  <input
                    type="text"
                    value={laboratoryName}
                    onChange={(e) => setLaboratoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Add Presets with Categories and Search */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Adicionar Marcadores Rápidos (+):
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {filteredExamPresets.length} marcadores
                  </span>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                  {[
                    'Todos',
                    'Glicemia & Insulina',
                    'Perfil Lipídico',
                    'Vitaminas & Minerais',
                    'Tireoide & Hormônios',
                    'Função Renal & Hepática',
                    'Hemograma & Inflamatórios'
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPresetCategoryFilter(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-bold transition-colors ${
                        presetCategoryFilter === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div>
                  <input
                    type="text"
                    value={presetSearchTerm}
                    onChange={(e) => setPresetSearchTerm(e.target.value)}
                    placeholder="Filtrar por nome ou categoria..."
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {filteredExamPresets.map((preset) => {
                    const alreadyAdded = examItems.some((it) => it.name === preset.name);
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleAddPresetItem(preset)}
                        disabled={alreadyAdded}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                          alreadyAdded
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-white border border-slate-300 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/50'
                        }`}
                      >
                        + {preset.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Biomarkers Input List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Marcadores Inclusos no Laudo ({examItems.length}):
                </span>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {examItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <span className="font-semibold text-xs text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] text-slate-500">
                          Ref: {item.minReference} – {item.maxReference} {item.unit} | Ótimo: {item.optimalMin || '—'} – {item.optimalMax || '—'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={item.value}
                            onChange={(e) => handleItemValueChange(index, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2.5 py-1 text-xs font-mono font-bold border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-right"
                          />
                          <span className="text-xs font-medium text-slate-500 font-mono">{item.unit}</span>
                        </div>

                        <div className="w-28 text-right">
                          {getStatusBadge(item.status)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Remover exame"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Clínicas & Conduta:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Níveis de vitamina D repostos, glicemia otimizada com a nova distribuição de carboidratos..."
                  value={clinicalObservations}
                  onChange={(e) => setClinicalObservations(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewExamModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Salvar Exames no Prontuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
