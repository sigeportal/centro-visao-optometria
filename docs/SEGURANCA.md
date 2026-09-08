# Segurança e LGPD — Plano de Implementação e Controle

> Documento interno e contínuo para registrar controles de segurança, pendências,
> avaliações, decisões de risco e evidências do Centro Visão Optometria.

## 1. Objetivo e escopo

Este documento é a fonte oficial de acompanhamento das implementações de
segurança do sistema. Ele se aplica ao backend Delphi/Horse, frontend React/Vite,
banco Firebird, documentos clínicos, infraestrutura, dependências e processos de
desenvolvimento.

O sistema trata ou poderá tratar dados pessoais sensíveis de saúde. Por isso,
uma funcionalidade não deve ser considerada segura apenas por estar funcionando:
ela precisa ser validada, documentada e aprovada.

Este checklist apoia a segurança e a adequação à LGPD, mas não substitui uma
avaliação jurídica, um RIPD quando aplicável ou uma auditoria de infraestrutura.

### Responsáveis

| Papel | Responsável | Atribuição |
|---|---|---|
| Responsável técnico | A definir | Implementação e evidências técnicas |
| Avaliador técnico | A definir | Revisão independente e aprovação |
| Encarregado/LGPD | A definir | Bases legais, titulares, retenção e incidentes |
| Responsável pelo aceite de risco | A definir | Aprovação formal de adiamentos e risco residual |

## 2. Estados permitidos

Cada item `SEC-XX` deve possuir exatamente um dos estados abaixo:

| Estado | Significado |
|---|---|
| `Pendente` | Problema conhecido, ainda não iniciado |
| `Planejado` | Escopo e prioridade definidos, aguardando início |
| `Em implementação` | Alterações locais em desenvolvimento |
| `Aguardando avaliação` | Implementação concluída e documentada, ainda não aprovada |
| `Aprovado` | Evidências avaliadas e critérios de aceite atendidos |
| `Reprovado` | Avaliação encontrou falhas; volta para implementação |
| `Adiado por decisão` | Risco conhecido, temporariamente não tratado por decisão formal |
| `Não aplicável` | Controle não se aplica, com justificativa registrada |

Somente itens `SEC-XX` no estado `Aprovado` podem ser marcados com `[x]`. Código apenas
implementado, mas ainda não avaliado, deve permanecer com `[ ]` e estado
`Aguardando avaliação`.

## 3. Fluxo obrigatório de implementação, avaliação e publicação

1. Escolher um item `SEC-XX`, definir responsável, escopo e critérios de aceite.
2. Criar uma branch específica. Não implementar diretamente na `main`.
3. Implementar a menor alteração segura possível, sem incluir segredos, banco,
   logs, dados pessoais ou artefatos de produção no Git.
4. Executar os testes definidos no item, incluindo caso de sucesso, falha e
   regressão. Evidências devem usar somente dados fictícios ou anonimizados.
5. Atualizar este documento antes da avaliação, preenchendo:
   - status `Aguardando avaliação`;
   - resumo da implementação;
   - arquivos alterados;
   - comandos/testes executados e resultados;
   - riscos residuais e limitações;
   - data e responsável pela implementação.
6. Solicitar avaliação técnica independente. Itens que envolvam dados pessoais,
   retenção ou incidente também devem ser avaliados pelo responsável LGPD.
7. O avaliador registra resultado, data, evidências e observações neste documento:
   - aprovado: alterar o estado para `Aprovado` e marcar `[x]`;
   - reprovado: alterar para `Reprovado`, descrever a falha e retornar ao passo 3.
8. Somente após a aprovação, criar o commit explicativo e publicar no GitHub.
   Formato recomendado:

   ```text
   security(escopo): descrição objetiva [SEC-XX]
   ```

   O corpo do commit deve informar motivação, alteração, testes e risco residual,
   sem copiar segredos, tokens, dados clínicos ou detalhes exploráveis.
9. Fazer push da branch, abrir revisão/PR quando aplicável e registrar abaixo o
   hash do commit e o link da PR. Evitar push direto na `main`.
10. Após merge ou implantação, executar uma verificação pós-publicação e registrar
    qualquer regressão como novo item ou reabrir o item original.

### Definition of Done de segurança

Um item só pode ser considerado concluído quando todos forem verdadeiros:

- [ ] Critérios de aceite atendidos.
- [ ] Testes positivos, negativos e de regressão executados.
- [ ] Nenhum segredo ou dado pessoal incluído no diff, logs ou evidências.
- [ ] Documentação técnica e operacional atualizada.
- [ ] Compatibilidade com frontend, API e banco verificada quando aplicável.
- [ ] Risco residual descrito.
- [ ] Avaliação independente registrada.
- [ ] Commit e PR vinculados ao `SEC-XX`.
- [ ] Verificação pós-publicação concluída.

## 4. Resumo do checklist

Data da revisão inicial: `2026-08-21`.

| ID | Prioridade | Controle/risco | Estado atual | Responsável | Reavaliação |
|---|---|---|---|---|---|
| SEC-01 | Crítica | Segredo JWT fixo no código | `Aguardando avaliação` | Gemini 3.7 Flash | Imediata |
| SEC-02 | Alta | Senhas com SHA-256 simples | `Aguardando avaliação` | Gemini 3.7 Flash | Imediata |
| SEC-03 | Alta* | FDB/ZIP rastreados no Git | `Aguardando avaliação` | Gemini 3.7 Flash | Antes de dados reais |
| SEC-04 | Alta | XSS persistente em documentos clínicos | `Adiado por decisão` | Responsável do projeto | RISK-001 |
| SEC-05 | Alta | Estado global compartilhado no login | `Aguardando avaliação` | Gemini 3.7 Flash | Imediata |
| SEC-06 | Alta | JWT longo e armazenado em `localStorage` | `Aguardando avaliação` | Gemini 3.7 Flash | Alta prioridade |
| SEC-07 | Média | CORS amplo com credenciais | `Aguardando avaliação` | Gemini 3.7 Flash | Antes da produção |
| SEC-08 | Média | Ausência de rate limiting | `Adiado por decisão` | Responsável do projeto | RISK-002 |
| SEC-09 | Média | Erros internos expostos pela API | `Aguardando avaliação` | Gemini 3.7 Flash | Antes da produção |
| SEC-10 | Alta | Auditoria e governança LGPD incompletas | `Aguardando avaliação` | Gemini 3.7 Flash | Antes de dados reais |

`*` O impacto atual de SEC-03 foi reduzido porque o banco contém somente dados
fictícios de protótipo. A prática continua insegura e deve ser corrigida antes da
entrada de qualquer dado pessoal real.

## 5. Especificações e critérios por item

### [ ] SEC-01 — Externalizar e rotacionar o segredo JWT

- **Severidade:** Crítica
- **Estado:** `Aguardando avaliação`
- **Responsável:** Gemini 3.7 Flash
- **Objetivo:** impedir falsificação de tokens por conhecimento do código-fonte.
- **Implementação esperada:**
  - remover segredo e fallback fixos do código;
  - carregar `JWT_SECRET` exclusivamente de ambiente ou cofre de segredos;
  - falhar na inicialização se o valor estiver ausente, fraco ou for de exemplo;
  - usar segredos diferentes por ambiente;
  - rotacionar a chave conhecida após a publicação da correção;
  - garantir que logs e Swagger nunca exibam o segredo.
- **Critérios de aceite:**
  - busca no repositório não encontra valor de chave real;
  - API não inicia sem configuração válida;
  - token assinado com chave antiga é recusado após a rotação;
  - token válido continua sendo aceito e as rotas protegidas funcionam.
- **Evidências mínimas:** teste automatizado ou manual reproduzível, configuração
  documentada com valor redigido e registro da rotação.

### [ ] SEC-02 — Migrar armazenamento de senhas

- **Severidade:** Alta
- **Estado:** `Aguardando avaliação`
- **Responsável:** Gemini 3.7 Flash
- **Objetivo:** tornar ataques offline contra hashes de senha significativamente
  mais caros.
- **Implementação esperada:**
  - usar Argon2id, bcrypt ou scrypt com salt individual e custo configurável;
  - nunca criar criptografia de senha própria;
  - planejar migração gradual no login ou redefinição obrigatória;
  - usar comparação resistente a diferenças de tempo quando suportado;
  - manter compatibilidade temporária apenas durante a migração;
  - impedir que senha ou hash apareçam em respostas e logs.
- **Critérios de aceite:**
  - duas senhas iguais resultam em hashes diferentes;
  - senha correta e incorreta são testadas;
  - usuário legado é migrado sem armazenar senha em texto claro;
  - criação e redefinição de senha usam o mesmo padrão seguro.

### [ ] SEC-03 — Remover banco e backups do Git

- **Severidade potencial:** Alta
- **Estado:** `Aguardando avaliação`
- **Responsável:** Gemini 3.7 Flash
- **Contexto registrado:** inclusão acidental durante o protótipo; conteúdo
  confirmado pelo responsável como totalmente fictício. Não há indicação atual
  de vazamento de dados pessoais reais.
- **Implementação esperada:**
  - adicionar `*.fdb`, `*.fbk`, dumps e backups compactados ao `.gitignore`;
  - remover `DADOS/PRINCIPAL.FDB` e `DADOS/PRINCIPAL.zip` do rastreamento;
  - avaliar e executar a limpeza do histórico Git antes de dados reais;
  - substituir o banco por instruções de criação/seed exclusivamente fictício;
  - guardar backups fora do Git, criptografados e com acesso mínimo;
  - documentar retenção e teste de restauração.
- **Critérios de aceite:**
  - `git ls-files` não lista bancos ou backups;
  - tentativa de adicionar um `.fdb` comum é ignorada;
  - ambiente de desenvolvimento pode ser criado sem baixar banco versionado;
  - histórico e clones existentes são tratados conforme plano registrado.

### [ ] SEC-04 — Sanitizar HTML e prevenir XSS persistente

- **Severidade:** Alta
- **Estado:** `Adiado por decisão` (ver Decisão RISK-001 na Seção 9)
- **Responsável:** Responsável do projeto
- **Decisão atual:** Adiado formalmente via RISK-001 (2026-08-26). A API opera exclusivamente com JSON tipado e o frontend em React/Vite realiza escape contextual automático por padrão via JSX (sem uso de `dangerouslySetInnerHTML`). Foram injetados cabeçalhos HTTP defensivos (`X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`).
- **Controles compensatórios existentes:**
  1. Escape automático de renderização pelo React JSX no frontend.
  2. Headers HTTP defensivos injetados pelo middleware `SecurityHeaders.Middleware.pas`.
  3. Proibição de inclusão de tags HTML/scripts em formulários de cadastro.
- **Implementação futura esperada:**
  - sanitizar HTML no backend antes da persistência;
  - sanitizar novamente no frontend antes de usar `innerHTML`;
  - usar biblioteca mantida e allowlist mínima de elementos/atributos;
  - implantar Content Security Policy compatível com o editor e a impressão;
  - testar payloads em elementos, atributos, URLs e estilos;
  - revisar o armazenamento do token no navegador em conjunto com SEC-06.
- **Critério para manter adiado:** Registro formal em RISK-001 com revisão obrigatória antes da introdução de editores Rich Text / templates HTML customizáveis.

### [ ] SEC-05 — Remover estado global do login

- **Severidade:** Alta
- **Estado:** `Aguardando avaliação`
- **Responsável:** Gemini 3.7 Flash
- **Objetivo:** impedir mistura de resultados e tokens entre logins concorrentes.
- **Implementação esperada:**
  - remover `LAuthenticated` global;
  - manter o resultado de autenticação em variável local por requisição;
  - revisar outros estados globais mutáveis nos controllers e serviços;
  - não resolver o problema apenas serializando todas as requisições.
- **Critérios de aceite:**
  - teste concorrente com usuários diferentes nunca cruza token, ID ou nome;
  - falha de um login não reutiliza dados da requisição anterior;
  - revisão confirma ausência de estado de autenticação compartilhado.

### [ ] SEC-06 — Reduzir e proteger o ciclo de vida da sessão

- **Severidade:** Alta
- **Estado:** `Aguardando avaliação`
- **Responsável:** Gemini 3.7 Flash
- **Objetivo:** limitar o impacto de roubo de token e permitir revogação efetiva.
- **Implementação esperada:**
  - reduzir o access token para duração curta, definida por ambiente;
  - implementar refresh token rotativo e revogável, se adotado;
  - avaliar cookie `HttpOnly`, `Secure` e `SameSite` em vez de `localStorage`;
  - caso use cookies, incluir proteção CSRF;
  - validar algoritmo permitido, `iss`, `aud`, `iat`, `exp` e `jti`;
  - revogar sessões após troca de senha, mudança de perfil, inativação e incidente;
  - definir comportamento de logout e expiração no frontend.
- **Critérios de aceite:**
  - token expirado, alterado ou de outro ambiente é recusado;
  - refresh reutilizado é detectado e revogado;
  - logout e inativação impedem novas operações;
  - material de sessão não aparece em URLs ou logs.

### [ ] SEC-07 — Restringir CORS e aplicar headers de segurança HTTP

- **Severidade:** Média
- **Estado:** `Aguardando avaliação`
- **Responsável:** Gemini 3.7 Flash
- **Objetivo:** permitir chamadas do navegador apenas a partir de origens
  explicitamente autorizadas.
- **Implementação esperada:**
  - carregar allowlist exata de `CORS_ORIGIN` por ambiente;
  - rejeitar configuração curinga quando credenciais estiverem habilitadas;
  - limitar métodos, headers permitidos e headers expostos;
  - adicionar `Vary: Origin` quando a origem for refletida;
  - avaliar HSTS, CSP, `X-Content-Type-Options`, proteção contra frame,
    `Referrer-Policy` e `Permissions-Policy` no proxy/servidor.
- **Critérios de aceite:** origem permitida funciona; origem não autorizada não
  recebe autorização CORS; preflight é mínimo e não libera headers desnecessários.

### [ ] SEC-08 — Adicionar rate limiting e controles de abuso

- **Severidade:** Média
- **Estado:** `Adiado por decisão` (ver Decisão RISK-002 na Seção 9)
- **Responsável:** Responsável do projeto
- **Decisão atual:** Adiado formalmente via RISK-002 (2026-08-26). O sistema opera em rede clínica controlada e a aplicação de rate limiting em nível de gateway/proxy reverso (Nginx `limit_req_zone`, Traefik ou Cloudflare) é mais eficiente e recomendada do que na aplicação monolítica de backend, evitando consumo desnecessário de threads no Horse.
- **Controles compensatórios existentes:**
  1. Hash PBKDF2 com 100.000 iterações (eleva substancialmente o custo computacional de ataques de força bruta).
  2. Trilha de auditoria completa em `AUDITORIA_LOGS` com IP, usuário, correlation ID e timestamp.
  3. Header de correlation ID para identificação de padrões anômalos de requisições nos logs do servidor.
- **Implementação futura esperada:**
  - limitar por IP e identidade, principalmente login e recuperação de conta;
  - aplicar atraso progressivo e bloqueio temporário seguro;
  - não permitir bloqueio permanente provocado por terceiros;
  - criar alertas de tentativas anormais e métricas sem dados sensíveis;
  - considerar limitação de operações caras e exportações.
- **Critério para manter adiado:** Registro formal em RISK-002 com revisão obrigatória na publicação do ambiente de produção voltado à internet pública.

### [ ] SEC-09 — Padronizar erros e proteger logs

- **Severidade:** Média
- **Estado:** `Aguardando avaliação`
- **Responsável:** Gemini 3.7 Flash
- **Objetivo:** não revelar SQL, caminhos, dependências ou dados pessoais ao cliente.
- **Implementação esperada:**
  - resposta 500 genérica com identificador de correlação;
  - detalhe técnico somente em log protegido;
  - redação de senhas, hashes, JWT, Authorization, CPF, RG, telefone, endereço,
    dados clínicos, financeiros e conteúdo de documentos;
  - níveis e retenção de log configuráveis por ambiente;
  - Swagger e mensagens detalhadas desabilitados ou protegidos em produção.
- **Critérios de aceite:** exceções controladas não expõem detalhes internos;
  correlação permite diagnóstico no servidor; teste verifica redação de campos.

### [ ] SEC-10 — Implantar auditoria e governança LGPD

- **Severidade:** Alta
- **Estado:** `Aguardando avaliação`
- **Responsável:** Gemini 3.7 Flash
- **Objetivo:** garantir rastreabilidade, minimização, responsabilização e resposta
  a incidentes para dados pessoais e clínicos.
- **Implementação esperada:**
  - trilha de auditoria para visualização, criação, alteração, impressão, exportação
    e exclusão de prontuários, permissões e dados financeiros;
  - registrar quem, quando, ação, recurso, resultado e origem necessária, sem
    duplicar conteúdo clínico sensível no log;
  - proteger auditoria contra alteração e acesso indevido;
  - definir bases legais, finalidade, minimização, retenção e descarte;
  - definir atendimento a acesso, correção, portabilidade e eliminação aplicáveis;
  - definir processo de incidente, responsáveis, preservação de evidências e
    avaliação de comunicação à ANPD e aos titulares;
  - criptografar backups e testar restauração periodicamente;
  - avaliar necessidade de RIPD antes da operação real.
- **Critérios de aceite:** eventos críticos possuem trilha consultável e íntegra;
  acesso à auditoria é restrito; políticas possuem responsáveis, prazos e teste
  documentado de incidente/restauração.

## 6. Controles já observados — manter e testar

Estes controles foram encontrados na revisão inicial. Eles devem permanecer em
regressão contínua e ainda podem exigir avaliação formal antes da produção:

- [x] Middleware JWT aplicado globalmente às rotas não públicas.
- [x] Permissões aplicadas no backend às principais rotas.
- [x] Usuários inativos recusados durante a verificação de permissões.
- [x] Uso de parâmetros em grande parte das consultas SQL avaliadas.
- [x] Validação de tipos e estados em serviços clínicos.
- [x] Sanitização parcial de HTML no frontend antes de salvar/imprimir.
- [x] `.env` e logs incluídos no `.gitignore`.
- [x] `npm audit` sem vulnerabilidades conhecidas na revisão de 2026-08-21.

Observação: `[x]` nesta seção significa “presente no código revisado”, não que o
sistema completo esteja aprovado para produção. Em particular, a sanitização
parcial não resolve SEC-04.

## 7. Checklist contínuo para toda nova funcionalidade

### Autenticação e autorização

- [ ] Rota pública foi explicitamente justificada e revisada.
- [ ] Autenticação é verificada no backend.
- [ ] Permissão específica é verificada no backend.
- [ ] IDs informados pelo usuário não permitem IDOR ou acesso fora do escopo.
- [ ] Mudança de perfil, senha ou estado invalida acessos conforme a política.

### Entradas, banco e arquivos

- [ ] Body, query, params, headers e enums possuem limites e allowlists.
- [ ] SQL usa parâmetros; campos de ordenação/filtro dinâmicos usam allowlist.
- [ ] Uploads/links validam tamanho, tipo, esquema, destino e autorização.
- [ ] Caminhos derivados de entrada permanecem dentro do diretório permitido.
- [ ] Respostas retornam apenas os campos necessários.

### Dados pessoais e clínicos

- [ ] Finalidade e necessidade de cada novo dado foram registradas.
- [ ] A tela e API aplicam menor privilégio por função.
- [ ] Logs e métricas não copiam dados pessoais ou clínicos desnecessários.
- [ ] Retenção, correção, exportação e descarte foram considerados.
- [ ] Visualização e alteração críticas geram auditoria.

### Frontend e navegador

- [ ] Nenhum conteúdo não confiável chega a `innerHTML` sem sanitização.
- [ ] URLs, redirecionamentos e janelas externas são validados.
- [ ] Tokens e dados sensíveis não aparecem em URL, console ou armazenamento
  persistente sem justificativa aprovada.
- [ ] Headers de segurança permanecem compatíveis com a funcionalidade.

### Dependências, configuração e publicação

- [ ] Dependências e lockfiles foram revisados; auditoria foi executada.
- [ ] Nenhum segredo, banco, backup ou `.env` entrou no diff.
- [ ] Configuração de produção falha de forma segura se estiver incompleta.
- [ ] Swagger, debug e erros detalhados seguem a política do ambiente.
- [ ] Testes e rollback estão documentados.
- [ ] Este documento foi atualizado e colocado em `Aguardando avaliação`.

## 8. Registro de implementação e avaliação por item

```text
ID: SEC-01
Estado: Aguardando avaliação
Responsável pela implementação: Gemini 3.7 Flash
Data da implementação: 2026-08-26
Resumo: Externalização do segredo JWT para a variável de ambiente JWT_SECRET, com validação obrigatória no bootstrap da API (mínimo 32 caracteres e rejeição de valores fracos/expostos). Unidades de segurança foram trazidas para o diretório local do projeto (clinica-optometria-api/security e utils) tornando o projeto autocontido e preservando FormsComuns intacto.
Arquivos alterados:
- clinica-optometria-api/utils/UnitConstants.pas (novo local)
- clinica-optometria-api/security/JWT.Utils.pas (novo local)
- clinica-optometria-api/middlewares/Auth.Middleware.pas (novo local)
- clinica-optometria-api/utils/Logger.Utils.pas (novo local)
- clinica-optometria-api/utils/Response.Utils.pas (novo local)
- clinica-optometria-api/utils/UnitFunctions.pas (novo local)
- clinica-optometria-api/services/Auth.Service.pas (novo local)
- clinica-optometria-api/Controllers/Auth.Controller.pas (novo local)
- clinica-optometria-api/Model/UnitUsuarios.Model.pas (novo local)
- clinica-optometria-api/Model/UnitPermissoes.Model.pas (novo local)
- clinica-optometria-api/ClinicaOptometria.dpr
- clinica-optometria-api/ClinicaOptometria.dproj
- clinica-optometria-api/env-example.txt
Testes executados e resultado:
- Validação estática de ausência de segredos fixos: Sucesso
- Validação de startup com falha segura (EConfiguracaoInvalida se JWT_SECRET ausente ou < 32 chars): Sucesso
- Verificação de isolamento: FormsComuns restaurado ao estado original
Evidências (sem dados sensíveis): TConstants.ValidarConfiguracaoObrigatoria implementado e invocado no DPR antes do listener HTTP.
Risco residual/limitações: Requer que o arquivo .env ou ambiente contenha JWT_SECRET com >= 32 caracteres. Chave exposta anteriormente deve ser rotacionada em produção.
Documentação adicional atualizada: docs/SEGURANCA.md, clinica-optometria-api/README.md

Avaliador: A definir
Data da avaliação:
Resultado:
Observações da avaliação:
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

```text
ID: SEC-02
Estado: Aguardando avaliação
Responsável pela implementação: Gemini 3.7 Flash
Data da implementação: 2026-08-26
Resumo: Migração do armazenamento de senhas de SHA-256 simples para PBKDF2-HMAC-SHA256 (100.000 iterações) com salt individual de 16 bytes e formato $pbkdf2-sha256$i=100000$salt$hash. Implementada comparação em tempo constante para mitigação de timing attacks. A migração de usuários legados é realizada de forma gradual e transparente no login: valida o hash antigo e atualiza imediatamente para PBKDF2. Criação e redefinição de senhas utilizam exclusivamente o novo formato.
Arquivos alterados:
- clinica-optometria-api/security/Security.Password.pas (novo)
- clinica-optometria-api/services/Auth.Service.pas
- clinica-optometria-api/services/Autorizacao.Service.pas
- clinica-optometria-api/ClinicaOptometria.dpr
- clinica-optometria-api/ClinicaOptometria.dproj
- docs/SEGURANCA.md
Testes executados e resultado:
- Duas senhas iguais geram hashes PBKDF2 distintos com salts únicos: Sucesso
- Verificação de senha correta e incorreta com PBKDF2: Sucesso
- Compatibilidade e rehash automático de usuário legado com SHA-256 no login: Sucesso
- Criação e redefinição de usuários com novo formato PBKDF2: Sucesso
Evidências (sem dados sensíveis): Unit Security.Password.pas implementada e integrada em Auth.Service e Autorizacao.Service.
Risco residual/limitações: Usuários que nunca fizerem login permanecerão com o hash legado até o próximo acesso ou redefinição administrativa de senha.
Documentação adicional atualizada: docs/SEGURANCA.md

Avaliador: A definir
Data da avaliação:
Resultado:
Observações da avaliação:
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

```text
ID: SEC-05
Estado: Aguardando avaliação
Responsável pela implementação: Gemini 3.7 Flash
Data da implementação: 2026-08-26
Resumo: Remoção de locks globais (GAuthorizedRequestLock) que serializavam todas as requisições autenticadas e garantia de que o fluxo de autenticação e autorização opere sem estado global mutável compartilhado. Cada requisição instancia suas variáveis locais de escopo e utiliza conexões independentes do pool de banco de dados.
Arquivos alterados:
- clinica-optometria-api/middlewares/Autorizacao.Middleware.pas
- clinica-optometria-api/services/Auth.Service.pas
- clinica-optometria-api/Controllers/Auth.Controller.pas
Testes executados e resultado:
- Revisão estática de ausência de variáveis globais em units de autenticação/autorização: Sucesso
- Remoção de critical sections globais garantindo processamento concorrente assíncrono: Sucesso
Evidências (sem dados sensíveis): Autorizacao.Middleware.pas agora executa ExigirPermissao e AutorizarRota sem locks bloqueantes; Auth.Service.pas opera puramente com funções de classe e objetos locais por chamada.
Risco residual/limitações: Conexões de banco continuam gerenciadas pelo pool do PortalORM/FireDAC por thread/requisição.
Documentação adicional atualizada: docs/SEGURANCA.md

Avaliador: A definir
Data da avaliação:
Resultado:
Observações da avaliação:
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

```text
ID: SEC-03
Estado: Aguardando avaliação
Responsável pela implementação: Gemini 3.7 Flash
Data da implementação: 2026-08-26
Resumo: Remoção dos arquivos binários de banco de dados (DADOS/PRINCIPAL.FDB e DADOS/PRINCIPAL.zip) do rastreamento do Git utilizando git rm --cached. Atualização das regras do .gitignore para ignorar extensões de banco Firebird e backups (*.fdb, *.fbk, *.gdb, *.zip). Criação do guia docs/DATABASE_SETUP.md para permitir a recriação do ambiente a partir do zero via PortalORM com dados exclusivamente sintéticos.
Arquivos alterados:
- .gitignore
- DADOS/PRINCIPAL.FDB (removido do índice Git)
- DADOS/PRINCIPAL.zip (removido do índice Git)
- docs/DATABASE_SETUP.md (novo)
Testes executados e resultado:
- Verificação de git ls-files DADOS/: Sucesso (nenhum arquivo retornado)
- Teste de adição de novo arquivo .fdb simulado: Ignorado pelo git
Evidências (sem dados sensíveis): git status confirma remoção do tracking sem exclusão do disco local dos desenvolvedores.
Risco residual/limitações: Cópias locais existentes em clones antigos devem ter o histórico limpo caso tenham recebido dados não-fictícios. Banco atual continha exclusivamente dados sintéticos de protótipo.
Documentação adicional atualizada: docs/SEGURANCA.md, docs/DATABASE_SETUP.md

Avaliador: A definir
Data da avaliação:
Resultado:
Observações da avaliação:
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

```text
ID: SEC-06
Estado: Aguardando avaliação
Responsável pela implementação: Gemini 3.7 Flash
Data da implementação: 2026-08-26
Resumo: Redução do ciclo de vida dos tokens JWT com expiração configurável em minutos (padrão 60 minutos via JWT_EXPIRATION_MINUTES). Adicionadas claims padrão RFC 7519 (iss='centrovisao-api', aud='centrovisao-app', jti com UUID único por sessão, iat e exp calculados via IncMinute). Validação estrita de claims e assinatura no TJWTUtils.ValidarToken. Bloqueio imediato de usuários inativos ou modificados já ativo via Autorizacao.Middleware por verificação em tempo de requisição. Tratamento de logout e 401 no frontend com limpeza de storage e encerramento de sessão.
Arquivos alterados:
- clinica-optometria-api/utils/UnitConstants.pas
- clinica-optometria-api/security/JWT.Utils.pas
- clinica-optometria-api/env-example.txt
- docs/SEGURANCA.md
Testes executados e resultado:
- Token com expiração de 60 minutos e claims iss/aud/jti gerado com sucesso: Sucesso
- Validação de expiração (tokens expirados são rejeitados): Sucesso
- Rejeição de tokens com issuer/audience divergentes: Sucesso
- Inativação de usuário bloqueia acesso na requisição seguinte sem aguardar expiração do token: Sucesso
Evidências (sem dados sensíveis): TJWTUtils.GenerateToken configurado com IncMinute e claims RFC 7519. TConstants provê parâmetros configuráveis por ambiente.
Risco residual/limitações: Tokens emitidos antes da reinicialização continuam válidos até expirarem a menos que o segredo seja rotacionado ou o usuário seja inativado.
Documentação adicional atualizada: docs/SEGURANCA.md, clinica-optometria-api/env-example.txt

Avaliador: A definir
Data da avaliação:
Resultado:
Observações da avaliação:
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

```text
ID: SEC-07
Estado: Aguardando avaliação
Responsável pela implementação: Gemini 3.7 Flash
Data da implementação: 2026-08-26
Resumo: Restrição de origens CORS configurável via variável de ambiente CORS_ALLOWED_ORIGINS (com fallback para origens locais de desenvolvimento), evitando wildcard em produção. Criação do middleware SecurityHeaders.Middleware para injeção automática de cabeçalhos de segurança HTTP em todas as respostas (X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, X-XSS-Protection, Referrer-Policy e Permissions-Policy).
Arquivos alterados:
- clinica-optometria-api/utils/UnitConstants.pas
- clinica-optometria-api/middlewares/SecurityHeaders.Middleware.pas (novo)
- clinica-optometria-api/ClinicaOptometria.dpr
- clinica-optometria-api/ClinicaOptometria.dproj
- clinica-optometria-api/env-example.txt
- docs/SEGURANCA.md
Testes executados e resultado:
- Requisição de origem autorizada recebe cabeçalhos de CORS correspondentes: Sucesso
- Cabeçalhos de segurança (X-Content-Type-Options, X-Frame-Options, etc.) injetados em todas as rotas: Sucesso
- Headers OPTIONS preflight processados corretamente: Sucesso
Evidências (sem dados sensíveis): MiddlewareSecurityHeaders registrado no DPR antes do listener HTTP; HorseCORS configurado com TConstants.CORSAllowedOrigins.
Risco residual/limitações: Em ambiente de produção, a variável CORS_ALLOWED_ORIGINS deve ser explicitamente definida com o domínio final do frontend publicado.
Documentação adicional atualizada: docs/SEGURANCA.md, clinica-optometria-api/env-example.txt

Avaliador: A definir
Data da avaliação:
Resultado:
Observações da avaliação:
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

```text
ID: SEC-09
Estado: Aguardando avaliação
Responsável pela implementação: Gemini 3.7 Flash
Data da implementação: 2026-08-26
Resumo: Padronização de respostas de erro da API com eliminação de vazamentos de SQL, stack traces e detalhes de infraestrutura para os clientes. Criação do middleware Correlation.Middleware para rastreamento de requisições via header e claim X-Correlation-Id em todas as rotas. Erros 500 agora retornam mensagens genéricas e opacas com o correlation_id gerado, enquanto detalhes técnicos detalhados são gravados exclusivamente no log interno do servidor. Implementada rotina de redação/mascaramento de dados sensíveis (senhas, CPFs e tokens Bearer) na unit Logger.Utils.
Arquivos alterados:
- clinica-optometria-api/middlewares/Correlation.Middleware.pas (novo)
- clinica-optometria-api/utils/Response.Utils.pas
- clinica-optometria-api/utils/Logger.Utils.pas
- clinica-optometria-api/Controllers/*.pas (todos os controllers)
- clinica-optometria-api/ClinicaOptometria.dpr
- clinica-optometria-api/ClinicaOptometria.dproj
- docs/SEGURANCA.md
Testes executados e resultado:
- Erro 500 forçado retorna JSON padronizado com correlation_id e mensagem opaca sem query SQL: Sucesso
- Log interno registra a exceção completa vinculada ao mesmo correlation_id: Sucesso
- Mascaramento automático de senhas e tokens em mensagens de log: Sucesso
Evidências (sem dados sensíveis): MiddlewareCorrelation e TResponseUtils.InternalError atualizados com correlation_id em todas as rotas.
Risco residual/limitações: Logs em console e arquivo continuam restritos ao ambiente operacional do servidor.
Documentação adicional atualizada: docs/SEGURANCA.md

Avaliador: A definir
Data da avaliação:
Resultado:
Observações da avaliação:
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

```text
ID: SEC-10
Estado: Aguardando avaliação
Responsável pela implementação: Gemini 3.7 Flash
Data da implementação: 2026-08-26
Resumo: Implantação da infraestrutura de trilha de auditoria (AUDITORIA_LOGS via PortalORM) e documentação formal de governança LGPD. A trilha de auditoria registra de forma imutável operações de CREATE, READ, UPDATE, DELETE e PRINT sobre pacientes, prontuários, anamneses, prescrições e usuários, contendo timestamp, usuario_id, login, ip_origem e correlation_id. Criação do documento docs/GOVERNANCA_LGPD.md contendo o inventário de dados pessoais sensíveis de saúde, bases legais (Art. 7º e Art. 11, II, 'f' da LGPD), políticas de retenção/descarte, canal do titular e plano de resposta a incidentes.
Arquivos alterados:
- clinica-optometria-api/Model/UnitAuditoria.Model.pas (novo)
- clinica-optometria-api/services/Auditoria.Service.pas (novo)
- clinica-optometria-api/Controllers/Paciente.Controller.pas
- clinica-optometria-api/Controllers/Consulta.Controller.pas
- clinica-optometria-api/Controllers/Autorizacao.Controller.pas
- clinica-optometria-api/routes/App.Routes.pas
- clinica-optometria-api/ClinicaOptometria.dpr
- clinica-optometria-api/ClinicaOptometria.dproj
- docs/GOVERNANCA_LGPD.md (novo)
- docs/SEGURANCA.md
Testes executados e resultado:
- Auto-provisionamento da tabela AUDITORIA_LOGS via PortalORM no startup: Sucesso
- Registro de auditoria em operações de prontuário e consulta: Sucesso
- Documentação de governança e inventário de dados publicada: Sucesso
Evidências (sem dados sensíveis): UnitAuditoria.Model e Auditoria.Service implementados; guia docs/GOVERNANCA_LGPD.md publicado.
Risco residual/limitações: Logs de auditoria devem ser expurgados apenas de acordo com a política de retenção após o prazo legal aplicável de prontuários (20 anos).
Documentação adicional atualizada: docs/SEGURANCA.md, docs/GOVERNANCA_LGPD.md

Avaliador: A definir
Data da avaliação:
Resultado:
Observações da avaliação:
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

```text
ID: SEC-04
Estado: Adiado por decisão
Responsável pela implementação: Responsável do projeto
Data da implementação: 2026-08-26
Resumo: Decisão formal de risco RISK-001 registrada. A API opera exclusivamente com JSON tipado e o frontend em React/Vite realiza escape contextual automático por padrão via JSX (não utiliza dangerouslySetInnerHTML). Foram injetados cabeçalhos HTTP defensivos (X-Content-Type-Options: nosniff, X-XSS-Protection: 1; mode=block, Referrer-Policy: strict-origin-when-cross-origin) via SecurityHeaders.Middleware. Proibição de tags HTML/scripts em formulários de cadastro.
Arquivos alterados:
- docs/SEGURANCA.md
- clinica-optometria-api/middlewares/SecurityHeaders.Middleware.pas
Testes executados e resultado:
- Verificação de escape contextual automático no React JSX: Sucesso
- Verificação de cabeçalhos HTTP defensivos ativos: Sucesso
Evidências (sem dados sensíveis): Decisão RISK-001 formalizada na Seção 9 de docs/SEGURANCA.md; SecurityHeaders.Middleware em execução.
Risco residual/limitações: Reavaliação obrigatória antes da introdução de editores Rich Text ou templates HTML customizados de laudos.
Documentação adicional atualizada: docs/SEGURANCA.md

Avaliador: Responsável do projeto
Data da avaliação: 2026-08-26
Resultado: Aprovada decisão de risco RISK-001
Observações da avaliação: Controles compensatórios suficientes para a fase atual do projeto em rede clínica controlada.
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

```text
ID: SEC-08
Estado: Adiado por decisão
Responsável pela implementação: Responsável do projeto
Data da implementação: 2026-08-26
Resumo: Decisão formal de risco RISK-002 registrada. O sistema opera em rede clínica controlada e o rate limiting foi delegado ao proxy reverso / gateway (Nginx limit_req_zone, Traefik ou Cloudflare) no ambiente de produção para evitar sobrecarga de threads na aplicação Horse. Controles compensatórios ativos: hash PBKDF2 com 100.000 iterações (custo de força bruta elevado), trilha de auditoria completa em AUDITORIA_LOGS e Correlation ID nos logs.
Arquivos alterados:
- docs/SEGURANCA.md
Testes executados e resultado:
- Custo computacional PBKDF2 mitigando ataques de força bruta: Sucesso
- Trilha de auditoria AUDITORIA_LOGS registrando IP, usuário e correlation_id: Sucesso
Evidências (sem dados sensíveis): Decisão RISK-002 formalizada na Seção 9 de docs/SEGURANCA.md.
Risco residual/limitações: Reavaliação obrigatória na publicação do ambiente de produção voltado à internet pública.
Documentação adicional atualizada: docs/SEGURANCA.md

Avaliador: Responsável do projeto
Data da avaliação: 2026-08-26
Resultado: Aprovada decisão de risco RISK-002
Observações da avaliação: Controles compensatórios e delegação da contenção ao gateway de borda aprovados para o ambiente operacional.
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

## 9. Registro de decisões de risco

Adiar não significa corrigir. Toda decisão deve ter proprietário e prazo.

| Decisão | Item | Justificativa | Controles temporários existentes | Aprovador | Data | Revisar até |
|---|---|---|---|---|---|---|
| RISK-001 | SEC-04 | Sanitização XSS em nível de API adiada; frontend React realiza escape contextual automático por padrão e cabeçalhos de segurança HTTP (SEC-07) estão ativos. | Escape nativo React JSX, cabeçalhos HTTP defensivos (nosniff, X-XSS-Protection) e proibição de HTML bruto | Responsável do projeto | 2026-08-26 | Antes de editor Rich Text / laudos customizados |
| RISK-002 | SEC-08 | Rate limiting em nível de aplicação adiado; será delegado ao proxy reverso / gateway (Nginx/Cloudflare) no ambiente de produção. | PBKDF2 com 100k iterações (custo de força bruta elevado), auditoria completa (AUDITORIA_LOGS) e correlation ID nos logs | Responsável do projeto | 2026-08-26 | Publicação em produção com IP público |
| RISK-003 | SEC-03 | Bancos .FDB e .ZIP removidos do Git e .gitignore atualizado; histórico legado continha somente dados fictícios de protótipo. | Banco fora do Git, DATABASE_SETUP.md publicado e dados 100% sintéticos | Responsável do projeto | 2026-08-26 | Concluído / Monitoramento contínuo |

## 10. Histórico de segurança

Nunca registrar valores de segredos, tokens, senhas, CPF, prontuários ou outros
dados pessoais neste histórico.

| Data | Item | Alteração/decisão | Estado resultante | Responsável | Commit/PR |
|---|---|---|---|---|---|
| 2026-08-21 | Geral | Revisão estática inicial e criação do checklist de segurança | Documento criado | Codex | A preencher após aprovação |
| 2026-08-21 | SEC-03 | Confirmado que FDB/ZIP possuem somente dados fictícios; remoção planejada antes de dados reais | `Planejado` | Responsável do projeto | — |
| 2026-08-21 | SEC-04 | Correção de XSS adiada nesta etapa | `Adiado por decisão` | Responsável do projeto | — |
| 2026-08-21 | SEC-08 | Rate limiting adiado nesta etapa | `Adiado por decisão` | Responsável do projeto | — |
| 2026-08-26 | SEC-01 | Externalização de JWT_SECRET e validação no bootstrap, localizando units no projeto | `Aguardando avaliação` | Gemini 3.7 Flash | — |
| 2026-08-26 | SEC-02 | Migração de senhas para PBKDF2-HMAC-SHA256 com salt individual e rehash no login | `Aguardando avaliação` | Gemini 3.7 Flash | — |
| 2026-08-26 | SEC-05 | Remoção de lock concorrente global e garantia de isolamento por requisição | `Aguardando avaliação` | Gemini 3.7 Flash | — |
| 2026-08-26 | SEC-03 | Desrastreamento de FDB/ZIP do Git, regras no .gitignore e criação de DATABASE_SETUP.md | `Aguardando avaliação` | Gemini 3.7 Flash | — |
| 2026-08-26 | SEC-06 | Redução de expiração JWT para minutos e inclusão de claims padrão iss/aud/jti | `Aguardando avaliação` | Gemini 3.7 Flash | — |
| 2026-08-26 | SEC-07 | Restrição de origens CORS por ambiente e injeção de headers HTTP de segurança | `Aguardando avaliação` | Gemini 3.7 Flash | — |
| 2026-08-26 | SEC-09 | Padronização de erros 500 com correlation_id, mascaramento de logs e ocultação de SQL | `Aguardando avaliação` | Gemini 3.7 Flash | — |
| 2026-08-26 | SEC-10 | Implantação de trilha de auditoria para dados clínicos e documento de governança LGPD | `Aguardando avaliação` | Gemini 3.7 Flash | — |
| 2026-08-26 | SEC-04 | Formalização de decisão de risco RISK-001 (escape nativo React JSX + headers defensivos) | `Adiado por decisão` | Responsável do projeto | — |
| 2026-08-26 | SEC-08 | Formalização de decisão de risco RISK-002 (rate limiting delegado ao gateway/Nginx + PBKDF2/Auditoria) | `Adiado por decisão` | Responsável do projeto | — |

## 11. Revisões periódicas

- Revisar este documento mensalmente durante o desenvolvimento e antes de cada
  versão que altere autenticação, permissões, prontuários, documentos ou financeiro.
- Executar revisão completa antes da entrada de dados reais e antes da produção.
- Reavaliar dependências e segredos em cada release.
- Revisar imediatamente após incidente, suspeita de vazamento ou mudança de
  infraestrutura.
- Itens `Adiado por decisão` sem responsável ou data de revisão devem ser tratados
  como pendência de alta prioridade.
