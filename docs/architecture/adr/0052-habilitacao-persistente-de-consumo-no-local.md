# ADR 0052 — Habilitação persistente de Consumo no local

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

A ativação atômica foi aprovada no banco descartável. O banco persistente ainda não admite o novo evento de auditoria nem possui os privilégios mínimos para executar o adaptador.

## Decisão

- criar a ação `EnableTenantFulfillmentActivation`;
- falhar sem concessões se tabelas, auditorias ou versão de produto estiverem ausentes;
- aplicar `0010` apenas se a restrição ainda não admitir o evento;
- conceder inserção nas relações de modalidade e nas duas auditorias;
- conceder atualização somente de `products.version` e `products.updated_at`;
- revogar alteração e exclusão das auditorias;
- não inserir `dine_in`, não escolher produtos e não expor interface nesta fase.

## Consequências

O adaptador poderá ser conectado posteriormente sem capacidade de alterar conteúdo, preço, disponibilidade ou apagar auditoria. A execução exige a senha administrativa local e confirmação humana.

## Reversão

Revogar as concessões adicionadas. A reversão de `0010` exige confirmar antes que não existam eventos `tenant.fulfillment_mode.enabled` persistidos.

## Evidência de aceitação

Em 2026-08-16, o banco persistente local confirmou a migration e os privilégios mínimos sem inserir `dine_in` ou alterar produtos.
