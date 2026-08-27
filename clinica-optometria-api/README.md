# clinica-optometria-api

API Delphi/Horse para Centro Visao Optometria com persistencia em Firebird (via FireDAC e PortalORM).

## Padrao adotado

- Controllers por dominio em `Controllers/`
- Services para regra de negocio em `services/`
- Middleware JWT global em `middlewares/Auth.Middleware.pas`
- Utilitarios de resposta padronizada em `utils/Response.Utils.pas`
- Utilitarios de log em `utils/Logger.Utils.pas`
- Utilitarios de JWT em `security/JWT.Utils.pas`
- Conexao e constantes locais ao projeto em `database/` e `utils/UnitConstants.pas`
- Conversao dataset para JSON em `utils/Dataset.JSON.Utils.pas`

## Variaveis de ambiente

Configuradas via variaveis de sistema ou arquivo `.env` na raiz da API (ver `env-example.txt`):

| Variavel | Obrigatoria | Descricao |
|---|---|---|
| `PORT` | Nao (default: `9000`) | Porta HTTP do listener da API |
| `JWT_SECRET` | **Sim** | Chave secreta para assinatura e validacao de tokens JWT (minimo de 32 caracteres). Valores fracos ou de exemplo sao rejeitados na inicializacao. |
| `CAMINHO_BD` / `DB_NAME` | **Sim** | Caminho ou nome do banco de dados Firebird |
| `DB_HOST` | Nao (default: `127.0.0.1`) | Host do Firebird |
| `DB_PORT` | Nao (default: `3050`) | Porta do Firebird |
| `DB_USER` | Nao (default: `SYSDBA`) | Usuario do banco de dados |
| `DB_PASS` | Nao | Senha do banco de dados |

### Inicializacao e Seguranca (SEC-01)

A API executa validacao obrigatoria de configuracao no bootstrap (`TConstants.ValidarConfiguracaoObrigatoria`) antes de abrir o listener HTTP. Se `JWT_SECRET` estiver ausente, possuir menos de 32 caracteres ou contiver valores de exemplo/fracos conhecidos, o processo aborta a inicializacao de forma segura (`EConfiguracaoInvalida`), registrando o erro fatal no log.

## Banco de dados

1. Crie o banco Firebird (ou aponte para a base de dados).
2. Configure as variaveis `DB_*` / `CAMINHO_BD` para os valores reais.
3. Mantenha os models em `Model/` como fonte principal de estrutura (PortalORM-first).
4. Principais rotas:
	- `POST /v1/auth/login` (login e geracao de token JWT)
	- `GET /v1/auth/me` (sessao do usuario logado)
	- `GET /v1/pacientes`
	- `GET /v1/agenda`
	- `GET /v1/consultas`
	- `GET /v1/ficha-clinica/secoes`
