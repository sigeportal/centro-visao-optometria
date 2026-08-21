import React from 'react';
import { Plus, Check, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export default function ContasReceberTab({
  transactions,
  onOpenReceitaModal,
  onUpdateTransactionStatus
}) {
  const contasReceber = transactions.filter(t => t.type === 'Receita');
  const pendentes = contasReceber.filter(t => t.status === 'Em Aberto');
  const recebidas = contasReceber.filter(t => t.status === 'Liquidado');

  const totalPendente = pendentes.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalRecebido = recebidas.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="clinical-panel p-4 sm:p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Total a Receber (Em Aberto)
          </span>
          <h3 className="text-2xl font-black text-amber-600 font-mono mt-1">
            {formatCurrency(totalPendente)}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
            {pendentes.length} títulos pendentes de liquidação
          </span>
        </div>

        <div className="clinical-panel p-4 sm:p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Já Recebido
          </span>
          <h3 className="text-2xl font-black text-forest-800 font-mono mt-1">
            {formatCurrency(totalRecebido)}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
            {recebidas.length} recebimentos confirmados
          </span>
        </div>

        <div className="clinical-panel p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Ação Rápida
            </span>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Lance novas receitas avulsas ou de consultas
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenReceitaModal}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Receita</span>
          </button>
        </div>
      </div>

      {/* Table of Receivables */}
      <div className="clinical-panel overflow-x-auto shadow-hairline">
        <table className="clinical-table min-w-[750px]">
          <thead>
            <tr>
              <th className="py-3 px-5 text-left">Vencimento</th>
              <th className="py-3 px-4 text-left">Paciente / Devedor</th>
              <th className="py-3 px-4 text-left">Descrição</th>
              <th className="py-3 px-3 text-left">Forma Pagto</th>
              <th className="py-3 px-3 text-center">Situação</th>
              <th className="py-3 px-4 text-right">Valor</th>
              <th className="py-3 px-5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {contasReceber.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                  Nenhuma conta a receber registrada.
                </td>
              </tr>
            ) : (
              contasReceber.map((t) => (
                <tr key={t.id} className="hover:bg-forest-50/20 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-medium text-slate-600">
                    {t.date}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {t.patientName || t.description}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {t.description}
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 font-medium">
                    {t.paymentMethod}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={t.status === 'Liquidado' ? 'badge-confirmed' : 'badge-waiting'}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-forest-800">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {t.status === 'Em Aberto' && (
                      <button
                        type="button"
                        onClick={() => onUpdateTransactionStatus(t.id, 'Liquidado')}
                        className="btn-primary py-1 px-2.5 text-xs ml-auto"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Receber</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

