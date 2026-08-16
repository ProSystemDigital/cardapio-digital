# ADR 0023 — Modalidades por produto controladas

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

A leitura aprovada na Fase 3.12 permite conferir mesa, retirada e entrega por produto. A administração precisa ajustar essas relações sem criar modalidades, misturar tenants ou deixar um produto sem forma de atendimento.

## Decisão

- oferecer somente modalidades já habilitadas no tenant derivado;
- exigir ao menos uma modalidade, sem duplicatas e dentro do vocabulário fechado;
- renovar autenticação, identidade interna, membership e `catalog.product.update` na Server Action;
- validar novamente as modalidades permitidas no PostgreSQL sob RLS;
- substituir o conjunto dentro da mesma transação que incrementa a versão e registra auditoria;
- conceder ao runtime somente `UPDATE` de versão e instante do produto, `INSERT/DELETE` na relação e `INSERT` na auditoria;
- não permitir criação, remoção ou configuração das modalidades do tenant nesta fase.

## Consequências

Proprietário e gerente podem ajustar compatibilidade operacional com falha fechada, concorrência otimista e trilha pública. O formulário não envia tenant, papel ou ator. A criação e a governança das modalidades do estabelecimento permanecem bloqueadas.

## Reversão

Revogar `INSERT/DELETE` em `product_fulfillment_modes`, remover a Server Action e o formulário, mantendo a apresentação somente leitura da Fase 3.12.

## Evidência de aceitação

Em 2026-08-15, o gate descartável confirmou migrations, RLS, isolamento, snapshots, substituição atômica das modalidades, auditoria e ciclo `down/up`. A concessão mínima foi aplicada no banco local persistente e a revisão humana visual, funcional e arquitetural aprovou a operação administrativa.
