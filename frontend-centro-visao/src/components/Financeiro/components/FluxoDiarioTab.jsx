import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Printer, 
  MoreVertical, 
  Check, 
  Ban, 
  Trash2, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export default function FluxoDiarioTab({
  transactions,
  filteredTransactions,
  fluxoTotals,
  filters,
  setFilters,
  appliedFilters,
  setAppliedFilters,
  searchTerm,
  setSearchTerm,
  pageSize,
  setPageSize,
  selectedItems,
  setSelectedItems,
  onOpenReceitaModal,
  onOpenDespesaModal,
  onOpenPrintReport,
  onUpdateTransactionStatus,
  onDeleteTransaction
}) {
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(filteredTransactions.map(t => t.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleToggleItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* 3 Summary Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Entradas */}
        <div className="clinical-panel p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Entradas no Período
            </span>
            <h3 className="text-2xl font-black text-forest-800 font-mono mt-1">
              {formatCurrency(fluxoTotals.receitasRealizadas)}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              Recebimentos confirmados
            </span>
          </div>
          <div className="w-10 h-10 bg-forest-50 text-forest-700 border border-forest-200/60 rounded-xl flex items-center justify-center font-bold shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Saídas */}
        <div className="clinical-panel p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Saídas no Período
            </span>
            <h3 className="text-2xl font-black text-rose-700 font-mono mt-1">
              {formatCurrency(fluxoTotals.despesasRealizadas)}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              Despesas e contas liquidadas
            </span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-xl flex items-center justify-center font-bold shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        {/* Saldo / Resultado */}
        <div className="clinical-panel p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Saldo / Resultado
            </span>
            <h3 className={`text-2xl font-black font-mono mt-1 ${
              fluxoTotals.totalPeriodo >= 0 ? 'text-slate-900' : 'text-rose-700'
            }`}>
              {formatCurrency(fluxoTotals.totalPeriodo)}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              Fluxo líquido consolidado
            </span>
          </div>
          <div className="w-10 h-10 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar & Quick Actions */}
      <div className="clinical-panel p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-forest-700" />
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Filtros do Fluxo de Caixa
            </h4>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenPrintReport}
              className="btn-secondary py-1.5 px-3"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Relatório</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const clean = {
                  periodo: 'todos',
                  tipo: 'todos',
                  profissional: 'todos',
                  formaPagamento: 'todos',
                  procedimento: 'todos',
                  conta: 'todos',
                  parceria: 'todas',
                  situacao: 'todas',
                  categoria: 'todas'
                };
                setFilters(clean);
                setAppliedFilters(clean);
                setSearchTerm('');
              }}
              className="btn-secondary py-1.5 px-3"
              title="Limpar Filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Período */}
          <div>
            <label className="clinical-label">Período</label>
            <select
              value={filters.periodo}
              onChange={(e) => setFilters({ ...filters, periodo: e.target.value })}
              className="clinical-input h-9"
            >
              <option value="todos">Todos</option>
              <option value="hoje">Hoje (17/08/2026)</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mês (Agosto)</option>
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="clinical-label">Tipo</label>
            <select
              value={filters.tipo}
              onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
              className="clinical-input h-9"
            >
              <option value="todos">Todos</option>
              <option value="Receita">Receitas (+)</option>
              <option value="Despesa">Despesas (-)</option>
            </select>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="clinical-label">Forma de Pagamento</label>
            <select
              value={filters.formaPagamento}
              onChange={(e) => setFilters({ ...filters, formaPagamento: e.target.value })}
              className="clinical-input h-9"
            >
              <option value="todos">Todas</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão Débito">Cartão Débito</option>
              <option value="Cartão Crédito">Cartão Crédito</option>
              <option value="Boleto">Boleto</option>
              <option value="Transferência Bancária">Transferência Bancária</option>
            </select>
          </div>

          {/* Situação */}
          <div>
            <label className="clinical-label">Situação</label>
            <select
              value={filters.situacao}
              onChange={(e) => setFilters({ ...filters, situacao: e.target.value })}
              className="clinical-input h-9"
            >
              <option value="todas">Todas</option>
              <option value="Liquidado">Liquidado / Pago</option>
              <option value="Em Aberto">Em Aberto</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {/* Busca textual */}
          <div>
            <label className="clinical-label">Buscar</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Descrição, paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="clinical-input h-9 !pl-9 pr-3 placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="clinical-panel overflow-x-auto shadow-hairline">
        <table className="clinical-table min-w-[800px]">
          <thead>
            <tr>
              <th className="py-3 px-4 w-10 text-left">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length > 0 && selectedItems.length === filteredTransactions.length}
                  onChange={handleSelectAll}
                  className="accent-forest-700 w-3.5 h-3.5 rounded"
                />
              </th>
              <th className="py-3 px-3 text-left">Data</th>
              <th className="py-3 px-3 text-left">Tipo</th>
              <th className="py-3 px-4 text-left">Descrição</th>
              <th className="py-3 px-3 text-left">Categoria</th>
              <th className="py-3 px-3 text-left">Forma Pagto</th>
              <th className="py-3 px-3 text-left">Conta</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-4 text-right">Valor</th>
              <th className="py-3 px-3 text-center w-12">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-slate-400 font-medium">
                  Nenhum lançamento financeiro encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const isSelected = selectedItems.includes(t.id);
                const isReceita = t.type === 'Receita';
                const isLiquidado = t.status === 'Liquidado' || t.status === 'Pago';

                return (
                  <tr 
                    key={t.id}
                    className={`hover:bg-forest-50/20 transition-colors ${
                      isSelected ? 'bg-forest-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleItem(t.id)}
                        className="accent-forest-700 w-3.5 h-3.5 rounded"
                      />
                    </td>
                    <td className="py-3.5 px-3 font-mono font-medium text-slate-600">
                      {t.date}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                        isReceita 
                          ? 'bg-forest-50 text-forest-800 border-forest-200' 
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>
                        <span>{t.description}</span>
                        {t.professional && t.professional !== 'Todos' && (
                          <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                            Prof.: {t.professional}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                      {t.category}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 font-medium">
                      {t.paymentMethod}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                      {t.account}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={isLiquidado ? 'badge-confirmed' : t.status === 'Em Aberto' ? 'badge-waiting' : 'badge-neutral'}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                      <span className={isReceita ? 'text-forest-800' : 'text-rose-700'}>
                        {isReceita ? '+' : '-'} {formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center relative">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setOpenActionMenuId(openActionMenuId === t.id ? null : t.id)}
                          className="btn-secondary p-1.5"
                          title="Ações"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dropdown Menu */}
                      {openActionMenuId === t.id && (
                        <div className="absolute right-3 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-modal z-50 text-left divide-y divide-slate-100 animate-fade-in overflow-hidden">
                          {!isLiquidado && (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateTransactionStatus(t.id, isReceita ? 'Liquidado' : 'Pago');
                                setOpenActionMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-forest-700 hover:bg-forest-50 flex items-center space-x-1.5 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Marcar como Pago</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateTransactionStatus(t.id, 'Cancelado');
                              setOpenActionMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center space-x-1.5 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancelar Lançamento</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteTransaction(t.id);
                              setOpenActionMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

