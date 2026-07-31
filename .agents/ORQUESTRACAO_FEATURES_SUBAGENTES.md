# Orquestracao das Features por Subagentes

## Papel do Agente Principal

Coordenar a execucao, manter consistencia entre dominios, revisar integracoes e evitar edicoes conflitantes. O agente principal deve fazer a integracao final, rodar verificacoes e ajustar contratos entre backend e frontend.

## Preparacao

1. Ler `.agents/INSTRUCOES_FEATURES_IMAGENS.md`.
2. Ler `.agents/skills/clinica-optometria/SKILL.md`.
3. Para cada frente, passar ao subagente a skill especifica e os arquivos/imagens do modulo.
4. Informar que ha outros agentes trabalhando no mesmo codebase e que nenhum agente deve reverter alteracoes alheias.

## Divisao Recomendada

### Subagente 1 - Ficha Clinica

Skill: `.agents/skills/clinica-ficha-clinica`

Responsabilidade:
- Backend e frontend de secoes configuraveis.
- Persistencia de ordem, ativo, exibicao em tela e exibicao em impressao.
- Aplicar configuracao nas telas clinicas quando o ponto de integracao ja existir.

Escopo de escrita preferencial:
- `clinica-optometria-api/Controllers/FichaClinica.Controller.pas`
- `clinica-optometria-api/services/FichaClinica.Service.pas`
- `clinica-optometria-api/Model/UnitFichaSecao.Model.pas`
- `frontend-clinica/src/api/fichaClinica.js`
- `frontend-clinica/src/pages/FichaClinica/FichaClinicaConfigPage.jsx`

### Subagente 2 - Pacientes

Skill: `.agents/skills/clinica-pacientes`

Responsabilidade:
- Cadastro, pesquisa, detalhe e abas do prontuario.
- Acoes rapidas para agendar, atender, editar e excluir.
- Contratos de paciente para anamneses, consultas, financeiro e documentos.

Escopo de escrita preferencial:
- `clinica-optometria-api/Controllers/Paciente.Controller.pas`
- `clinica-optometria-api/services/Paciente.Service.pas`
- `clinica-optometria-api/Model/UnitPaciente.Model.pas`
- `frontend-clinica/src/api/paciente.js`
- `frontend-clinica/src/pages/Pacientes/`

### Subagente 3 - Agenda

Skill: `.agents/skills/clinica-agenda`

Responsabilidade:
- Grade/lista de agenda, filtros por profissional, novo agendamento e detalhes.
- Validacao de conflito, status e lancamento de pagamento.

Escopo de escrita preferencial:
- `clinica-optometria-api/Controllers/Agenda.Controller.pas`
- `clinica-optometria-api/services/Agenda.Service.pas`
- `clinica-optometria-api/Model/UnitAgendamento.Model.pas`
- `frontend-clinica/src/api/agenda.js`
- `frontend-clinica/src/pages/Agenda/`

### Subagente 4 - Consultas

Skill: `.agents/skills/clinica-consultas`

Responsabilidade:
- Atendimento, anamnese, prescricao, documentos e impressoes.
- Vinculos paciente/consulta/documento/prescricao.

Escopo de escrita preferencial:
- `clinica-optometria-api/Controllers/Consulta.Controller.pas`
- `clinica-optometria-api/services/Consulta.Service.pas`
- `clinica-optometria-api/Model/UnitConsulta.Model.pas`
- `clinica-optometria-api/Model/UnitAnamnese.Model.pas`
- `clinica-optometria-api/Model/UnitPrescricao.Model.pas`
- `clinica-optometria-api/Model/UnitDocumentoConsulta.Model.pas`
- `frontend-clinica/src/api/consulta.js`
- `frontend-clinica/src/pages/Consultas/`

### Subagente 5 - Dashboard

Skill: `.agents/skills/clinica-dashboard`

Responsabilidade:
- Indicadores, proximas consultas, aniversariantes e consultas vencidas.
- Integrar dados reais dos modulos anteriores.

Escopo de escrita preferencial:
- `clinica-optometria-api/Controllers/Dashboard.Controller.pas`
- `clinica-optometria-api/services/Dashboard.Service.pas`
- `clinica-optometria-api/routes/App.Routes.pas`
- `frontend-clinica/src/api/dashboard.js`
- `frontend-clinica/src/pages/Dashboard/DashboardPage.jsx`

## Prompts Prontos

Use este formato para cada subagente:

```text
Use a skill <caminho-da-skill> e a skill .agents/skills/clinica-optometria para implementar <modulo>.
Voce nao esta sozinho no codebase; nao reverta edicoes de outros agentes e ajuste sua implementacao a mudancas existentes.
Seu escopo preferencial de escrita e: <arquivos/pastas>.
Antes de editar, leia as imagens e referencias citadas na skill.
Ao finalizar, informe arquivos alterados, rotas criadas/alteradas, validacoes executadas e pendencias.
```

## Ordem de Integracao

1. Integrar Ficha Clinica e Pacientes.
2. Integrar Agenda com Pacientes.
3. Integrar Consultas com Pacientes e Agenda.
4. Integrar Dashboard por ultimo.
5. Rodar `npm run build` em `frontend-clinica`.
6. Revisar rotas Delphi registradas em `App.Routes.pas`.
7. Fazer uma passagem visual comparando cada tela com `imagens/`.

## Checklist Final

- Todas as rotas frontend existem e nao caem em placeholder.
- Todas as APIs chamadas pelo frontend existem no backend.
- Respostas seguem `TResponseUtils`.
- CRUD PortalORM nao usa SQL manual desnecessario.
- Listagens e dashboards usam `TDatabase.Query`.
- Impressao de anamnese e prescricao segue PDFs em `docs/`.
- Fluxo completo funciona: paciente -> agenda -> consulta -> anamnese -> prescricao -> documentos -> dashboard.
