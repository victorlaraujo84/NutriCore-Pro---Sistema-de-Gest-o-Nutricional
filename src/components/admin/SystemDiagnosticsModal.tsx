import React, { useState, useEffect } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { SystemDiagnosticReport, DiagnosticCheckItem } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Layers,
  Activity,
  UserCheck,
  FileText,
  Camera,
  Scale,
  Sparkles,
  X,
  RotateCcw,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SystemDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemDiagnosticsModal: React.FC<SystemDiagnosticsModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    runSystemDiagnostics,
    latestDiagnosticReport,
    resetAllData
  } = useNutrition();

  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<SystemDiagnosticReport | null>(latestDiagnosticReport);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const executeDiagnosticScan = async () => {
    setIsRunning(true);
    setResetSuccessMessage(null);
    try {
      // Simulate small smooth delay for scanning feeling
      await new Promise((resolve) => setTimeout(resolve, 350));
      const res = await runSystemDiagnostics();
      setReport(res);
      if (res.overallStatus === 'healthy') {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 }
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report) {
      executeDiagnosticScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResetDemoData = () => {
    if (confirm('Deseja recarregar os dados de demonstração com os 3 casos clínicos completos (fotos comparativas, dietas, evolução e programas)?')) {
      resetAllData();
      setResetSuccessMessage('Dados de demonstração restaurados com 100% de integridade!');
      executeDiagnosticScan();
    }
  };

  const getStatusIcon = (status: DiagnosticCheckItem['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <RefreshCw className="w-5 h-5 text-sky-500 animate-spin shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase block">
                Auditoria de Qualidade & Integridade
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Diagnóstico Geral do Sistema NutriCore Pro
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {resetSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* Health Score Overview Strip */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                  report?.overallStatus === 'healthy'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : report?.overallStatus === 'warning'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {report ? `${report.passedCount}/${report.checks.length}` : '—'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {report?.overallStatus === 'healthy'
                      ? 'Sistema 100% Operacional & Íntegro'
                      : report?.overallStatus === 'warning'
                      ? 'Sistema Operacional com Recomendações'
                      : 'Inconsistências Detectadas'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Tempo de varredura: {report?.executionDurationMs || 0}ms • {report?.checks.length || 0} módulos analisados
                </p>
              </div>
            </div>

            <button
              onClick={executeDiagnosticScan}
              disabled={isRunning}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Verificando...' : 'Reexecutar Testes'}</span>
            </button>
          </div>

          {/* Checks List */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Verificação dos 8 Subsistemas Clínicos:
            </h3>

            <div className="space-y-2">
              {report?.checks.map((check) => (
                <div
                  key={check.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-colors space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      {getStatusIcon(check.status)}
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          {check.name}
                        </span>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {check.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        check.status === 'passed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : check.status === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {check.status === 'passed' ? 'Aprovado ✓' : check.status === 'warning' ? 'Atenção ⚠' : 'Falhou ✖'}
                    </span>
                  </div>

                  {check.details && (
                    <div className="pl-7 text-[11px] font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {check.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleResetDemoData}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Recarregar Casos Clínicos Completos</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
          >
            Concluir Auditoria
          </button>
        </div>
      </div>
    </div>
  );
};
