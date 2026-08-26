import React from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Paperclip } from 'lucide-react';
import ToggleSwitch from '../../Common/ToggleSwitch';
import { FORMAS_PAGAMENTO, CONTAS_BANCARIAS, CATEGORIAS_DESPESA } from '../data/mockFinanceiroData';

export default function NovaDespesaModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  onFileAttached
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200/90 rounded-2xl shadow-modal text-xs overflow-hidden my-auto animate-fade-in">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-forest-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Módulo Financeiro
            </span>
            <h3 className="font-bold text-white text-base tracking-tight mt-0.5">
              Nova Despesa
            </h3>
            <p className="text-[11px] text-forest-200/80 mt-0.5">
              Lance despesas operacionais, contas fixas, fornecedores ou compras.
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-forest-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4 bg-white overflow-y-auto flex-1 text-xs">
          
          {/* Linha 1: Descrição *, Valor *, Data competência * */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            <div className="md:col-span-6">
              <label className="clinical-label">
                Descrição da Despesa <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="Ex.: Conta de Energia, Material de Ótica..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="clinical-input mt-1 font-medium"
              />
            </div>

            <div className="md:col-span-3">
              <label className="clinical-label">
                Valor <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="clinical-input pl-9 font-bold font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="clinical-label">
                Data da Competência <span className="text-rose-500">*</span>
              </label>
              <input 
                type="date" 
                required
                value={formData.competenceDate}
                onChange={(e) => setFormData({ ...formData, competenceDate: e.target.value })}
                className="clinical-input mt-1 font-medium"
              />
            </div>
          </div>

          {/* Linha 2: Categoria *, Despesa recorrente */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
            <div className="md:col-span-6">
              <label className="clinical-label">
                Categoria de Despesa <span className="text-rose-500">*</span>
              </label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="clinical-input mt-1 font-medium"
              >
                {CATEGORIAS_DESPESA.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6 flex items-center justify-between p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl mt-4">
              <div>
                <span className="font-bold text-slate-800 text-xs block">Despesa Recorrente</span>
                <span className="text-[10.5px] text-slate-400">Repetir cobrança mensalmente</span>
              </div>
              <ToggleSwitch
                checked={formData.isRecurring}
                onChange={(val) => setFormData({ ...formData, isRecurring: val })}
                activeColor="bg-forest-700"
                ariaLabel="Despesa recorrente"
              />
            </div>
          </div>

          {/* Seção Condições de Pagamento */}
          <div className="p-4 border border-slate-200/80 bg-slate-50/70 rounded-xl space-y-3 mt-2">
            <span className="font-bold text-rose-800 uppercase text-[10px] tracking-wider block">
              Condições de Pagamento
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-1 lg:col-span-3">
                <label className="clinical-label">
                  Forma de Pagamento <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="clinical-input h-9 mt-1 font-medium"
                >
                  {FORMAS_PAGAMENTO.map(fp => (
                    <option key={fp} value={fp}>{fp}</option>
                  ))}
                  <option value="Boleto Bancário">Boleto Bancário</option>
                </select>
              </div>

              <div className="sm:col-span-1 lg:col-span-3">
                <label className="clinical-label">
                  Conta <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  className="clinical-input h-9 mt-1 font-medium"
                >
                  {CONTAS_BANCARIAS.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 lg:col-span-2">
                <label className="clinical-label">
                  Vencimento <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="clinical-input h-9 mt-1 font-medium"
                />
              </div>

              <div className="sm:col-span-1 lg:col-span-2">
                <label className="clinical-label">
                  Parcelamento <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                  className="clinical-input h-9 mt-1 font-bold text-center"
                />
              </div>

              <div className="sm:col-span-1 lg:col-span-2">
                <label className={`w-full h-9 flex items-center justify-center space-x-2 px-2.5 rounded-xl border cursor-pointer font-bold text-xs transition-all ${
                  formData.isPaid 
                    ? 'bg-rose-50 border-rose-300 text-rose-900' 
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className="accent-rose-600 w-3.5 h-3.5 rounded"
                  />
                  <span className="whitespace-nowrap">Pago</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <div className="text-right flex items-center space-x-2">
                <span className="text-slate-500 font-medium text-xs">Valor Total:</span>
                <span className="text-rose-700 font-bold text-base font-mono">
                  R$ {Number(formData.value || 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* Seção Comprovante */}
          <div className="p-3.5 border border-slate-200/80 bg-white rounded-xl space-y-2">
            <span className="clinical-label block">
              Comprovante / Anexo
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-slate-500 text-xs">
                Adicione imagens ou PDF quando precisar guardar o comprovante junto da despesa.
              </p>
              <div>
                <label className="cursor-pointer btn-secondary py-1.5 px-3">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{formData.fileName || 'Anexar arquivo'}</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        onFileAttached(e.target.files[0].name);
                      }
                    }} 
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="shrink-0 pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            
            <button 
              type="submit" 
              className="btn-danger"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Despesa</span>
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}

