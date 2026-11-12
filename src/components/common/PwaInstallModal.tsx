import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  Globe,
  Bell
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: 'patient' | 'nutritionist';
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  targetRole = 'patient',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Instalar no seu Telefone
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {targetRole === 'patient'
                  ? 'Acesso rápido ao seu cardápio diário e hidratação'
                  : 'Acesse o NutriCore Pro como app nativo no celular'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* App Highlights */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2 text-emerald-950 font-semibold">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Acesso Instantâneo</span>
            </div>
            <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center gap-2 text-cyan-950 font-semibold">
              <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Funciona em Tela Cheia</span>
            </div>
          </div>

          {isStandalone || isInstalled ? (
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-900 text-sm">
                Aplicativo Instalado com Sucesso!
              </h4>
              <p className="text-xs text-emerald-700">
                O NutriCore Pro já está pronto na sua tela de início para ser usado a qualquer momento.
              </p>
            </div>
          ) : isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">
                  iOS
                </span>
                <span>Como instalar no iPhone / iPad (Safari):</span>
              </div>

              <ol className="space-y-3 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs font-bold text-[11px]">
                    1
                  </div>
                  <span>
                    Toque no botão de <strong>Compartilhar</strong> (ícone <Share className="w-3.5 h-3.5 inline text-blue-600" />) na barra inferior do Safari.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs font-bold text-[11px]">
                    2
                  </div>
                  <span>
                    Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (ícone <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" />).
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs font-bold text-[11px]">
                    3
                  </div>
                  <span>
                    No canto superior direito, toque em <strong>"Adicionar"</strong>. Pronto!
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            /* Android / Chrome One-Click Install */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instale o NutriCore Pro no seu Android ou navegador Chrome/Edge para ter acesso direto sem precisar digitar o link novamente.
                </p>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Leve, seguro e não consome memória do aparelho.</span>
                </div>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Aplicativo Agora</span>
              </button>
            </div>
          )}

          {/* Close button */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
