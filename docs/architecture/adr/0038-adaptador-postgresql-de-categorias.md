# ADR 0038 — Adaptador PostgreSQL de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O contrato portátil foi aprovado, mas ainda falta provar que a alteração de uma categoria e sua evidência ocorrem atomicamente sob RLS e concorrência otimista.

## Decisão

- implementar a porta de comando com transação PostgreSQL exclusiva;
- definir o contexto local de tenant antes de ler ou escrever;
- atualizar somente nome, ordem, versão e instante quando solicitados;
- distinguir categoria inexistente de conflito de versão;
- inserir `category.updated` na mesma transação, contendo somente campos alterados;
- conceder apenas no banco descartável `UPDATE` nas quatro colunas necessárias e `SELECT/INSERT` na trilha;
- manter banco persistente, composição autorizada, Server Action e interface desconectados.

## Consequências

O gate pode comprovar atualização, incremento de versão, rejeição de comando obsoleto e exatamente um evento atômico. Uma falha de auditoria reverte também a categoria.

## Reversão

Remover adaptador, fixture e teste de integração. O contrato e a migration permanecem sem capacidade exposta ao runtime persistente.

## Evidência de aceitação

Em 2026-08-16, o gate PostgreSQL descartável confirmou atualização real, incremento de versão, conflito otimista, auditoria atômica, RLS, isolamento, reversão, novo `up` e limpeza do papel temporário.
