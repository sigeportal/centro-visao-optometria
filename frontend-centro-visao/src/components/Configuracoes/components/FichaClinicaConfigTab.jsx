import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';
import ToggleSwitch from '../../Common/ToggleSwitch';
import {
  DEFAULT_CLINICAL_SECTIONS,
  getStoredClinicalSections,
  saveStoredClinicalSections,
  normalizeFromApi,
  normalizeToApi
} from '../../../data/clinicalSectionsConfig';
import {
  listarSecoesFicha,
  salvarConfiguracaoCompletaFicha
} from '../../../api/fichaClinica';

export default function FichaClinicaConfigTab({
  clinicalSections,
  setClinicalSections,
  onShowSuccess
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Carrega configurações da API ao montar o componente
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadSectionsFromBackend() {
      setLoading(true);
      setErrorMessage('');
      try {
        const apiSections = await listarSecoesFicha({ signal: controller.signal });
        if (isMounted && Array.isArray(apiSections) && apiSections.length > 0) {
          const normalized = normalizeFromApi(apiSections);
          setClinicalSections(normalized);
          saveStoredClinicalSections(normalized);
        }
      } catch (err) {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          console.warn('Não foi possível carregar da API, usando armazenamento local:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSectionsFromBackend();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [setClinicalSections]);

  // Alternar visibilidade de seção individual
  const handleToggleSection = (id) => {
    setClinicalSections(prev => 
      prev.map(sec => sec.id === id
        ? { ...sec, enabled: !sec.enabled, exibeTela: !sec.enabled }
        : sec)
    );
  };

  // Alternar visibilidade de todas as seções
  const handleToggleAll = (enableState) => {
    setClinicalSections(prev => 
      prev.map(sec => ({ ...sec, enabled: enableState, exibeTela: enableState }))
    );
  };

  // Restaurar padrão original
  const handleResetDefaults = async () => {
    if (window.confirm('Deseja restaurar a ordem e todas as seções padrão da Ficha Clínica?')) {
      const resetSections = DEFAULT_CLINICAL_SECTIONS.map((sec, index) => ({
        ...sec,
        enabled: true,
        exibeTela: true,
        exibeImpressao: true,
        ordem: index + 1,
      }));
      setClinicalSections(resetSections);
      setErrorMessage('');

      setSaving(true);
      try {
        const response = await salvarConfiguracaoCompletaFicha(normalizeToApi(resetSections));
        const savedSections = Array.isArray(response) && response.length > 0
          ? normalizeFromApi(response)
          : resetSections;
        setClinicalSections(savedSections);
        saveStoredClinicalSections(savedSections);
        onShowSuccess?.();
      } catch (err) {
        console.error('Erro ao restaurar configuração da ficha clínica:', err);
        setErrorMessage(err?.response?.data?.error?.message || 'Não foi possível restaurar a configuração da ficha clínica.');
      } finally {
        setSaving(false);
      }
    }
  };

  // Mover seção para Cima / Baixo
  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= clinicalSections.length) return;
    const updated = [...clinicalSections];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    setClinicalSections(updated);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...clinicalSections];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    setClinicalSections(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Salvar alterações
  const handleSaveClinicalConfig = async () => {
    setSaving(true);
    setErrorMessage('');

    try {
      const apiPayload = normalizeToApi(clinicalSections);
      const res = await salvarConfiguracaoCompletaFicha(apiPayload);
      if (Array.isArray(res) && res.length > 0) {
        const normalized = normalizeFromApi(res);
        setClinicalSections(normalized);
        saveStoredClinicalSections(normalized);
      }
      onShowSuccess?.();
    } catch (err) {
      console.error('Erro ao salvar configuração da ficha clínica na API:', err);
      setErrorMessage(err?.response?.data?.error?.message || 'Não foi possível salvar a configuração da ficha clínica.');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = clinicalSections.filter(s => s.enabled).length;
  const totalCount = clinicalSections.length;

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* Alerta de erro caso ocorra */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action & Info Control Bar */}
      <div className="clinical-panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Exames & Campos da Ficha Clínica
            </h3>
            <span className="bg-forest-50 text-forest-800 border border-forest-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
              {activeCount} de {totalCount} Ativos
            </span>
            {loading && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" />
                Carregando...
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ative ou desative seções e <strong>arraste pelo ícone (⋮⋮)</strong> para reorganizar a ordem de exibição durante o atendimento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleAll(true)}
            disabled={saving || loading}
            className="btn-secondary py-1.5 px-3 disabled:opacity-50"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ativar Todos</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleAll(false)}
            disabled={saving || loading}
            className="btn-secondary py-1.5 px-3 disabled:opacity-50"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Ocultar Todos</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving || loading}
            className="btn-secondary py-1.5 px-3 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={handleSaveClinicalConfig}
            disabled={saving || loading}
            className="btn-primary py-1.5 px-3.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Salvando...' : 'Salvar Ficha'}</span>
          </button>
        </div>
      </div>

      {/* Draggable & Reorderable List of Sections */}
      <div className="clinical-panel divide-y divide-slate-100 overflow-hidden">
        {clinicalSections.map((section, index) => {
          const isDraggingThis = draggedIndex === index;
          const isDragOverThis = dragOverIndex === index;

          return (
            <div
              key={section.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-3.5 sm:p-4 flex items-center justify-between transition-all select-none ${
                isDraggingThis ? 'opacity-40 bg-forest-50/50' : 'bg-white hover:bg-forest-50/15'
              } ${isDragOverThis ? 'border-t-2 border-t-forest-600 bg-forest-50/30' : ''}`}
            >
              {/* Left: Drag Handle, Index Badge & Title */}
              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                {/* Drag Handle */}
                <div 
                  title="Clique e arraste para reordenar"
                  className="cursor-grab active:cursor-grabbing p-1.5 text-slate-400 hover:text-forest-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Order Number Badge */}
                <span className="w-7 h-7 shrink-0 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-600 flex items-center justify-center">
                  #{index + 1}
                </span>

                {/* Section Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-bold text-xs tracking-tight ${
                      section.enabled ? 'text-slate-900' : 'text-slate-400 line-through'
                    }`}>
                      {section.title}
                    </h4>
                    {!section.enabled && (
                      <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
                        Oculto no Atendimento
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                    {section.subtitle}
                  </p>
                </div>
              </div>

              {/* Right: Move Up/Down Controls & Toggle Switch */}
              <div className="flex items-center space-x-3 shrink-0 ml-4">
                
                {/* Quick Move Up/Down Buttons */}
                <div className="flex items-center space-x-0.5 border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                  <button
                    type="button"
                    disabled={index === 0 || saving}
                    onClick={() => handleMove(index, -1)}
                    title="Mover para Cima"
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === clinicalSections.length - 1 || saving}
                    onClick={() => handleMove(index, 1)}
                    title="Mover para Baixo"
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Toggle Switch Button */}
                <div className="flex items-center space-x-2.5">
                  <span className={`text-[11px] font-bold w-28 text-right hidden sm:inline-block ${
                    section.enabled ? 'text-forest-900' : 'text-slate-400'
                  }`}>
                    {section.enabled ? 'Visível na Ficha' : 'Oculto'}
                  </span>

                  <ToggleSwitch
                    checked={section.enabled}
                    onChange={() => handleToggleSection(section.id)}
                    activeColor="bg-forest-700"
                    ariaLabel={`Alternar visibilidade de ${section.title}`}
                  />
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3.5 sm:p-4 border border-slate-200/80 rounded-2xl shadow-hairline">
        <span className="text-xs text-slate-600 font-medium">
          💡 Após salvar, as alterações são refletidas na tela de atendimento dos pacientes.
        </span>
        <button
          type="button"
          onClick={handleSaveClinicalConfig}
          disabled={saving || loading}
          className="btn-primary py-2 px-4 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>

    </div>
  );
}
