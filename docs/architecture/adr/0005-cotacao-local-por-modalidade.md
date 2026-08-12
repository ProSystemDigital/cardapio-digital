# ADR 0005 — Cotação local por modalidade de atendimento

| Campo | Valor |
| --- | --- |
| Status | Em avaliação humana |
| Data | 2026-08-12 |
| Decisores | Produto e Engenharia |

## Contexto

Mesa, retirada e entrega alteram compatibilidade, taxa e total do pedido. Esses cálculos precisam ser estabilizados antes de solicitar mesa, endereço ou identificação e antes de persistir ou enviar qualquer pedido.

## Decisão

- oferecer somente as modalidades habilitadas pelo tenant;
- validar todas as linhas contra a modalidade antes de aceitar a troca;
- manter a seleção anterior e informar os itens incompatíveis quando a troca for inválida;
- calcular subtotal, taxa, total e valor faltante para o mínimo em centavos;
- aplicar taxa exclusivamente à entrega e obtê-la da configuração do tenant;
- considerar a cotação apta somente quando houver itens válidos, modalidade selecionada, mínimo atingido e nenhuma incompatibilidade;
- manter a ação de envio desabilitada, mesmo diante de cotação válida;
- não solicitar número de mesa, nome, telefone ou endereço nesta fase.

## Consequências

A aplicação consegue demonstrar o impacto financeiro e operacional das modalidades sem iniciar tratamento de dados pessoais. A cotação não constitui pedido, reserva de preço, confirmação ou aceite do estabelecimento.

O cálculo usa as linhas locais já derivadas do catálogo. O futuro checkout deverá revalidar catálogo, preços, disponibilidade, modalidade, mínimo e taxa no servidor antes de gerar um pedido.

## Reversão

Como modalidade e cotação existem somente no estado da aba, a reversão remove o seletor e o cálculo sem migração de dados.
