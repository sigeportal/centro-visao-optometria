import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { formatCEP, formatCNPJ, formatPhone } from '../../../utils/formatters';

export default function DadosClinicaTab({ 
  clinicData, 
  setClinicData, 
  onSave,
  loading = false,
  saving = false,
  errorMessage = '',
}) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="clinical-panel p-5 sm:p-6 space-y-4 animate-fade-in shadow-sm">
      <div>
        <h3 className="font-bold text-sm text-slate-900 tracking-tight">
          Dados da Clínica
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Informações cadastrais e de identificação institucional utilizadas em receitas, laudos e recibos.
        </p>
      </div>

      {errorMessage && (
        <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-1">
        <div>
          <label className="clinical-label">
            Nome Fantasia / Clínica
          </label>
          <input 
            type="text" 
            value={clinicData.name}
            onChange={(e) => setClinicData({ ...clinicData, name: e.target.value })}
            className="clinical-input font-bold"
          />
        </div>

        <div>
          <label className="clinical-label">
            CNPJ
          </label>
          <input 
            type="text" 
            value={formatCNPJ(clinicData.cnpj)}
            onChange={(e) => setClinicData({ ...clinicData, cnpj: formatCNPJ(e.target.value) })}
            className="clinical-input font-mono font-medium"
          />
        </div>

        <div>
          <label className="clinical-label">
            Telefone / WhatsApp
          </label>
          <input 
            type="text" 
            value={formatPhone(clinicData.phone)}
            onChange={(e) => setClinicData({ ...clinicData, phone: formatPhone(e.target.value) })}
            className="clinical-input font-medium"
          />
        </div>

        <div>
          <label className="clinical-label">
            Cidade
          </label>
          <input 
            type="text" 
            value={clinicData.city}
            onChange={(e) => setClinicData({ ...clinicData, city: e.target.value })}
            className="clinical-input font-medium"
          />
        </div>

        <div>
          <label className="clinical-label">UF</label>
          <input
            type="text"
            maxLength={2}
            value={clinicData.state}
            onChange={(e) => setClinicData({ ...clinicData, state: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
            className="clinical-input font-mono uppercase font-medium"
          />
        </div>

        <div>
          <label className="clinical-label">CEP</label>
          <input
            type="text"
            value={formatCEP(clinicData.cep)}
            onChange={(e) => setClinicData({ ...clinicData, cep: formatCEP(e.target.value) })}
            className="clinical-input font-mono font-medium"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="clinical-label">
            Endereço Completo
          </label>
          <input 
            type="text" 
            value={clinicData.address}
            onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })}
            className="clinical-input font-medium"
          />
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-100">
        <button
          type="submit"
          disabled={loading || saving || !clinicData.name.trim()}
          className="btn-primary"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Salvando...' : 'Salvar Dados'}</span>
        </button>
      </div>
    </form>
  );
}

