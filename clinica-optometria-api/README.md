# clinica-optometria-api

API Delphi/Horse para Centro Visao Optometria com persistencia em Firebird (via FireDAC).

## Padrao adotado

- Controllers por dominio
- Services para regra de negocio
- Middleware JWT global
- Response utils padronizado
- Conexao centralizada de banco em `data/DB.Connection.pas`
- Conversao dataset para JSON em `utils/Dataset.JSON.Utils.pas`

## Variaveis de ambiente

- `PORT`
- `JWT_SECRET`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`

## Banco de dados

1. Crie o banco Firebird.
2. Configure as variaveis `DB_*` para o host/porta/arquivo reais.
3. Mantenha os models em `Model/Models.Clinica.pas` como fonte principal de estrutura (PortalORM-first).
4. As rotas de listagem atuais ja leem diretamente do banco:
	- `GET /v1/pacientes`
	- `GET /v1/agenda`
	- `GET /v1/consultas`
	- `GET /v1/ficha-clinica/secoes`

## Pontos de extensao imediata

- Adicionar rotas de CRUD completo
- Trocar payload JWT mock por validacao real
- Implementar endpoints de impressao em `reports/`
- Evoluir entidades PortalORM conforme novos modulos
