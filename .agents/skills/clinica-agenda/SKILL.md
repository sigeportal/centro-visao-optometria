---
name: clinica-agenda
description: Implementar ou revisar agenda da clinica de optometria. Use quando a tarefa envolver tela de agendamentos, visoes mes/semana/dia/lista, filtros por profissional, novo agendamento, detalhes, status, fila de espera, conflito de horario ou lancamento de pagamento.
---

# Clinica Agenda

## Uso

Use junto da skill `clinica-optometria`. Leia `references/agenda.md` antes de editar codigo.

## Fluxo

1. Inspecionar `Agenda.Controller.pas`, `Agenda.Service.pas`, `UnitAgendamento.Model.pas`, `frontend-clinica/src/pages/Agenda/AgendaPage.jsx` e `src/api/agenda.js`.
2. Concentrar regras de conflito e status no service Delphi.
3. Manter modal de novo agendamento e modal de detalhes no frontend, com validacao visual.
4. Atualizar a grade/lista apos criar, alterar status ou cancelar.

## Rotas Esperadas

- `GET /v1/agenda?inicio=&fim=&profissional_id=&status=`
- `POST /v1/agenda`
- `GET /v1/agenda/:id`
- `PUT /v1/agenda/:id`
- `PATCH /v1/agenda/:id/status`
- `DELETE /v1/agenda/:id`
- `GET /v1/agenda/fila-espera`
- `POST /v1/agenda/:id/lancar-pagamento`

## Regras

- Campos obrigatorios: profissional, procedimento, paciente, data, hora inicio e hora fim.
- Hora fim deve ser maior que hora inicio.
- Impedir conflito de horario para o mesmo profissional.
- Status permitidos: agendada, confirmada, atendida, cancelada, faltou.
- Visao "Todos" consolida profissionais; filtros individuais mostram apenas um profissional.
- Botao WhatsApp deve usar contato do paciente quando disponivel.

## Validacao

Testar criacao, conflito de horario, alteracao de status, filtro por profissional e build do frontend.
