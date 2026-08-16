# ADR 0021 — Classificação administrativa controlada

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

A estrutura de categorias foi aprovada em somente leitura. O próximo uso operacional é mover um produto entre categorias existentes, sem abrir simultaneamente criação, renomeação, ordenação, arquivamento ou exclusão de categorias.

## Decisão

- oferecer uma seleção de categoria independente em cada produto;
- renovar sessão, vínculo, membership e `catalog.product.update` a cada envio;
- aceitar do navegador somente produto, versão esperada, categoria de destino e confirmação;
- verificar a categoria sob o mesmo `tenant_id`, RLS e transação da alteração;
- manter a chave estrangeira composta `(tenant_id, category_id)` como barreira estrutural;
- atualizar categoria, versão e auditoria atomicamente;
- registrar na auditoria somente o nome público da categoria, sem expor seu UUID;
- conceder ao runtime `UPDATE` somente em `category_id`, `version` e `updated_at`.
- criar uma segunda categoria fictícia apenas no banco persistente local para tornar o gate de movimento verificável.

## Consequências

Produtos podem ser classificados usando apenas categorias existentes do tenant. Categoria inexistente, arquivada ou de outro tenant falha antes da escrita. Concorrência com qualquer outra edição do produto continua protegida pela versão otimista. A gestão da estrutura de categorias permanece bloqueada.

O gate local foi aprovado em 2026-08-15. O banco descartável confirmou RLS, isolamento, troca real, versão, auditoria e `up/down/up`; o banco persistente confirmou privilégio mínimo, categoria fictícia de validação e revisão visual, funcional e arquitetural humana.

## Reversão

Remover formulário e Server Action e revogar `UPDATE` em `category_id`. Categorias, demais controles de produto e auditoria já existente permanecem inalterados.
