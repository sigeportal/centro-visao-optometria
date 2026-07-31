---
name: clinica-pacientes
description: Implementar ou revisar pacientes da clinica de optometria. Use quando a tarefa envolver cadastro, pesquisa, prontuario com abas, foto, dados pessoais, responsavel legal, historico clinico, financeiro, consultas ou documentos do paciente.
---

# Clinica Pacientes

## Uso

Use junto da skill `clinica-optometria`. Leia `references/pacientes.md` antes de editar codigo.

## Fluxo

1. Inspecionar models/controllers/services de paciente existentes antes de criar novos arquivos.
2. Evoluir o model PortalORM somente com campos necessarios, mantendo atributos `[TCampo]` nas propriedades.
3. Usar service para validacoes e controller apenas para HTTP/JSON.
4. No frontend, manter as rotas existentes de pacientes e ampliar paginas atuais em vez de duplicar telas.
5. Validar pesquisa, cadastro, edicao, detalhe em abas e acoes rapidas.

## Rotas Esperadas

- `GET /v1/pacientes?busca=&page=&limit=`
- `POST /v1/pacientes`
- `GET /v1/pacientes/:id`
- `PUT /v1/pacientes/:id`
- `DELETE /v1/pacientes/:id`
- `GET /v1/pacientes/:id/anamneses`
- `GET /v1/pacientes/:id/consultas`
- `GET /v1/pacientes/:id/documentos`
- `GET /v1/pacientes/:id/financeiro`

## Regras

- Pesquisa deve aceitar nome, CPF ou cidade.
- Cadastro deve validar nome e dados de contato/documentos quando informados.
- Exclusao deve pedir confirmacao no frontend e preferir inativacao se houver dependencias clinicas.
- Perfil deve ter abas: Informacoes pessoais, Anamnese, Financeiro, Consultas e Documentos.
- Acoes rapidas na listagem: agendar, atender, abrir perfil, editar e excluir.

## Validacao

Executar `npm run build` em `frontend-clinica` apos alterar frontend. Confirmar que endpoints continuam retornando o envelope padrao de resposta.
