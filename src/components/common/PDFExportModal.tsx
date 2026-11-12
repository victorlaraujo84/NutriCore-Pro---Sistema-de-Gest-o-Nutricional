import React, { useRef, useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import {
  Printer,
  Download,
  X,
  FileText,
  CheckCircle2,
  Sparkles,
  Award,
  ShoppingCart,
  Scale,
  Calendar
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { generateShoppingList } from '../../utils/shoppingListCalculator';
import { ShoppingListFrequency } from '../../types';
import { generatePatientPlanPDF } from '../../utils/planPdfGenerator';

export const PDFExportModal: React.FC = () => {
  const {
    isExportPlanModalOpen,
    setExportPlanModalOpen,
    activePatient,
    selectedPatientForDetail,
    activeDietPlan,
    patientAnthropometry,
    clinicConfig,
  } = useNutrition();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [includeShoppingList, setIncludeShoppingList] = useState(true);
  const [shoppingFrequency, setShoppingFrequency] = useState<ShoppingListFrequency>('semanal');
  const [shoppingPrepLossFactor, setShoppingPrepLossFactor] = useState(20);
  const [includeAnthroEvolution, setIncludeAnthroEvolution] = useState(true);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const patient = selectedPatientForDetail || activePatient;
  const dietPlan = activeDietPlan;
  const latestAnthro = patientAnthropometry[patientAnthropometry.length - 1];

  if (!isExportPlanModalOpen || !patient) return null;

  const shoppingList = dietPlan && includeShoppingList
    ? generateShoppingList(dietPlan, shoppingFrequency, shoppingPrepLossFactor)
    : [];

  // Group shopping list
  const shoppingCategories: Record<string, typeof shoppingList> = {};
  shoppingList.forEach((item) => {
    if (!shoppingCategories[item.category]) shoppingCategories[item.category] = [];
    shoppingCategories[item.category].push(item);
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_Nutricional_${patient.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">Relatório Clínico & Prescrição Nutricional Oficial</h3>
              <p className="text-[11px] text-slate-300">
                Visualização do documento pronto para impressão e download em PDF
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                generatePatientPlanPDF(patient, dietPlan, {
                  clinicConfig,
                  anthroRecord: latestAnthro,
                  action: 'download',
                })
              }
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 cursor-pointer"
              title="Baixar resumo direto em PDF vetorial leve e nítido com macros e metas calóricas"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>PDF Resumo & Metas</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>

            <button
              onClick={() => setExportPlanModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Bar */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3 no-print">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeShoppingList}
                onChange={(e) => setIncludeShoppingList(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <span>Incluir Lista de Compras (+{shoppingPrepLossFactor}% perda/preparo)</span>
            </label>

            {includeShoppingList && (
              <select
                value={shoppingFrequency}
                onChange={(e) => setShoppingFrequency(e.target.value as ShoppingListFrequency)}
                className="p-1 border border-slate-300 rounded bg-white text-xs font-semibold text-slate-800"
              >
                <option value="semanal">Semanal (7 dias)</option>
                <option value="quinzenal">Quinzenal (15 dias)</option>
                <option value="mensal">Mensal (30 dias)</option>
              </select>
            )}

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includeAnthroEvolution}
                onChange={(e) => setIncludeAnthroEvolution(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <span>Incluir Evolução Antropométrica por Consulta</span>
            </label>
          </div>
        </div>

        {/* Printable Sheet View */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
          <div
            ref={printAreaRef}
            className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-xl shadow-lg border border-slate-200 text-slate-900 space-y-6 print-container"
          >
            {/* Header: Clinic & Doctor Info */}
            <div className="flex justify-between items-start pb-5 border-b-2 border-emerald-600">
              <div>
                <div className="flex items-center space-x-2 text-emerald-700">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xl font-black tracking-tight">{clinicConfig?.name || 'Clínica NutriCore Pro'}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Nutrição Clínica Funcional & Esportiva Avançada
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="font-bold text-slate-900 block">{clinicConfig?.nutritionistName || 'Dr. Ricardo Silva'}</span>
                <span className="text-emerald-700 font-semibold">{clinicConfig?.crn || 'CRN-3 48.912/SP'}</span>
                <span className="text-slate-400 block text-[10px] mt-0.5">
                  Data: {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Patient Details & Goals Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Paciente</span>
                <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Idade / Sexo</span>
                <span className="font-semibold text-slate-800">
                  {patient.age} anos ({patient.gender})
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Peso / Altura</span>
                <span className="font-semibold text-slate-800">
                  {patient.weightKg} kg / {patient.heightCm} cm
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Meta Calórica</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {dietPlan?.targetCalories || patient.targetCalories} kcal/dia
                </span>
              </div>
            </div>

            {/* Macronutrient Distribution Bar */}
            {dietPlan && (
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs flex justify-around text-center">
                <div>
                  <span className="text-[10px] text-blue-700 block font-semibold">Proteínas</span>
                  <span className="font-bold text-blue-900">{dietPlan.targetProteinG}g</span>
                </div>
                <div className="border-l border-emerald-200 pl-4">
                  <span className="text-[10px] text-amber-700 block font-semibold">Carboidratos</span>
                  <span className="font-bold text-amber-900">{dietPlan.targetCarbsG}g</span>
                </div>
                <div className="border-l border-emerald-200 pl-4">
                  <span className="text-[10px] text-rose-700 block font-semibold">Gorduras</span>
                  <span className="font-bold text-rose-900">{dietPlan.targetFatsG}g</span>
                </div>
                <div className="border-l border-emerald-200 pl-4">
                  <span className="text-[10px] text-emerald-700 block font-semibold">Hidratação</span>
                  <span className="font-bold text-emerald-900">{dietPlan.waterGoalMl} ml/dia</span>
                </div>
              </div>
            )}

            {/* Anthropometric Evolution per Consultation (if toggled) */}
            {includeAnthroEvolution && patientAnthropometry.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>Histórico & Evolução das Avaliações por Consulta</span>
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Consulta</th>
                        <th className="py-2 px-3">Data</th>
                        <th className="py-2 px-3">Método</th>
                        <th className="py-2 px-3">Peso</th>
                        <th className="py-2 px-3">% Gordura</th>
                        <th className="py-2 px-3">Massa Magra</th>
                        <th className="py-2 px-3">Massa Gorda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientAnthropometry.map((rec, idx) => (
                        <tr key={rec.id}>
                          <td className="py-1.5 px-3 font-bold text-slate-900">
                            {rec.consultationNumber ? `${rec.consultationNumber}ª Consulta` : `${idx + 1}ª Consulta`}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600">{rec.date}</td>
                          <td className="py-1.5 px-3 text-slate-700">
                            {rec.assessmentType === 'bioimpedancia' ? 'Bioimpedância' : 'Pollock 7D'}
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{rec.weightKg} kg</td>
                          <td className="py-1.5 px-3 font-bold text-emerald-700">{rec.bodyFatPercentage}%</td>
                          <td className="py-1.5 px-3 text-slate-800">{rec.leanMassKg} kg</td>
                          <td className="py-1.5 px-3 text-slate-800">{rec.fatMassKg} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Meals Plan Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                Plano Alimentar Prescrito
              </h4>

              {dietPlan?.meals.map((meal, idx) => (
                <div key={meal.id} className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-white">
                  <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1 rounded-lg">
                    <span className="font-bold text-xs text-slate-900">
                      {idx + 1}. {meal.name}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">{meal.time}</span>
                  </div>

                  <div className="space-y-2 text-xs pl-2">
                    {meal.items.map((item) => (
                      <div key={item.id} className="border-b border-slate-100 pb-2 space-y-1">
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="font-medium text-slate-900">
                              • {item.amountG}g de {item.foodName}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-2">
                              ({item.measureLabel})
                            </span>
                          </div>
                          <span className="font-bold text-slate-700 text-[11px]">
                            {item.calories} kcal
                          </span>
                        </div>

                        {item.possibleSubstitutions && item.possibleSubstitutions.length > 0 && (
                          <div className="text-[10px] text-slate-600 bg-slate-50/80 rounded-lg p-2 ml-3 space-y-1 border-l-2 border-emerald-500">
                            <span className="font-bold text-emerald-800 block text-[10px]">
                              🔄 Opções de Substituição Equivalente (mesmo valor nutricional):
                            </span>
                            <div className="space-y-0.5">
                              {item.possibleSubstitutions.map((sub, sIdx) => (
                                <div key={sIdx} className="text-slate-600 leading-tight">
                                  • <span className="font-semibold text-slate-800">{sub.name}</span>: {sub.amountG}g ({sub.measureLabel}) — <span className="font-medium text-slate-700">{sub.calories} kcal</span> <span className="text-slate-400 font-mono text-[9px]">(P: {sub.protein}g | C: {sub.carbs}g | G: {sub.fats}g)</span>
                                  {sub.tip && <span className="text-emerald-700 text-[9px] italic ml-1">[{sub.tip}]</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {meal.instructions && (
                    <div className="text-[10px] text-slate-500 italic pt-1 pl-2">
                      Orientações: {meal.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Shopping List Section (if included) */}
            {includeShoppingList && shoppingList.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    <span>Lista de Compras para o Paciente ({shoppingFrequency.toUpperCase()} - {shoppingFrequency === 'semanal' ? '7 dias' : shoppingFrequency === 'quinzenal' ? '15 dias' : '30 dias'})</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    +{shoppingPrepLossFactor}% perda/preparo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(shoppingCategories).map(([category, items]) => (
                    <div key={category} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 uppercase block">{category}</span>
                      <ul className="space-y-1 text-[11px] pl-1">
                        {items.map((item) => (
                          <li key={item.id} className="flex justify-between items-center border-b border-slate-200/50 pb-0.5">
                            <span className="text-slate-800">• {item.foodName}</span>
                            <span className="font-bold text-emerald-800">{item.unitLabel}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Guidelines & Hydration */}
            {dietPlan?.generalGuidelines && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                  Recomendações Clínicas & Conduta
                </h4>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {dietPlan.generalGuidelines}
                </p>
              </div>
            )}

            {/* Signature & Disclaimer Footer */}
            <div className="pt-8 flex justify-between items-end text-xs text-slate-400 border-t border-slate-200">
              <div>
                <span className="block text-[10px]">{clinicConfig?.email || 'contato@nutricorepro.com.br'} • {clinicConfig?.phone || '(11) 98765-4321'}</span>
                <span className="block text-[10px]">{clinicConfig?.address || 'Av. Paulista, 1500 - São Paulo / SP'}</span>
              </div>

              <div className="text-center">
                <div className="w-48 border-b border-slate-400 mb-1" />
                <span className="font-bold text-slate-800 block text-xs">{clinicConfig?.nutritionistName || 'Dr. Ricardo Silva'}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">{clinicConfig?.crn || 'CRN-3 48.912/SP'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
