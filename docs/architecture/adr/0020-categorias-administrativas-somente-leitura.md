# ADR 0020 — Categorias administrativas somente leitura

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

Produtos já possuem controles graduais, mas categorias ainda não aparecem na visão administrativa. Autorizar sua alteração imediatamente exigiria novos contratos de comando e auditoria para outra entidade. A operação precisa primeiro confirmar que nomes, ordem e vínculo dos produtos são reconstruídos corretamente para o tenant derivado.

## Decisão

- apresentar as categorias já carregadas pelo repositório PostgreSQL do tenant derivado;
- respeitar a ordem persistida e informar a posição visual;
- calcular no Server Component a quantidade de produtos vinculados a cada categoria;
- não aceitar tenant, filtro, ordenação ou categoria do navegador;
- não adicionar Server Action, privilégio PostgreSQL ou mutação;
- manter renomeação, reordenação, arquivamento, criação e exclusão bloqueados.

## Consequências

A operação consegue revisar a estrutura do catálogo antes de ampliar a escrita. A fase reutiliza a leitura RLS já aprovada e não aumenta a superfície de privilégio. Uma futura mutação de categorias deverá generalizar a auditoria sem enfraquecer a trilha append-only.

O gate foi aprovado em 2026-08-15 por revisão visual, funcional e arquitetural humana. Os testes unitários, lint, tipos, build, responsividade e PWA permaneceram aprovados sem nova permissão ou mutação PostgreSQL.

## Reversão

Remover a seção de categorias da página administrativa. Repositório, permissões e dados persistidos permanecem inalterados.
