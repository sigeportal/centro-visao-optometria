# Dashboard - Referencia de Implementacao

## Imagem

`imagens/1 - Dashboard.png`

## Funcionalidades

- Cards superiores: total de pacientes, agendamentos do dia, consultas realizadas no dia e consultas do mes.
- Lista de proximas consultas com data/hora, paciente, procedimento/profissional e status.
- Listas laterais de aniversariantes do dia e consultas vencidas.
- Bloco de avisos, suporte ou bate-papo, se houver dados.
- Atalhos para listas completas.

## Campos de Retorno

- `resumo.total_pacientes`
- `resumo.agendamentos_hoje`
- `resumo.consultas_realizadas_hoje`
- `resumo.consultas_mes`
- `proximas_consultas[].paciente_nome`
- `proximas_consultas[].data_hora`
- `proximas_consultas[].profissional_nome`
- `proximas_consultas[].procedimento_nome`
- `proximas_consultas[].status`
- `aniversariantes[].nome`
- `aniversariantes[].data_nascimento`
- `consultas_vencidas[].paciente_nome`
- `consultas_vencidas[].data_hora`

## Criterios de Aceite

- Cards mostram zero quando nao ha registros.
- Listas exibem estado vazio amigavel.
- Datas consideram timezone da aplicacao.
- Links levam para agenda, pacientes ou consultas com filtro adequado quando possivel.
