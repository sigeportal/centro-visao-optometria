import React from 'react';
import { Plus, Check, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export default function ContasPagarTab({
  transactions,
  onOpenDespesaModal,
  onUpdateTransactionStatus
}) {
  const contasPagar = transactions.filter(t => t.type === 'Despesa');
  const pendentes = contasPagar.filter(t => t.status === 'Em Aberto');
  const pagas = contasPagar.filter(t => t.status === 'Pago');

  const totalPendente = pendentes.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalPago = pagas.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="clinical-panel p-4 sm:p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Total a Pagar (Em Aberto)
          </span>
          <h3 className="text-2xl font-black text-rose-700 font-mono mt-1">
            {formatCurrency(totalPendente)}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
            {pendentes.length} contas pendentes de pagamento
          </span>
        </div>

        <div className="clinical-panel p-4 sm:p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Já Pago
          </span>
          <h3 className="text-2xl font-black text-slate-800 font-mono mt-1">
            {formatCurrency(totalPago)}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
            {pagas.length} contas liquidadas
          </span>
        </div>

        <div className="clinical-panel p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Ação Rápida
            </span>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Lance novas despesas operacionais ou fixas
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDespesaModal}
            className="btn-danger"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* Table of Payables */}
      <div className="clinical-panel overflow-x-auto shadow-hairline">
        <table className="clinical-table min-w-[750px]">
          <thead>
            <tr>
              <th className="py-3 px-5 text-left">Vencimento</th>
              <th className="py-3 px-4 text-left">Descrição da Despesa</th>
              <th className="py-3 px-3 text-left">Categoria</th>
              <th className="py-3 px-3 text-left">Forma Pagto</th>
              <th className="py-3 px-3 text-center">Situação</th>
              <th className="py-3 px-4 text-right">Valor</th>
              <th className="py-3 px-5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {contasPagar.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                  Nenhuma conta a pagar cadastrada.
                </td>
              </tr>
            ) : (
              contasPagar.map((t) => (
                <tr key={t.id} className="hover:bg-rose-50/20 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-medium text-slate-600">
                    {t.date}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {t.description}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">
                    {t.category}
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 font-medium">
                    {t.paymentMethod}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={t.status === 'Pago' ? 'badge-confirmed' : 'badge-waiting'}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-rose-700">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {t.status === 'Em Aberto' && (
                      <button
                        type="button"
                        onClick={() => onUpdateTransactionStatus(t.id, 'Pago')}
                        className="btn-danger py-1 px-2.5 text-xs ml-auto"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pagar</span>
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

