import React, { useState } from 'react';
import { Plus, Printer } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import ReciboPagamentoModal from './ReciboPagamentoModal';

export default function FinanceiroPacienteTab({
  patient,
  pagamentos,
  setPagamentos,
  onShowToast
}) {
  const [receiptModal, setReceiptModal] = useState({
    isOpen: false,
    recipientType: 'patient',
    name: patient?.name || '',
    cpf: patient?.cpf || '',
    paymentItem: null,
    showPrintPreview: false
  });

  const totalGasto = pagamentos.reduce((acc, p) => acc + (Number(p.value) || 0), 0);

  const handleOpenReceipt = (item) => {
    setReceiptModal({
      isOpen: true,
      recipientType: 'patient',
      name: patient?.name || '',
      cpf: patient?.cpf || '',
      paymentItem: item,
      showPrintPreview: false
    });
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clinical-panel p-4 sm:p-5">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
            Total em Atendimentos
          </span>
          <h3 className="text-2xl font-bold text-forest-800 font-mono mt-1">
            {formatCurrency(totalGasto)}
          </h3>
          <span className="text-xs text-slate-500 font-medium mt-0.5 block">
            {pagamentos.length} transações registradas
          </span>
        </div>

        <div className="clinical-panel p-4 sm:p-5">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
            Saldo Devedor / Pendências
          </span>
          <h3 className="text-2xl font-bold text-slate-900 font-mono mt-1">
            R$ 0,00
          </h3>
          <span className="text-xs text-forest-700 font-bold mt-0.5 block">
            Paciente em dia (sem pendências)
          </span>
        </div>

        <div className="clinical-panel p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
              Novo Pagamento
            </span>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Lance uma nova receita
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const val = prompt("Valor do pagamento (R$):", "180.00");
              if (val) {
                const novo = {
                  id: String(Date.now()),
                  date: new Date().toLocaleDateString('pt-BR'),
                  description: "Pagamento avulso de consulta",
                  procedure: "Consulta Completa",
                  professional: "Dra. Katiuscia Almeida",
                  paymentMethod: "Pix",
                  account: "Clínica",
                  status: "Liquidado",
                  value: parseFloat(val) || 180
                };
                setPagamentos(prev => [novo, ...prev]);
                onShowToast("Pagamento registrado com sucesso!");
              }
            }}
            className="btn-primary py-2 px-3 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="clinical-table">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="py-3 px-4">Data</th>
              <th className="py-3 px-4">Descrição</th>
              <th className="py-3 px-4">Profissional</th>
              <th className="py-3 px-4">Forma Pagto</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Valor</th>
              <th className="py-3 px-4 text-center w-24">Recibo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {pagamentos.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                  Nenhum lançamento financeiro para este paciente.
                </td>
              </tr>
            ) : (
              pagamentos.map((p) => (
                <tr key={p.id} className="hover:bg-forest-50/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                    {p.date}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>
                      <span>{p.description}</span>
                      <span className="text-[10.5px] text-slate-400 block font-normal mt-0.5">
                        {p.procedure}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {p.professional}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {p.paymentMethod}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="badge-finished">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-xs text-forest-900">
                    {formatCurrency(p.value)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenReceipt(p)}
                      className="btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center space-x-1"
                      title="Emitir Recibo"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Recibo</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Recibo Modal */}
      <ReciboPagamentoModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal(prev => ({ ...prev, isOpen: false }))}
        recipientType={receiptModal.recipientType}
        setRecipientType={(type) => setReceiptModal(prev => ({ ...prev, recipientType: type }))}
        name={receiptModal.name}
        setName={(name) => setReceiptModal(prev => ({ ...prev, name }))}
        cpf={receiptModal.cpf}
        setCpf={(cpf) => setReceiptModal(prev => ({ ...prev, cpf }))}
        paymentItem={receiptModal.paymentItem}
        showPrintPreview={receiptModal.showPrintPreview}
        setShowPrintPreview={(val) => setReceiptModal(prev => ({ ...prev, showPrintPreview: val }))}
        onPrint={() => {
          window.print();
          onShowToast("Enviado para impressão do recibo.");
        }}
      />

    </div>
  );
}
