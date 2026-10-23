# ADR 0043 — Leitura persistente da auditoria de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O repositório sanitizado foi aprovado no banco descartável, mas o runtime persistente ainda não pode consultar a trilha de categorias.

## Decisão

- criar a ação operacional `EnableCategoryAuditRead`;
- falhar sem concessão quando `category_audit_events` não existir;
- conceder exclusivamente `SELECT` nessa tabela ao runtime local;
- não alterar privilégios de escrita nem conceder acesso a outras trilhas;
- manter composição autorizada e interface fora desta fase.

## Consequências

O repositório aprovado poderá ser usado no banco persistente sem ampliar mutações. A consulta continuará sujeita a RLS e ao limite definido em código.

## Reversão

Revogar `SELECT` em `category_audit_events` do papel de runtime local.

## Evidência de aceitação

Em 2026-08-16, a ação persistente habilitou exclusivamente a leitura local da auditoria de categorias. Nenhuma composição ou interface fazia parte do gate.
