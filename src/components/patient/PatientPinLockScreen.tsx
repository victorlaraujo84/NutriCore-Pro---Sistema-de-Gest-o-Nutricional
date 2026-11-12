import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Fingerprint,
  ShieldCheck,
  Smartphone,
  Sparkles,
  AlertCircle,
  Delete
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PatientPinLockScreenProps {
  patientName: string;
  patientAvatar?: string;
  correctPin: string;
  onUnlock: () => void;
  onResetPin: () => void;
}

export const PatientPinLockScreen: React.FC<PatientPinLockScreenProps> = ({
  patientName,
  patientAvatar,
  correctPin,
  onUnlock,
  onResetPin,
}) => {
  const [pinDigits, setPinDigits] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleDigitPress = (digit: string) => {
    if (pinDigits.length >= 4) return;
    setErrorMsg('');

    const nextPin = pinDigits + digit;
    setPinDigits(nextPin);

    if (nextPin.length === 4) {
      // Validate
      if (nextPin === correctPin) {
        confetti({
          particleCount: 35,
          spread: 45,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          onUnlock();
        }, 200);
      } else {
        setIsShaking(true);
        setErrorMsg('PIN incorreto. Tente novamente.');
        setTimeout(() => {
          setPinDigits('');
          setIsShaking(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    setErrorMsg('');
    setPinDigits((prev) => prev.slice(0, -1));
  };

  const handleBiometricAuth = () => {
    setIsBiometricScanning(true);
    setErrorMsg('');

    setTimeout(() => {
      setIsBiometricScanning(false);
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 }
      });
      onUnlock();
    }, 700);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 max-w-sm mx-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 w-full text-center space-y-6">
        {/* Avatar & Patient Header */}
        <div className="space-y-2">
          <div className="relative inline-block">
            <img
              src={patientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
              alt={patientName}
              className="w-18 h-18 rounded-2xl object-cover border-2 border-emerald-500 shadow-md mx-auto"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-full shadow-xs">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-slate-900">{patientName}</h2>
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prontuário & Dieta Protegidos</span>
            </span>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">
            Digite seu PIN de 4 dígitos
          </p>

          <div
            className={`flex items-center justify-center gap-3 py-2 transition-transform ${
              isShaking ? 'animate-bounce text-rose-500' : ''
            }`}
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinDigits.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    isFilled
                      ? 'bg-indigo-600 scale-110 shadow-xs ring-2 ring-indigo-200'
                      : 'bg-slate-200'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg && (
            <div className="text-[11px] text-rose-600 font-bold flex items-center justify-center gap-1 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-13 bg-slate-50 hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 hover:text-indigo-900 font-bold text-lg rounded-2xl border border-slate-200 transition-all flex items-center justify-center active:scale-95 select-none"
            >
              {digit}
            </button>
          ))}

          {/* Biometric Button */}
          <button
            type="button"
            onClick={handleBiometricAuth}
            disabled={isBiometricScanning}
            title="Desbloquear com Biometria"
            className="h-13 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl border border-emerald-200 transition-all flex items-center justify-center active:scale-95"
          >
            <Fingerprint className={`w-5 h-5 ${isBiometricScanning ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Zero Button */}
          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-13 bg-slate-50 hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 hover:text-indigo-900 font-bold text-lg rounded-2xl border border-slate-200 transition-all flex items-center justify-center active:scale-95 select-none"
          >
            0
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            title="Apagar dígito"
            className="h-13 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold rounded-2xl border border-slate-200 transition-all flex items-center justify-center active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Biometrics Quick Action Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleBiometricAuth}
            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Fingerprint className="w-4 h-4" />
            <span>{isBiometricScanning ? 'Verificando Biometria...' : 'Acessar com Biometria / Face ID'}</span>
          </button>

          <button
            type="button"
            onClick={onResetPin}
            className="text-[11px] text-slate-400 hover:text-slate-600 underline font-medium transition-colors"
          >
            Esqueci meu PIN / Redefinir Senha
          </button>
        </div>
      </div>
    </div>
  );
};
