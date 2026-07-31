---
name: clinica-ficha-clinica
description: Implementar ou revisar configuracao dinamica da ficha clinica. Use quando a tarefa envolver secoes da ficha, ativar/desativar blocos, ordenar por drag and drop, exibir na tela, exibir na impressao ou aplicar a configuracao em consultas.
---

# Clinica Ficha Clinica

## Uso

Use junto da skill `clinica-optometria`. Leia `references/ficha-clinica.md` antes de editar codigo.

## Fluxo

1. Inspecionar `FichaClinica.Controller.pas`, `FichaClinica.Service.pas`, `UnitFichaSecao.Model.pas`, `src/pages/FichaClinica/FichaClinicaConfigPage.jsx` e `src/api/fichaClinica.js`.
2. Garantir que a configuracao seja persistida no Firebird via PortalORM.
3. Implementar ou manter toggles e ordenacao na tela de configuracao.
4. Aplicar somente secoes ativas, na ordem persistida, nas telas de consulta e impressao.

## Rotas Esperadas

- `GET /v1/ficha-clinica/secoes`
- `PUT /v1/ficha-clinica/secoes/ordem`
- `PATCH /v1/ficha-clinica/secoes/:id/ativo`
- `PATCH /v1/ficha-clinica/secoes/:id/exibicao`

## Secoes Iniciais

Anamnese, Prescricao do Ultimo Exame, Acuidade Visual, Biomicroscopia, Ceratometria, Tonometria, Forometria, Oftalmoscopia, Retinoscopia Dinamica, Retinoscopia Estatica, Avaliacao Motora, RX Final, Amplitude de Acomodacao, Afinamento e DX.

## Regras

- `FSC_CHAVE` deve ser unica.
- Ordem nao pode repetir.
- Apenas secoes ativas aparecem na ficha.
- `exibe_tela` e `exibe_impressao` controlam destinos diferentes.
- Mudanca deve refletir imediatamente no frontend apos salvar.

## Validacao

Testar toggles, reordenacao, persistencia apos recarregar e build do frontend.
