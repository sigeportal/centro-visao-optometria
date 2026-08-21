import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export default function RelatorioFinanceiroModal({
  isOpen,
  onClose,
  filters,
  filteredTransactions,
  fluxoTotals,
  onPrint
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative bg-white max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 border border-slate-200/90 rounded-2xl shadow-modal space-y-5 text-xs text-slate-900 my-auto font-sans print:shadow-none print:border-none print:max-w-full print:p-4 animate-fade-in">
        
        {/* Header do Relatório Formatado para Impressão */}
        <div className="flex items-center justify-between border-b-2 border-forest-800 pb-3.5">
          <div>
            <h2 className="text-lg font-bold uppercase text-slate-900 tracking-tight">
              Relatório Financeiro
            </h2>
            <p className="text-xs text-forest-800 font-bold mt-0.5">
              CENTRO VISÃO — Saúde Visual
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Período: {filters.periodo === 'hoje' ? 'Hoje' : filters.periodo === 'semana' ? 'Esta Semana' : filters.periodo === 'mes' ? 'Este Mês' : 'Geral'} • Emitido em: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="text-right print:hidden">
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabela Formatada para Impressão */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-900 text-[11px]">
                <th className="py-2.5 px-3 border-r border-slate-300">Data</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Descrição</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Forma de Pagamento</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center">Situação</th>
                <th className="py-2.5 px-3 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-mono text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-sans italic">
                    Nenhum registro encontrado no período.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 border-r border-slate-200">{t.date}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-sans font-medium text-slate-900">
                      {t.description}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-sans">{t.paymentMethod}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-sans">
                      {t.status}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {t.type === 'Receita' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumo Formatado do Relatório */}
        <div className="border border-slate-300 rounded-xl p-4 sm:p-5 bg-slate-50/70 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                RESUMO
              </span>
              <h4 className="font-bold text-slate-900 text-sm">
                Soma do período
              </h4>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                TOTAL DO PERÍODO
              </span>
              <span className="text-base font-bold font-mono text-forest-800">
                {formatCurrency(fluxoTotals.totalPeriodo)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1 text-xs">
            {/* Pendências */}
            <div className="space-y-1.5 border-r border-slate-200 pr-4">
              <span className="font-bold text-slate-700 uppercase text-[10px] block mb-1.5">
                PENDÊNCIAS
              </span>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Total a receber</span>
                <span className="font-bold font-mono text-amber-600">
                  {formatCurrency(fluxoTotals.receitasAberto)}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Total a pagar</span>
                <span className="font-bold font-mono text-rose-700">
                  {formatCurrency(fluxoTotals.despesasAberto)}
                </span>
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div className="space-y-1.5 border-r border-slate-200 pr-4">
              <span className="font-bold text-slate-700 uppercase text-[10px] block mb-1.5">
                FORMAS DE PAGAMENTO
              </span>
              {Object.keys(fluxoTotals.formasPagamentoMap || {}).length === 0 ? (
                <p className="text-slate-500 italic text-xs">Nenhum pagamento realizado no período.</p>
              ) : (
                Object.entries(fluxoTotals.formasPagamentoMap).map(([forma, valor]) => (
                  <div key={forma} className="flex justify-between py-0.5">
                    <span className="text-slate-700">{forma}</span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatCurrency(valor)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Movimentação */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 uppercase text-[10px] block mb-1.5">
                MOVIMENTAÇÃO
              </span>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Entrada (Receitas)</span>
                <span className="font-bold font-mono text-forest-800">
                  + {formatCurrency(fluxoTotals.receitasRealizadas)}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Saída (Despesas)</span>
                <span className="font-bold font-mono text-rose-700">
                  - {formatCurrency(fluxoTotals.despesasRealizadas)}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold">
                <span>Resultado</span>
                <span className="font-mono text-forest-800">
                  {formatCurrency(fluxoTotals.totalPeriodo)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações de Impressão */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 print:hidden">
          <button 
            type="button" 
            onClick={onClose}
            className="btn-secondary"
          >
            Voltar
          </button>
          <button 
            type="button" 
            onClick={onPrint}
            className="btn-primary"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Confirmar Impressão</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
