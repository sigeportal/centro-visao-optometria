import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Landmark, 
  CreditCard 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters';

export default function VisaoGeralTab({
  fluxoTotals,
  transactions
}) {
  const [showReceitasChart, setShowReceitasChart] = useState(true);
  const [showDespesasChart, setShowDespesasChart] = useState(true);

  // Monthly Comparison Chart Data
  const monthlyData = [
    { mes: 'Mar', receitas: 14200, despesas: 5800, resultado: 8400 },
    { mes: 'Abr', receitas: 16800, despesas: 6400, resultado: 10400 },
    { mes: 'Mai', receitas: 18900, despesas: 7100, resultado: 11800 },
    { mes: 'Jun', receitas: 17500, despesas: 6900, resultado: 10600 },
    { mes: 'Jul', receitas: 21300, despesas: 7800, resultado: 13500 },
    { mes: 'Ago', receitas: 24500, despesas: 8200, resultado: 16300 }
  ];

  // Payment Methods Pie Data
  const formasPagamentoPieData = [
    { name: 'Pix', value: 48, color: '#17594D' },
    { name: 'Cartão Crédito', value: 28, color: '#0284C7' },
    { name: 'Cartão Débito', value: 14, color: '#D97706' },
    { name: 'Dinheiro', value: 10, color: '#64748B' }
  ];

  // Most used categories Pie Data
  const categoriasMaisUsadasData = [
    { name: 'Consultas', value: 55, color: '#062E22' },
    { name: 'Exames & Laudos', value: 25, color: '#1A6F5E' },
    { name: 'Lentes de Contato', value: 12, color: '#D97706' },
    { name: 'Outros', value: 8, color: '#94A3B8' }
  ];

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* 4 Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="clinical-panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Receitas Realizadas
            </span>
            <div className="w-8 h-8 bg-forest-50 text-forest-700 border border-forest-200/60 rounded-lg flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-forest-800 font-mono mt-3">
            {formatCurrency(fluxoTotals.receitasRealizadas)}
          </h3>
          <span className="text-[11px] text-forest-700 font-bold mt-1 block">
            +18% vs mês anterior
          </span>
        </div>

        <div className="clinical-panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Despesas Pagas
            </span>
            <div className="w-8 h-8 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-lg flex items-center justify-center font-bold">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-700 font-mono mt-3">
            {formatCurrency(fluxoTotals.despesasRealizadas)}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Controlado dentro da meta
          </span>
        </div>

        <div className="clinical-panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Resultado Líquido
            </span>
            <div className="w-8 h-8 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-3">
            {formatCurrency(fluxoTotals.totalPeriodo)}
          </h3>
          <span className="text-[11px] text-forest-700 font-bold mt-1 block">
            Margem operacional positiva
          </span>
        </div>

        <div className="clinical-panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Previsão a Receber
            </span>
            <div className="w-8 h-8 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-lg flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-600 font-mono mt-3">
            {formatCurrency(fluxoTotals.receitasAberto)}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            A liquidar nos próximos dias
          </span>
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="clinical-panel p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-900 text-sm tracking-tight">
              Evolução Financeira Mensal (Últimos 6 Meses)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Comparativo consolidado de faturamento bruto vs despesas operacionais.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowReceitasChart(!showReceitasChart)}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                showReceitasChart 
                  ? 'bg-forest-50 text-forest-800 border-forest-300' 
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              Receitas
            </button>
            <button
              type="button"
              onClick={() => setShowDespesasChart(!showDespesasChart)}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                showDespesasChart 
                  ? 'bg-rose-50 text-rose-800 border-rose-300' 
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              Despesas
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 'bold' }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11, fontFamily: 'monospace' }} stroke="#64748b" />
              <Tooltip 
                formatter={(val) => [formatCurrency(val), '']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '8px' }} />
              {showReceitasChart && <Bar dataKey="receitas" name="Receitas" fill="#17594D" radius={[4, 4, 0, 0]} />}
              {showDespesasChart && <Bar dataKey="despesas" name="Despesas" fill="#E11D48" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2 Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="clinical-panel p-5 space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 text-xs tracking-tight">
              Distribuição por Meio de Pagamento
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Participação percentual nas liquidações do mês.</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formasPagamentoPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {formasPagamentoPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Participação']} />
                <Legend 
                  align="center" 
                  verticalAlign="bottom" 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clinical-panel p-5 space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 text-xs tracking-tight">
              Categorias Mais Utilizadas
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Planos de contas mais recorrentes nos atendimentos.</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoriasMaisUsadasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoriasMaisUsadasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Participação']} />
                <Legend 
                  align="center" 
                  verticalAlign="bottom" 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}

