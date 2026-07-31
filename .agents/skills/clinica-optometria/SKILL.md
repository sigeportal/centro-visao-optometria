---
name: clinica-optometria
description: "WORKFLOW SKILL - Implementar sistema Centro Visao Optometria com backend Delphi/Horse + PortalORM + Firebird e frontend React/Vite. Use when: adicionar rotas, controllers, services e models; criar paginas e APIs de pacientes, agenda, consultas, anamnese, prescricoes, financeiro e documentos; definir padrao de resposta, JWT, middleware, variaveis de ambiente e fluxo de impressao clinica baseado em docs."
argument-hint: "Descreva o modulo a implementar (ex: pacientes, agenda, consulta, ficha clinica, impressao)"
user-invocable: true
disable-model-invocation: false
---

# Centro Visao Optometria - Skill do Projeto

Sistema de gestao para clinica de optometria, com backend em Delphi + Horse e frontend em React + Vite.

---

## Visao Geral da Arquitetura

| Camada | Tecnologia |
|---|---|
| Backend (API REST) | Delphi, framework Horse (estilo Express), porta configuravel via env |
| Banco de dados | Firebird (ORM via PortalORM) |
| Autenticacao | JWT (horse-jwt + delphi-jose-jwt) |
| Dominio clinico | Pacientes, agenda, consultas, anamnese, prescricao, financeiro, documentos |
| Frontend | React 18 + Vite 5 + Tailwind CSS + react-hook-form + Axios |
| Deploy backend | Google Cloud Run |
| Gerenciador de pacotes Delphi | Boss |

Convencao de infraestrutura backend:
- Dependencias Delphi devem ser gerenciadas via `boss.json` na raiz do backend.
- O arquivo `.dpr` deve seguir o bootstrap padrao com `Horse`, `Horse.CORS`, `Horse.Jhonson`, `Horse.HandleException`, `Horse.Logger`, `Horse.GBSwagger` e registro centralizado de rotas/controllers.
- Swagger deve ficar disponivel em `/swagger/doc/html` com `AddBearerSecurity` e callback do middleware de autenticacao.

---

## Estrutura de Pastas

### Backend (clinica-optometria-api/)
```
Controllers/        -> Um arquivo por dominio: Paciente.Controller.pas, Agenda.Controller.pas, ...
services/           -> Logica de negocio: Paciente.Service.pas, Consulta.Service.pas, ...
middlewares/        -> Auth.Middleware.pas (JWT guard)
Model/              -> Models.Clinica.pas (entidades PortalORM)
routes/             -> App.Routes.pas (registro central de controllers)
config/             -> App.Config.pas (variaveis de ambiente)
utils/              -> Response.Utils.pas, Logger.Utils.pas
security/           -> JWT.Utils.pas
database/           -> UnitDatabase.pas (factory de conexao/query via PortalORM)
reports/            -> Geracao de impressao: anamnese e prescricao
data/               -> Arquivos e documentos vinculados a consultas
```

### Frontend (frontend-clinica/src/)
```
api/                -> Uma funcao por dominio: paciente.js, agenda.js, consulta.js, ...
pages/Pacientes/    -> PacientesPage.jsx, PacienteFormPage.jsx, PacienteDetalhePage.jsx
pages/Agenda/       -> AgendaPage.jsx, AgendamentoFormModal.jsx, AgendamentoDetalheModal.jsx
pages/Consultas/    -> ConsultasPage.jsx, ConsultaDetalhePage.jsx
pages/FichaClinica/ -> FichaClinicaConfigPage.jsx
context/            -> AuthContext.jsx
components/Layout/  -> Layout.jsx, Sidebar.jsx, Header.jsx
components/common/  -> Modal.jsx, Spinner.jsx, Table.jsx, FormField.jsx
```

---

## Convencoes de Nomenclatura

### Backend (Delphi)

| Elemento | Padrao | Exemplo |
|---|---|---|
| Arquivo | Dominio.Tipo.pas | Paciente.Controller.pas, Consulta.Service.pas |
| Classe | T + PascalCase + Tipo | TPacienteController, TConsultaService, TModelUsuario |
| Field privado | F + PascalCase | FJWTSecret, FPacienteId |
| Record de resultado | TResultado* | TResultadoConsulta, TResultadoPrescricao |
| Coluna SQL | PREFIX_NOME (maiusculo) | PAC_NOME, CON_DATA, REC_OD_ESFERICO |

Prefixos de coluna por entidade:
- USU_ (usuario)
- PAC_ (paciente)
- AGD_ (agendamento)
- CON_ (consulta)
- ANA_ (anamnese)
- REC_ (prescricao)
- FIN_ (financeiro)
- DOC_ (documentos)

### Convencoes PortalORM (Obrigatorio)

- Nao criar ou exigir scripts SQL de schema como fluxo principal; a estrutura deve ser derivada dos models PortalORM.
- Arquivos de model devem seguir o padrao `UnitName.Model.pas` (ex.: `UnitPaciente.Model.pas`, `UnitConsulta.Model.pas`).
- Todo model de tabela deve herdar de `TTabela` e usar `[TNomeTabela('TABELA', 'PK')]`.
- Todo campo persistido deve usar `[TCampo('COLUNA', 'TIPO_SQL')]` na `property` (nunca no field privado), pois o PortalORM varre propriedades via RTTI.
- Instanciacao de model para CRUD deve usar conexao ORM: `TModelX.Create(TDatabase.Connection)`.
- Operacoes padrao do model:
  - inserir: definir PK com `GeraCodigo('CAMPO_PK')` quando nao houver identity/trigger e depois `SalvaNoBanco`
  - atualizar: `BuscaDadosTabela(id)` + `SalvaNoBanco` (ou `SalvaNoBanco(nTentativas)` quando necessario)
  - buscar por id: `BuscaDadosTabela(id)`
  - excluir: `Apagar(id)`
- Para consultas manuais em services, usar `iQuery` via `TDatabase.Query` (factory connection), evitando instanciar `TFDQuery` manualmente.

---

## PortalORM na Pratica

### Instalacao

```bash
boss install https://github.com/CachopaWeb/PortalORM
```

### UnitDatabase (padrao recomendado)

```pascal
unit UnitDatabase;

interface

uses
  UnitConnection.Model.Interfaces;

type
  TDatabase = class
  public
    class function Connection: iConnection;
    class function Query: iQuery;
  end;

implementation

uses
  UnitConstants,
  UnitConnection.Firedac.Model,
  UnitFactory.Connection.Firedac;

class function TDatabase.Connection: iConnection;
begin
  Result := TConnectionFiredac.New(TConstants.BancoDados);
end;

class function TDatabase.Query: iQuery;
begin
  Result := TFactoryConnectionFiredac.New(TConstants.BancoDados).Query;
end;
```

### Model com atributos PortalORM

```pascal
uses UnitPortalORM.Model;

type
  [TNomeTabela('PACIENTES', 'PAC_ID')]
  TPaciente = class(TTabela)
  private
    FCodigo: Integer;
    FNome: string;
  public
    [TCampo('PAC_ID', 'INTEGER NOT NULL PRIMARY KEY')]
    property Codigo: Integer read FCodigo write FCodigo;

    [TCampo('PAC_NOME', 'VARCHAR(150)')]
    property Nome: string read FNome write FNome;
  end;
```

### CRUD no controller/service com PortalORM

```pascal
var
  LPaciente: TPaciente;
begin
  LPaciente := TPaciente.Create(TDatabase.Connection);
  try
    LPaciente.Nome := 'Maria';
    LPaciente.SalvaNoBanco;

    LPaciente.BuscaDadosTabela(1);
    LPaciente.Nome := 'Maria Silva';
    LPaciente.SalvaNoBanco(3);

    LPaciente.Apagar(1);
  finally
    LPaciente.Free;
  end;
end;
```

### Listagem com iQuery (factory connection)

```pascal
var
  LQuery: iQuery;
begin
  LQuery := TDatabase.Query;
  LQuery.Clear;
  LQuery.Add('SELECT PAC_ID, PAC_NOME FROM PACIENTES');
  LQuery.Open;
  // mapear LQuery.DataSet para JSON
end;
```

### Frontend (React/JS)

| Elemento | Padrao | Exemplo |
|---|---|---|
| Arquivo de pagina | PascalCase + tipo | PacientesPage.jsx, ConsultaDetalhePage.jsx |
| Arquivo de API | camelCase, dominio | paciente.js, agenda.js, fichaClinica.js |
| Funcoes de API | camelCase, verbo em PT | listar, criar, atualizar, remover, finalizar |
| Chaves localStorage | co_* | co_token, co_user |

---

## Como Criar um Novo Endpoint (Backend)

### 1. Model (se necessario) - Model/Models.Clinica.pas
```pascal
[TNomeTabela('PACIENTES', 'PAC_ID')]
TModelPaciente = class(TTabela)
private
  FNome: string;
  FCpf: string;
published
  [TCampo('PAC_NOME', 'VARCHAR(150)')]
  property Nome: string read FNome write FNome;

  [TCampo('PAC_CPF', 'VARCHAR(14)')]
  property Cpf: string read FCpf write FCpf;
end;
```

### 2. Service - services/Paciente.Service.pas
```pascal
type
  TPacienteService = class
  public
    function Criar(const ACnpj, ANome, ACpf: string): Integer;
    function ObterPorId(AId: Integer): TPaciente;
    procedure Excluir(AId: Integer);
  end;
```

### 3. Controller - Controllers/Paciente.Controller.pas
```pascal
type
  TPacienteController = class
  public
    class procedure Registrar;
    class procedure Criar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
  end;

class procedure TPacienteController.Registrar;
begin
  THorse.Group.Prefix('/v1').Route('/pacientes').Post(Criar);
end;

class procedure TPacienteController.Criar(Req: THorseRequest; Res: THorseResponse; Next: TProc);
var
  CNPJ: string;
  Nome: string;
  Paciente: TPaciente;
begin
  try
    CNPJ := Req.Session<TJSONObject>.GetValue<string>('cnpj');
    Nome := Req.Body<TJSONObject>.GetValue<string>('nome');
    Paciente := TPaciente.Create(TDatabase.Connection);
    try
      Paciente.Nome := Nome;
      Paciente.SalvaNoBanco;
      TResponseUtils.Created(Res, TJSONObject.Create.AddPair('id', Paciente.Codigo.ToString));
    finally
      Paciente.Free;
    end;
  except on E: Exception do
    begin
      TLogger.Error('PacienteController.Criar', E.Message);
      TResponseUtils.InternalError(Res, E.Message);
    end;
  end;
end;
```

### 4. Registrar em routes/App.Routes.pas
```pascal
TPacienteController.Registrar;
```

### 5. Adicionar ao middleware JWT (se for rota publica)
Editar middlewares/Auth.Middleware.pas na lista RotasPublicas.

### 6. Regra de implementacao ORM

- Nao criar SQL de `INSERT/UPDATE/DELETE` manual para entidades mapeadas em `TTabela`.
- Usar `SalvaNoBanco`, `BuscaDadosTabela` e `Apagar` como caminho padrao.
- SQL manual fica reservado para listagem com joins, filtros e agregacoes.

---

## Formato de Resposta da API

Sempre usar TResponseUtils (utils/Response.Utils.pas):

| Situacao | Metodo | Status HTTP |
|---|---|---|
| Sucesso com dados | TResponseUtils.Ok(Res, 'msg', dados) | 200 |
| Criado | TResponseUtils.Created(Res, dados) | 201 |
| Erro de validacao | TResponseUtils.ValidationError(Res, erros) | 422 |
| Nao autorizado | TResponseUtils.Unauthorized(Res) | 401 |
| Nao encontrado | TResponseUtils.NotFound(Res, 'msg') | 404 |
| Erro interno | TResponseUtils.InternalError(Res, E.Message) | 500 |

Formato JSON de sucesso:
```json
{ "success": true, "data": { ... } }
```

Formato JSON de erro:
```json
{ "success": false, "error": { "code": 400, "message": "..." } }
```

Resposta sugerida de consulta finalizada:
```json
{ "success": true, "data": { "consulta_id": 18, "status": "realizada" } }
```

---

## Fluxo Tecnico de Servicos Clinicos

Servico central para agenda/consulta em services/Consulta.Service.pas:

```pascal
var
  Svc: TConsultaService;
  Resultado: TResultadoConsulta;
begin
  Svc := TConsultaService.Create;
  try
    Resultado := Svc.AgendarConsulta(CNPJ, DadosJSON);
    if Resultado.Sucesso then
      // retornar Resultado.ConsultaId, Resultado.Status
    else
      // retornar Resultado.Erro
  finally
    Svc.Free;
  end;
end;
```

TResultadoConsulta deve conter:
- Sucesso
- ConsultaId
- Status
- Mensagem
- Erro

Regras obrigatorias:
- Impedir conflito de horario por profissional.
- Horario fim deve ser maior que horario inicio.
- Exigir paciente ativo para agendar.
- Status permitidos: agendada, confirmada, atendida, cancelada.

---

## Como Criar uma Nova Pagina (Frontend)

### 1. Funcao de API - src/api/paciente.js
```js
import api from './axios';

export const listar = () => api.get('/v1/pacientes');
export const criar = (dados) => api.post('/v1/pacientes', dados);
export const excluir = (id) => api.delete(`/v1/pacientes/${id}`);
```

### 2. Pagina - src/pages/Pacientes/PacientesPage.jsx
```jsx
import { useState, useEffect } from 'react';
import { listar } from '../../api/paciente';
import { toast } from 'react-hot-toast';

export default function PacientesPage() {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    listar()
      .then((res) => setDados(res.data.data))
      .catch(() => toast.error('Erro ao carregar'));
  }, []);

  return <div>...</div>;
}
```

### 3. Rota - src/App.jsx
```jsx
<Route path="/pacientes" element={<PrivateRoute><PacientesPage /></PrivateRoute>} />
```

### 4. Menu - src/components/Layout/Layout.jsx
Adicionar item de navegacao no sidebar.

---

## Rotas da API (Referencia Rapida)

| Metodo | Rota | Auth |
|---|---|---|
| POST | /v1/auth/login | Publica |
| POST | /v1/usuarios | Publica |
| GET | /health | Publica |
| GET/POST | /v1/pacientes | JWT |
| GET/PUT/DELETE | /v1/pacientes/:id | JWT |
| GET/POST | /v1/agenda | JWT |
| GET | /v1/agenda/fila-espera | JWT |
| POST | /v1/consultas | JWT |
| GET | /v1/consultas/:id | JWT |
| POST | /v1/consultas/:id/finalizar | JWT |
| GET/POST | /v1/consultas/:id/anamneses | JWT |
| GET/POST | /v1/consultas/:id/prescricoes | JWT |
| GET | /v1/prescricoes/:id/impressao | JWT |
| GET | /v1/consultas/:id/documentos | JWT |
| POST | /v1/financeiro/lancamentos | JWT |
| GET | /v1/ficha-clinica/secoes | JWT |
| PUT | /v1/ficha-clinica/secoes/ordem | JWT |
| PATCH | /v1/ficha-clinica/secoes/:id/ativo | JWT |

---

## Variaveis de Ambiente (Backend)

Backend le exclusivamente de variaveis de ambiente (sem .env):

| Variavel | Uso |
|---|---|
| PORT | Porta HTTP |
| DB_HOST, DB_PORT, DB_NAME | Conexao Firebird |
| DB_USER, DB_PASS | Credenciais DB |
| JWT_SECRET | Chave HMAC do JWT |
| CORS_ORIGIN | Origem permitida no frontend |
| APP_TIMEZONE | Timezone da agenda |
| REPORTS_DIR | Diretorio de saida dos PDFs |

---

## Autenticacao JWT (Backend)

- Token lido automaticamente pelo middleware Auth.Middleware.pas.
- Payload padrao: cnpj, usuario_id, username, exp.
- Em handlers: Req.Session<TJSONObject>.GetValue<string>('cnpj').
- Rotas publicas default: /swagger, /v1/auth/login, /v1/usuarios, /health, /favicon.

---

## Axios (Frontend)

src/api/axios.js deve configurar interceptors:
- Injetar Authorization: Bearer <token> em todas as requisicoes.
- Redirecionar para /login em resposta 401.
- Persistir token e usuario no localStorage em co_token e co_user.

---

## Implementacao Guiada pelas Referencias Visuais

Entradas obrigatorias de referencia:
- imagens/ (telas de dashboard, pacientes, agenda, consultas e ficha clinica)
- docs/Ficha clinica S_endereco.xlsx
- docs/impressao anamnese.pdf
- docs/impressao prescricao.pdf

Mapeamento funcional observado:
- Dashboard com cards e listas de proximas consultas, aniversariantes e vencidas.
- Pacientes com cadastro, pesquisa e detalhes em abas.
- Consulta com prescricoes cadastradas e documentos.
- Agenda com novo agendamento, detalhe de status e acao de lancar pagamento.
- Configuracao de ficha clinica com toggle + ordenacao drag and drop.

---

## Especificacao da Configuracao da Ficha Clinica

Objetivo: montar dinamicamente quais blocos aparecem na ficha e impressao.

Entidade sugerida:
- FICHA_SECAO
  - FSC_ID
  - FSC_CHAVE
  - FSC_NOME
  - FSC_ATIVO
  - FSC_ORDEM
  - FSC_EXIBE_IMPRESSAO
  - FSC_EXIBE_TELA

Regras:
- FSC_CHAVE deve ser unica.
- Ordem nao pode repetir.
- Apenas secoes ativas aparecem.
- Ordem deve refletir imediatamente no frontend.

---

## Criterios de Qualidade (Definition of Done)

- Modulo implementado com backend + frontend + validacoes.
- Padrões de tecnologia seguidos (Horse, PortalORM, JWT, Axios interceptor).
- Respostas padronizadas com TResponseUtils.
- CRUD de entidades mapeadas feito com PortalORM (`SalvaNoBanco`, `BuscaDadosTabela`, `Apagar`).
- Listagens com SQL manual usando pool de conexao (`Connected/Disconnected`) sem vazamento.
- Fluxo principal consistente: paciente -> agendamento -> consulta -> prescricao -> impressao.
- Configuracao da ficha clinica funcional (ativar, desativar, ordenar).
- UX/UI suave, legivel, responsiva e com feedback claro.
- Operacao 100% online (sem fila offline e sem sincronizacao local).

---

## Prompt Base para Invocacao

Use esta skill para implementar o modulo [modulo], seguindo os padroes tecnicos do projeto (Delphi/Horse + PortalORM + JWT + React/Axios), as referencias visuais da pasta imagens e os modelos de impressao da pasta docs.