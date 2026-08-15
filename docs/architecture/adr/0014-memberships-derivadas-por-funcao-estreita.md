# ADR 0014 — Memberships derivadas por função estreita

| Campo | Valor |
| --- | --- |
| Status | Aceito para gate local |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

A sessão Clerk já resolve um `principalId` interno, mas a rota administrativa ainda não conhece tenant ou papel. Conceder `SELECT` direto nas tabelas de identidade ao runtime ampliaria privilégios; aceitar tenant ou papel da sessão externa violaria a fronteira aprovada.

## Decisão

- criar `list_principal_tenant_access(uuid)` como função PostgreSQL `SECURITY DEFINER` com `search_path` fixo;
- retornar somente `tenant_id` e papel de memberships ativas ligadas a principal ativo;
- revogar execução de `PUBLIC` e conceder somente ao papel de runtime local;
- validar o `principalId` no serviço antes da consulta;
- não aceitar tenant, papel ou lista de memberships do navegador ou Clerk;
- no primeiro gate, permitir avanço somente quando existir exatamente uma membership ativa;
- manter comandos de catálogo bloqueados até uma etapa própria de autorização e interface.

## Consequências

O runtime não recebe leitura direta de `principals` ou `tenant_memberships`. Identidades sem membership e identidades com múltiplos tenants recebem estado seguro, pois a seleção explícita ainda não existe. A consulta acontece em cada carregamento da rota e reflete revogações sem copiar claims para sessão externa.

## Reversão

Executar `0006_principal_tenant_access.down.sql`, remover o método de listagem e retornar a rota ao estado de identidade validada sem tenant derivado. Login, vínculo e memberships persistidas permanecem intactos.
