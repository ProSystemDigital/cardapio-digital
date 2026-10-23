# ADR 0034 — Leitura persistente da auditoria do perfil

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O repositório de leitura foi aprovado no banco descartável, mas o runtime persistente possui somente `INSERT` na trilha do perfil. Conceder leitura junto com outras mudanças dificultaria comprovar o privilégio mínimo.

## Decisão

- adicionar a ação explícita `EnableTenantProfileAuditRead` ao executor local;
- recusar a concessão quando a tabela de auditoria não existir;
- conceder exclusivamente `SELECT` em `tenant_profile_audit_events`;
- não alterar privilégios de escrita, tabelas de identidade ou auditoria de produtos;
- manter composição autorizada e interface fora desta fase.

## Consequências

O banco persistente fica preparado para uma consulta limitada posterior, sem ampliar mutações. A próxima fase deverá renovar identidade, membership e `tenant.audit.read` antes de chamar o repositório.

## Reversão

Revogar `SELECT` de `tenant_profile_audit_events` do papel de runtime local. Escrita e eventos existentes permanecem inalterados.

## Evidência de aceitação

Em 2026-08-16, a ação administrativa local confirmou a concessão exclusiva de leitura da auditoria do perfil no banco persistente, sem alterar privilégios de escrita ou outras trilhas.
