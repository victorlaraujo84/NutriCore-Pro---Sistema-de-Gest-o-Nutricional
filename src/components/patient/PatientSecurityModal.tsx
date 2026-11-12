import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
  Smartphone,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PatientSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientAvatar?: string;
  isPinEnabled: boolean;
  onSetPin: (newPin: string | null) => void;
  onLockNow: () => void;
  onSecureLogout: () => void;
}

export const PatientSecurityModal: React.FC<PatientSecurityModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientAvatar,
  isPinEnabled,
  onSetPin,
  onLockNow,
  onSecureLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'pin' | 'session'>('pin');
  const [pinInput, setPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setConfirmPinInput('');
      setFeedbackMsg(null);
      setShowLogoutConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSavePin = () => {
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setFeedbackMsg({ type: 'error', text: 'O PIN deve conter exatamente 4 dígitos numéricos.' });
      return;
    }

    if (pinInput !== confirmPinInput) {
      setFeedbackMsg({ type: 'error', text: 'Os dígitos do PIN digitados não coincidem.' });
      return;
    }

    onSetPin(pinInput);
    setFeedbackMsg({ type: 'success', text: 'PIN de segurança ativado com sucesso!' });
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleRemovePin = () => {
    onSetPin(null);
    setFeedbackMsg({ type: 'success', text: 'Proteção por PIN desativada.' });
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Privacidade & Segurança</h3>
              <p className="text-[11px] text-slate-300">Proteção de Prontuário e Sessão</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pin')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'pin'
                ? 'bg-white text-indigo-700 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>PIN / Biometria</span>
          </button>

          <button
            onClick={() => setActiveTab('session')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'session'
                ? 'bg-white text-rose-700 border-b-2 border-rose-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {activeTab === 'pin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Status do Bloqueio por PIN
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isPinEnabled ? 'Ativo (4 Dígitos Protegidos)' : 'Desativado (Acesso Direto)'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                    isPinEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isPinEnabled ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>

              {isPinEnabled ? (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-slate-600">
                    O aplicativo solicita o seu PIN de 4 dígitos ou autenticação biométrica (Face ID / Touch ID) sempre que for aberto no seu dispositivo.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onLockNow}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloquear Agora</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemovePin}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Desativar PIN</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-slate-600 leading-relaxed">
                    Defina uma senha numérica de <strong>4 dígitos</strong> para proteger o acesso aos seus dados de saúde, exames e composição corporal.
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Novo PIN (4 dígitos)
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full text-center tracking-widest text-lg font-mono py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Confirme o PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full text-center tracking-widest text-lg font-mono py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePin}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar e Ativar Proteção por PIN</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'session' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Encerramento de Sessão Segura (LGPD)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Recomendado caso esteja acessando este dispositivo a partir de um computador compartilhado ou rede pública.
                </p>
              </div>

              {!showLogoutConfirm ? (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ao encerrar a sessão segura, os dados temporários de prontuário, receitas e laudos em cache neste navegador serão desconectados e a tela será imediatamente trancada.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Encerrar Sessão e Limpar Cache do Paciente</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-rose-900">
                    Tem certeza que deseja encerrar a sessão de <u>{patientName}</u> neste navegador?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSecureLogout();
                        onClose();
                      }}
                      className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-xs"
                    >
                      Confirmar Saída
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
