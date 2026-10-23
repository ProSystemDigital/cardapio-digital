# ADR 0045 — Contrato de criação de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

A interface atual apresenta um formulário para cada categoria existente; os dois formulários observados correspondem aos dois registros persistidos e não a um limite de renderização. Para cadastrar várias categorias, a criação precisa de contrato próprio antes de qualquer `INSERT` ou botão.

## Decisão

- criar um comando portátil contendo somente tenant autorizado, nome e ordem;
- limitar nome a 80 caracteres e ordem a inteiro entre 0 e 10.000;
- não aceitar UUID da categoria ou slug do chamador;
- autorizar somente proprietário ou gerente vinculado;
- manter porta e serviço de criação separados da atualização existente;
- manter PostgreSQL, privilégio persistente, Server Action e formulário de cadastro fora desta fase;
- padronizar o rótulo existente `dine_in` como “Consumo no local”, sem ainda habilitá-lo no tenant persistente.

## Consequências

O número de categorias não fica limitado a dois, mas nenhuma nova linha pode ser criada até o adaptador e a auditoria de criação passarem por gates próprios. Identificador e slug serão derivados no servidor em fase posterior.

## Reversão

Remover contrato, porta, serviço e testes de criação e restaurar os rótulos anteriores. Categorias e modalidades persistidas não são alteradas nesta fase.

## Evidência de aceitação

Em 2026-08-16, 82 testes unitários, lint, tipos, build, 27 testes visuais e PWA foram aprovados. O contrato confirmou criação repetível sem ID ou slug do chamador, negações antes da porta e ausência de corte na renderização das categorias existentes.
