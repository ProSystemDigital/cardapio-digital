# ADR 0059 — Habilitação persistente dos metadados de imagem

| Campo | Valor |
| --- | --- |
| Status | Aceito para gate local persistente |
| Data | 2026-08-18 |
| Decisores | Produto e Engenharia |

## Contexto

O adaptador PostgreSQL de imagens foi aprovado no banco descartável. O banco local persistente ainda não possui as migrations 0011 e 0012 nem os privilégios necessários, e uma aplicação manual poderia produzir estado parcial ou ampliar a superfície de escrita.

## Decisão

- oferecer a ação explícita `EnableCatalogImageMetadataWrite` no executor administrativo local;
- recusar estado parcial entre as duas tabelas de metadados ou entre as duas ações de auditoria;
- aplicar 0011 e 0012 somente quando suas fundações estiverem integralmente ausentes;
- conceder `SELECT`, `INSERT` e `UPDATE` somente nas tabelas de metadados de logo e produto;
- manter `DELETE` revogado nas tabelas de metadados;
- conceder somente `SELECT` e `INSERT` nas auditorias existentes e revogar `UPDATE` e `DELETE`;
- incluir 0011 e 0012 em novos provisionamentos locais, ainda sem conceder acesso automático;
- manter armazenamento de objetos, composição, Server Action e interface fora desta fase.

## Consequências

O adaptador poderá operar no banco local persistente sob RLS e concorrência otimista. Nenhum objeto será enviado ou excluído, e nenhuma imagem ficará visível ao usuário nesta etapa.

## Reversão

Revogar os privilégios concedidos. O rollback das migrations só é seguro enquanto não houver metadados ou eventos reais dependentes das novas ações.
