# Agenda - Referencia de Implementacao

## Imagens

- `imagens/5.1 - Tela Agendamentos.png`
- `imagens/5.2 - Novo Agendamento.png`
- `imagens/5.3 - Detalhes Agendamento.png`

## Telas

- Grade de agenda por profissional e consolidada.
- Filtros: Todos e profissionais individuais.
- Modos: Mes, Semana, Dia e Agendamentos.
- Modal de novo agendamento.
- Modal de detalhes com status e lancamento financeiro.

## Campos do Agendamento

`id`, `paciente_id`, `profissional_id`, `procedimento_id`, `data`, `hora_inicio`, `hora_fim`, `status`, `prioridade`, `parceria_id`, `observacao`, `criado_em`, `criado_por`.

## Criterios de Aceite

- Novo agendamento valida obrigatorios e horario final maior que inicial.
- Service impede conflito de horario para o mesmo profissional.
- Alteracao de status persiste e atualiza a tela.
- Detalhe mostra paciente, WhatsApp, nascimento/idade, profissional, procedimento, parceria, observacoes e criacao.
- Lancar pagamento cria ou encaminha para financeiro vinculado ao agendamento/consulta.
