import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Receipt } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export default function ReciboPagamentoModal({
  isOpen,
  onClose,
  recipientType,
  setRecipientType,
  name,
  setName,
  cpf,
  setCpf,
  paymentItem,
  showPrintPreview,
  setShowPrintPreview,
  onPrint
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl border border-slate-200/90 w-full max-w-2xl shadow-modal flex flex-col max-h-[90vh] my-auto animate-fade-in text-xs overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white p-4 sm:p-5 flex items-center justify-between border-b border-forest-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center text-amber-400 font-bold shadow-hairline">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">
                {showPrintPreview ? 'Recibo de Pagamento Clínico' : 'Emitir Recibo'}
              </h3>
              <p className="text-[11px] text-forest-200/80">Comprovante de quitação e prestação de serviço</p>
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

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 bg-white overflow-y-auto flex-1">
          {showPrintPreview ? (
            /* Printable Receipt Layout */
            <div className="border border-slate-200/80 rounded-xl p-5 space-y-5 bg-slate-50/40 font-sans text-xs">
              <div className="flex items-center justify-between border-b-2 border-forest-700 pb-3">
                <div>
                  <h3 className="text-base font-bold uppercase text-forest-900 tracking-wider">CENTRO VISÃO</h3>
                  <p className="text-xs text-slate-600 font-medium">Centro de Saúde Visual e Cuidados Clínicos</p>
                  <p className="text-[10.5px] text-slate-400 font-mono">CNPJ: 12.345.678/0001-90 • CRM/CRO: 987654</p>
                </div>
                <div className="text-right">
                  <span className="badge-finished text-xs">
                    RECIBO DE PAGAMENTO
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-1">Nº REC-00{paymentItem?.id}/2026</p>
                </div>
              </div>

              <div className="p-3.5 bg-forest-50/70 border border-forest-200/80 rounded-xl flex items-center justify-between">
                <span className="font-bold text-forest-950 uppercase text-xs">VALOR RECEBIDO</span>
                <span className="text-2xl font-bold text-forest-800 font-mono">
                  {formatCurrency(paymentItem?.value)}
                </span>
              </div>

              <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-2.5 leading-relaxed text-slate-800 text-xs">
                <p>
                  Recebemos de <strong>{name}</strong>, inscrito(a) no CPF sob o nº <strong>{cpf}</strong>, a quantia de <strong>{formatCurrency(paymentItem?.value)}</strong>, referente ao atendimento e realização de <strong>{paymentItem?.procedure} ({paymentItem?.description})</strong> com o profissional <strong>{paymentItem?.professional}</strong>.
                </p>
                <p className="text-slate-500 text-[11px]">
                  Forma de liquidação: <strong>{paymentItem?.paymentMethod}</strong> • Conta: <strong>{paymentItem?.account}</strong>.
                </p>
              </div>

              <div className="pt-4 flex items-end justify-between border-t border-slate-200">
                <div>
                  <p className="font-medium text-slate-600 text-xs">
                    São Paulo - SP, {paymentItem?.date || new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-center w-56 border-t border-slate-800 pt-1">
                  <p className="font-bold text-slate-900 text-xs">Centro Visão Optometria</p>
                  <p className="text-[10px] text-slate-400">Assinatura do Responsável</p>
                </div>
              </div>
            </div>
          ) : (
            /* Configure Recipient Form */
            <div className="space-y-4">
              <div>
                <label className="clinical-label mb-2">
                  Emitir recibo em nome de:
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="recipientType"
                      checked={recipientType === 'patient'}
                      onChange={() => setRecipientType('patient')}
                      className="accent-forest-700"
                    />
                    <span>Do próprio paciente</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="recipientType"
                      checked={recipientType === 'other'}
                      onChange={() => setRecipientType('other')}
                      className="accent-forest-700"
                    />
                    <span>De outra pessoa / responsável</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="clinical-label">
                    Nome do Titular do Recibo <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="clinical-input font-bold"
                  />
                </div>

                <div>
                  <label className="clinical-label">
                    CPF <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="clinical-input font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex justify-end space-x-2">
          {showPrintPreview ? (
            <>
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="btn-secondary"
              >
                Voltar à Edição
              </button>
              <button
                type="button"
                onClick={onPrint}
                className="btn-primary"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                className="btn-primary"
              >
                <span>Visualizar Recibo</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}

