import React, { useState } from 'react';
import { useNutrition } from '../../context/NutritionContext';
import { PaymentTransaction, PaymentStatus, PaymentMethod } from '../../types';
import {
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  Trash2,
  Receipt,
  User,
  AlertCircle,
  FileText,
  Printer,
  Award,
  Calendar,
  X,
  CreditCard,
  Building2,
  Check,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const {
    payments,
    addPayment,
    updatePaymentStatus,
    deletePayment,
    patients,
    clinicConfig,
    patientProgramEnrollments,
    currentNutritionist,
  } = useNutrition();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'consulta_avulsa' | 'programa_acompanhamento'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | string>('all');

  // Modals & Panels
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<PaymentTransaction | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Internal Entry Form
  const [entryType, setEntryType] = useState<'consulta_avulsa' | 'programa_acompanhamento'>('consulta_avulsa');
  const [entryPatientId, setEntryPatientId] = useState(patients[0]?.id || '');
  const [entryAmount, setEntryAmount] = useState<number>(250);
  const [entryTitle, setEntryTitle] = useState('Consulta Nutricional Clínica (Avulsa)');
  const [entryDescription, setEntryDescription] = useState('Atendimento clínico com prescrição dietética e antropometria.');
  const [entryMethod, setEntryMethod] = useState<PaymentMethod>('pix');
  const [entryStatus, setEntryStatus] = useState<PaymentStatus>('completed');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

  // Quick show notification
  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Metrics calculation
  const completedPayments = payments.filter((p) => p.status === 'completed');
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const totalReceived = completedPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPending = pendingPayments.reduce((acc, p) => acc + p.amount, 0);

  // Split by entry type (Consultas Avulsas vs Programas de Acompanhamento)
  const singleConsultationsReceived = completedPayments
    .filter((p) => p.entryType === 'consulta_avulsa' || (!p.entryType && !p.programEnrollmentId))
    .reduce((acc, p) => acc + p.amount, 0);

  const programsReceived = completedPayments
    .filter((p) => p.entryType === 'programa_acompanhamento' || p.programEnrollmentId)
    .reduce((acc, p) => acc + p.amount, 0);

  // Filtered payments list
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.patientName && p.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'programa_acompanhamento' && (p.entryType === 'programa_acompanhamento' || !!p.programEnrollmentId)) ||
      (typeFilter === 'consulta_avulsa' && (p.entryType === 'consulta_avulsa' || (!p.entryType && !p.programEnrollmentId)));

    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;

    return matchesSearch && matchesStatus && matchesType && matchesMethod;
  });

  // Handle Create Internal Entry
  const handleSaveInternalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === entryPatientId);
    const patName = pat ? pat.name : 'Paciente';

    const newTx = addPayment({
      patientId: entryPatientId,
      patientName: patName,
      patientEmail: pat?.email,
      patientPhone: pat?.phone,
      amount: entryAmount,
      currency: 'BRL',
      title: entryTitle,
      description: entryDescription,
      method: entryMethod,
      status: entryStatus,
      entryType,
      paidAt: entryStatus === 'completed' ? new Date().toISOString() : undefined,
      paymentGateway: 'manual_internal',
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    setIsNewEntryModalOpen(false);
    triggerToast(`Lançamento de ${formatCurrency(entryAmount)} registrado para ${patName}!`);
  };

  // Export CSV report
  const handleExportCSV = () => {
    const headers = ['ID', 'Data', 'Paciente', 'Tipo', 'Título', 'Valor (R$)', 'Forma Informada', 'Status', 'Recibo'];
    const rows = payments.map((p) => [
      p.id,
      new Date(p.createdAt).toLocaleDateString('pt-BR'),
      `"${p.patientName || 'Não identificado'}"`,
      p.entryType === 'programa_acompanhamento' ? 'Programa Contínuo' : 'Consulta Avulsa',
      `"${p.title || 'Consulta'}"`,
      p.amount.toFixed(2),
      p.method === 'pix' ? 'PIX' : p.method === 'credit_card' ? 'Cartão Crédito' : p.method === 'dinheiro' ? 'Dinheiro' : p.method,
      p.status === 'completed' ? 'Pago' : p.status === 'pending' ? 'Pendente' : p.status === 'cortesia' ? 'Cortesia' : p.status,
      p.receiptNumber || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `controle_financeiro_interno_nutricore_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Relatório interno exportado em CSV!');
  };

  // Print Receipt Helper
  const handlePrintReceipt = (tx: PaymentTransaction) => {
    setSelectedReceiptTx(tx);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <DollarSign className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Controle Financeiro Interno & Atendimentos
            </h2>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
              Gestão Clínica Interna
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
            Painel exclusivo para controle financeiro e fluxo de caixa da clínica. O nutricionista informa os valores acordados para consultas avulsas e programas contínuos, acompanha quitações e emite recibos internos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => {
              setEntryType('consulta_avulsa');
              setEntryTitle('Consulta Nutricional Clínica (Avulsa)');
              setEntryAmount(250);
              setEntryStatus('completed');
              setIsNewEntryModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Valor de Atendimento</span>
          </button>
        </div>
      </div>

      {/* Internal Clarification Callout */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-950">
        <div className="p-1 rounded-lg bg-amber-100 text-amber-800 mt-0.5 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <span className="font-bold">Controle Interno Sem Processamento Externo:</span>
          <p className="text-amber-900 leading-relaxed">
            O sistema não realiza débitos ou cobranças online em cartões de terceiros. Todos os lançamentos aqui exibidos refletem os valores informados pelo próprio nutricionista para acompanhamento de receitas (consultas avulsas vs. programas de acompanhamento de médio/longo prazo).
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Recebido (Quitado)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{formatCurrency(totalReceived)}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {completedPayments.length} baixas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Receitas informadas pelo consultório
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            A Receber / Pendente
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">{formatCurrency(totalPending)}</span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
              {pendingPayments.length} em aberto
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Aguardando confirmação do nutricionista
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Receita: Consultas Avulsas
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{formatCurrency(singleConsultationsReceived)}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Atendimentos pontuais com valor unitário
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Receita: Programas Contínuos
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-800">{formatCurrency(programsReceived)}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pacotes periódicos (3 a 6 meses de acompanhamento)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por paciente, descrição ou recibo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Todos os Tipos</option>
            <option value="consulta_avulsa">🩺 Consultas Avulsas</option>
            <option value="programa_acompanhamento">🎯 Programas de Acompanhamento</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Todos os Status</option>
            <option value="completed">Quitado (Pago)</option>
            <option value="pending">Pendente</option>
            <option value="cortesia">Cortesia</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Todas as Formas</option>
            <option value="pix">PIX</option>
            <option value="credit_card">Cartão de Crédito</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="transferencia">Transferência</option>
          </select>
        </div>
      </div>

      {/* Financial Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Tipo & Atendimento</th>
                <th className="py-3.5 px-4">Paciente</th>
                <th className="py-3.5 px-4">Valor Informado</th>
                <th className="py-3.5 px-4">Forma Informada</th>
                <th className="py-3.5 px-4">Data do Registro</th>
                <th className="py-3.5 px-4">Status Interno</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum lançamento financeiro encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isProgram = p.entryType === 'programa_acompanhamento' || !!p.programEnrollmentId;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tipo & Título */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`p-1.5 rounded-lg text-xs ${
                              isProgram
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isProgram ? <Award className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-xs">
                              {p.title}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {isProgram ? 'Programa Contínuo' : 'Consulta Avulsa'} {p.receiptNumber ? `• ${p.receiptNumber}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Paciente */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {p.patientName || 'Paciente'}
                        </span>
                        {p.patientPhone && (
                          <span className="text-[10px] text-slate-400 block">{p.patientPhone}</span>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-900 text-sm">
                          {formatCurrency(p.amount)}
                        </span>
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase">
                          {p.method === 'pix'
                            ? 'PIX'
                            : p.method === 'credit_card'
                            ? 'Cartão'
                            : p.method === 'dinheiro'
                            ? 'Dinheiro'
                            : p.method === 'transferencia'
                            ? 'Transferência'
                            : p.method}
                        </span>
                      </td>

                      {/* Data */}
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Status Interno com Toggle rápido */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            const newStatus: PaymentStatus =
                              p.status === 'completed' ? 'pending' : 'completed';
                            updatePaymentStatus(p.id, newStatus);
                            triggerToast(
                              `Status de ${p.patientName} alterado para ${
                                newStatus === 'completed' ? 'Quitado' : 'Pendente'
                              }!`
                            );
                          }}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full font-bold text-[10px] transition-colors cursor-pointer ${
                            p.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : p.status === 'cortesia'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Clique para alternar entre Quitado e Pendente"
                        >
                          {p.status === 'completed' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Quitado (Pago)</span>
                            </>
                          ) : p.status === 'cortesia' ? (
                            <span>Cortesia / Parceria</span>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pendente</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Recibo Simples do Nutricionista */}
                          <button
                            onClick={() => setSelectedReceiptTx(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Visualizar / Imprimir Recibo do Nutricionista"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Excluir lançamento de ${formatCurrency(p.amount)} de ${p.patientName}?`)) {
                                deletePayment(p.id);
                                triggerToast('Lançamento financeiro removido.');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Lançamento / Informar Valor da Consulta */}
      {isNewEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  Registrar Valor de Atendimento (Controle Interno)
                </h3>
              </div>
              <button
                onClick={() => setIsNewEntryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInternalEntry} className="space-y-4">
              {/* Type Switcher: Consulta Avulsa vs Programa */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tipo de Atendimento:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('consulta_avulsa');
                      setEntryTitle('Consulta Nutricional Clínica (Avulsa)');
                      setEntryAmount(250);
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      entryType === 'consulta_avulsa'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🩺 Consulta Avulsa
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('programa_acompanhamento');
                      setEntryTitle('Programa de Acompanhamento Nutricional');
                      setEntryAmount(1200);
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      entryType === 'programa_acompanhamento'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🎯 Programa Contínuo
                  </button>
                </div>
              </div>

              {/* Patient */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Paciente: *
                </label>
                <select
                  value={entryPatientId}
                  onChange={(e) => setEntryPatientId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Identificação do Atendimento: *
                </label>
                <input
                  type="text"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Amount & Method Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Valor Informado (R$): *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Forma de Recebimento:
                  </label>
                  <select
                    value={entryMethod}
                    onChange={(e) => setEntryMethod(e.target.value as any)}
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
                  Status da Quitação Interna:
                </label>
                <select
                  value={entryStatus}
                  onChange={(e) => setEntryStatus(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-emerald-800"
                >
                  <option value="completed">Quitado (Valor já recebido pelo consultório)</option>
                  <option value="pending">Pendente (A receber / Em aberto)</option>
                  <option value="cortesia">Cortesia / Isento</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Observações Internas (Opcional):
                </label>
                <input
                  type="text"
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  placeholder="Ex: Consulta presencial com plano alimentar entregue."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewEntryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Salvar no Controle Interno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Recibo Simples do Nutricionista (Declaração de Recebimento) */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto print:m-0 print:p-8 print:shadow-none print:border-none">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6 print:hidden">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Recibo de Atendimento Nutricional
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceiptTx(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="space-y-6 text-slate-800 font-sans border-2 border-dashed border-slate-200 p-6 rounded-2xl bg-slate-50/50 print:border-none print:p-0 print:bg-white">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  {clinicConfig.name}
                </h2>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  {clinicConfig.nutritionistName} • {clinicConfig.crn}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {clinicConfig.address} • Tel: {clinicConfig.phone}
                </p>
              </div>

              {/* Receipt Title and Value */}
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    RECIBO Nº
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-800">
                    {selectedReceiptTx.receiptNumber || `REC-${Date.now().toString().slice(-6)}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    VALOR TOTAL
                  </span>
                  <span className="text-xl font-black text-emerald-700">
                    {formatCurrency(selectedReceiptTx.amount)}
                  </span>
                </div>
              </div>

              {/* Declaration Text */}
              <p className="text-xs leading-relaxed text-slate-700 text-justify">
                Recebi de <strong>{selectedReceiptTx.patientName}</strong> a importância de{' '}
                <strong>{formatCurrency(selectedReceiptTx.amount)}</strong> referente a serviços profissionais de{' '}
                <strong>{selectedReceiptTx.title}</strong>, prestados sob forma de atendimento clínico nutricional individualizado.
              </p>

              {/* Meta details */}
              <div className="text-[11px] text-slate-500 space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                <div>Forma informada: <strong>{selectedReceiptTx.method.toUpperCase()}</strong></div>
                <div>Data de emissão: <strong>{new Date(selectedReceiptTx.createdAt).toLocaleDateString('pt-BR')}</strong></div>
                <div>Status do atendimento: <strong>{selectedReceiptTx.status === 'completed' ? 'Quitado' : 'Pendente'}</strong></div>
              </div>

              {/* Signature Line */}
              <div className="pt-8 text-center border-t border-slate-200">
                <div className="w-56 h-px bg-slate-400 mx-auto mb-2" />
                <span className="font-bold text-xs text-slate-900 block">
                  {clinicConfig.nutritionistName}
                </span>
                <span className="text-[11px] text-slate-600 block">
                  {clinicConfig.crn}
                </span>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-6 border-t border-slate-100 mt-4 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedReceiptTx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
