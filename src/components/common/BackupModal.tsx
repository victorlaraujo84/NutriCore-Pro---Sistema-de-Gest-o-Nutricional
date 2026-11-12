import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import {
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  X,
  RotateCcw
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { exportBackupData, importBackupData, resetAllData } = useNutrition();
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonString = exportBackupData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutricore_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importBackupData(content);
        setImportStatus(result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            Backup & Segurança de Dados (JSON)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Exporte todos os prontuários, planos alimentares, exames laboratoriais, prescrições e histórico antropométrico em formato JSON seguro ou restaure uma cópia prévia.
        </p>

        <div className="space-y-4">
          {/* Export Box */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-xs text-emerald-950">Exportar Backup Completo</h4>
              <p className="text-[11px] text-emerald-800">Baixar arquivo .json com todos os cadastros e dados clínicos.</p>
            </div>
            <button
              onClick={handleExport}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Backup</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900">Restaurar Backup Anterior</h4>
                <p className="text-[11px] text-slate-500">Selecione um arquivo .json salvo anteriormente.</p>
              </div>

              <label className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Selecionar Arquivo</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 mt-2 ${
                  importStatus.success
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {importStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>

          {/* Reset Demo Data */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar dados padrão de demonstração</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Fechar
            </button>
          </div>

          {isResetConfirmOpen && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-2 animate-fadeIn">
              <p className="font-semibold">Tem certeza? Todos os dados customizados serão reiniciados para o estado de fábrica.</p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-2.5 py-1 bg-white border border-rose-200 text-slate-700 rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    resetAllData();
                    setIsResetConfirmOpen(false);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold text-xs"
                >
                  Confirmar Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
