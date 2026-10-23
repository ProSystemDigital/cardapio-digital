# ADR 0051 — Persistência auditada de Consumo no local

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

Ativar `dine_in` apenas no tenant exporia uma modalidade sem produtos compatíveis. A ativação precisa manter tenant, produtos e auditorias coerentes mesmo diante de falha.

## Decisão

- ampliar reversivelmente a auditoria do perfil para `tenant.fulfillment_mode.enabled`;
- exigir seleção explícita, única e não vazia de até 200 produtos ativos do tenant;
- bloquear toda a transação se qualquer produto não pertencer ao tenant;
- inserir a modalidade no tenant e nos produtos selecionados na mesma transação;
- incrementar a versão dos produtos e registrar um evento em cada trilha de produto;
- registrar na trilha do tenant somente o rótulo público e a quantidade inicial, sem lista de UUIDs;
- manter banco persistente, privilégio permanente, composição e interface fora desta fase.

## Consequências

O catálogo nunca observa a ativação sem ao menos um produto compatível. Produtos não selecionados permanecem inalterados e poderão receber a modalidade posteriormente pelo fluxo já existente.

## Reversão

O gate remove eventos e relações fictícias de `dine_in`, aplica `0010` para baixo e segue o ciclo normal de rollback. Dados persistentes reais não são alterados nesta fase.

## Evidência de aceitação

Em 2026-08-16, o gate PostgreSQL descartável aprovou ativação atômica, produto inicial exclusivo, auditorias, RLS, limpeza, `down/up` e remoção do papel temporário.
