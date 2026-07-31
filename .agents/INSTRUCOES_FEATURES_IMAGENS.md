# Instrucoes para Implementar as Features das Imagens

## Objetivo

Implementar no projeto Centro Visao Optometria as funcionalidades observadas em `imagens/`, usando backend Delphi/Horse + PortalORM + Firebird 2.5 e frontend React/Vite.

## Fontes Obrigatorias

- `imagens/1 - Dashboard.png`
- `imagens/2.1 - Cadastro Pacientes.png`
- `imagens/2.2 - Pesquisa de Pacientes.png`
- `imagens/3.1 - Dados do Paciente.png`
- `imagens/3.2 - Dados do Paciente Anamnese.png`
- `imagens/3.3 - Dados do Paciente Financeiro.png`
- `imagens/3.4 - Dados do Paciente Consultas.png`
- `imagens/3.5 - Dados do Paciente Documentos.png`
- `imagens/4.1 - Detalhes Consultas.png`
- `imagens/4.2 - Detalhes Anamnese.png`
- `imagens/4.3 - Detalhes Prescrição.png`
- `imagens/5.1 - Tela Agendamentos.png`
- `imagens/5.2 - Novo Agendamento.png`
- `imagens/5.3 - Detalhes Agendamento.png`
- `imagens/6 - Configurações Ficha Clinica.png`
- `docs/Ficha clinica S_endereço.xlsx`
- `docs/impressao anamnese.pdf`
- `docs/impressao prescrição.pdf`

## Skills Criadas

- `.agents/skills/clinica-dashboard`
- `.agents/skills/clinica-pacientes`
- `.agents/skills/clinica-agenda`
- `.agents/skills/clinica-consultas`
- `.agents/skills/clinica-ficha-clinica`

Sempre usar tambem `.agents/skills/clinica-optometria`, que contem os padroes gerais do projeto.

## Ordem Recomendada

1. Ficha clinica: garantir secoes configuraveis e base para telas/impressao.
2. Pacientes: cadastro, pesquisa e prontuario com abas.
3. Agenda: grade, novo agendamento, detalhe, status e pagamento.
4. Consultas: atendimento, anamnese, prescricoes, documentos e impressao.
5. Dashboard: indicadores e listas operacionais consumindo dados reais.

## Padroes Obrigatorios

- Backend: Delphi, Horse, PortalORM, Firebird 2.5, JWT, `TResponseUtils`.
- Models PortalORM: herdar de `TTabela`, usar `[TNomeTabela]` na classe e `[TCampo]` nas propriedades.
- CRUD de entidade: usar `SalvaNoBanco`, `BuscaDadosTabela` e `Apagar` quando aplicavel.
- Listagens e agregacoes: usar `TDatabase.Query`.
- Frontend: React/Vite, Axios em `src/api`, rotas em `App.jsx`, paginas existentes quando possivel.
- Nao criar landing page. A primeira tela autenticada deve continuar sendo o dashboard operacional.

## Definition of Done Geral

- Backend e frontend implementados para o modulo.
- Rotas registradas e protegidas por JWT quando necessario.
- Respostas no envelope padrao `{ success, data }` ou `{ success, error }`.
- Estados de carregamento, erro e vazio no frontend.
- Build do frontend com `npm run build`.
- Validacao manual do fluxo principal descrito na skill do modulo.
