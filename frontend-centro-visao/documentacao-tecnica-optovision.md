# Documentação técnica observacional — OptoVision

## 1. Identificação

- **Sistema observado:** OptoVision / Centro Visão Optometria
- **URL-base:** `https://centrovisaooptometria.optovision.com.br`
- **Data da observação:** 13/08/2026
- **Contexto:** sessão autenticada como usuário com perfil de Administrador
- **Escopo:** varredura exploratória, somente leitura, das áreas acessíveis pela interface web
- **Objetivo:** documentar navegação, telas, componentes visuais, campos, entidades, fluxos e regras de negócio observáveis

> Esta documentação descreve o comportamento visível na interface. Não foi feita inspeção do código-fonte, banco de dados, APIs internas, filas, jobs, logs ou regras executadas exclusivamente no servidor. Portanto, as regras classificadas como “observáveis” são as que aparecem na UI; hipóteses de implementação estão marcadas como inferências.

## 2. Resumo executivo

O OptoVision é um sistema administrativo para clínica de optometria/oftalmologia. O produto concentra:

- cadastro e histórico de pacientes;
- agenda e fila de espera;
- registro de consultas e atendimentos;
- prescrição de óculos e lentes de contato;
- ficha clínica optométrica detalhada;
- geração de atestados, laudos, declarações e encaminhamentos;
- anexos de arquivos;
- recebimentos, despesas e visão financeira;
- relatórios operacionais e financeiros;
- configuração da clínica, agenda, parceiros, modelos, procedimentos, usuários, permissões e ficha clínica;
- vídeos e treinamentos integrados ao produto;
- atalhos para suporte via WhatsApp, Google Chat e central de ajuda.

O sistema tem aparência de dashboard administrativo responsivo, com barra superior turquesa, menu lateral persistente, cartões de indicadores, tabelas paginadas, filtros, modais e editores de texto ricos.

## 3. Estrutura visual e padrões de interação

### 3.1 Layout global

- Barra superior em tons de turquesa/verde-azulado.
- Logotipo “Vision” no canto superior esquerdo.
- Botão de expansão/recolhimento do menu lateral.
- Menu lateral com ícones e rótulos.
- Área principal clara, com fundo cinza muito claro e cartões brancos.
- Perfil do usuário no canto superior direito, com nome e perfil.
- Ícones de tela cheia, notificações e ajuda na barra superior.
- Breadcrumbs com o caminho `Início / módulo atual`.
- Rodapé comum com marca, ano e telefones de suporte.

### 3.2 Componentes recorrentes

- Cabeçalhos hierárquicos (`h3`, `h4`, `h5`).
- Cartões de KPI com ícones coloridos, número destacado e barra de progresso.
- Tabelas com cabeçalhos ordenáveis, busca, paginação e seletor de quantidade de registros.
- Estados vazios, por exemplo “Nenhum registro encontrado” e “Nenhum pagamento”.
- Botões de ação: adicionar, salvar, alterar, imprimir, pesquisar, filtrar, editar e excluir.
- Modais de criação/edição, como “Novo Agendamento”, “Informações do Pagamento” e “Adicionar arquivos”.
- Campos de data com calendário e placeholders no padrão `dd/mm/yyyy` ou `mm/dd/yyyy`.
- Comboboxes para profissional, procedimento, parceiro, usuário, categoria e status.
- Checkbox para ativação, seleção em lote, dias da semana e itens da ficha clínica.
- Editor de texto rico com negrito, itálico, tamanho, cor, listas, parágrafo e tela cheia.
- Links de WhatsApp para contato de pacientes e suporte.

### 3.3 Padrões de navegação

- Menus principais abrem submenus sem necessariamente trocar de rota.
- Muitas telas usam abas internas por fragmentos de URL, como `#anamnese`, `#consultas`, `#documentos` e `#financeiro`.
- O atendimento de uma consulta reúne várias áreas na mesma experiência: cadastro, histórico, prescrições, ficha clínica, documentos, anexos, financeiro e ajustes.
- Tabelas parecem usar paginação e ordenação no cliente ou em componente de tabela; a implementação não foi confirmada.

## 4. Mapa de navegação

### 4.1 Menu principal

| Módulo | Subáreas observadas |
|---|---|
| Início | Dashboard operacional |
| Agenda | Calendário, fila de espera, novo agendamento |
| Pacientes | Cadastrar, pesquisar, arquivados |
| Consultas | Fila de espera, consultas atendidas |
| Financeiro | Fluxo diário, contas a receber, contas a pagar, visão geral |
| Relatórios | Pacientes, agendamentos, atendimentos, financeiro, consultas, aniversariantes, consultas vencidas, inadimplentes e parceiros |
| Configurações | Ajustes, dados da clínica, parcerias, modelos, procedimentos, usuários, permissões e ficha clínica |
| Vídeos e Treinamentos | Conteúdo de onboarding e ajuda operacional |

### 4.2 Rotas observadas

```text
/home
/agendamentos
/pacientes
/pacientes/create
/pacientes/{id}
/pacientes/{id}/edit
/espera
/consultas
/pacientes/{id}/consultas/{consulta}/prescricoes/create
/financeiro
/financeiro/contas-a-receber
/financeiro/contas-a-pagar
/financeiro/visao-geral
/relatorios/pacientes
/relatorios/agendamentos
/relatorios/atendimentos
/relatorios/financeiro
/relatorios/consultas
/relatorios/aniversariantes
/relatorios/exames-vencidos
/relatorios/inadimplentes
/relatorios/parceiros
/ajustes
/clinica
/oticas
/oticas/create
/modelos
/modelos/create
/procedimentos
/procedimentos/create
/usuarios
/usuarios/create
/regras
/regras/create
/ficha-clinica
/treinamento
```

## 5. Dashboard — `/home`

### 5.1 Conteúdo

O dashboard mostra saudação, data corrente, indicadores e atalhos operacionais:

- Total de pacientes.
- Agendamentos do dia.
- Consultas realizadas no dia.
- Total de consultas no mês.
- Próximas consultas.
- Ajuda via WhatsApp.
- Avisos.
- Aniversariantes do dia.
- Consultas vencendo hoje.
- Bate-papo via Google Chat.

### 5.2 Indicadores observados

Na sessão utilizada para a varredura, foram exibidos valores de exemplo como 7 pacientes, 2 agendamentos do dia, 2 consultas realizadas e 5 consultas no mês. Esses valores são dados do ambiente observado, não regras fixas do produto.

### 5.3 Regras observáveis

- O dashboard é sensível à data corrente da clínica/sessão.
- Os cards parecem ser agregações dos módulos de pacientes, agenda e consultas.
- A área de próximas consultas pode exibir estado vazio.
- Os cards possuem barra de progresso visual, mas não foi possível confirmar a base matemática de cada percentual.

## 6. Pacientes

### 6.1 Pesquisa — `/pacientes`

A tela lista pacientes com:

- busca por nome, CPF ou cidade;
- controle de quantidade por página: 5, 10, 20, 50 ou Todos;
- opção de visualizar pacientes arquivados;
- ação Cadastrar;
- ações por paciente: Agendar, Atender, visualizar histórico, editar e excluir;
- colunas Cod, Nome, Cidade, Data de Nascimento e Consultas.

### 6.2 Cadastro — `/pacientes/create`

#### Informações principais

- Nome do paciente — marcado como obrigatório.
- Nome social ou apelido.
- Data de nascimento.
- Sexo: Feminino, Masculino ou Não informado.
- Celular/WhatsApp.
- Telefone 2.

#### Dados complementares

- E-mail.
- Ocupação.
- CPF.
- RG.
- Como conheceu a clínica:
  - Indicação;
  - Ótica;
  - Panfletagem;
  - Redes sociais.
- Responsável legal: nome e CPF.

#### Endereço

- CEP.
- Logradouro.
- Número.
- Complemento.
- Bairro.
- Estado, com seleção dos estados brasileiros.
- Cidade, dependente do estado.
- Outras cidades, distritos ou povoados.
- Link para consulta de CEP.
- Ação para completar o endereço.

#### Adicionais

- Nota/observação.
- Foto do paciente.
- Cancelar.
- Salvar e Atender.
- Salvar.

### 6.3 Edição — `/pacientes/{id}/edit`

Reutiliza o formulário de cadastro e adiciona:

- status do cliente;
- ativação/desativação do paciente;
- carregamento assíncrono das cidades após seleção do estado.

### 6.4 Histórico do paciente — `/pacientes/{id}`

Abas observadas:

- Informações Pessoais.
- Anamnese.
- Financeiro.
- Consultas.
- Documentos.

#### Informações pessoais

Exibe contato, dados complementares, endereço, cidade, CEP, nota, data de cadastro e origem do paciente. Há botão Editar Paciente e link de WhatsApp quando existe telefone.

#### Anamnese

Mostra o histórico de anamneses com data, profissional responsável e opções. O registro pode expandir os grupos de sintomas, doenças oculares, doenças sistêmicas, medicamentos, cefaleia e outros campos clínicos.

#### Financeiro do paciente

Exibe:

- Receitas.
- Total a receber.
- Total previsto.
- Adicionar pagamento.
- Tabela de data, descrição, categoria, forma de pagamento, situação, valor e opções.
- Valor total.

#### Consultas

Tabela com:

- Número.
- Data da consulta.
- Profissional.
- Procedimento.
- Estado financeiro.
- Visualizar.
- Editar.
- Excluir.

#### Documentos

Agrupa documentos por consulta realizada, informando data e quantidade de documentos.

## 7. Agenda e agendamento

### 7.1 Agenda — `/agendamentos`

Componentes observados:

- filtros por Todos, profissional Katiuscia e profissional Adelino;
- link para Fila de Espera;
- botão Novo Agendamento;
- navegação anterior/próximo;
- visualizações Mês, Semana e Dia;
- botão Agendamentos;
- grade semanal com dias, horários e eventos;
- eventos com intervalo, status visual e nome do paciente.

A grade observada cobria a semana de 09 a 15 de agosto de 2026, com intervalos de 30 minutos entre 08:00 e 17:00.

### 7.2 Novo agendamento

Modal com:

- Profissional.
- Procedimento.
- Paciente.
- Data.
- Horário de início.
- Horário de fim.
- Prioridade.
- Parceria.
- Observação.
- Fechar.
- Salvar.

#### Regras observáveis

- O horário final deve ser maior que o horário inicial.
- O botão Salvar aparece desabilitado enquanto o formulário não está pronto.
- Profissional, procedimento, paciente e parceiro são selecionados por combobox.
- A agenda pode ser filtrada por profissional.
- A duração do procedimento é um dado de configuração que potencialmente influencia os horários.

### 7.3 Fila de espera — `/espera`

Tabela com:

- Horário.
- Nome.
- Cidade.
- Idade.
- Profissional.
- Procedimento.
- Parceria.
- Pagamento.
- Ações.

Possui busca, paginação e estado vazio. A fila representa atendimentos aguardando processamento, inclusive consultas sem agendamento, conforme o link de ajuda associado.

### 7.4 Consultas atendidas — `/consultas`

Lista atendimentos com:

- data e hora;
- nome do paciente;
- CPF quando disponível;
- cidade;
- profissional;
- procedimento;
- ações de editar/excluir.

Há busca e paginação. A ordenação observada é descendente por data/hora.

## 8. Atendimento e consulta

O workspace de atendimento concentra a consulta atual e apresenta:

- paciente, idade e sexo;
- parceria;
- profissional responsável;
- procedimento;
- Finalizar atendimento;
- Cadastro;
- Histórico;
- Prescrição para Óculos;
- Prescrição Lentes de Contato;
- Anamnese e Ficha Clínica;
- Atestados e Documentos;
- Anexos;
- Financeiro;
- Ajustes.

### 8.1 Prescrição para óculos

Campos por OD e OE:

- Esférico.
- Cilíndrico.
- Eixo.
- AV.
- Prisma.
- DNP.

Campos adicionais:

- Adição.
- Tipo de lente, com opções de visão simples, antirreflexo, digital, fotossensível, multifocal e bifocal.
- Retorno.
- Observações.
- Salvar.

Possui aba Início e aba Histórico. O histórico lista título, profissional, data de cadastro e opções.

### 8.2 Prescrição de lentes de contato

Campos por OD e OE:

- Esférico.
- Cilíndrico.
- Eixo.
- AV.

Tipos de lente observados:

- Gelatinosa Incolor Anual.
- Gelatinosa Incolor Descartável.
- Gelatinosa Colorida Anual.
- Gelatinosa Colorida Descartável.
- Tórica Incolor Anual.
- Tórica Colorida Anual.
- Tórica Descartável.
- Rígida.

Também possui observações, histórico e botão Salvar.

### 8.3 Anamnese e ficha clínica

#### Anamnese

- Motivo principal da consulta.
- Data do último exame.
- Observações gerais.
- Sintomas: prurido, fotofobia, hiperemia, pterígio, epífera, trauma, vermelhidão, ardência, dor ocular, lacrimejamento, força a visão, cansaço visual e sensibilidade à luz.
- Doenças oculares: glaucoma, catarata, pterígio, ceratocone, estrabismo e conjuntivite.
- Doenças sistêmicas: hipertensão, diabetes, colesterol, asma, depressão, renite, sinusite, alergias e reumatismo.
- Medicamentos: losartana, captopril, atenolol, nifidipino, propanolol, hidrocloratiazida, metiformina, glibencamida, AAS, sinvastantina, polaramine e omeprazol.
- Campos livres para outros sintomas, doenças e medicamentos.
- Usa óculos, dificuldades para longe/perto.
- Usa lente de contato, dificuldades para longe/perto.
- Cefaleia/dor de cabeça.

#### Antecedentes familiares

- Diabetes.
- Estrabismo.
- Glaucoma.
- Pressão alta.
- Catarata.
- Alguém usa óculos?
- Observações.

#### Prescrição do último exame

Tabela por OD e OE com esférico, cilíndrico, eixo, adição, DNP e altura, além de campo para lentes.

#### Exames e avaliações

| Seção | Campos observados |
|---|---|
| Acuidade Visual | VL, VP e PH para S/C e C/C, em OD, OE e AO |
| Biomicroscopia | Cílios, sobrancelhas, pálpebras, conjuntiva, esclerótica, córnea, íris, pupila, cristalino, câmara anterior e observações para OD/OE |
| Ceratometria | Técnica, OD, OE e miras; técnica padrão observada: AutoRefratômetro |
| Tonometria | Técnica, OD, OE e hora; técnica padrão observada: Transpalpebral |
| Forometria | Técnica e medições S/C e C/C para longe, 40 cm e 20 cm |
| Oftalmoscopia | Técnica, reflexo de Bruckner, papila, escavação, mácula, fixação, cor, relação A/V e observações para OD/OE |
| Retinoscopia Dinâmica | Resultado e AV para OD/OE |
| Retinoscopia Estática | Resultado e AV para OD/OE |
| Avaliação Motora | Kappa, Hirschberg, ducções e versões |
| RX Final | Esférico, cilíndrico, eixo, AV, adição, AV de perto, tipo de lente e tratamento |
| Amplitude de Acomodação | Técnica e nível de OD/OE; técnica observada: Sheard 40 cm |
| Afinamento | Resultado e AV para OD/OE |
| DX | Refrativo, motor e ocular |
| Flexibilidade e Facilidade de Acomodação | Técnica e ciclos de OD/OE; técnica observada: Flipper 40 cm |
| Adição | Resultado e AV para OD/OE |
| PPC | OR, luz e filtro em S/C e C/C |
| Reflexos Pupilares | Fotomotor, consensual e acomodativo para OD/OE |
| Reservas Fusionais | Técnica e RFN/RFP para VL e VP |
| Subjetivo | Resultado e AV para OD/OE |
| Teste Ambulatorial | Tempo e resultado |

As seções são expansíveis/recolhíveis e a ficha possui botão Salvar.

### 8.4 Documentos do atendimento

Subseções:

- Ver Todos.
- Atestado.
- Laudo.
- Declaração.
- Encaminhamento.

Cada documento possui seleção de modelo, editor de texto e Salvar.

Modelos observados:

- Atestado.
- Laudo Optométrico.
- Declaração.
- Termo de Autorização.
- Encaminhamento.

### 8.5 Anexos

- Lista de arquivos do atendimento.
- Estado vazio “Nenhum arquivo encontrado”.
- Botão Adicionar.
- Modal “Adicionar arquivos”.
- Upload por arrastar e soltar ou seleção de arquivo.

O upload não foi executado durante a varredura.

### 8.6 Financeiro no atendimento

Modal “Informações do Pagamento” com:

- paciente, bloqueado para edição;
- procedimento, bloqueado para edição, Consulta ou Retorno;
- profissional, bloqueado para edição;
- parceria;
- valor da consulta;
- forma de pagamento: dinheiro, débito, crédito, dinheiro/cartão, transferência bancária, parceiro ou PIX;
- recebido;
- data de vencimento;
- Fechar e Salvar.

### 8.7 Ajustes da consulta

Campos:

- data da consulta;
- hora;
- retorno em;
- profissional que atendeu;
- procedimento Consulta ou Retorno;
- Alterar.

## 9. Atestados, documentos e modelos

### 9.1 Lista de documentos

Tabela com número, título, profissional, data de cadastro e opções.

### 9.2 Modelos — `/modelos`

Lista de modelos com:

- título;
- descrição;
- status;
- editar/excluir.

Modelos observados no ambiente:

- Atestado.
- Declaração.
- Encaminhamento.
- Laudo Optométrico.
- Prescrição Lente.
- Prescrição Óculos.
- Prescrição Óculos — Longe e Perto.
- Termo de Autorização.

### 9.3 Cadastro de modelo — `/modelos/create`

- Título.
- Categoria: Atestado, Declaração, Encaminhamento, Laudo, Prescrição Óculos ou Prescrição Lente.
- Descrição em editor rico.
- Ativar modelo: Não ou Sim.
- Cancelar e Confirmar.

### 9.4 Variáveis dinâmicas observadas

Modelos/ficha clínica exibem placeholders como:

- `{clinica.logo}`
- `{clinica.cidade}`
- `{paciente.nome}`
- `{dia}`
- `{mes}`
- `{ano}`

Esses placeholders indicam um mecanismo de substituição de dados no momento da geração do documento. O funcionamento completo e a lista oficial de variáveis não foram confirmados.

## 10. Financeiro

### 10.1 Fluxo diário — `/financeiro`

Filtros:

- período: hoje, semana, mês, últimos 30 dias ou período personalizado;
- tipo: Todos, Receita ou Despesa;
- profissional;
- forma de pagamento;
- procedimento;
- conta: Clínica, Conta do banco ou Cartão;
- parceria;
- situação: Todas, A receber, Recebido, A pagar, Pago ou Em atraso;
- categoria.

Ações:

- Pesquisar.
- Atualizar.
- Nova receita.
- Nova despesa.
- Imprimir.
- Configurar colunas.
- Ações em lote.

Indicadores:

- receitas em aberto;
- receitas realizadas;
- despesas em aberto;
- despesas realizadas;
- total do período;
- total a receber;
- total a pagar;
- formas de pagamento;
- entrada, saída e resultado.

Tabela principal:

- data;
- descrição;
- forma de pagamento;
- situação;
- valor;
- saldo;
- opções.

### 10.2 Contas a receber

Especializa o fluxo financeiro para receitas e exibe:

- vencidos;
- a vencer;
- a receber;
- recebidos;
- total do período.

Possui Nova receita, Imprimir e ações em lote.

### 10.3 Contas a pagar

Especializa o fluxo financeiro para despesas e exibe:

- vencidos;
- vencem hoje;
- a vencer;
- pagos;
- total do período.

Possui Nova despesa, Imprimir e ações em lote.

### 10.4 Visão geral — `/financeiro/visao-geral`

Dashboard financeiro com:

- receitas do mês;
- despesas do mês;
- saldo do mês;
- saldo em caixa;
- vencidos;
- a receber;
- a pagar;
- transações recentes de receitas;
- transações recentes de despesas;
- evolução dos valores dos últimos seis meses;
- serviços mais vendidos;
- categorias mais usadas.

A própria tela informa que o comparativo dos últimos seis meses considera somente lançamentos já pagos/recebidos.

## 11. Relatórios

Os relatórios usam filtros de período, busca, tabelas paginadas e, em diversas telas, Exportar CSV e Imprimir.

### 11.1 Relatório de pacientes

Filtros de período e origem do paciente. Colunas:

- número;
- nome;
- CPF;
- contato;
- como chegou à clínica;
- data de cadastro;
- envio de mensagem.

### 11.2 Relatório de agendamentos

Colunas:

- número;
- agendado para;
- paciente;
- procedimento;
- profissional;
- parceira;
- data de cadastro do agendamento;
- status.

Status observado: ATENDIDO.

### 11.3 Relatório de atendimentos

Colunas:

- número;
- paciente;
- data da consulta;
- procedimento;
- profissional;
- parceira;
- formas de pagamento;
- valor pago.

### 11.4 Relatório financeiro

Filtros:

- data inicial;
- data final;
- profissional;
- forma de pagamento;
- parceria;
- procedimento.

### 11.5 Relatório de consultas

Filtros:

- período inicial/final;
- profissional;
- procedimento;
- parceria.

### 11.6 Aniversariantes

Colunas:

- dia;
- nome;
- aniversário;
- contato;
- cidade;
- envio de mensagem.

### 11.7 Consultas/exames vencidos

Colunas:

- número;
- paciente;
- contato;
- cidade;
- última consulta;
- vencimento;
- envio de mensagem.

### 11.8 Inadimplentes

Colunas:

- número;
- paciente;
- procedimento;
- data de vencimento;
- valor;
- parceiro;
- status;
- cobrança.

### 11.9 Parceiros

Filtros:

- período;
- parceiro;
- procedimento.

Resultado com nome do parceiro e total de consultas.

## 12. Configurações

### 12.1 Ajustes — `/ajustes`

O módulo possui grupos configuráveis:

#### Contas

- Clínica.
- Conta do banco.
- Cartão.

#### Tipos de pagamento

- Dinheiro.
- Cartão Débito.
- Cartão Crédito.
- Dinheiro/Cartão.
- Transferência Bancária.
- Parceiro.
- PIX.

#### Categorias de despesa

- Custos Fixos.
- Aluguel.
- Contabilidade.
- Encargos de funcionários.
- Outras Despesas.

#### Categorias de receita

- Receitas de serviços.
- Receitas de vendas.
- Receitas Financeiras.
- Outras receitas.

Todos os registros observados possuíam situação ATIVO.

### 12.2 Dados da clínica — `/clinica`

#### Informações da clínica

- Nome.
- Contato.
- Responsável.
- CNPJ.
- Endereço.
- Cidade.
- Estado.
- Logomarca.

#### Configuração da agenda

- horário de início;
- horário de fim;
- dias da semana: domingo a sábado;
- possui intervalo;
- início do intervalo;
- fim do intervalo.

### 12.3 Parcerias — `/oticas`

Cadastro/listagem com:

- número;
- nome;
- cidade;
- contato;
- data de cadastro;
- ativo;
- editar.

No ambiente observado havia parceiros como Ótica demo, Ótica Farol, Ótica Silva, Particular e Wolnei.

Cadastro de parceiro:

- nome obrigatório;
- telefone;
- e-mail;
- responsável;
- CNPJ;
- endereço;
- cidade;
- estado;
- ativo;
- Cancelar e Confirmar.

### 12.4 Procedimentos — `/procedimentos`

Lista com:

- nome;
- tempo;
- valor;
- ativo;
- editar.

Cadastro de procedimento:

- nome do procedimento;
- valor;
- duração em minutos;
- cor de identificação;
- procedimento ativo;
- visível no agendamento.

#### NFS-e

- descrição fiscal;
- item da Lista de Serviço — LC 116/03;
- código de serviço municipal;
- NBS;
- CNAE.

As listas fiscais são extensas e incluem classificações de serviços de saúde, informática, administração, comércio e várias outras atividades.

### 12.5 Usuários — `/usuarios`

Lista com:

- nome;
- e-mail;
- telefone;
- perfil;
- ativo;
- editar/excluir.

Perfis observados:

- Administrador.
- Optometrista.
- Atendente.
- Oftalmologista.

Cadastro de usuário:

- nome;
- login;
- senha;
- e-mail;
- telefone;
- perfil;
- foto;
- especialidade;
- conselho profissional: CBOO, CROO, CRM, ABTO ou AOOB;
- UF do conselho;
- número do conselho;
- assinatura digital;
- status Ativo.

Regra de entrada exibida: o login não pode conter espaços em branco ou caracteres especiais.

### 12.6 Permissões — `/regras`

Perfis de permissão observados:

- Administrador.
- Atendente.
- Oftalmologista.
- Optometrista.

Cadastro/edição de permissão:

- descrição;
- Agenda;
- Pagamentos;
- Pacientes;
- Consultas;
- Financeiro;
- Notas Fiscais;
- Relatórios;
- Configurações;
- Clínica;
- Início/Widgets.

O modelo é baseado em permissões por módulo, representadas por checkbox.

### 12.7 Ficha clínica — `/ficha-clinica`

A tela informa que é possível ativar/desativar e organizar as opções exibidas na ficha clínica.

Seções configuráveis:

- Anamnese.
- Prescrição do Último Exame.
- Acuidade Visual.
- Biomicroscopia.
- Ceratometria.
- Tonometria.
- Forometria.
- Oftalmoscopia.
- Retinoscopia Dinâmica.
- Retinoscopia Estática.
- Avaliação Motora.
- RX Final.
- Amplitude de Acomodação.
- Afinamento.
- DX.
- Flexibilidade e Facilidade de Acomodação.
- Adição.
- PPC.
- Reflexos Pupilares.
- Reservas Fusionais.
- Subjetivo.
- Teste Ambulatorial.

Também existe opção Exibir rodapé e editor de conteúdo do rodapé. Exemplo observado:

```text
Assinatura:___________________________ {clinica.cidade}, {dia} de {mes} de {ano}.
```

## 13. Casos de uso

### UC-01 — Consultar indicadores do dia

- **Ator:** usuário autenticado.
- **Pré-condição:** acesso ao sistema.
- **Fluxo:** abrir Início; visualizar cards de pacientes, agenda e consultas; abrir listas completas quando necessário.
- **Resultado:** usuário obtém uma visão resumida da operação.

### UC-02 — Cadastrar paciente

- **Ator:** atendente ou administrador autorizado.
- **Fluxo:** Pacientes → Cadastrar; preencher dados pessoais, contato, origem, endereço e observações; salvar ou salvar e atender.
- **Resultado:** paciente fica disponível na pesquisa e pode entrar na agenda/atendimento.

### UC-03 — Pesquisar e abrir histórico

- **Ator:** usuário autorizado.
- **Fluxo:** Pacientes → Pesquisar; buscar por nome, CPF ou cidade; abrir paciente.
- **Resultado:** acesso a dados pessoais, anamnese, financeiro, consultas e documentos.

### UC-04 — Agendar atendimento

- **Ator:** usuário autorizado.
- **Fluxo:** abrir Agenda; escolher Novo Agendamento; selecionar profissional, procedimento, paciente, data, horários e parceria; informar observação; salvar.
- **Regra:** horário final deve ser posterior ao inicial.
- **Resultado:** evento aparece na grade e pode alimentar fila/atendimento.

### UC-05 — Atender paciente

- **Ator:** atendente, optometrista, oftalmologista ou administrador, conforme permissão.
- **Fluxo:** abrir fila, agenda ou paciente; iniciar atendimento; preencher anamnese, exames, prescrições e documentos; salvar; finalizar.
- **Resultado:** consulta passa para consultas atendidas e fica vinculada ao histórico do paciente.

### UC-06 — Emitir prescrição de óculos

- **Ator:** profissional autorizado.
- **Fluxo:** atendimento → Prescrição para Óculos; informar refração OD/OE, adição, lente, retorno e observações; salvar.
- **Resultado:** prescrição é armazenada no histórico da consulta/paciente.

### UC-07 — Emitir prescrição de lentes de contato

- **Ator:** profissional autorizado.
- **Fluxo:** atendimento → Prescrição Lentes de Contato; informar parâmetros OD/OE, tipo de lente e observações; salvar.
- **Resultado:** prescrição fica disponível no histórico.

### UC-08 — Preencher ficha clínica

- **Ator:** profissional autorizado.
- **Fluxo:** abrir Anamnese e Ficha Clínica; expandir seções; preencher tabelas e campos; salvar.
- **Resultado:** ficha clínica fica vinculada ao atendimento e pode compor documentos.

### UC-09 — Emitir documento clínico

- **Ator:** profissional autorizado.
- **Fluxo:** Atestados e Documentos; escolher categoria e modelo; editar o texto; salvar.
- **Resultado:** documento aparece no histórico do paciente e/ou consulta.

### UC-10 — Anexar arquivo

- **Ator:** usuário autorizado.
- **Fluxo:** abrir Anexos; Adicionar; arrastar arquivo ou selecionar arquivo.
- **Resultado esperado:** arquivo associado ao atendimento. O upload não foi executado durante a varredura.

### UC-11 — Registrar pagamento

- **Ator:** usuário autorizado.
- **Fluxo:** abrir Financeiro no atendimento ou histórico; informar valor, forma, parceria e vencimento; salvar.
- **Resultado:** lançamento passa a alimentar financeiro, contas a receber e relatórios.

### UC-12 — Gerenciar despesas e receitas

- **Ator:** administrador ou usuário com permissão financeira.
- **Fluxo:** abrir Fluxo Diário; filtrar; criar receita/despesa; consultar situação; imprimir ou agir em lote.
- **Resultado:** saldos e indicadores financeiros são atualizados.

### UC-13 — Configurar clínica e agenda

- **Ator:** administrador.
- **Fluxo:** Configurações → Dados da Clínica; atualizar identificação, horários, dias e intervalo; confirmar.
- **Resultado:** dados institucionais e disponibilidade da agenda são alterados.

### UC-14 — Configurar permissões

- **Ator:** administrador.
- **Fluxo:** Configurações → Permissões; criar/editar perfil; marcar módulos; salvar.
- **Resultado:** usuários vinculados ao perfil passam a ter acesso conforme a configuração.

## 14. Regras de negócio observáveis

### Pacientes

- Nome do paciente é explicitamente marcado como obrigatório.
- A busca informa suporte a Nome, CPF ou Cidade.
- Pacientes podem ser arquivados e consultados em lista separada.
- A cidade depende da seleção do estado.
- O sistema permite salvar diretamente ou salvar iniciando um atendimento.
- O cadastro tem relacionamento com origem do paciente, parceiro, consultas e documentos.

### Agenda

- Agendamentos relacionam paciente, profissional, procedimento, horário, parceria e observação.
- A duração do procedimento é configurável.
- O fim precisa ser maior que o início.
- Agenda e fila são superfícies diferentes para o mesmo fluxo operacional.
- A agenda suporta filtros por profissional e visualizações Mês, Semana e Dia.

### Atendimento

- Um atendimento é contextualizado por paciente, profissional, procedimento e parceria.
- Consulta e Retorno são procedimentos recorrentes em comboboxes financeiros e de ajuste.
- A finalização do atendimento é uma ação explícita.
- A ficha clínica é modular e configurável por seção.

### Documentos

- Documentos são baseados em modelos categorizados.
- Modelos podem ser ativados/desativados.
- O texto usa variáveis dinâmicas para dados de clínica e paciente.

### Financeiro

- Receitas e despesas são tratadas separadamente e também em fluxo consolidado.
- Há estados A receber, Recebido, A pagar, Pago e Em atraso.
- Formas de pagamento são configuráveis.
- Contas, categorias e parceiros são dimensões de filtragem.
- A visão dos últimos seis meses considera somente lançamentos liquidados, segundo o texto da própria tela.

### Segurança e acesso

- O sistema possui perfis de usuário e perfis de permissão.
- A UI expõe módulos separados para permissões de Agenda, Pagamentos, Pacientes, Consultas, Financeiro, Notas Fiscais, Relatórios, Configurações, Clínica e Widgets.
- A autenticação, expiração de sessão, MFA e autorização server-side não foram testadas.

## 15. Entidades e relacionamentos inferidos

```text
Clínica
 ├── Usuários ── Perfil/Permissões
 ├── Parceiros/Óticas
 ├── Procedimentos
 ├── Modelos de documentos
 ├── Configurações financeiras
 └── Configuração da agenda

Paciente
 ├── Agendamentos
 ├── Consultas/Atendimentos
 │    ├── Anamnese/Ficha clínica
 │    ├── Prescrição de óculos
 │    ├── Prescrição de lentes de contato
 │    ├── Documentos
 │    ├── Anexos
 │    └── Pagamentos
 └── Histórico consolidado
```

Os relacionamentos acima são inferidos pelos menus, URLs, tabelas e agrupamentos da interface; os nomes reais das tabelas ou entidades persistidas não foram confirmados.

## 16. Integrações e links externos observados

- Central de ajuda: `ajuda.optovision.com.br`.
- WhatsApp para suporte.
- WhatsApp para contato/cobrança de pacientes.
- Google Chat para comunicação com a equipe.
- Consulta de CEP dos Correios.
- Site institucional `optovision.com.br`.
- Campos de NFS-e, LC 116/03, NBS e CNAE para configuração fiscal de procedimentos.

## 17. Exportações e impressão

Foram observados recursos de:

- Exportar CSV em relatórios de pacientes, atendimentos, aniversariantes e parceiros.
- Imprimir relatórios.
- Imprimir ou configurar colunas no financeiro.
- Possível geração/impressão de documentos clínicos a partir dos modelos.

Os arquivos exportados não foram baixados durante a varredura.

## 18. Estados vazios e dados observados

O ambiente continha registros de demonstração/teste e dados operacionais. Para evitar duplicação de dados pessoais, este documento não reproduz CPF, e-mail, telefone ou endereço completos.

Estados vazios observados:

- nenhuma próxima consulta no dashboard;
- nenhuma consulta vencendo hoje;
- nenhuma ficha clínica histórica em uma das visões;
- nenhum anexo;
- nenhum pagamento para um paciente;
- nenhuma receita/despesa no período financeiro filtrado;
- fila de espera vazia;
- aniversariantes vazios;
- consultas vencidas vazias;
- inadimplentes vazios.

## 19. Pontos de atenção para engenharia e produto

- Padronizar textos e acentuação exibidos na UI, pois foram observadas grafias inconsistentes como “Renite”, “Doênças”, “Epífera”, “Forometria”, “Visualisar” e “Preríodo”.
- Padronizar máscaras de data: algumas telas exibem placeholder `dd/mm/yyyy`, enquanto o formulário de paciente exibiu `mm/dd/yyyy`.
- Revisar mensagens de estado vazio e feedback após salvar, pois vários fluxos dependem de modais e tabelas dinâmicas.
- Confirmar validações de CPF, e-mail, telefone, datas, intervalos e campos obrigatórios no servidor.
- Garantir autorização server-side para todas as rotas, não apenas ocultação no menu.
- Validar proteção de dados pessoais e de saúde, especialmente em exportações, WhatsApp, documentos e anexos.
- Controlar acesso a arquivos anexados e assinaturas digitais.
- Definir política de auditoria para alterações em pacientes, fichas, prescrições, pagamentos e permissões.
- Documentar a lista oficial de variáveis dinâmicas dos modelos.
- Documentar a fonte e a regra dos percentuais dos cards do dashboard.
- Avaliar acessibilidade dos ícones, botões com rótulos apenas visuais e editores ricos.
- Testar comportamento responsivo em telas menores e navegação por teclado.
- Confirmar idempotência e consistência transacional de salvar atendimento, pagamento e documento.

## 20. Lacunas da varredura

- Não foram testados login, logout, recuperação de senha ou troca de usuário.
- Não foram enviados formulários, salvos registros, excluídos itens, finalizados atendimentos ou alteradas configurações.
- Não foram feitos uploads ou downloads.
- Não foram inspecionadas APIs, requisições de rede, banco de dados, código-fonte ou infraestrutura.
- Não foram exercitados todos os botões de ação em registros existentes.
- A documentação cobre as rotas e fluxos acessíveis pelo menu e pelos links encontrados, mas não garante a descoberta de endpoints ocultos, experimentais ou dependentes de permissões adicionais.
- Os valores de ambiente, registros, contagens e nomes de profissionais são exemplos da sessão observada e podem mudar.

## 21. Checklist recomendado para uma próxima etapa

- [ ] Inventariar APIs e contratos de dados.
- [ ] Mapear permissões por rota e por ação.
- [ ] Testar validações de cada formulário.
- [ ] Testar transições de status de agendamento e consulta.
- [ ] Testar pagamentos, estornos, vencimentos e inadimplência.
- [ ] Testar geração, edição, impressão e assinatura de documentos.
- [ ] Testar upload, visualização, exclusão e autorização de anexos.
- [ ] Testar exportações CSV com dados reais anonimizados.
- [ ] Testar regras de retenção, anonimização e auditoria para dados pessoais e clínicos.
- [ ] Criar uma matriz de rastreabilidade entre casos de uso, telas, permissões e entidades.
- [ ] Criar testes automatizados de regressão para agenda, atendimento e financeiro.

