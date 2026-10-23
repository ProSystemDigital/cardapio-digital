# ADR 0076 — Arquivamento seguro de categorias

| Campo | Valor |
| --- | --- |
| Status | Em gate local e revisão humana |
| Data | 2026-09-05 |
| Decisores | Produto e Engenharia |

## Contexto

Os cards de categorias precisam oferecer edição e exclusão sem apagar histórico nem permitir que produtos ativos apontem para uma categoria removida.

## Decisão

- editar e excluir ficam no menu vertical de três pontos;
- excluir realiza arquivamento lógico e exige confirmação explícita;
- somente Proprietário possui `catalog.category.archive`;
- categorias com produtos ativos não podem ser arquivadas;
- criação de produto bloqueia a categoria com `FOR KEY SHARE`, enquanto o arquivamento atualiza a categoria antes de verificar produtos, fechando a corrida entre as duas operações;
- o runtime recebe apenas atualização de `archived_at`, `version` e `updated_at`, leitura das colunas necessárias de produtos e inserção na auditoria;
- `DELETE` físico permanece revogado.

## Consequências

O operador precisa transferir ou arquivar os produtos antes da categoria. Categorias arquivadas desaparecem das leituras atuais, mas permanecem disponíveis para integridade referencial e auditoria.

## Reversão

Remover a ação da interface, revogar a atualização de `archived_at` em categorias e executar `0019_category_archiving.down.sql` depois de avaliar os eventos existentes.
