# ADR 0039 — Habilitação persistente de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O adaptador PostgreSQL foi aprovado no banco descartável. Antes de compor identidade ou expor uma ação, o banco persistente local precisa receber a migration e somente os privilégios indispensáveis.

## Decisão

- criar a ação operacional `EnableCategoryWrite`;
- recusar estados parciais entre `categories.version` e `category_audit_events`;
- aplicar `0008` apenas quando ambos ainda estiverem ausentes;
- conceder `UPDATE` somente em nome, ordem, versão e instante;
- conceder somente `INSERT` na auditoria e revogar sua alteração e exclusão;
- manter leitura da auditoria, composição autorizada, Server Action e interface fora desta fase.

## Consequências

O runtime persistente poderá executar o adaptador já aprovado sem receber criação, exclusão, arquivamento, alteração de slug ou capacidade de adulterar eventos.

## Reversão

Revogar as concessões do runtime. A reversão da migration exige antes confirmar que nenhum consumidor ou evento persistente depende da fundação.

## Evidência de aceitação

Em 2026-08-16, a ação persistente aplicou a fundação e habilitou a escrita local com privilégio mínimo. Nenhuma composição ou interface fazia parte do gate.
