import React, { useState, useRef } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { SupplementPrescription, PrescriptionItem } from '../../types';
import {
  FileCheck,
  Plus,
  Printer,
  Calendar,
  Sparkles,
  Trash2,
  CheckCircle2,
  Clock,
  Pill,
  Download,
  AlertCircle,
  Copy
} from 'lucide-react';

const COMMON_SUPPLEMENT_TEMPLATES: Omit<PrescriptionItem, 'id'>[] = [
  {
    name: 'Creatina Monohidratada (Creapure®)',
    category: 'Suplemento Nutricional',
    dosage: '5g ao dia',
    timing: 'Pós-treino ou junto à principal refeição',
    form: 'Pó',
    instructions: 'Diluir 5g em 200ml de água ou suco. Consumir diariamente inclusive em dias sem treino.',
    purpose: 'Aumento de força, hipertrofia muscular e retenção intramuscular.',
    durationDays: 90
  },
  {
    name: 'Whey Protein Isolado / Concentrado',
    category: 'Suplemento Nutricional',
    dosage: '30g (1 dosador)',
    timing: 'No café da manhã ou pós-treino com água gelada',
    form: 'Pó',
    instructions: 'Bater 1 dosador (30g) em 200ml de água ou leite desnatado.',
    purpose: 'Complementação do aporte proteico de alto valor biológico.',
    durationDays: 60
  },
  {
    name: 'Vitamina D3 + K2 (MK-7)',
    category: 'Nutracêutico',
    dosage: '2.000 UI D3 + 50mcg K2',
    timing: '1 cápsula ao dia junto ao almoço',
    form: 'Cápsula',
    instructions: 'Ingerir 1 cápsula por via oral junto à refeição contendo gorduras saudáveis.',
    purpose: 'Otimização imunológica, absorção e direcionamento de cálcio ósseo.',
    durationDays: 60
  },
  {
    name: 'Ômega-3 (EPA/DHA Alta Concentração)',
    category: 'Nutracêutico',
    dosage: '1.000mg EPA + 500mg DHA (2 cápsulas)',
    timing: 'Junto ao jantar',
    form: 'Cápsula',
    instructions: 'Ingerir 2 cápsulas oleosas ao dia durante ou logo após a refeição.',
    purpose: 'Modulação inflamatória, suporte cardiovascular e perfil lipídico.',
    durationDays: 60
  },
  {
    name: 'Magnésio Bisglicinato / Treonato',
    category: 'Mineral Quelato',
    dosage: '300mg de magnésio elementar',
    timing: '1 hora antes de dormir',
    form: 'Cápsula',
    instructions: 'Tomar 1 a 2 cápsulas com água 30 a 60 minutos antes de deitar.',
    purpose: 'Melhora da latência e qualidade do sono, relaxamento neuromuscular.',
    durationDays: 60
  },
  {
    name: 'Ashwagandha (KSM-66) Extrato Seco',
    category: 'Fitoterápico',
    dosage: '500mg padronizado a 5% withanolídeos',
    timing: '1 cápsula pela manhã ou à noite',
    form: 'Cápsula',
    instructions: 'Ingerir 1 cápsula com água pela manhã ou antes do repouso noturno.',
    purpose: 'Modulação de cortisol, redução da ansiedade e recuperação neural.',
    durationDays: 45
  },
  {
    name: 'Coenzima Q10 (Ubiquinona)',
    category: 'Nutracêutico',
    dosage: '100mg',
    timing: 'Pela manhã com refeição com gorduras boas',
    form: 'Cápsula',
    instructions: 'Ingerir 1 cápsula pela manhã acompanhada de alimento.',
    purpose: 'Otimização mitocondrial e produção de energia celular (ATP).',
    durationDays: 60
  }
];

export const PrescriptionsView: React.FC = () => {
  const {
    patientPrescriptions,
    addPrescription,
    deletePrescription,
    selectedPatientForDetail,
    activePatientId,
    patients,
    clinicConfig,
    currentNutritionist
  } = useNutrition();

  const targetPatient = selectedPatientForDetail || patients.find((p) => p.id === activePatientId) || patients[0];
  const [selectedPrescription, setSelectedPrescription] = useState<SupplementPrescription | null>(
    patientPrescriptions[0] || null
  );
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form State
  const [prescriptionTitle, setPrescriptionTitle] = useState('Prescrição de Suplementação & Fitoterapia');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });
  const [generalInstructions, setGeneralInstructions] = useState(
    'Consumir os suplementos rigorosamente nos horários indicados com água. Em caso de dúvidas, entrar em contato.'
  );
  const [items, setItems] = useState<Omit<PrescriptionItem, 'id'>[]>([
    COMMON_SUPPLEMENT_TEMPLATES[0],
    COMMON_SUPPLEMENT_TEMPLATES[4]
  ]);

  const handleAddItemFromTemplate = (tpl: typeof COMMON_SUPPLEMENT_TEMPLATES[0]) => {
    setItems((prev) => [...prev, { ...tpl }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<PrescriptionItem>) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, ...updates } : it))
    );
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatient || items.length === 0) return;

    const created = addPrescription({
      patientId: targetPatient.id,
      title: prescriptionTitle,
      nutritionistName: currentNutritionist?.name || clinicConfig.nutritionistName,
      crn: currentNutritionist?.crn || clinicConfig.crn,
      validUntil,
      generalInstructions,
      items: items.map((it, idx) => ({
        ...it,
        id: `pr-it-${Date.now()}-${idx}`
      }))
    });

    setSelectedPrescription(created);
    setIsNewModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-purple-100 text-purple-800 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Receituário & Prescrição de Suplementos
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Elabore fórmulas magistrais, fitoterápicos e suplementação esportiva e clínica com emissão em folha timbrada para <strong>{targetPatient?.name}</strong>.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Prescrição</span>
        </button>
      </div>

      {patientPrescriptions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: History of Prescriptions */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Prescrições Emitidas ({patientPrescriptions.length})
            </div>

            <div className="space-y-3">
              {patientPrescriptions.map((presc) => {
                const isSelected = selectedPrescription?.id === presc.id;
                return (
                  <div
                    key={presc.id}
                    onClick={() => setSelectedPrescription(presc)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/70 border-purple-500 shadow-xs ring-1 ring-purple-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">
                        {presc.title}
                      </h4>
                      <span className="text-[11px] font-mono font-medium text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded">
                        {new Date(presc.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mb-2">
                      {presc.items?.length || 0} compostos / suplementos
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>Validade: {new Date(presc.validUntil).toLocaleDateString('pt-BR')}</span>
                      <span className="font-medium text-purple-600">{presc.nutritionistName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Prescription Preview in Official Letterhead format */}
          <div className="lg:col-span-8">
            {selectedPrescription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">
                    Visualização do Receituário Timbrado Oficial
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir / Salvar PDF</span>
                    </button>

                    <button
                      onClick={() => deletePrescription(selectedPrescription.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir prescrição"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Printable Document Sheet */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 sm:p-12 print:p-0 print:border-none print:shadow-none space-y-8 font-sans">
                  {/* Letterhead Header */}
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        {clinicConfig.name}
                      </h1>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {clinicConfig.address}
                      </p>
                      <p className="text-xs text-slate-500">
                        {clinicConfig.phone} • {clinicConfig.email}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm text-slate-900">
                        {selectedPrescription.nutritionistName}
                      </div>
                      <div className="text-xs font-mono font-semibold text-emerald-700">
                        {selectedPrescription.crn}
                      </div>
                    </div>
                  </div>

                  {/* Patient Info Banner */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Paciente:</span>
                      <span className="font-bold text-slate-900 text-sm">{targetPatient?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Data de Emissão:</span>
                      <span className="font-medium text-slate-800">{new Date(selectedPrescription.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Validade da Receita:</span>
                      <span className="font-medium text-slate-800">{new Date(selectedPrescription.validUntil).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center">
                    <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-dashed border-slate-200 pb-2 inline-block px-8">
                      {selectedPrescription.title}
                    </h2>
                  </div>

                  {/* Prescribed Items List */}
                  <div className="space-y-6">
                    {(selectedPrescription.items || []).map((item, index) => (
                      <div key={item.id} className="space-y-1.5 pl-4 border-l-2 border-purple-500">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {index + 1}. {item.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            {item.form}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-slate-800">
                          <span className="font-bold text-slate-900">Dosagem & Quantidade:</span> {item.dosage}
                        </div>

                        <div className="text-xs text-slate-700">
                          <span className="font-bold text-slate-900">Posologia / Horário:</span> {item.timing}
                        </div>

                        {item.purpose && (
                          <div className="text-xs text-slate-500 italic">
                            Finalidade: {item.purpose}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* General Guidelines */}
                  {selectedPrescription.generalInstructions && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 block">Orientações Gerais:</span>
                      <p className="leading-relaxed whitespace-pre-line">{selectedPrescription.generalInstructions}</p>
                    </div>
                  )}

                  {/* Signature Footer */}
                  <div className="pt-12 text-center flex flex-col items-center">
                    <div className="w-64 border-t border-slate-900 pt-2">
                      <div className="font-bold text-xs text-slate-900">
                        {selectedPrescription.nutritionistName}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Nutricionista Clínico & Esportivo • {selectedPrescription.crn}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                Selecione uma prescrição à esquerda para visualizá-la ou crie uma nova.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <Pill className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma prescrição gerada para este paciente</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Crie receituários de creatina, whey protein, vitaminas, minerais quelatos ou fórmulas magistrais com instruções posológicas precisas.
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Criar Primeira Prescrição
          </button>
        </div>
      )}

      {/* New Prescription Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600" />
                Nova Prescrição Nutricional — {targetPatient?.name}
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePrescription} className="space-y-4 overflow-y-auto pr-1 py-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título da Prescrição:
                  </label>
                  <input
                    type="text"
                    required
                    value={prescriptionTitle}
                    onChange={(e) => setPrescriptionTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Validade do Receituário:
                  </label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Template Picker */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Adicionar da Biblioteca de Compostos (+):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SUPPLEMENT_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => handleAddItemFromTemplate(tpl)}
                      className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-white border border-slate-300 text-slate-700 hover:border-purple-500 hover:text-purple-600 transition-colors"
                    >
                      + {tpl.name.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items in prescription */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Itens da Prescrição ({items.length}):
                </span>

                {items.map((item, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Nome do Suplemento ou Fórmula"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(index, { name: e.target.value })}
                        className="font-bold text-xs text-slate-900 bg-white px-2.5 py-1.5 rounded border border-slate-300 flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <select
                        value={item.form}
                        onChange={(e) => handleUpdateItem(index, { form: e.target.value })}
                        className="text-xs bg-white px-2 py-1.5 rounded border border-slate-300 focus:outline-none"
                      >
                        <option value="Cápsula">Cápsula</option>
                        <option value="Pó">Pó</option>
                        <option value="Gotas">Gotas</option>
                        <option value="Sachê">Sachê</option>
                        <option value="Comprimido">Comprimido</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Dosagem (Ex: 5g, 500mg)"
                        value={item.dosage}
                        onChange={(e) => handleUpdateItem(index, { dosage: e.target.value })}
                        className="text-xs bg-white px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Posologia e Horário (Ex: 1x ao dia pela manhã)"
                        value={item.timing}
                        onChange={(e) => handleUpdateItem(index, { timing: e.target.value })}
                        className="text-xs bg-white px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Orientações Gerais ao Paciente:
                </label>
                <textarea
                  rows={2}
                  value={generalInstructions}
                  onChange={(e) => setGeneralInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Emitir Prescrição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
