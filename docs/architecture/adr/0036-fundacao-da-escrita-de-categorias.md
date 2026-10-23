# ADR 0036 — Fundação da escrita de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

Categorias já são lidas pelo tenant derivado e produtos podem ser movidos entre categorias existentes. Renomear ou reordenar a estrutura, porém, ainda não possui concorrência otimista nem uma trilha própria. A auditoria de produtos não deve receber eventos de outra entidade.

## Decisão

- adicionar `version` positiva a `categories`, inicialmente igual a `1`;
- criar `category_audit_events` com chave estrangeira composta para a categoria do mesmo tenant;
- limitar ator persistido a proprietário ou gerente e a ação a `category.updated`;
- aplicar RLS forçada com políticas separadas de leitura e inserção pelo contexto local do tenant;
- revogar acesso público e não conceder privilégio ao runtime nesta fase;
- manter criação, exclusão, arquivamento, formulário, Server Action e repositório de comando fora desta entrega.

## Consequências

Uma futura mutação limitada de nome ou ordem poderá detectar concorrência e registrar evidência atômica sem enfraquecer a auditoria de produtos. Nenhuma capacidade administrativa nova é exposta nesta fase.

## Reversão

Remover `category_audit_events` e a coluna `categories.version` pela migration `0008_category_writes.down.sql`, antes de existir qualquer comando dependente desses contratos.

## Evidência de aceitação

Em 2026-08-16, o gate PostgreSQL local descartável confirmou aplicação, RLS, isolamento, snapshots, reversão completa, novo `up` e remoção do papel temporário. Nenhum privilégio foi concedido ao runtime persistente.
