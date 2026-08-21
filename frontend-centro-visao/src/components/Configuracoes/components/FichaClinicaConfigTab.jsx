import React, { useState } from 'react';
import { 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Save 
} from 'lucide-react';
import ToggleSwitch from '../../Common/ToggleSwitch';
import { 
  DEFAULT_CLINICAL_SECTIONS, 
  saveStoredClinicalSections 
} from '../../../data/clinicalSectionsConfig';

export default function FichaClinicaConfigTab({ 
  clinicalSections, 
  setClinicalSections, 
  onShowSuccess 
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Toggle individual section
  const handleToggleSection = (id) => {
    setClinicalSections(prev => 
      prev.map(sec => sec.id === id ? { ...sec, enabled: !sec.enabled } : sec)
    );
  };

  // Toggle all sections
  const handleToggleAll = (enableState) => {
    setClinicalSections(prev => 
      prev.map(sec => ({ ...sec, enabled: enableState }))
    );
  };

  // Reset to default configuration and order
  const handleResetDefaults = () => {
    if (window.confirm("Deseja restaurar a ordem e configurações padrão da Ficha Clínica?")) {
      setClinicalSections(DEFAULT_CLINICAL_SECTIONS);
      saveStoredClinicalSections(DEFAULT_CLINICAL_SECTIONS);
      onShowSuccess();
    }
  };

  // Move section Up / Down
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

  // Save changes
  const handleSaveClinicalConfig = () => {
    saveStoredClinicalSections(clinicalSections);
    onShowSuccess();
  };

  const activeCount = clinicalSections.filter(s => s.enabled).length;
  const totalCount = clinicalSections.length;

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
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
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ative ou desative seções e <strong>arraste pelo ícone (⋮⋮)</strong> para reorganizar a ordem de exibição durante o atendimento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleAll(true)}
            className="btn-secondary py-1.5 px-3"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ativar Todos</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleAll(false)}
            className="btn-secondary py-1.5 px-3"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Ocultar Todos</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="btn-secondary py-1.5 px-3"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={handleSaveClinicalConfig}
            className="btn-primary py-1.5 px-3.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Ficha</span>
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
                    disabled={index === 0}
                    onClick={() => handleMove(index, -1)}
                    title="Mover para Cima"
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === clinicalSections.length - 1}
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
          💡 As alterações aplicadas aqui são refletidas imediatamente na tela de atendimento dos pacientes.
        </span>
        <button
          type="button"
          onClick={handleSaveClinicalConfig}
          className="btn-primary py-2 px-4"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

    </div>
  );
}
