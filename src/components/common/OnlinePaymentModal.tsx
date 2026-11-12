import React, { useState, useEffect } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { PaymentMethod, PaymentStatus, PaymentTransaction } from '../../types';
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  Receipt,
  DollarSign,
  Printer,
  Award,
  Check,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface OnlinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnlinePaymentModal: React.FC<OnlinePaymentModalProps> = ({ isOpen, onClose }) => {
  const {
    activePaymentModal,
    payments,
    addPayment,
    updatePaymentStatus,
    patients,
    clinicConfig,
    patientProgramEnrollments,
    registerProgramSession,
  } = useNutrition();

  const [amount, setAmount] = useState<number>(activePaymentModal?.amount || 250);
  const [title, setTitle] = useState<string>(activePaymentModal?.title || 'Consulta Nutricional Clínica');
  const [description, setDescription] = useState<string>(
    activePaymentModal?.description || 'Atendimento clínico com prescrição dietética e suporte.'
  );
  const [entryType, setEntryType] = useState<'consulta_avulsa' | 'programa_acompanhamento'>('consulta_avulsa');
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<PaymentStatus>('completed');
  const [completedTransaction, setCompletedTransaction] = useState<PaymentTransaction | null>(null);
  const [isLinkedToProgram, setIsLinkedToProgram] = useState<boolean>(false);

  // Sync state when modal opens
  useEffect(() => {
    if (activePaymentModal) {
      const targetPatient = patients.find((p) => p.id === activePaymentModal.patientId);
      const activeProg = targetPatient
        ? patientProgramEnrollments.find((e) => e.patientId === targetPatient.id && e.status === 'ativo')
        : null;

      if (activeProg && activePaymentModal.amount === 0) {
        setIsLinkedToProgram(true);
        setEntryType('programa_acompanhamento');
        setAmount(0);
        setTitle(`Atendimento: ${activeProg.title}`);
        setDescription(`Consulta do programa de acompanhamento (${activeProg.completedConsultations + 1}/${activeProg.totalConsultations})`);
      } else {
        setIsLinkedToProgram(false);
        setEntryType('consulta_avulsa');
        setAmount(activePaymentModal.amount !== undefined ? activePaymentModal.amount : 250);
        setTitle(activePaymentModal.title || 'Consulta Nutricional Clínica');
        setDescription(activePaymentModal.description || 'Atendimento clínico com avaliação e plano alimentar.');
      }
      setCompletedTransaction(null);
    }
  }, [activePaymentModal, patients, patientProgramEnrollments]);

  if (!isOpen || !activePaymentModal) return null;

  const targetPatient = patients.find((p) => p.id === activePaymentModal.patientId);
  const patientName = targetPatient?.name || activePaymentModal.patientName || 'Paciente';
  const activeProg = targetPatient
    ? patientProgramEnrollments.find((e) => e.patientId === targetPatient.id && e.status === 'ativo')
    : null;

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSaveInternalPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLinkedToProgram && activeProg) {
      // Register program session count
      registerProgramSession(activeProg.id, {
        date: new Date().toISOString().split('T')[0],
        notes: description || 'Atendimento do programa contínuo.',
        appointmentId: activePaymentModal.appointmentId,
      });
    }

    const tx = addPayment({
      patientId: activePaymentModal.patientId || targetPatient?.id || '',
      patientName,
      patientEmail: targetPatient?.email,
      patientPhone: targetPatient?.phone,
      appointmentId: activePaymentModal.appointmentId,
      dietPlanId: activePaymentModal.dietPlanId,
      programEnrollmentId: isLinkedToProgram && activeProg ? activeProg.id : undefined,
      entryType: isLinkedToProgram ? 'programa_acompanhamento' : entryType,
      amount: isLinkedToProgram ? 0 : amount,
      currency: 'BRL',
      title,
      description,
      method,
      status: isLinkedToProgram ? 'completed' : status,
      paymentGateway: 'manual_internal',
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      paidAt: status === 'completed' || isLinkedToProgram ? new Date().toISOString() : undefined,
    });

    setCompletedTransaction(tx);
  };

  const patientHistory = payments.filter((p) => p.patientId === activePaymentModal.patientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold">Lançamento de Atendimento (Controle Interno)</h3>
              </div>
              <p className="text-xs text-slate-300">
                Paciente: <span className="font-semibold text-white">{patientName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Note */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Gestão financeira interna: informe o valor e a quitação acordada com o paciente para o fluxo de caixa do consultório.
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {completedTransaction ? (
            /* Success confirmation */
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-900">
                  Lançamento Registrado no Controle Interno!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Recibo Interno Nº: <strong>{completedTransaction.receiptNumber}</strong>
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Valor: <strong>{formatCurrency(completedTransaction.amount)}</strong> • Status: <strong>{completedTransaction.status === 'completed' ? 'Quitado' : 'Pendente'}</strong>
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Recibo</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveInternalPayment} className="space-y-4">
              {/* If patient is in an active program, offer continuous program link */}
              {activeProg && (
                <div className="bg-amber-50/80 border border-amber-200/90 p-3.5 rounded-xl space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-amber-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLinkedToProgram}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsLinkedToProgram(checked);
                        if (checked) {
                          setAmount(0);
                          setTitle(`Atendimento: ${activeProg.title}`);
                          setDescription(`Consulta ${activeProg.completedConsultations + 1} de ${activeProg.totalConsultations} (Incluso no plano contínuo)`);
                        } else {
                          setAmount(250);
                          setTitle('Consulta Nutricional Clínica (Avulsa)');
                          setDescription('Atendimento avulso com avaliação e plano alimentar.');
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Vincular ao Programa: {activeProg.title}</span>
                  </label>
                  {isLinkedToProgram && (
                    <div className="pl-6 text-[11px] text-amber-900 leading-relaxed">
                      ✓ Esta consulta é computada como a <strong>sessão {activeProg.completedConsultations + 1} de {activeProg.totalConsultations}</strong> do programa contratado. O valor avulso é registrado como R$ 0,00 (já coberto pelo pacote).
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Identificação do Atendimento: *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Valor Informado (R$): *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={isLinkedToProgram}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 disabled:opacity-60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  {isLinkedToProgram && (
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                      Incluso no programa do paciente
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Forma de Recebimento:
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="pix">PIX</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Status Interno do Pagamento:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-emerald-800"
                >
                  <option value="completed">Quitado (Valor já recebido pelo nutricionista)</option>
                  <option value="pending">Pendente (Aguardando quitação)</option>
                  <option value="cortesia">Cortesia / Isento</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Observações Internas:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Consulta presencial com entrega de plano."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          )}

          {/* Patient financial history */}
          {patientHistory.length > 0 && !completedTransaction && (
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Lançamentos Anteriores deste Paciente ({patientHistory.length}):
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {patientHistory.map((item) => (
                  <div key={item.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-800 block">{item.title}</span>
                      <span className="text-slate-500 text-[10px]">{item.method.toUpperCase()} • {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">{formatCurrency(item.amount)}</span>
                      <span className={`text-[10px] font-bold ${item.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {item.status === 'completed' ? 'Quitado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
