---
name: clinica-consultas
description: Implementar ou revisar consultas clinicas de optometria. Use quando a tarefa envolver atendimento, detalhes da consulta, anamnese, prescricao de oculos, documentos vinculados, impressao de anamnese/prescricao, historico de consultas ou finalizacao de atendimento.
---

# Clinica Consultas

## Uso

Use junto da skill `clinica-optometria`. Leia `references/consultas.md` antes de editar codigo.

## Fluxo

1. Inspecionar controller/service/model de consulta, anamnese, prescricao e documentos existentes.
2. Modelar o fluxo paciente -> agendamento -> consulta -> anamnese -> prescricao -> documentos -> impressao.
3. Criar ou ajustar endpoints no backend antes de ligar componentes frontend.
4. Preservar impressao conforme `docs/impressao anamnese.pdf` e `docs/impressao prescrição.pdf`.
5. Validar rastreabilidade: data, usuario/profissional e vinculo com paciente/consulta.

## Rotas Esperadas

- `GET /v1/consultas`
- `POST /v1/consultas`
- `GET /v1/consultas/:id`
- `PUT /v1/consultas/:id`
- `POST /v1/consultas/:id/finalizar`
- `GET/POST /v1/consultas/:id/anamneses`
- `GET/PUT/DELETE /v1/anamneses/:id`
- `GET/POST /v1/consultas/:id/prescricoes`
- `GET/PUT/DELETE /v1/prescricoes/:id`
- `GET /v1/prescricoes/:id/impressao`
- `GET /v1/anamneses/:id/impressao`
- `GET/POST /v1/consultas/:id/documentos`

## Regras

- Anamnese deve suportar textos livres, checkboxes clinicos e observacoes.
- Prescricao de oculos deve suportar OD/OE: esferico, cilindrico, eixo, AV, prisma e DNP, alem de adicao, lente, retorno e observacoes.
- Documentos devem ficar vinculados a consulta e agrupados por paciente/data.
- Exclusoes exigem confirmacao no frontend.
- Impressao deve ser acessivel a partir da listagem de anamnese e prescricao.

## Validacao

Validar fluxo completo de atendimento, edicao, impressao e `npm run build` no frontend.
