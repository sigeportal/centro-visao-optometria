import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart as PieIcon 
} from 'lucide-react';
import { MOCK_PATIENTS } from '../../data/mockData';
import { INITIAL_TRANSACTIONS } from './data/mockFinanceiroData';

import FluxoDiarioTab from './components/FluxoDiarioTab';
import ContasReceberTab from './components/ContasReceberTab';
import ContasPagarTab from './components/ContasPagarTab';
import VisaoGeralTab from './components/VisaoGeralTab';
import NovaReceitaModal from './components/NovaReceitaModal';
import NovaDespesaModal from './components/NovaDespesaModal';
import RelatorioFinanceiroModal from './components/RelatorioFinanceiroModal';
import ToastNotification from '../Common/ToastNotification';

export default function FinanceiroView({ activeSubTab = 'fluxo', setActiveSubTab }) {
  // Tab state
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'fluxo');
  const selectedTab = setActiveSubTab ? activeSubTab : currentTab;

  const handleTabChange = (tab) => {
    if (setActiveSubTab) {
      setActiveSubTab(tab);
    } else {
      setCurrentTab(tab);
    }
  };

  // Toast
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToastMessage({ message: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Master Transactions State
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

  // Filters State
  const [filters, setFilters] = useState({
    periodo: 'todos',
    tipo: 'todos',
    profissional: 'todos',
    formaPagamento: 'todos',
    procedimento: 'todos',
    conta: 'todos',
    parceria: 'todas',
    situacao: 'todas',
    categoria: 'todas'
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [selectedItems, setSelectedItems] = useState([]);

  // Modals State
  const [isReceitaModalOpen, setIsReceitaModalOpen] = useState(false);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  // Form: Nova Receita
  const [receitaForm, setReceitaForm] = useState({
    patientName: MOCK_PATIENTS[0]?.name || 'Carlos Eduardo Silva',
    totalValue: '180.00',
    competenceDate: '2026-08-17',
    description: 'Recebimento de Carlos Eduardo Silva',
    category: 'Receitas de serviços',
    professional: 'Dra. Katiuscia Magalhaes',
    procedure: 'Consulta',
    partnership: 'Nenhuma Parceria',
    value: '180.00',
    paymentMethod: 'Pix',
    account: 'Clínica',
    dueDate: '2026-08-17',
    installments: 1,
    received: true,
    fileName: null
  });

  // Form: Nova Despesa
  const [despesaForm, setDespesaForm] = useState({
    description: '',
    value: '',
    competenceDate: '2026-08-17',
    category: 'Despesas Operacionais',
    isRecurring: false,
    paymentMethod: 'Pix',
    account: 'Clínica',
    dueDate: '2026-08-17',
    installments: 1,
    isPaid: true,
    fileName: null
  });

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Period filter
      if (filters.periodo === 'hoje' && t.rawDate !== '2026-08-17') return false;
      if (filters.periodo === 'semana' && !t.rawDate.startsWith('2026-08')) return false;
      if (filters.periodo === 'mes' && !t.rawDate.startsWith('2026-08')) return false;

      // Type filter
      if (filters.tipo !== 'todos' && t.type !== filters.tipo) return false;

      // Payment method
      if (filters.formaPagamento !== 'todos' && t.paymentMethod !== filters.formaPagamento) return false;

      // Status
      if (filters.situacao === 'Liquidado' && t.status !== 'Liquidado' && t.status !== 'Pago') return false;
      if (filters.situacao === 'Em Aberto' && t.status !== 'Em Aberto') return false;
      if (filters.situacao === 'Cancelado' && t.status !== 'Cancelado') return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesPatient = t.patientName?.toLowerCase().includes(q);
        const matchesCategory = t.category?.toLowerCase().includes(q);
        if (!matchesDesc && !matchesPatient && !matchesCategory) return false;
      }

      return true;
    });
  }, [transactions, filters, searchTerm]);

  // Financial Metrics & Totals
  const fluxoTotals = useMemo(() => {
    let receitasRealizadas = 0;
    let despesasRealizadas = 0;
    let receitasAberto = 0;
    let despesasAberto = 0;
    const formasPagamentoMap = {};

    filteredTransactions.forEach(t => {
      const val = Number(t.amount) || 0;
      if (t.type === 'Receita') {
        if (t.status === 'Liquidado' || t.status === 'Pago') {
          receitasRealizadas += val;
          formasPagamentoMap[t.paymentMethod] = (formasPagamentoMap[t.paymentMethod] || 0) + val;
        } else if (t.status === 'Em Aberto') {
          receitasAberto += val;
        }
      } else if (t.type === 'Despesa') {
        if (t.status === 'Pago' || t.status === 'Liquidado') {
          despesasRealizadas += val;
          formasPagamentoMap[t.paymentMethod] = (formasPagamentoMap[t.paymentMethod] || 0) + val;
        } else if (t.status === 'Em Aberto') {
          despesasAberto += val;
        }
      }
    });

    return {
      receitasRealizadas,
      despesasRealizadas,
      receitasAberto,
      despesasAberto,
      totalPeriodo: receitasRealizadas - despesasRealizadas,
      formasPagamentoMap
    };
  }, [filteredTransactions]);

  // Action Handlers
  const handleSaveReceita = (e) => {
    e.preventDefault();
    const val = parseFloat(receitaForm.totalValue || receitaForm.value) || 0;
    if (val <= 0) {
      showToast("Informe um valor válido para a receita.", "error");
      return;
    }

    const novaReceita = {
      id: `LAN-${Date.now()}`,
      date: receitaForm.competenceDate.split('-').reverse().join('/'),
      rawDate: receitaForm.competenceDate,
      type: "Receita",
      description: receitaForm.description || `Recebimento de ${receitaForm.patientName}`,
      patientName: receitaForm.patientName,
      category: receitaForm.category,
      professional: receitaForm.professional,
      procedure: receitaForm.procedure,
      partnership: receitaForm.partnership,
      paymentMethod: receitaForm.paymentMethod,
      account: receitaForm.account,
      status: receitaForm.received ? "Liquidado" : "Em Aberto",
      dueDateStatus: receitaForm.received ? 'recebido' : 'pendente',
      amount: val
    };

    setTransactions(prev => [novaReceita, ...prev]);
    setIsReceitaModalOpen(false);
    showToast("Receita cadastrada com sucesso!");
  };

  const handleSaveDespesa = (e) => {
    e.preventDefault();
    const val = parseFloat(despesaForm.value) || 0;
    if (val <= 0) {
      showToast("Informe um valor válido para a despesa.", "error");
      return;
    }

    const novaDespesa = {
      id: `LAN-${Date.now()}`,
      date: despesaForm.competenceDate.split('-').reverse().join('/'),
      rawDate: despesaForm.competenceDate,
      type: "Despesa",
      description: despesaForm.description,
      category: despesaForm.category,
      professional: "Todos",
      procedure: "Todos",
      partnership: "Nenhuma Parceria",
      paymentMethod: despesaForm.paymentMethod,
      account: despesaForm.account,
      status: despesaForm.isPaid ? "Pago" : "Em Aberto",
      dueDateStatus: despesaForm.isPaid ? 'pago' : 'pendente',
      amount: val
    };

    setTransactions(prev => [novaDespesa, ...prev]);
    setIsDespesaModalOpen(false);
    showToast("Despesa cadastrada com sucesso!");
  };

  const handleUpdateStatus = (id, newStatus) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    showToast(`Status atualizado para ${newStatus}.`);
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm("Deseja realmente excluir este lançamento financeiro?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast("Lançamento excluído.");
    }
  };

  const tabsConfig = [
    { id: 'fluxo', label: 'Fluxo Diário', icon: DollarSign },
    { id: 'receber', label: 'Contas a Receber', icon: ArrowUpRight },
    { id: 'pagar', label: 'Contas a Pagar', icon: ArrowDownRight },
    { id: 'visao', label: 'Visão Geral & DRE', icon: PieIcon }
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-12 text-xs">
      
      {/* Top Banner & Quick Actions */}
      <div className="clinical-panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-forest-800 block">
            Gestão Financeira & Caixa
          </span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Painel Financeiro
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Fluxo de caixa em tempo real, contas a pagar, a receber e relatórios analíticos da clínica.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsDespesaModalOpen(true)}
            className="btn-danger py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReceitaModalOpen(true)}
            className="btn-primary py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Receita</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="clinical-panel p-1 flex items-center space-x-1 overflow-x-auto">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-3.5 text-xs font-bold rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-forest-700 text-white shadow-hairline'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {selectedTab === 'fluxo' && (
        <FluxoDiarioTab
          transactions={transactions}
          filteredTransactions={filteredTransactions}
          fluxoTotals={fluxoTotals}
          filters={filters}
          setFilters={setFilters}
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          pageSize={pageSize}
          setPageSize={setPageSize}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          onOpenReceitaModal={() => setIsReceitaModalOpen(true)}
          onOpenDespesaModal={() => setIsDespesaModalOpen(true)}
          onOpenPrintReport={() => setIsPrintReportOpen(true)}
          onUpdateTransactionStatus={handleUpdateStatus}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {selectedTab === 'receber' && (
        <ContasReceberTab
          transactions={transactions}
          onOpenReceitaModal={() => setIsReceitaModalOpen(true)}
          onUpdateTransactionStatus={handleUpdateStatus}
        />
      )}

      {selectedTab === 'pagar' && (
        <ContasPagarTab
          transactions={transactions}
          onOpenDespesaModal={() => setIsDespesaModalOpen(true)}
          onUpdateTransactionStatus={handleUpdateStatus}
        />
      )}

      {selectedTab === 'visao' && (
        <VisaoGeralTab
          fluxoTotals={fluxoTotals}
          transactions={transactions}
        />
      )}

      {/* Modais */}
      <NovaReceitaModal
        isOpen={isReceitaModalOpen}
        onClose={() => setIsReceitaModalOpen(false)}
        formData={receitaForm}
        setFormData={setReceitaForm}
        onSubmit={handleSaveReceita}
        onFileAttached={(fileName) => {
          setReceitaForm(prev => ({ ...prev, fileName }));
          showToast(`Arquivo ${fileName} anexado.`);
        }}
      />

      <NovaDespesaModal
        isOpen={isDespesaModalOpen}
        onClose={() => setIsDespesaModalOpen(false)}
        formData={despesaForm}
        setFormData={setDespesaForm}
        onSubmit={handleSaveDespesa}
        onFileAttached={(fileName) => {
          setDespesaForm(prev => ({ ...prev, fileName }));
          showToast(`Arquivo ${fileName} anexado.`);
        }}
      />

      <RelatorioFinanceiroModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        filters={filters}
        filteredTransactions={filteredTransactions}
        fluxoTotals={fluxoTotals}
        onPrint={() => {
          window.print();
          showToast("Enviado para impressão.");
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <ToastNotification
          message={typeof toastMessage === 'string' ? toastMessage : toastMessage.message}
          type={typeof toastMessage === 'string' ? 'success' : (toastMessage.type || 'success')}
          onClose={() => setToastMessage(null)}
        />
      )}

    </div>
  );
}
