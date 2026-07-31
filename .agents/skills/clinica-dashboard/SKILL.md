---
name: clinica-dashboard
description: Implementar ou revisar o dashboard operacional da clinica de optometria. Use quando a tarefa envolver a tela inicial, indicadores, proximas consultas, aniversariantes, consultas vencidas, cards de resumo, atalhos para agenda/pacientes/consultas, ou APIs de metricas do dashboard.
---

# Clinica Dashboard

## Uso

Use junto da skill `clinica-optometria`. Leia `references/dashboard.md` antes de editar codigo.

## Fluxo

1. Inspecionar `frontend-clinica/src/pages/Dashboard/DashboardPage.jsx`, APIs em `frontend-clinica/src/api/` e rotas backend existentes.
2. Implementar primeiro o contrato backend em Delphi/Horse, usando `TResponseUtils`, JWT e `TDatabase.Query` para agregacoes.
3. Implementar a API frontend em Axios e atualizar a pagina sem criar landing page.
4. Validar estados: carregando, vazio, erro, dados reais e navegacao para as telas relacionadas.

## Contrato Esperado

- `GET /v1/dashboard/resumo`
- `GET /v1/dashboard/proximas-consultas`
- `GET /v1/dashboard/aniversariantes`
- `GET /v1/dashboard/consultas-vencidas`

Retornar sempre `{ "success": true, "data": ... }`.

## Regras

- Filtrar dados por clinica/CNPJ do JWT quando existir no payload.
- Contadores devem considerar timezone local configurado no backend.
- Proximas consultas devem ordenar por data/hora ascendente.
- Consultas vencidas sao agendamentos/consultas anteriores ao momento atual ainda nao atendidos/cancelados.
- Interface deve manter menu lateral, topo, cards compactos e listas operacionais.

## Validacao

Executar `npm run build` em `frontend-clinica` apos alterar frontend. Para backend, revisar compilacao Delphi e Swagger/rotas registradas quando ambiente Delphi estiver disponivel.
