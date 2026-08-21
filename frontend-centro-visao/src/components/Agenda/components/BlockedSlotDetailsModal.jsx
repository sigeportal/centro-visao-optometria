import React from 'react';
import { createPortal } from 'react-dom';
import { Lock, X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { formatDate } from '../../../utils/formatters';

export default function BlockedSlotDetailsModal({
  blockedSlot,
  onClose,
  onRemove
}) {
  if (!blockedSlot) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl border border-slate-200/90 w-full max-w-md shadow-modal my-auto animate-fade-in text-xs overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white p-4 sm:p-5 flex items-center justify-between border-b border-forest-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center text-amber-400 font-bold shadow-hairline">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">Horário Bloqueado</h3>
              <p className="text-[11px] text-forest-200/80">Informações da indisponibilidade de agenda</p>
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

        {/* Body Info */}
        <div className="p-5 sm:p-6 space-y-3">
          {/* Data & Período */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</span>
              <div className="flex items-center space-x-1.5 mt-1 font-bold text-slate-900">
                <CalendarIcon className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                <span>{formatDate(blockedSlot.date)}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Período</span>
              <div className="flex items-center space-x-1.5 mt-1 font-mono font-bold text-slate-900">
                <Clock className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                <span>{blockedSlot.startTime} às {blockedSlot.endTime}</span>
              </div>
            </div>
          </div>

          {/* Profissional */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profissional</span>
            <span className="block font-bold text-slate-900 text-xs mt-0.5">
              {blockedSlot.doctor === 'Todos' ? 'Todos os Profissionais' : blockedSlot.doctor}
            </span>
          </div>

          {/* Motivo do Bloqueio */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motivo do Bloqueio</span>
            <p className="text-slate-700 font-medium text-xs mt-0.5 leading-relaxed">
              {blockedSlot.motivo || 'Nenhum motivo específico informado.'}
            </p>
          </div>

          {/* Informational Callout */}
          <div className="p-3 bg-forest-50/70 border border-forest-200/80 rounded-xl flex items-center space-x-2 text-forest-900 text-xs font-medium">
            <Lock className="w-4 h-4 text-forest-700 shrink-0" />
            <span>Este período está bloqueado para novos agendamentos nesta data.</span>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onRemove}
            className="btn-danger text-xs py-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Desbloquear</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

