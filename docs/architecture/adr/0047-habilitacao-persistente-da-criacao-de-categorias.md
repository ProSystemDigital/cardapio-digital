# ADR 0047 — Habilitação persistente da criação de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

A criação auditada foi aprovada no banco descartável. O banco persistente ainda não admite `category.created` nem permite inserir categorias.

## Decisão

- criar a ação `EnableCategoryCreation`;
- exigir a fundação `category_audit_events` antes de qualquer concessão;
- aplicar `0009` apenas quando a restrição ainda não admitir criação;
- conceder somente `INSERT` em `categories` e `category_audit_events`;
- revogar alteração e exclusão da trilha;
- manter composição autorizada, Server Action e formulário fora desta fase.

## Consequências

O adaptador aprovado poderá operar no banco local persistente sem conceder exclusão, arquivamento, alteração de slug ou adulteração de eventos.

## Reversão

Revogar os dois privilégios de inserção. A reversão de `0009` exige confirmar previamente que não há eventos `category.created` persistidos.

## Evidência de aceitação

Em 2026-08-16, o banco local persistente confirmou a migration e a concessão mínima de criação de categorias.
