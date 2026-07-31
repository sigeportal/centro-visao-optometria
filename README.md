# Centro Visao Optometria

Implementacao inicial baseada na skill do projeto, com:

- Backend Delphi/Horse em `clinica-optometria-api/`
- Frontend React/Vite em `frontend-clinica/`
- Referencias funcionais em `imagens/`
- Modelos de impressao em `docs/`

## Estrutura

- `clinica-optometria-api/`: esqueleto da API por dominios (controllers, services, middleware JWT, padrao de resposta)
- `frontend-clinica/`: MVP navegavel com dashboard, pacientes, agenda, consultas e ficha clinica

## Frontend - executar

1. Entre na pasta `frontend-clinica/`
2. Rode `npm install`
3. Rode `npm run dev`

Opcional: criar `.env` em `frontend-clinica/` com:

```
VITE_API_URL=http://localhost:9000
```

## Backend - status

O backend foi estruturado em Delphi/Horse e agora ja usa persistencia real com Firebird (FireDAC) nas rotas de listagem.

Rotas ja criadas:

- `GET /health`
- `POST /v1/auth/login`
- `GET /v1/pacientes`
- `GET /v1/agenda`
- `GET /v1/consultas`
- `GET /v1/ficha-clinica/secoes`

### Preparar banco Firebird

1. Criar database no Firebird.
2. Configurar variaveis de ambiente usando `clinica-optometria-api/env-example.txt`.
3. Garantir que os models PortalORM estejam atualizados (eles sao a fonte principal da estrutura).

## Proximas implementacoes recomendadas

- Evoluir models PortalORM conforme novos modulos de negocio
- Regras completas de anamnese e prescricao conforme docs
- Fluxo financeiro integrado ao status de agendamento
- Impressao PDF de anamnese e prescricao
- Upload e consulta de documentos por consulta
