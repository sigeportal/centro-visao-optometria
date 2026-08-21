import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Building2, Loader2, X, Save } from 'lucide-react';
import ToggleSwitch from '../../Common/ToggleSwitch';
import { formatCNPJ, formatPhone } from '../../../utils/formatters';

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function NovaParceriaModal({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit,
  saving = false,
  errorMessage = '',
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200/90 shadow-modal overflow-hidden my-auto animate-fade-in text-xs">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-forest-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-forest-800/80 border border-forest-600/40 text-amber-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                PARCERIAS
              </span>
              <h3 className="font-bold text-white text-base tracking-tight mt-0.5">
                {formData.id ? 'Editar Parceiro' : 'Novo Parceiro'}
              </h3>
              <p className="text-[11px] text-forest-200/80">
                Dados utilizados na identificação e no contato com o parceiro.
              </p>
            </div>
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
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4 bg-white overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 font-bold flex items-center gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {/* Row 1: Nome do parceiro * & CNPJ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="clinical-label">
                Nome do parceiro <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>

            <div>
              <label className="clinical-label">
                CNPJ
              </label>
              <input
                type="text"
                maxLength={18}
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                className="clinical-input font-mono font-medium"
              />
            </div>
          </div>

          {/* Row 2: Telefone & E-mail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="clinical-label">
                Telefone
              </label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                className="clinical-input font-medium"
              />
            </div>

            <div>
              <label className="clinical-label">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>
          </div>

          {/* Row 3: Responsável (Full width) */}
          <div>
            <label className="clinical-label">
              Responsável
            </label>
            <input
              type="text"
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              className="clinical-input font-medium"
            />
          </div>

          {/* Row 4: Endereço (Full width) */}
          <div>
            <label className="clinical-label">
              Endereço
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="clinical-input font-medium"
            />
          </div>

          {/* Row 5: Cidade & Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="clinical-label">
                Cidade
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>

            <div>
              <label className="clinical-label">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="clinical-input font-medium"
              >
                <option value="">Selecione</option>
                {ESTADOS_BRASIL.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bottom Toggle: Parceiro Ativo */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <div>
              <h4 className="font-bold text-xs text-slate-900">
                Parceiro ativo
              </h4>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                O parceiro está disponível para vinculação nos agendamentos.
              </p>
            </div>

            <ToggleSwitch
              checked={formData.ativo}
              onChange={(checked) => setFormData({ ...formData, ativo: checked })}
              activeColor="bg-forest-700"
              ariaLabel="Status ativo do parceiro"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="shrink-0 pt-3.5 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Salvando...' : 'Salvar Parceiro'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
}

