# ADR 0040 — Composição autorizada de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O banco persistente possui privilégio mínimo, mas o adaptador não deve ser chamado antes de renovar identidade, membership e permissão específica no servidor.

## Decisão

- adicionar `catalog.category.update` à matriz de proprietário e gerente;
- autorizar o tenant a cada comando por meio da identidade interna verificada;
- derivar UUID e papel do ator exclusivamente do resultado da autorização;
- compor autorização, serviço e PostgreSQL em módulo marcado `server-only`;
- aceitar na fronteira somente identidade confiável, tenant, categoria, versão, nome e ordem;
- manter Server Action e formulário fora desta fase.

## Consequências

Membership ausente ou revogada impede o repositório de escrita. Ator e papel não podem ser fornecidos pela futura entrada do navegador.

## Reversão

Remover composição, módulo de servidor e permissão específica. Fundação e privilégio persistente permanecem inativos sem consumidor.

## Evidência de aceitação

Em 2026-08-16, 77 testes unitários, lint, verificação de tipos e build de produção confirmaram derivação do ator, permissão específica, negação sem membership e isolamento server-only.
