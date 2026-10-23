# ADR 0048 — Composição autorizada da criação de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O banco persistente admite criação auditada, mas o adaptador não deve ser chamado diretamente por uma futura entrada do navegador. Identidade, membership e papel precisam ser renovados no servidor antes da inserção.

## Decisão

- introduzir a permissão específica `catalog.category.create`, separada de atualização;
- autorizar o tenant usando somente a identidade técnica confiável;
- derivar principal e papel internos antes de construir o ator do domínio;
- compor autorização, serviço de criação e adaptador PostgreSQL em módulo `server-only`;
- aceitar nessa fronteira somente tenant já derivado, nome e ordem;
- manter Server Action e formulário fora desta fase.

## Consequências

Uma futura ação poderá criar categorias sem aceitar ator, papel, UUID ou slug do navegador. Proprietário e gerente mantêm a capacidade, enquanto administrador da plataforma e identidade sem membership continuam negados por padrão.

## Reversão

Remover a permissão, o serviço autorizado e a composição de criação. O banco e as categorias existentes não são alterados por esta fase.

## Evidência de aceitação

Em 2026-08-16, 86 testes unitários, lint, tipos e build de produção foram aprovados. Os testes confirmaram ator derivado e ausência de chamada ao repositório sem membership.
