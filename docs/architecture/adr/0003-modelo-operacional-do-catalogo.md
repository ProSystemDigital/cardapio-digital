# ADR 0003 — Modelo operacional do catálogo

| Campo | Valor |
| --- | --- |
| Status | Aceito para avaliação humana |
| Data | 2026-08-12 |
| Decisores | Produto e Engenharia |

## Contexto

A futura persistência depende de contratos estáveis para horários, modalidades, preços, variações e adicionais. Criar tabelas antes dessas invariantes aumentaria retrabalho e permitiria estados inválidos no catálogo.

## Decisão

- representar todos os valores monetários como inteiros em centavos;
- configurar pedido mínimo e taxa demonstrativa de entrega por tenant;
- configurar horários por dia da semana com formato de 24 horas;
- limitar cada produto às modalidades habilitadas pelo respectivo tenant;
- modelar variações como diferenças de preço em relação ao preço-base;
- modelar adicionais em grupos com seleções mínima e máxima;
- rejeitar o catálogo inteiro antes da exposição quando houver referência cruzada, duplicidade, preço negativo, modalidade inválida ou limite inconsistente;
- manter seleção de variações/adicionais e cálculo de pedido personalizado fora desta entrega.

## Alternativas consideradas

- Persistir imediatamente: rejeitada porque tecnologia e isolamento ainda serão decididos em ADR próprio.
- Validar somente na interface: rejeitada porque outras entradas futuras poderiam ignorar as regras.
- Usar valores decimais: rejeitada para evitar imprecisão de ponto flutuante em cálculos monetários.

## Consequências e reversão

O catálogo em memória passa a representar dados mais próximos da operação real e fornece invariantes reaproveitáveis pela persistência futura. Horários ainda não cobrem intervalos múltiplos, feriados, exceções ou operações que atravessam a meia-noite; esses casos exigem decisão adicional.

A interface apenas informa valores operacionais demonstrativos. Ela não permite escolher variações ou adicionais, evitando subtotal incorreto. A reversão consiste em remover os novos campos e o validador antes de existir dado persistido.
