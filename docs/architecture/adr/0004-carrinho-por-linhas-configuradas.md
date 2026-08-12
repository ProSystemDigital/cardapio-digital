# ADR 0004 — Carrinho por linhas configuradas

| Campo | Valor |
| --- | --- |
| Status | Em avaliação humana |
| Data | 2026-08-12 |
| Decisores | Produto e Engenharia |

## Contexto

O carrinho anterior armazenava apenas quantidade por produto e não conseguia distinguir variações ou adicionais. Aceitar o preço calculado pela interface também criaria risco de manipulação e divergência quando houver persistência.

## Decisão

- representar o carrinho como linhas identificadas, vinculadas ao tenant e ao produto;
- armazenar somente IDs de variação e adicionais escolhidos, quantidade e preço unitário derivado;
- recalcular o preço exclusivamente a partir do catálogo validado ao criar ou editar uma linha;
- exigir variação quando o produto possuir variações;
- validar pertencimento, disponibilidade, duplicidade e limites de adicionais no domínio;
- mesclar linhas com configuração idêntica e manter separadas configurações diferentes;
- permitir edição, alteração de quantidade e remoção enquanto o carrinho permanecer em memória;
- reinicializar o estado pela identidade do tenant e não coletar dados pessoais.

## Consequências

O subtotal passa a representar produtos personalizados sem confiar em valores fornecidos pela interface. Uma alteração posterior de catálogo não revalida automaticamente linhas já abertas na aba; persistência e checkout deverão recalcular todas as linhas novamente antes da confirmação.

O modal controla foco, teclado, fechamento por `Escape` e opções indisponíveis. Ainda não existe escolha de modalidade, taxa aplicada ao total, pedido persistido ou envio externo.

## Reversão

Como não existe persistência, a reversão remove o modelo de linhas e a interface de personalização sem migração de dados.
