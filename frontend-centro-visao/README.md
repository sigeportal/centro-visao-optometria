# 👁️ Centro Visão — Sistema Clínico Especializado

<div align="center">

![React](https://img.shields.io/badge/React-18-blue.svg?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg?style=flat-square&logo=tailwind-css)
![Lucide Icons](https://img.shields.io/badge/Icons-Lucide-F97316.svg?style=flat-square)

**Sistema completo de gestão clínica, prontuário eletrônico e fluxo financeiro para clínicas e consultórios de Optometria e Oftalmologia.**

</div>

---

## 📌 Visão Geral

O **Centro Visão** é uma plataforma web moderna desenvolvida para otimizar o fluxo de atendimento em clínicas optométricas, desde o agendamento e recepção até a avaliação refrativa minuciosa, emissão de laudos, prescrições e gestão financeira.

Projetado com interface limpa, de alta legibilidade, responsiva e com foco em alta produtividade para médicos, optometristas e recepcionistas.

---

## 🚀 Principais Funcionalidades

### 1. 📊 Painel Principal (Dashboard)
- Indicadores chave de desempenho (KPIs) de atendimentos, pacientes e faturamento.
- Alertas dinâmicos de **aniversariantes do dia** e **exames com vencimento próximo**.
- Acesso rápido a novos agendamentos e cadastros de pacientes.

### 2. 📅 Agenda Inteligente e Flexível
- **Linha do tempo contínua** para a semana inteira (Segunda a Sábado, das 07:00 às 19:00).
- **Ajuste de duração interativo**: arraste a borda inferior do card do paciente para alterar o tempo em incrementos de **5 em 5 minutos**.
- Movimentação livre de agendamentos e visualização completa de dados sem quebras de texto.
- Intervalos na régua lateral com divisões de 30 minutos e espaçamento com margem de respiro superior/inferior.

### 3. ⏳ Fila de Espera em Tempo Real
- Controle de chegada de pacientes na recepção.
- Cronômetro visual do tempo de espera em minutos.
- Identificação rápida de **Parceria** (ex: *Ótica Visão Real*, *Particular*) e **Status de Pagamento** (*Pago via Pix*, *A Receber na Saída*, *Isento*).
- Chamada direta para o módulo de atendimento (*"Atender"*).

### 4. 👥 Gestão de Pacientes & Prontuários
- Cadastro detalhado com dados pessoais, CPF, endereço, ocupação e origem/parceria.
- Histórico clínico consolidado com todas as consultas, diagnósticos e anexos anteriores.
- Acesso instantâneo à linha do tempo de prescrições e exames.

### 5. 🩺 Módulo de Consultas & Ficha Clínica
- **Fluxo Clínico Completo**:
  - Anamnese detalhada e queixa principal.
  - Acuidade Visual (Sem Correção, Com Correção e Perto).
  - Avaliação Motora com **Diagrama em H das Versões Oculares** para Olho Direito (OD) e Olho Esquerdo (OE).
  - Retinoscopia Dinâmica e Estática.
  - Afinamento, Flexibilidade e Amplitude de Acomodação.
  - Ceratometria, Tonometria, Biomicroscopia e Oftalmoscopia.
  - Diagnóstico e conduta clínica.
- **Prescrição de Óculos & Lentes de Contato**:
  - Geração de receitas com parâmetros esféricos, cilíndricos, eixo, adição, DNP e tipo de lente.
- **Editor de Documentos**:
  - Emissão e impressão de Atestados de Comparecimento, Laudos Optométricos e Declarações.

### 6. ⚙️ Personalização da Ficha Clínica (Configurações)
- **Ativação / Desativação via Toggle Switch**: controle quais dos 22 blocos clínicos estarão visíveis no atendimento.
- **Reordenação Drag-and-Drop**: arraste e solte as seções clínicas na ordem desejada pelo profissional.
- Sincronização em tempo real e persistência local.

### 7. 🤝 Gestão de Parcerias
- Cadastro de óticas, laboratórios e parceiros conveniados.
- Modal dedicado em tela cheia com dados completos (Razão social, CNPJ, telefone, e-mail, responsável, endereço, cidade e estado).
- Controle de status ativo/inativo.

### 8. 💰 Módulo Financeiro Consolidado
- **Fluxo de Caixa Diário**: controle de entradas e saídas por forma de pagamento (PIX, Cartão, Dinheiro, Transferência).
- **Contas a Receber & Contas a Pagar**: acompanhamento de vencimentos, liquidados e pendências.
- **Visão Geral & Gráficos**: evolução mensal e serviços mais realizados.
- Modais em tela cheia para lançamento de novas receitas e despesas.

### 9. 📈 Relatórios & Métricas
- Relatórios analíticos de desempenho clínico, conversão de parcerias e faturamento.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) + CSS puro para componentes clínicos especializados
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Renderização de Modais**: React Portals (`createPortal`) para sobreposição de tela cheia
- **Arquitetura de Estado**: Hooks React (`useState`, `useEffect`, `useMemo`) com sincronização customizada de eventos

---

## 📦 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- Gerenciador de pacotes `npm` ou `yarn`

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Nann-spec/frontend-centro-visao.git
   cd frontend-centro-visao
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:5173
   ```

5. **Para gerar a build de produção:**
   ```bash
   npm run build
   ```

---

## 📂 Estrutura de Pastas

```
frontend-optovision/
├── src/
│   ├── components/
│   │   ├── Agenda/          # Visualização da agenda contínua e fila de espera
│   │   ├── Atendimento/     # Ficha clínica, diagramas motores e workspace de consulta
│   │   ├── Configuracoes/   # Personalização de ficha, parcerias e dados da clínica
│   │   ├── Dashboard/       # Métricas principais e cards de alerta
│   │   ├── Financeiro/      # Fluxo diário, contas a pagar/receber e visão geral
│   │   ├── Layout/          # Header, Sidebar retrátil e Breadcrumb
│   │   ├── Pacientes/       # Lista de pacientes, modal de cadastro e histórico
│   │   └── Relatorios/      # Relatórios operacionais
│   ├── data/
│   │   ├── clinicalSectionsConfig.js # Configuração reordenável das seções clínicas
│   │   └── mockData.js               # Mock datasets completos de pacientes e consultas
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```
