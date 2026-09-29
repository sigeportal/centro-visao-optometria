import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, Save, Trash2, User } from 'lucide-react';
import { calculateAge, maskCPF, maskRG, maskPhone } from '../../../utils/formatters';
import { compressImage, formatFileSize, resolvePhotoUrl } from '../../../utils/imageCompressor';

function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function DadosPessoaisTab({
  formData,
  setFormData,
  isEditing,
  setIsEditing,
  onSave
}) {
  const currentAge = calculateAge(formData.birthDate);
  const [compressing, setCompressing] = useState(false);
  const [photoSizeInfo, setPhotoSizeInfo] = useState('');
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setImgError(false);
  }, [formData.photo]);

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    setCompressing(true);
    setError('');

    try {
      const compressed = await compressImage(file, {
        maxSize: 400,
        quality: 0.85,
        preferredMimeType: 'image/webp',
      });
      setFormData({
        ...formData,
        photo: compressed.dataUrl,
        foto: compressed.dataUrl,
      });
      setPhotoSizeInfo(`Foto otimizada: ${formatFileSize(compressed.sizeBytes)}`);
    } catch (err) {
      setError(err?.message || 'Falha ao comprimir imagem do paciente.');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setFormData({
      ...formData,
      photo: '',
      foto: '',
    });
    setPhotoSizeInfo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="clinical-panel p-5 sm:p-6 space-y-5 animate-fade-in">
      
      {/* Header with edit toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">
            Dados Cadastrais & Informações Pessoais
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Registro civil, informações de contato, endereço residencial e responsável legal do paciente.
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

          {/* Avatar do Paciente */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-xs flex items-center justify-center shrink-0">
              {formData.photo && !imgError ? (
                <img
                  src={resolvePhotoUrl(formData.photo)}
                  alt={formData.name || 'Paciente'}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-forest-800 bg-forest-50/70 font-bold">
                  {formData.name ? (
                    <span className="text-xl">{getInitials(formData.name)}</span>
                  ) : (
                    <User className="w-8 h-8 text-forest-600/70" />
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Foto de Identificação</span>
                <p className="text-[11px] text-slate-400">
                  Foto do paciente para o prontuário e ficha clínica de optometria.
                </p>
              </div>

              {compressing && (
                <div className="flex items-center gap-1.5 text-forest-700 text-[11px] font-medium justify-center sm:justify-start">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Otimizando e comprimindo imagem...</span>
                </div>
              )}

              {photoSizeInfo && (
                <span className="inline-block text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  ✓ {photoSizeInfo}
                </span>
              )}

              {error && (
                <span className="inline-block text-[11px] text-rose-600 font-semibold">
                  {error}
                </span>
              )}

              {isEditing ? (
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    disabled={compressing}
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary !py-1.5 !px-2.5 !text-xs flex items-center gap-1.5 font-semibold"
                  >
                    <Camera className="w-3.5 h-3.5 text-forest-700" />
                    <span>{formData.photo ? 'Alterar Foto' : 'Adicionar Foto'}</span>
                  </button>

                  {formData.photo && (
                    <button
                      type="button"
                      disabled={compressing}
                      onClick={handleRemovePhoto}
                      className="btn-secondary !py-1.5 !px-2.5 !text-xs !text-rose-700 hover:!bg-rose-50 hover:!border-rose-300 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Remover Foto</span>
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[10.5px] text-slate-400 italic">
                  Clique em &quot;Editar Cadastro&quot; para alterar ou remover a foto do paciente.
                </p>
              )}
            </div>
          </div>

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
                maxLength={14}
                placeholder="000.000.000-00"
                disabled={!isEditing}
                value={maskCPF(formData.cpf || '')}
                onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                className="clinical-input font-mono font-bold"
              />
            </div>

            <div>
              <label className="clinical-label">
                RG
              </label>
              <input
                type="text"
                maxLength={12}
                placeholder="00.000.000-0"
                disabled={!isEditing}
                value={maskRG(formData.rg || '')}
                onChange={(e) => setFormData({ ...formData, rg: maskRG(e.target.value) })}
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
                maxLength={15}
                placeholder="(00) 00000-0000"
                disabled={!isEditing}
                value={maskPhone(formData.phone || '')}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                className="clinical-input font-medium font-mono"
              />
            </div>

            <div>
              <label className="clinical-label">
                Telefone Secundário / Recado
              </label>
              <input
                type="text"
                maxLength={15}
                placeholder="(00) 0000-0000 ou (00) 00000-0000"
                disabled={!isEditing}
                value={maskPhone(formData.phone2 || '')}
                onChange={(e) => setFormData({ ...formData, phone2: maskPhone(e.target.value) })}
                className="clinical-input font-medium font-mono"
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

        {/* Seção 4: Responsável Legal */}
        <div className="pt-3.5 border-t border-slate-100">
          <span className="font-bold text-[10.5px] uppercase text-forest-800 tracking-wider block mb-3">
            4. Responsável Legal
            <span className="normal-case text-slate-400 font-medium tracking-normal ml-1.5">
              (opcional)
            </span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="clinical-label">
                Nome do Responsável
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.responsibleName || ''}
                onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                className="clinical-input font-medium"
              />
            </div>

            <div>
              <label className="clinical-label">
                CPF do Responsável
              </label>
              <input
                type="text"
                maxLength={14}
                placeholder="000.000.000-00"
                disabled={!isEditing}
                value={maskCPF(formData.responsibleCpf || '')}
                onChange={(e) => setFormData({ ...formData, responsibleCpf: maskCPF(e.target.value) })}
                className="clinical-input font-mono font-bold"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
