# ADR 0027 — Fundação da escrita do perfil do tenant

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

A leitura do perfil foi aprovada, mas `tenants` ainda não possui versão otimista. A trilha `catalog_audit_events` aceita exclusivamente produtos e possui chave estrangeira composta para `products`; reutilizá-la para o tenant quebraria seu contrato e enfraqueceria a integridade referencial. Uma interface de edição não deve existir antes de concorrência e auditoria próprias.

## Decisão

- adicionar `version` positiva a `tenants`, inicialmente igual a `1`;
- criar `tenant_profile_audit_events` como trilha append-only separada;
- limitar ator persistido a proprietário ou gerente e ação a `tenant.profile.updated`;
- aplicar RLS forçada com políticas separadas de leitura e inserção pelo contexto local do tenant;
- revogar acesso público e não conceder privilégio ao runtime nesta fase;
- manter formulário, Server Action, repositório de comando e alteração persistente fora desta entrega.

## Consequências

A futura edição de nome curto e slogan poderá usar concorrência otimista e auditoria atômica sem alterar o contrato de eventos de produto. O novo esquema não coleta dados pessoais, não habilita integração e não concede escrita ao runtime.

## Reversão

Remover `tenant_profile_audit_events` e a coluna `tenants.version` pela migration `down`, antes de existir qualquer comando dependente desses contratos.

## Evidência de aceitação

Em 2026-08-16, o gate PostgreSQL local descartável confirmou aplicação, RLS, isolamento, snapshots, reversão completa, novo `up` e limpeza do papel temporário. Nenhum privilégio foi concedido ao runtime persistente.
