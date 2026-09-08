# Guia de Configuração e Inicialização do Banco de Dados (Firebird)

Este documento descreve como preparar, configurar, inicializar e manter o banco de dados Firebird para o sistema **Centro Visão Optometria**, garantindo conformidade com as diretrizes de segurança (SEC-03 e LGPD).

---

## 1. Visão Geral

O sistema utiliza o SGBD **Firebird** (versão 2.5 ou 3.0+) como repositório relacional. A camada de persistência no backend Delphi/Horse é provida pelo **PortalORM** e **FireDAC**, implementando um modelo *Code-First/Model-First*:
- A API é capaz de validar a estrutura do esquema e criar tabelas automaticamente durante a inicialização.
- Nenhuma base de dados binária (`.FDB`, `.FBK`, `.GDB`) ou arquivo compactado (`.ZIP`, `.RAR`) contendo dados reais ou operacionais deve ser versionada no repositório Git.

---

## 2. Variáveis de Ambiente e Conexão

A API obtém os parâmetros de conexão ao banco de dados prioritariamente através de variáveis de ambiente ou por meio do arquivo `.env` localizado na raiz do diretório `clinica-optometria-api/`.

### 2.1. Lista de Parâmetros

| Variável | Obrigatória | Padrão | Descrição | Exemplo |
|---|---|---|---|---|
| `CAMINHO_BD` / `DB_NAME` | **Sim** | — | Caminho absoluto do arquivo `.FDB` no servidor Firebird | `C:\dados\clinica_optometria.fdb` ou `127.0.0.1:C:\dados\clinica_optometria.fdb` |
| `DB_HOST` | Não | `127.0.0.1` | Endereço de IP ou hostname do servidor Firebird | `127.0.0.1` ou `localhost` |
| `DB_PORT` | Não | `3050` | Porta TCP do serviço Firebird | `3050` |
| `DB_USER` | Não | `SYSDBA` | Usuário do banco de dados | `SYSDBA` |
| `DB_PASS` | Não | `masterkey` | Senha do banco de dados | `masterkey` |

> [!IMPORTANT]
> Em ambientes de homologação e produção, altere a senha padrão do usuário do banco Firebird e nunca utilize credenciais padrão de fábrica.

### 2.2. Exemplo de Arquivo `.env`

Crie o arquivo `clinica-optometria-api/.env` com a seguinte estrutura:

```dotenv
PORT=9000
JWT_SECRET=CHAVE-SECRETA-MUITO-FORTE-COM-MAIS-DE-32-CARACTERES-AQUI
CAMINHO_BD=C:\dados\clinica_optometria.fdb
DB_HOST=127.0.0.1
DB_PORT=3050
DB_USER=SYSDBA
DB_PASS=masterkey
```

---

## 3. Criação do Banco de Dados e Esquema de Tabelas

### 3.1. Criação do Arquivo de Banco de Dados (.FDB)

Para criar um novo banco vazio no Firebird, utilize a ferramenta `isql` (ou um gerenciador visual como FlameRobin / DBeaver / IBExpert):

```sql
CREATE DATABASE 'C:\dados\clinica_optometria.fdb'
USER 'SYSDBA' PASSWORD 'masterkey'
PAGE_SIZE 8192
DEFAULT CHARACTER SET UTF8;
```

### 3.2. Criação Automática de Tabelas (PortalORM)

A API do Centro Visão Optometria adota auto-provisionamento de esquema através do método `CriaTabela` de cada Model/Service durante o bootstrap em `TAppRoutes.Routes`:

1. Ao iniciar, a API executa `TAppRoutes.Routes`, que invoca:
   - `TAutorizacaoService.Inicializar`: Garante a existência da tabela `USUARIO_PERFIL` e verifica/adiciona o campo `USU_ATIVO` na tabela `USUARIOS`.
   - `TFuncionarioService.Inicializar`: Verifica e adiciona campos complementares (ex: `FUN_ATENDE` em `FUNCIONARIOS`).
   - `TParceriaService.Inicializar`: Garante a criação da tabela `PARCERIAS` via `TModelParceria.CriaTabela`.
   - `TProcedimentoService.Inicializar`: Cria a tabela `PROCEDIMENTOS` via `TModelProcedimento.CriaTabela`.
   - `TFichaClinicaService.Inicializar`: Cria tabelas de seções e modelos de ficha clínica.
   - `TFichaClinicaDadosService.Inicializar`: Cria tabelas dinâmicas de campos clínicos.
   - `TConfiguracaoClinicaService.Inicializar`: Cria tabela de parametrizações da clínica.
2. Com isso, ao conectar a API a um banco Firebird recém-criado, todas as tabelas necessárias são construídas automaticamente pelo PortalORM sem necessidade de executar scripts DDL manuais.

---

## 4. Carga de Dados Sintéticos e Usuário Administrador (Seed)

Para novos ambientes (desenvolvimento, testes locais ou homologação), o acesso administrativo inicial segue a seguinte regra:

1. **Tabela de Usuários**: Deve possuir um registro de usuário administrador (`admin`).
2. **Vinculação de Perfil**: O método `TAutorizacaoService.Inicializar` localiza o usuário de login `ADMIN` e vincula automaticamente o perfil `admin` na tabela `USUARIO_PERFIL` se este ainda não possuir perfil associado.
3. **Criação de Usuário Admin Inicial (se necessário via SQL)**:
   Caso o banco esteja completamente limpo e sem nenhum usuário cadastrado na tabela `USUARIOS`, crie o registro inicial via script SQL com dados sintéticos:

```sql
-- Inserir funcionário sintético para o admin (se aplicável)
INSERT INTO FUNCIONARIOS (FUN_CODIGO, FUN_NOME, FUN_CATEGORIA, FUN_ATENDE, FUN_ESTADO)
VALUES (1, 'Administrador do Sistema', 'ADMINISTRATIVO', 0, 'ATIVO');

-- Inserir usuário admin inicial com hash SHA-256 da senha 'admin123'
-- Hash SHA-256('admin123') = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
INSERT INTO USUARIOS (USU_CODIGO, USU_LOGIN, USU_SENHA, USU_FUN, USU_ATIVO)
VALUES (1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1, 1);

-- Inserir perfil admin
INSERT INTO USUARIO_PERFIL (UPR_USUARIO_ID, UPR_PERFIL, UPR_ATIVO)
VALUES (1, 'admin', 1);

COMMIT;
```

> [!CAUTION]
> A senha inicial padrão deve ser obrigatoriamente alterada no primeiro login através do módulo de gerenciamento de usuários do sistema.

---

## 5. Política de Segurança e Backups (SEC-03 e LGPD)

### 5.1. Proibição Estrita no Git

- **Arquivos Binários de Banco**: Extensões `*.fdb`, `*.FDB`, `*.gdb`, `*.GDB`, `*.fbk`, `*.FBK`, `*.zip`, `*.ZIP` estão declaradas no `.gitignore` e **nunca** devem ser comitadas.
- **Prevenção de Vazamento de Dados**: Nenhum dado real de pacientes, prontuários, exames ou transações financeiras pode trafegar pelo repositório Git, nem em commits, nem em branches públicas ou privadas.

### 5.2. Procedimento de Backup Externo

Os backups de bancos de dados em produção e homologação devem ser executados através da ferramenta nativa `gbak` do Firebird:

1. **Execução de Backup (`gbak`)**:
   ```powershell
   gbak -b -v -user SYSDBA -password <SENHA_FORTE> 127.0.0.1:C:\dados\clinica_optometria.fdb D:\backups\clinica_optometria_$(Get-Date -Format 'yyyyMMdd_HHmmss').fbk
   ```
2. **Criptografia e Armazenamento**:
   - Os arquivos de backup (`.fbk`) devem ser compactados e criptografados (ex: AES-256).
   - O armazenamento deve ser feito em storage externo seguro (ex: bucket em nuvem com criptografia em repouso e controle de acesso IAM restrito, ou servidor de backup dedicado).
   - O diretório local `DADOS/backups/` é estritamente ignorado pelo Git e destinado apenas a cópias temporárias locais de teste.

### 5.3. Teste Periódico de Restauração

Recomenda-se a realização de simulações periódicas de restauração (`gbak -c`) em ambiente isolado para validação da integridade das cópias de segurança e atendimento às exigências de continuidade da LGPD.
