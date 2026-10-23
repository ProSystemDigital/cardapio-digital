# ADR 0029 — Adaptador PostgreSQL do perfil do tenant

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O comando portável foi aprovado e a persistência já possui versão e auditoria próprias. Falta comprovar que um adaptador real atualiza o perfil sem sobrescrever concorrência e sem separar alteração e evidência em transações diferentes.

## Decisão

- implementar `PostgresTenantProfileCommandRepository` atrás da porta existente;
- definir `app.tenant_id` localmente em cada transação;
- atualizar somente nome curto, slogan, versão e instante;
- rejeitar versão obsoleta e tenant inexistente sem inserir auditoria;
- inserir `tenant.profile.updated` na mesma transação da alteração;
- conceder no banco descartável somente colunas necessárias e `SELECT/INSERT` na auditoria;
- manter banco persistente, Server Action e formulário desconectados.

## Consequências

O comportamento transacional pode ser comprovado antes de qualquer exposição operacional. A trilha permanece append-only e isolada por tenant. A próxima fase deverá aplicar migration e concessões mínimas conscientemente no banco persistente antes de compor uma ação autenticada.

## Reversão

Remover o adaptador e sua fixture de teste. O contrato portável e a migration permanecem independentes e sem acesso do runtime persistente.

## Evidência de aceitação

Em 2026-08-16, o gate PostgreSQL descartável confirmou atualização de nome curto e slogan, incremento de versão, rejeição de comando obsoleto, um único evento de auditoria na mesma transação, ciclo `up/down/up` e limpeza do papel temporário.
