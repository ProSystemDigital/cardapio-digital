# ADR 0010 — Comandos autorizados e auditoria transacional

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-14 |
| Decisores | Produto e Engenharia |

## Contexto

A leitura persistida foi validada, mas escrita administrativa amplia o risco de alteração cruzada, sobrescrita concorrente e ausência de rastreabilidade. Autenticação e painel ainda não existem; portanto esta fase deve estabelecer contratos internos sem expor uma superfície HTTP.

## Decisão

- introduzir `CatalogAdministrationService` como fronteira de casos de uso;
- exigir ator técnico, papel, tenants autorizados e tenant do comando;
- permitir alteração de produto para `owner` e `manager` vinculados ao tenant;
- negar edição implícita ao `platform_admin` até existir fluxo explícito e auditado;
- implementar inicialmente preço e disponibilidade como menor fatia vertical;
- usar versão inteira e `expectedVersion` para concorrência otimista;
- alterar produto e inserir auditoria na mesma transação PostgreSQL;
- tornar auditoria append-only para o runtime: somente `SELECT` e `INSERT` possuem políticas RLS;
- não confiar em ator ou lista de tenants enviados pelo navegador; no futuro esses dados virão exclusivamente da autenticação/autorização do servidor;
- não criar Server Action, Route Handler, painel, conta, dado pessoal ou conexão Neon nesta fase.

## Consequências

Operações simultâneas não sobrescrevem silenciosamente uma à outra. Uma falha de auditoria reverte também a alteração do produto. O evento registra UUID técnico do ator, papel, ação, entidade e campos alterados, sem nome, e-mail, telefone ou endereço.

O contrato de ator é testável, mas ainda não representa identidade autenticada. Nenhum chamador externo pode acionar os comandos até a futura fase de autenticação.

O gate PostgreSQL local foi concluído em 2026-08-14. Ele comprovou alteração e auditoria atômicas, incremento de versão, rejeição de versão obsoleta, RLS do papel de runtime e limpeza integral dos recursos descartáveis.

## Reversão

Executar `0003_catalog_writes.down.sql` remove auditoria e versão. Remover serviço, contrato e adaptador de comando não afeta o repositório de leitura nem o modo em memória.
