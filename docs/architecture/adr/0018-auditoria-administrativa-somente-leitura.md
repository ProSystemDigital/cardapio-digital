# ADR 0018 — Auditoria administrativa somente leitura

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

Preço e disponibilidade já geram eventos transacionais, mas a evidência ainda depende de consulta técnica ao PostgreSQL. Antes de ampliar o conjunto de mutações, proprietário e gerente precisam confirmar alterações recentes sem receber acesso para adulterar a trilha ou visualizar identificadores externos.

## Decisão

- consultar no máximo os 20 eventos mais recentes do tenant derivado;
- renovar a permissão `tenant.audit.read` no PostgreSQL antes da leitura;
- definir `app.tenant_id` em transação somente leitura e manter RLS forçada;
- conceder ao runtime apenas `SELECT` em `catalog_audit_events`;
- apresentar produto, instante, papel interno e somente mudanças operacionais conhecidas de preço e disponibilidade;
- não apresentar UUID do ator, `issuer`, `subject`, e-mail ou qualquer dado do Clerk;
- não aceitar tenant, filtro, paginação ou limite enviados pelo navegador;
- não oferecer alteração ou exclusão de eventos.

## Consequências

A trilha passa a ser verificável pela operação sem perder seu caráter append-only. O limite fixo evita consulta irrestrita, mas ainda não resolve retenção, paginação, exportação ou investigação histórica; essas capacidades permanecem bloqueadas até decisão própria.

O gate local foi aprovado em 2026-08-15. O ciclo PostgreSQL descartável confirmou migrations, RLS, isolamento, snapshots e `up/down/up`; o banco persistente confirmou a concessão mínima de leitura, e a interface foi aprovada em revisão visual, funcional e arquitetural humana.

## Reversão

Remover a seção e o repositório de leitura e revogar `SELECT` em `catalog_audit_events` do papel runtime. A geração transacional dos eventos continua inalterada.
