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
| SEC-01 | Crítica | Segredo JWT fixo no código | `Pendente` | A definir | Imediata |
| SEC-02 | Alta | Senhas com SHA-256 simples | `Pendente` | A definir | Imediata |
| SEC-03 | Alta* | FDB/ZIP rastreados no Git | `Planejado` | A definir | Antes de dados reais |
| SEC-04 | Alta | XSS persistente em documentos clínicos | `Adiado por decisão` | A definir | A definir |
| SEC-05 | Alta | Estado global compartilhado no login | `Pendente` | A definir | Imediata |
| SEC-06 | Alta | JWT longo e armazenado em `localStorage` | `Pendente` | A definir | Alta prioridade |
| SEC-07 | Média | CORS amplo com credenciais | `Pendente` | A definir | Antes da produção |
| SEC-08 | Média | Ausência de rate limiting | `Adiado por decisão` | A definir | A definir |
| SEC-09 | Média | Erros internos expostos pela API | `Pendente` | A definir | Antes da produção |
| SEC-10 | Alta | Auditoria e governança LGPD incompletas | `Pendente` | A definir | Antes de dados reais |

`*` O impacto atual de SEC-03 foi reduzido porque o banco contém somente dados
fictícios de protótipo. A prática continua insegura e deve ser corrigida antes da
entrada de qualquer dado pessoal real.

## 5. Especificações e critérios por item

### [ ] SEC-01 — Externalizar e rotacionar o segredo JWT

- **Severidade:** Crítica
- **Estado:** `Pendente`
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
- **Estado:** `Pendente`
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
- **Estado:** `Planejado`
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
- **Estado:** `Adiado por decisão`
- **Decisão atual:** não implementar nesta etapa, por solicitação do responsável
  pelo projeto. O risco permanece conhecido e não deve ser considerado resolvido.
- **Implementação futura esperada:**
  - sanitizar HTML no backend antes da persistência;
  - sanitizar novamente no frontend antes de usar `innerHTML`;
  - usar biblioteca mantida e allowlist mínima de elementos/atributos;
  - implantar Content Security Policy compatível com o editor e a impressão;
  - testar payloads em elementos, atributos, URLs e estilos;
  - revisar o armazenamento do token no navegador em conjunto com SEC-06.
- **Critério para manter adiado:** preencher o Registro de Decisões de Risco com
  responsável, justificativa, controles temporários e data obrigatória de revisão.

### [ ] SEC-05 — Remover estado global do login

- **Severidade:** Alta
- **Estado:** `Pendente`
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
- **Estado:** `Pendente`
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

### [ ] SEC-07 — Restringir CORS e headers de navegador

- **Severidade:** Média
- **Estado:** `Pendente`
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
- **Estado:** `Adiado por decisão`
- **Decisão atual:** não implementar nesta etapa, por solicitação do responsável
  pelo projeto. O risco de força bruta e abuso permanece aberto.
- **Implementação futura esperada:**
  - limitar por IP e identidade, principalmente login e recuperação de conta;
  - aplicar atraso progressivo e bloqueio temporário seguro;
  - não permitir bloqueio permanente provocado por terceiros;
  - criar alertas de tentativas anormais e métricas sem dados sensíveis;
  - considerar limitação de operações caras e exportações.
- **Critério para manter adiado:** preencher o Registro de Decisões de Risco com
  responsável, justificativa, controles temporários e data obrigatória de revisão.

### [ ] SEC-09 — Padronizar erros e proteger logs

- **Severidade:** Média
- **Estado:** `Pendente`
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
- **Estado:** `Pendente`
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

Copiar o modelo abaixo para cada implementação:

```text
ID: SEC-XX
Estado: Aguardando avaliação
Responsável pela implementação:
Data da implementação:
Resumo:
Arquivos alterados:
Testes executados e resultado:
Evidências (sem dados sensíveis):
Risco residual/limitações:
Documentação adicional atualizada:

Avaliador:
Data da avaliação:
Resultado: Aprovado | Reprovado
Observações da avaliação:
Commit:
PR:
Data da verificação pós-publicação:
Resultado pós-publicação:
```

## 9. Registro de decisões de risco

Adiar não significa corrigir. Toda decisão deve ter proprietário e prazo.

| Decisão | Item | Justificativa | Controles temporários existentes | Aprovador | Data | Revisar até |
|---|---|---|---|---|---|---|
| RISK-001 | SEC-04 | Implementação de XSS não será feita nesta etapa | Nenhum controle adicional aprovado; sanitização parcial existente não elimina o risco | A definir | 2026-08-21 | A definir |
| RISK-002 | SEC-08 | Rate limiting não será feito nesta etapa | Nenhum controle compensatório confirmado | A definir | 2026-08-21 | A definir |
| RISK-003 | SEC-03 | Banco versionado contém somente dados fictícios de protótipo; limpeza será posterior | Proibição de inserir dados reais até a limpeza | A definir | 2026-08-21 | Antes de dados reais |

## 10. Histórico de segurança

Nunca registrar valores de segredos, tokens, senhas, CPF, prontuários ou outros
dados pessoais neste histórico.

| Data | Item | Alteração/decisão | Estado resultante | Responsável | Commit/PR |
|---|---|---|---|---|---|
| 2026-08-21 | Geral | Revisão estática inicial e criação do checklist de segurança | Documento criado | Codex | A preencher após aprovação |
| 2026-08-21 | SEC-03 | Confirmado que FDB/ZIP possuem somente dados fictícios; remoção planejada antes de dados reais | `Planejado` | Responsável do projeto | — |
| 2026-08-21 | SEC-04 | Correção de XSS adiada nesta etapa | `Adiado por decisão` | Responsável do projeto | — |
| 2026-08-21 | SEC-08 | Rate limiting adiado nesta etapa | `Adiado por decisão` | Responsável do projeto | — |

## 11. Revisões periódicas

- Revisar este documento mensalmente durante o desenvolvimento e antes de cada
  versão que altere autenticação, permissões, prontuários, documentos ou financeiro.
- Executar revisão completa antes da entrada de dados reais e antes da produção.
- Reavaliar dependências e segredos em cada release.
- Revisar imediatamente após incidente, suspeita de vazamento ou mudança de
  infraestrutura.
- Itens `Adiado por decisão` sem responsável ou data de revisão devem ser tratados
  como pendência de alta prioridade.
