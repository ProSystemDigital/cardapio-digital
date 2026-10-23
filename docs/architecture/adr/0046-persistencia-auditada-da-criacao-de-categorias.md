# ADR 0046 — Persistência auditada da criação de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O contrato de criação foi aprovado, mas a auditoria aceita apenas atualização e ainda não existe adaptador que derive identificador e slug ou garanta atomicidade.

## Decisão

- adicionar migration reversível que admite `category.created` na trilha existente;
- não conceder privilégios na migration;
- gerar UUID e slug técnico `category-<uuid>` exclusivamente no adaptador;
- inserir categoria e evento na mesma transação sob contexto RLS;
- registrar somente nome e ordem no JSON de mudanças;
- comprovar rollback da categoria quando o evento não puder referenciar um ator persistente;
- conceder `INSERT` somente ao papel descartável durante o gate;
- manter banco persistente, composição autorizada e formulário desconectados.

## Consequências

Várias categorias poderão ser criadas sem aceitar identificador ou slug do navegador e sem existir categoria sem evidência correspondente.

## Reversão

Remover eventos e categorias fictícias do gate descartável, aplicar `0009_category_creation.down.sql` e então seguir o rollback normal de `0008`.

## Evidência de aceitação

Em 2026-08-16, o gate PostgreSQL descartável confirmou criação, ID e slug derivados, auditoria atômica, rollback em falha do evento, RLS, `down/up` e limpeza do papel temporário.
