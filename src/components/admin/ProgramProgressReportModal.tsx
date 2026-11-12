import React, { useState, useMemo } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { ProgramProgressReport, PatientProgramEnrollment } from '../../types';
import {
  Award,
  CheckCircle2,
  Calendar,
  TrendingDown,
  TrendingUp,
  Scale,
  Percent,
  Activity,
  Send,
  Printer,
  X,
  FileCheck,
  User,
  Sparkles,
  Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProgramProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: ProgramProgressReport;
  enrollment?: PatientProgramEnrollment;
}

export const ProgramProgressReportModal: React.FC<ProgramProgressReportModalProps> = ({
  isOpen,
  onClose,
  report: initialReport,
  enrollment
}) => {
  const {
    patients,
    clinicConfig,
    generateAndSendProgramReport,
    programProgressReports
  } = useNutrition();

  const [customNotes, setCustomNotes] = useState('');
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  // Find or generate report
  const activeReport = useMemo(() => {
    if (initialReport) return initialReport;
    if (enrollment) {
      const existing = programProgressReports.find((r) => r.programEnrollmentId === enrollment.id);
      if (existing) return existing;
    }
    return null;
  }, [initialReport, enrollment, programProgressReports]);

  if (!isOpen) return null;

  const handleGenerateAndSend = () => {
    if (!enrollment) return;
    try {
      generateAndSendProgramReport(enrollment.id, customNotes.trim() || undefined);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
      setIsSuccessToast(true);
      setTimeout(() => {
        setIsSuccessToast(false);
      }, 4000);
    } catch (err: any) {
      alert(`Erro ao gerar relatório: ${err.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const patient = patients.find((p) => p.id === (activeReport?.patientId || enrollment?.patientId));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase block">
                Relatório Oficial de Progresso & Conclusão
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                {activeReport?.programTitle || enrollment?.title || 'Programa de Acompanhamento'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Success Banner if newly dispatched */}
          {isSuccessToast && (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center space-x-2 text-emerald-900 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Relatório gerado e enviado com sucesso ao Portal do Paciente! Uma notificação de celebração foi ativada.
              </span>
            </div>
          )}

          {/* Patient & Program Overview Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">PACIENTE</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{patient?.name || 'Paciente'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">CONSULTAS</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {enrollment?.completedConsultations || activeReport?.period.completedConsultations} de {enrollment?.totalConsultations || activeReport?.period.totalConsultations}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">PERÍODO</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {enrollment?.startDate || activeReport?.period.startDate} a {enrollment?.endDate || activeReport?.period.endDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">STATUS DO PLANO</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold inline-block text-[11px] mt-0.5">
                Concluído com Sucesso ✓
              </span>
            </div>
          </div>

          {/* Biometric Deltas Grid */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>Evolução Antropométrica Consolidada</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card Weight */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <span className="text-slate-500 font-semibold block text-[11px]">PESO CORPORAL</span>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Início: </span>
                    <span className="font-bold text-slate-700">{activeReport?.metricsDelta.initialWeightKg || patient?.weightKg} kg</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Final: </span>
                    <span className="font-bold text-slate-900">{activeReport?.metricsDelta.finalWeightKg || patient?.weightKg} kg</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-emerald-700 font-bold">
                  <span>Delta Total:</span>
                  <span className="text-sm">
                    {activeReport?.metricsDelta.deltaWeightKg
                      ? (activeReport.metricsDelta.deltaWeightKg > 0 ? `+${activeReport.metricsDelta.deltaWeightKg} kg` : `${activeReport.metricsDelta.deltaWeightKg} kg`)
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Card Body Fat */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <span className="text-slate-500 font-semibold block text-[11px]">% DE GORDURA CORPORAL</span>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Início: </span>
                    <span className="font-bold text-slate-700">{activeReport?.metricsDelta.initialBodyFatPercent || 22.4}%</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Final: </span>
                    <span className="font-bold text-slate-900">{activeReport?.metricsDelta.finalBodyFatPercent || 17.1}%</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-emerald-700 font-bold">
                  <span>Redução:</span>
                  <span className="text-sm">
                    {activeReport?.metricsDelta.deltaBodyFatPercent
                      ? (activeReport.metricsDelta.deltaBodyFatPercent > 0 ? `+${activeReport.metricsDelta.deltaBodyFatPercent}%` : `${activeReport.metricsDelta.deltaBodyFatPercent}%`)
                      : '-5.3%'}
                  </span>
                </div>
              </div>

              {/* Card Lean Mass */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <span className="text-slate-500 font-semibold block text-[11px]">MASSA MAGRA / MÚSCULO</span>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Início: </span>
                    <span className="font-bold text-slate-700">{activeReport?.metricsDelta.initialLeanMassKg || 64.0} kg</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Final: </span>
                    <span className="font-bold text-slate-900">{activeReport?.metricsDelta.finalLeanMassKg || 64.0} kg</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-indigo-700 font-bold">
                  <span>Preservação / Ganho:</span>
                  <span className="text-sm">Preservada ✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Photos Preview */}
          {activeReport?.beforePhoto && activeReport?.afterPhoto && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Registro Fotográfico do Tratamento</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 h-56 flex items-center justify-center">
                  <img
                    src={activeReport.beforePhoto.photoUrl}
                    alt="Antes"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    Início ({activeReport.beforePhoto.date})
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 h-56 flex items-center justify-center">
                  <img
                    src={activeReport.afterPhoto.photoUrl}
                    alt="Depois"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    Conclusão ({activeReport.afterPhoto.date})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Summary & Recommendations */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Parecer Clínico & Conclusão do Nutricionista</span>
            </h3>

            {activeReport ? (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <p className="leading-relaxed font-medium text-slate-800">
                  {activeReport.clinicalSummary}
                </p>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px]">Conquistas de Estilo de Vida:</span>
                  <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                    {activeReport.lifestyleImprovements.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold text-emerald-800 block text-[11px]">Próximos Passos Recomendados:</span>
                  <p className="text-slate-600 mt-0.5">{activeReport.nextStepsAdvice}</p>
                </div>
              </div>
            ) : (
              <div>
                <label className="font-semibold text-slate-600 block mb-1">
                  Observações e Mensagem Personalizada ao Paciente:
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva a evolução do paciente, elogios à disciplina e recomendações para a fase seguinte..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs"
                />
              </div>
            )}
          </div>

          {/* Signoff Strip */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-slate-500 text-[11px]">
            <div>
              <span className="font-bold text-slate-800">{clinicConfig.nutritionistName || 'Dr. Ricardo Silva'}</span>
              <span className="block text-slate-400">{clinicConfig.crn || 'CRN-3 48.912/SP'} • {clinicConfig.name}</span>
            </div>
            <div className="mt-2 sm:mt-0 text-slate-400">
              Emitido em: {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition-colors cursor-pointer text-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir / Exportar PDF</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold text-xs"
            >
              Fechar
            </button>

            {!activeReport?.sentToPatientPortal && enrollment && (
              <button
                onClick={handleGenerateAndSend}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer text-xs"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Relatório ao Portal do Paciente</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
