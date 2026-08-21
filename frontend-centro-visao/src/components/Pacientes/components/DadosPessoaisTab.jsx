import React from 'react';
import { Save } from 'lucide-react';
import { calculateAge } from '../../../utils/formatters';

export default function DadosPessoaisTab({
  formData,
  setFormData,
  isEditing,
  setIsEditing,
  onSave
}) {
  const currentAge = calculateAge(formData.birthDate);

  return (
    <div className="clinical-panel p-5 sm:p-6 space-y-5 animate-fade-in">
      
      {/* Header with edit toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">
            Dados Cadastrais & Informações Pessoais
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Registro civil, informações de contato, endereço residencial e convênio do paciente.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSave}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              Editar Cadastro
            </button>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-5 text-xs">
        {/* Seção 1: Identificação */}
        <div>
          <span className="font-bold text-[10.5px] uppercase text-forest-800 tracking-wider block mb-3">
            1. Identificação do Paciente
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="sm:col-span-2">
              <label className="clinical-label">
                Nome Completo <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="clinical-input font-bold"
              />
            </div>

            <div>
              <label className="clinical-label">
                CPF
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                className="clinical-input font-mono font-bold"
              />
            </div>

            <div>
              <label className="clinical-label">
                RG
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.rg}
                onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                className="clinical-input font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="clinical-label !mb-0">
                  Data de Nascimento
                </label>
                {currentAge !== null && (
                  <span className="text-[10.5px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 leading-none">
                    {currentAge} {currentAge === 1 ? 'ano' : 'anos'}
                  </span>
                )}
              </div>
              <input
                type="date"
                disabled={!isEditing}
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>

            <div>
              <label className="clinical-label">
                Sexo / Gênero
              </label>
              <select
                disabled={!isEditing}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="clinical-input font-medium"
              >
                <option value="">Não informado</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="clinical-label">
                Profissão / Ocupação
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Contato */}
        <div className="pt-3.5 border-t border-slate-100">
          <span className="font-bold text-[10.5px] uppercase text-forest-800 tracking-wider block mb-3">
            2. Informações de Contato
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div>
              <label className="clinical-label">
                Telefone Celular / WhatsApp
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>

            <div>
              <label className="clinical-label">
                Telefone Secundário / Recado
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.phone2}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>

            <div>
              <label className="clinical-label">
                E-mail
              </label>
              <input
                type="email"
                disabled={!isEditing}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>
          </div>
        </div>

        {/* Seção 3: Endereço */}
        <div className="pt-3.5 border-t border-slate-100">
          <span className="font-bold text-[10.5px] uppercase text-forest-800 tracking-wider block mb-3">
            3. Endereço Residencial
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="sm:col-span-2">
              <label className="clinical-label">
                Logradouro e Número
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>

            <div>
              <label className="clinical-label">
                Cidade
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>

            <div>
              <label className="clinical-label">
                Estado / UF
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

