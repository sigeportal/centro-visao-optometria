import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, X, Calendar, Clock, ChevronDown } from 'lucide-react';
import { PROFESSIONALS } from '../../data/mockData';

export default function BloquearHorarioModal({ isOpen, onClose, onSave }) {
  const [profissional, setProfissional] = useState('Katiuscia');
  const [data, setData] = useState('17/08/2026');
  const [horarioInicio, setHorarioInicio] = useState('17:05');
  const [horarioFim, setHorarioFim] = useState('17:35');
  const [motivo, setMotivo] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (onSave) {
      onSave({
        profissional,
        data,
        horarioInicio,
        horarioFim,
        motivo
      });
    }

    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl border border-slate-200/90 w-full max-w-lg shadow-modal my-auto animate-fade-in text-xs overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white p-4 sm:p-5 flex items-center justify-between border-b border-forest-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center text-amber-400 font-bold shadow-hairline">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">Bloquear Horário</h3>
              <p className="text-[11px] text-forest-200/80">Indisponibilizar período na grade de atendimento</p>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5">
          
          {/* Selecione o profissional */}
          <div>
            <label className="clinical-label">
              Selecione o profissional
            </label>
            <div className="relative">
              <select
                value={profissional}
                onChange={(e) => setProfissional(e.target.value)}
                className="clinical-input pr-8 font-semibold appearance-none"
              >
                <option value="Katiuscia">Katiuscia</option>
                <option value="Adelino">Adelino</option>
                <option value="Todos">Todos os profissionais</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3 Columns: Data, Horário de Início, Horário de Fim */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Data */}
            <div>
              <label className="clinical-label">
                Data
              </label>
              <div className="flex h-10 border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-forest-700 focus-within:ring-2 focus-within:ring-forest-700/10 transition-all">
                <input
                  type="text"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-3 text-xs bg-transparent font-medium text-slate-800 focus:outline-none"
                />
                <div className="px-2.5 bg-slate-50 border-l border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Horário de Início */}
            <div>
              <label className="clinical-label">
                Horário de Início
              </label>
              <div className="flex h-10 border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-forest-700 focus-within:ring-2 focus-within:ring-forest-700/10 transition-all">
                <input
                  type="text"
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                  className="w-full px-3 text-xs bg-transparent font-mono font-medium text-slate-800 focus:outline-none"
                />
                <div className="px-2.5 bg-slate-50 border-l border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Horário de Fim */}
            <div>
              <label className="clinical-label">
                Horário de Fim
              </label>
              <div className="flex h-10 border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-forest-700 focus-within:ring-2 focus-within:ring-forest-700/10 transition-all">
                <input
                  type="text"
                  value={horarioFim}
                  onChange={(e) => setHorarioFim(e.target.value)}
                  className="w-full px-3 text-xs bg-transparent font-mono font-medium text-slate-800 focus:outline-none"
                />
                <div className="px-2.5 bg-slate-50 border-l border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Motivo do bloqueio */}
          <div>
            <label className="clinical-label">
              Motivo do bloqueio
            </label>
            <textarea
              rows={3}
              placeholder="Ex.: reunião da equipe, compromisso externo..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10 focus:outline-none resize-y transition-all"
            />
          </div>

          {/* Informational Callout */}
          <div className="p-3 bg-forest-50/70 border border-forest-200/80 rounded-xl flex items-center space-x-2.5 text-xs text-forest-900 font-medium">
            <Lock className="w-4 h-4 text-forest-700 shrink-0" />
            <span>Este período ficará indisponível para novos agendamentos na grade.</span>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
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
              <Lock className="w-3.5 h-3.5" />
              <span>Criar bloqueio</span>
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
}

