/**
 * Financial mock data and initial configuration constants
 */

export const INITIAL_TRANSACTIONS = [
  {
    id: "LAN-101",
    date: "17/08/2026",
    rawDate: "2026-08-17",
    type: "Receita",
    description: "Recebimento de Carlos Eduardo Silva",
    patientName: "Carlos Eduardo Silva",
    category: "Receitas de serviços",
    professional: "Dra. Katiuscia Magalhaes",
    procedure: "Consulta",
    partnership: "Nenhuma Parceria",
    paymentMethod: "Pix",
    account: "Clínica",
    status: "Liquidado",
    dueDateStatus: 'recebido',
    amount: 180.00
  },
  {
    id: "LAN-102",
    date: "17/08/2026",
    rawDate: "2026-08-17",
    type: "Receita",
    description: "Recebimento de Maria Aparecida Santos",
    patientName: "Maria Aparecida Santos",
    category: "Receitas de serviços",
    professional: "Dra. Katiuscia Magalhaes",
    procedure: "Consulta",
    partnership: "Ótica Visão Nobre",
    paymentMethod: "Cartão Crédito",
    account: "Clínica",
    status: "Liquidado",
    dueDateStatus: 'recebido',
    amount: 220.00
  },
  {
    id: "LAN-103",
    date: "17/08/2026",
    rawDate: "2026-08-17",
    type: "Despesa",
    description: "Compra de Materiais e Colírios de Exame",
    category: "Materiais & Insumos Ópticos",
    professional: "Dra. Katiuscia Magalhaes",
    procedure: "Todos",
    partnership: "Nenhuma Parceria",
    paymentMethod: "Pix",
    account: "Clínica",
    status: "Pago",
    dueDateStatus: 'pago',
    amount: 145.00
  },
  {
    id: "LAN-104",
    date: "16/08/2026",
    rawDate: "2026-08-16",
    type: "Receita",
    description: "Recebimento de João Pedro Alcantara",
    patientName: "João Pedro Alcantara",
    category: "Receitas de serviços",
    professional: "Dr. Adelino Souza",
    procedure: "Consulta",
    partnership: "Convênio Sindicato",
    paymentMethod: "Dinheiro",
    account: "Conta Caixa / Balcão",
    status: "Liquidado",
    dueDateStatus: 'recebido',
    amount: 180.00
  },
  {
    id: "LAN-105",
    date: "15/08/2026",
    rawDate: "2026-08-15",
    type: "Despesa",
    description: "Aluguel da Sala Comercial - Agosto",
    category: "Aluguel & Condomínio",
    professional: "Todos",
    procedure: "Todos",
    partnership: "Nenhuma Parceria",
    paymentMethod: "Transferência Bancária",
    account: "Banco Santander - Centro Visão",
    status: "Pago",
    dueDateStatus: 'pago',
    amount: 1200.00
  },
  {
    id: "LAN-106",
    date: "18/08/2026",
    rawDate: "2026-08-18",
    type: "Receita",
    description: "Recebimento a prazo - Ana Beatriz Lima",
    patientName: "Ana Beatriz Lima",
    category: "Receitas de serviços",
    professional: "Dra. Katiuscia Magalhaes",
    procedure: "Consulta Completa + Tonometria",
    partnership: "Nenhuma Parceria",
    paymentMethod: "Boleto",
    account: "Clínica",
    status: "Em Aberto",
    dueDateStatus: 'pendente',
    amount: 250.00
  },
  {
    id: "LAN-107",
    date: "19/08/2026",
    rawDate: "2026-08-19",
    type: "Despesa",
    description: "Manutenção do Refrator de Greens",
    category: "Manutenção de Equipamentos",
    professional: "Todos",
    procedure: "Todos",
    partnership: "Nenhuma Parceria",
    paymentMethod: "Pix",
    account: "Clínica",
    status: "Em Aberto",
    dueDateStatus: 'pendente',
    amount: 380.00
  }
];

export const FORMAS_PAGAMENTO = [
  "Pix",
  "Dinheiro",
  "Cartão Débito",
  "Cartão Crédito",
  "Boleto",
  "Transferência Bancária"
];

export const CONTAS_BANCARIAS = [
  "Clínica",
  "Conta Caixa / Balcão",
  "Banco Santander - Centro Visão"
];

export const CATEGORIAS_RECEITA = [
  "Receitas de serviços",
  "Consultas Optométricas",
  "Venda de Lentes de Contato",
  "Exames Complementares",
  "Outras Receitas"
];

export const CATEGORIAS_DESPESA = [
  "Despesas Operacionais",
  "Aluguel & Condomínio",
  "Materiais & Insumos Ópticos",
  "Manutenção de Equipamentos",
  "Energia, Água & Internet",
  "Salários & Pró-labore",
  "Impostos & Taxas",
  "Outras Despesas"
];
