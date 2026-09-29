import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check, Loader2, Trash2, Upload, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { atualizarMinhaFoto, removerMinhaFoto } from '../../api/auth';
import { compressImage, formatFileSize, resolvePhotoUrl } from '../../utils/imageCompressor';

function getInitials(name) {
  return String(name || 'Usuário')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function AlterarFotoPerfilModal({ isOpen, onClose }) {
  const { user, refreshSession } = useAuth();
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  const displayName = user?.funcionario || user?.username || 'Usuário';

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(user?.foto ? resolvePhotoUrl(user.foto) : '');
      setSelectedImage(null);
      setIsRemoved(false);
      setSaving(false);
      setError('');
      setImgError(false);
    }
  }, [isOpen, user?.foto]);

  if (!isOpen) return null;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validação de tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    setCompressing(true);
    setError('');

    try {
      // Comprime com corte quadrado centralizado e resolução 400x400
      const compressed = await compressImage(file, {
        maxSize: 400,
        quality: 0.85,
        preferredMimeType: 'image/webp',
      });

      setSelectedImage(compressed);
      setPreviewUrl(compressed.dataUrl);
      setIsRemoved(false);
      setImgError(false);
    } catch (err) {
      setError(err?.message || 'Falha ao processar e comprimir a imagem.');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setSelectedImage(null);
    setPreviewUrl('');
    setIsRemoved(true);
    setImgError(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    // Se nada foi alterado, apenas fecha
    if (!selectedImage && !isRemoved) {
      onClose();
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isRemoved) {
        await removerMinhaFoto(user?.id);
      } else if (selectedImage) {
        await atualizarMinhaFoto(selectedImage.base64, selectedImage.mimeType, user?.id);
      }

      await refreshSession();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível atualizar a foto de perfil.'
      );
    } finally {
      setSaving(false);
    }
  };

  const hasImage = Boolean(previewUrl) && !isRemoved && !imgError;
  const isDirty = Boolean(selectedImage) || (isRemoved && Boolean(user?.foto));

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white w-full max-w-md flex flex-col rounded-2xl border border-slate-200/90 shadow-modal overflow-hidden my-auto animate-fade-in text-xs">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#022b22] via-[#033b2e] to-[#022b22] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-forest-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-forest-850 border border-forest-700/80 text-amber-400 flex items-center justify-center shrink-0 shadow-hairline">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                MINHA CONTA
              </span>
              <h3 className="font-bold text-white text-base tracking-tight mt-0.5">
                Alterar Foto de Perfil
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving || compressing}
            className="p-1.5 rounded-lg text-forest-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 bg-white overflow-y-auto">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 font-semibold shadow-hairline">
              {error}
            </div>
          )}

          {/* Visualização Circular da Foto */}
          <div className="flex flex-col items-center justify-center space-y-3 py-2">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-forest-50 to-emerald-100 flex items-center justify-center ring-2 ring-forest-600/30">
                {hasImage ? (
                  <img
                    src={previewUrl}
                    alt={displayName}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-forest-900 bg-forest-50 select-none">
                    <span className="text-2xl font-black tracking-wider">
                      {getInitials(displayName)}
                    </span>
                  </div>
                )}
              </div>

              {/* Botão de sobreposição rápida para trocar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || compressing}
                className="absolute inset-0 rounded-full bg-slate-900/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs font-semibold"
                title="Clique para escolher nova imagem"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[11px]">Trocar foto</span>
              </button>
            </div>

            <div className="text-center">
              <p className="font-bold text-slate-900 text-sm">{displayName}</p>
              <p className="text-[11px] text-slate-400 font-mono">{user?.username}</p>
            </div>

            {/* Informações de Otimização */}
            {compressing && (
              <div className="flex items-center gap-2 text-forest-700 bg-forest-50 px-3 py-1.5 rounded-full border border-forest-200/80 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Otimizando e recortando imagem...</span>
              </div>
            )}

            {selectedImage && !compressing && (
              <div className="text-center bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl font-medium space-y-0.5">
                <p className="font-bold text-emerald-800 text-[11px]">
                  ✓ Foto otimizada: {formatFileSize(selectedImage.sizeBytes)} ({selectedImage.mimeType.replace('image/', '').toUpperCase()})
                </p>
                <p className="text-[10px] text-emerald-700">
                  Resolução: {selectedImage.width}x{selectedImage.height} px (corte 1:1)
                </p>
              </div>
            )}

            {isRemoved && (
              <div className="text-center bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl font-medium text-[11px]">
                A foto atual será removida ao clicar em Salvar.
              </div>
            )}
          </div>

          {/* Botões de Ação para a Foto */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving || compressing}
              className="btn-secondary !py-2 !px-3 font-semibold flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4 text-forest-700" />
              <span>{hasImage ? 'Escolher outra foto' : 'Selecionar foto'}</span>
            </button>

            {hasImage && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={saving || compressing}
                className="btn-secondary !py-2 !px-3 !text-rose-700 hover:!bg-rose-50 hover:!border-rose-300 font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Remover foto</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || compressing}
            className="btn-secondary"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving || compressing}
            className="btn-primary"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{saving ? 'Salvando...' : 'Salvar Foto'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
