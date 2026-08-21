import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  DollarSign, 
  X, 
  User, 
  Files, 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  Save, 
  Info 
} from 'lucide-react';
import ToggleSwitch from '../../Common/ToggleSwitch';

export default function LancarPagamentoAgendamentoModal({
  isOpen,
  appointment,
  onClose,
  onBackToDetails,
  onSavePayment
}) {
  const [valor, setValor] = useState('180.00');
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [parceria, setParceria] = useState('Particular');
  const [pagamentoRecebido, setPagamentoRecebido] = useState(true);
  const [dataVencimento, setDataVencimento] = useState('2026-08-14');

  useEffect(() => {
    if (appointment) {
      if (appointment.procedure === 'Retorno') {
        setValor('0.00');
      } else if (appointment.procedure?.toLowerCase().includes('lente')) {
        setValor('250.00');
      } else {
        setValor('180.00');
      }
      setFormaPagamento(appointment.paymentMethod || 'Dinheiro');
      setParceria(appointment.partnership || 'Particular');
      setPagamentoRecebido(appointment.paymentStatus === 'Pago' || appointment.paymentStatus === 'Liquidado' || true);
      setDataVencimento(appointment.date || '2026-08-14');
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const patientName = appointment.patient || appointment.name || 'Mariana Oliveira Lima';
  const procedure = appointment.procedure || 'Avaliação Binocular / Tonometria';

  const handleSubmit = (e) => {
    e.preventDefault();
    const numVal = parseFloat(valor) || 0;
    if (onSavePayment) {
      onSavePayment({
        appointmentId: appointment.id,
        patientName,
        procedure,
        valor: numVal,
        formaPagamento,
        parceria,
        pagamentoRecebido,
        dataVencimento
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl border border-slate-200/90 w-full max-w-xl shadow-modal flex flex-col max-h-[90vh] my-auto animate-fade-in text-xs overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white p-4 sm:p-5 flex items-center justify-between border-b border-forest-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center text-amber-400 font-bold shadow-hairline">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">
                Pagamento do Agendamento
              </h3>
              <p className="text-[11px] text-forest-200/80">
                Registre ou atualize as informações financeiras deste atendimento
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-forest-200/70 hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
            
            {/* Patient & Procedure Summary Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-forest-50 border border-forest-200/60 text-forest-800 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-hairline">
                  <User className="w-4 h-4 text-forest-700" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                    Paciente
                  </span>
                  <strong className="text-xs font-bold text-slate-900 truncate block">
                    {patientName}
                  </strong>
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-hairline">
                  <Files className="w-4 h-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                    Procedimento
                  </span>
                  <strong className="text-xs font-bold text-slate-900 truncate block">
                    {procedure}
                  </strong>
                </div>
              </div>
            </div>

            {/* Valor do procedimento */}
            <div>
              <label className="clinical-label">
                Valor do procedimento <span className="text-rose-600">*</span>
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-forest-700 focus-within:ring-2 focus-within:ring-forest-700/10 transition-all bg-white">
                <span className="bg-slate-50 border-r border-slate-200 px-3.5 py-2 font-mono font-bold text-slate-600 text-xs flex items-center">
                  R$
                </span>
                <input
                  type="text"
                  required
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-transparent font-mono font-bold text-slate-900 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Forma de pagamento & Parceria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="clinical-label">
                  Forma de pagamento <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="clinical-input font-semibold"
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto Bancário">Boleto Bancário</option>
                  <option value="Transferência Bancária">Transferência Bancária</option>
                </select>
              </div>

              <div>
                <label className="clinical-label">
                  Parceria / Convênio <span className="text-rose-600">*</span>
                </label>
                <select
                  value={parceria}
                  onChange={(e) => setParceria(e.target.value)}
                  className="clinical-input font-semibold"
                >
                  <option value="Particular">Particular</option>
                  <option value="Óticas Carol">Óticas Carol</option>
                  <option value="Óticas Diniz">Óticas Diniz</option>
                  <option value="Centro Oftalmológico">Centro Oftalmológico</option>
                  <option value="Outro Convênio">Outro Convênio</option>
                </select>
              </div>
            </div>

            {/* Pagamento recebido? & Data de vencimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="clinical-label">
                  Pagamento recebido?
                </label>
                <div className="flex items-center space-x-3 bg-white border border-slate-200 p-2 rounded-xl">
                  <ToggleSwitch
                    checked={pagamentoRecebido}
                    onChange={(val) => setPagamentoRecebido(val)}
                  />
                  <span className="font-bold text-xs text-slate-800">
                    {pagamentoRecebido ? 'Sim (Liquidado)' : 'Não (Pendente)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="clinical-label">
                  Data de vencimento <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="clinical-input font-mono font-bold"
                />
              </div>
            </div>

            {/* Information Callout */}
            <div className="p-3 bg-forest-50/70 border border-forest-200/80 text-forest-900 text-xs font-medium rounded-xl flex items-center space-x-2.5">
              <Info className="w-4 h-4 text-forest-700 shrink-0" />
              <span>
                {pagamentoRecebido 
                  ? 'Ao marcar como recebido, o pagamento será lançado no caixa imediatamente como receita liquidada.'
                  : 'O valor ficará registrado no contas a receber como pendente.'}
              </span>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToDetails}
              className="btn-secondary flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar aos detalhes</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-primary"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar pagamento</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
}

