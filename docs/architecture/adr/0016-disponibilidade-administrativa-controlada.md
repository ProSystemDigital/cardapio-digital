# ADR 0016 — Disponibilidade administrativa controlada

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

O catálogo administrativo somente leitura foi aprovado. A próxima fatia precisa comprovar uma mutação real sem ampliar simultaneamente preço, conteúdo, categorias ou integrações e sem confiar em contexto enviado pelo navegador.

## Decisão

- expor somente a alternância de disponibilidade do produto por Server Action interna;
- renovar autenticação, vínculo, membership e permissão no servidor a cada envio;
- derivar o tenant exclusivamente do PostgreSQL e aceitar do formulário apenas produto, versão esperada, estado pretendido e confirmação;
- exigir confirmação explícita antes do envio;
- usar o serviço de administração já existente, concorrência otimista e auditoria na mesma transação;
- conceder ao runtime apenas `UPDATE` nas colunas `is_available`, `version` e `updated_at`, além de `INSERT` na auditoria append-only;
- manter preço e todas as demais edições indisponíveis.

## Consequências

Revogação de sessão, vínculo, principal ou membership bloqueia a operação seguinte. Formulários obsoletos não sobrescrevem mudanças concorrentes. O navegador conhece o UUID técnico do produto e sua versão, mas nunca fornece tenant, ator, papel ou permissão.

O gate permanece local e depende da concessão explícita no banco persistente, do ciclo PostgreSQL descartável, das validações automatizadas e da revisão humana visual e funcional.

O gate local foi concluído em 2026-08-15 com ciclo PostgreSQL descartável, concessão mínima persistente e alteração real de disponibilidade auditada, seguida de aprovação visual, funcional e arquitetural humana.

## Reversão

Remover a Server Action e o formulário restaura a interface somente leitura. Revogar `UPDATE` em `products` e `INSERT` em `catalog_audit_events` do papel runtime encerra a capacidade sem alterar dados existentes ou autenticação.
