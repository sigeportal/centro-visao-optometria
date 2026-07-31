# Ficha Clinica - Referencia de Implementacao

## Imagem

`imagens/6 - Configurações Ficha Clinica.png`

## Funcionalidades

- Configuracao de secoes da ficha clinica.
- Toggle para ativar/desativar.
- Ordenacao por arrastar e soltar.
- Aplicacao da ordem nas telas de consulta e impressoes.

## Entidade

`FICHA_SECAO`: `FSC_ID`, `FSC_CHAVE`, `FSC_NOME`, `FSC_ATIVO`, `FSC_ORDEM`, `FSC_EXIBE_TELA`, `FSC_EXIBE_IMPRESSAO`.

## Secoes Iniciais

Anamnese, Prescricao do Ultimo Exame, Acuidade Visual, Biomicroscopia, Ceratometria, Tonometria, Forometria, Oftalmoscopia, Retinoscopia Dinamica, Retinoscopia Estatica, Avaliacao Motora, RX Final, Amplitude de Acomodacao, Afinamento e DX.

## Criterios de Aceite

- Ordem persiste apos recarregar.
- Toggle persiste e altera a ficha imediatamente.
- Apenas secoes ativas aparecem.
- Configuracao separa exibicao em tela e impressao quando o backend suportar.
