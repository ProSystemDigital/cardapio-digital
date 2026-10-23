# ADR 0044 — Auditoria administrativa de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O banco persistente permite leitura mínima e o repositório retorna eventos sanitizados. Falta apresentar a evidência recente das alterações de categorias com autorização renovada.

## Decisão

- autorizar a consulta por `tenant.audit.read` usando identidade interna;
- fixar o limite em 20 eventos no módulo `server-only`;
- carregar a trilha junto com o catálogo e as demais auditorias;
- apresentar nome atual, novo nome, ordem, papel e instante;
- não exibir UUID da categoria, UUID do ator ou identidade externa;
- não oferecer paginação, exportação, alteração ou exclusão.

## Consequências

Proprietário e gerente podem verificar alterações recentes da estrutura sem ampliar a superfície de dados ou mutação.

## Reversão

Remover composição e seção visual e revogar o `SELECT` da Fase 3.33. Eventos já persistidos permanecem inalterados.

## Evidência de aceitação

Em 2026-08-16, 80 testes unitários, lint, tipos, build, 27 testes visuais e PWA foram aprovados. A revisão visual, funcional e arquitetural humana confirmou a trilha sanitizada e responsiva.
