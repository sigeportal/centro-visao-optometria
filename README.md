# 👁️ Centro Visão Optometria

> **Sistema Integrado de Gestão Clínica de Optometria**  
> Solução completa para atendimento clínico, gestão de pacientes, agenda de consultas, anamnese, prescrição de óculos e ficha clínica personalizada.

---

## 📌 Visão Geral

O **Centro Visão Optometria** é uma plataforma moderna desenvolvida para otimizar os processos operacionais e clínicos de clínicas de optometria. A solução combina um frontend web responsivo com um backend de alta performance em Delphi/Horse e persistência em banco de dados Firebird.

---

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **React** (Vite)
- **React Router DOM** (Navegação SPA)
- **Axios** (Integração com API REST)
- **Lucide React** (Ícones modernos)
- **CSS3 / Modular CSS** (Interface personalizada e responsiva)

### **Backend**
- **Delphi** com Framework **Horse**
- **Firebird SQL** (Persistência via FireDAC)
- **PortalORM** (Mapeamento Objeto-Relacional)
- **JWT** (Autenticação e Autorização)
- **Boss** (Gerenciador de Dependências Delphi)

---

## 📂 Estrutura do Repositório

```text
centro-visao-optometria/
├── frontend-clinica/         # Aplicação Web (React + Vite)
├── clinica-optometria-api/   # Backend REST API (Delphi + Horse)
├── DADOS/                    # Banco de dados Firebird (.FDB) e dados de inicialização
├── docs/                     # Especificações funcionais, modelos de impressão e planilhas
├── imagens/                  # Screenshots e mockups da interface do sistema
├── .agents/                  # Documentação e skills de automação do projeto
└── README.md                 # Documentação principal
```

---

## ✨ Funcionalidades Principais

- 📊 **Dashboard Operacional**: Indicadores diários, atalhos rápidos, próximas consultas, aniversariantes do mês e alertas.
- 👥 **Gestão de Pacientes**: Cadastro detalhado com prontuário eletrônico em abas (Dados Pessoais, Responsável Legal, Anamnese, Histórico Clínico, Financeiro e Documentos).
- 📅 **Agenda de Atendimentos**: Visualização por dia, semana e mês, filtros por optometrista/profissional, status do agendamento e lançamento financeiro.
- 🩺 **Consultas & Ficha Clínica**: Atendimento clínico dinâmico, anamnese, prescrição detalhada de óculos (Longe/Perto/Adição, Esférico, Cilíndrico, Eixo, DP) e configuração de seções customizáveis da ficha.
- 🖨️ **Impressão de Documentos**: Geração e impressão de receitas/prescrições e fichas de anamnese.

---

## 🚀 Como Executar o Projeto

### Pró-requisitos
- **Node.js** (v18+) e **npm**
- **Delphi 11+** (ou ambiente compatível para compilação da API Horse)
- **Firebird SQL Server** (v3.0+)

---

### 1. 💻 Executando o Frontend (`frontend-clinica`)

1. Acesse o diretório do frontend:
   ```bash
   cd frontend-clinica
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` baseado em `.env.example`:
   ```env
   VITE_API_URL=http://localhost:9000
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:5173`.

---

### 2. ⚙️ Executando o Backend (`clinica-optometria-api`)

1. Acesse o diretório da API:
   ```bash
   cd clinica-optometria-api
   ```

2. Restaure as dependências do Delphi via Boss (opcional se já possuir a pasta `modules`):
   ```bash
   boss install
   ```

3. Crie e configure o arquivo `.env` (com base em `env-example.txt`):
   ```env
   PORT=9000
   JWT_SECRET=sua-chave-secreta
   DB_HOST=127.0.0.1
   DB_PORT=3050
   DB_NAME=C:\dados\PRINCIPAL.FDB
   DB_USER=SYSDBA
   DB_PASS=masterkey
   ```

4. Abra o projeto `ClinicaOptometria.dpr` no Delphi e compile/execute a aplicação.  
   A API ficará escutando na porta configurada (ex: `http://localhost:9000`).

---

## 📄 Endpoints Principais da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Verificação de saúde da API |
| `POST` | `/v1/auth/login` | Autenticação do usuário e geração de Token JWT |
| `GET` | `/v1/pacientes` | Listagem e pesquisa de pacientes |
| `GET` | `/v1/agenda` | Listagem da agenda de atendimentos |
| `GET` | `/v1/consultas` | Consultas clínicas cadastradas |
| `GET` | `/v1/ficha-clinica/secoes` | Configuração das seções da ficha clínica |

---

## 🖼️ Telas do Sistema

> As capturas de tela das interfaces podem ser encontradas no diretório [`imagens/`](./imagens).

- **Dashboard**: [`imagens/1 - Dashboard.png`](./imagens/1%20-%20Dashboard.png)
- **Pacientes**: [`imagens/2.1 - Cadastro Pacientes.png`](./imagens/2.1%20-%20Cadastro%20Pacientes.png)
- **Prontuário do Paciente**: [`imagens/3.1 - Dados do Paciente.png`](./imagens/3.1%20-%20Dados%20do%20Paciente.png)
- **Agenda**: [`imagens/5.1 - Tela Agendamentos.png`](./imagens/5.1%20-%20Tela%20Agendamentos.png)

---

## 📜 Licença

Este projeto é de propriedade do **Centro Visão Optometria**. Todos os direitos reservados.
