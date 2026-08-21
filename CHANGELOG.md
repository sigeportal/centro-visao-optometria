# Changelog

Todas as alterações relevantes do Centro Visão Optometria serão registradas
neste arquivo.

## [1.0.0] - 2026-08-21

Primeira versão estável do fluxo principal do sistema.

### Incluído

- Autenticação e autorização por perfis.
- Dashboard operacional.
- Cadastro e histórico de pacientes.
- Agenda, fila de espera e início de atendimento.
- Consultas, ficha clínica, anamneses e prescrições.
- Documentos clínicos e anexos por link.
- Configurações de clínica, funcionários, usuários, parcerias e procedimentos.
- Checklist e processo de acompanhamento de segurança e LGPD.
- Banco Firebird com dados exclusivamente fictícios para testes do protótipo.

### Fora do escopo desta versão

- Módulo Financeiro.
- Módulo de Relatórios.

### Observações

- O frontend oficial desta versão é `frontend-centro-visao/`.
- As cópias locais `frontend-centro-visao - agy/` e
  `frontend-centro-visao - Antigo/` não fazem parte da distribuição.
- As pendências de segurança e decisões temporárias estão documentadas em
  `docs/SEGURANCA.md`.
