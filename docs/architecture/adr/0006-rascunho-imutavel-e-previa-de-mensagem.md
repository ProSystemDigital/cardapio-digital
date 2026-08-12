# ADR 0006 — Rascunho imutável e prévia da mensagem

| Campo | Valor |
| --- | --- |
| Status | Em avaliação humana |
| Data | 2026-08-12 |
| Decisores | Produto e Engenharia |

## Contexto

Antes de persistir ou enviar pedidos, o produto precisa estabilizar o resumo que será apresentado ao cliente e futuramente encaminhado ao estabelecimento. Linhas do carrinho podem estar desatualizadas em relação ao catálogo e não podem ser convertidas diretamente em pedido.

## Decisão

- reconstruir cada linha a partir dos IDs e do catálogo atual;
- rejeitar tenant incorreto, produto ou opção indisponível, combinação inválida, modalidade incompatível e pedido abaixo do mínimo;
- recalcular preços, taxa e total antes de criar o rascunho;
- gerar um `OrderDraft` imutável, local e com status `preview`;
- formatar mensagem determinística sem identificadores internos ou dados pessoais;
- exibir aviso inequívoco de que o pedido não foi enviado;
- permitir somente cópia para a área de transferência, preservando a prévia se a cópia falhar;
- não criar URL `wa.me`, navegar externamente, chamar API ou webhook.

## Consequências

A jornada possui um contrato de resumo testável antes de banco ou integração. A cópia transfere texto para a área de transferência do dispositivo apenas após ação do usuário; ela não confirma, persiste ou transmite o pedido automaticamente.

A referência local não aparece na mensagem e não é identificador de pedido. O futuro backend deverá gerar sua própria identidade e repetir toda a revalidação em ambiente confiável.

## Reversão

O rascunho existe somente em memória. A reversão remove o modal e as funções de construção/formatação sem migração ou exclusão de dados.
