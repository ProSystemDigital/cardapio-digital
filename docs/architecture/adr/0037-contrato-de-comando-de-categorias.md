# ADR 0037 — Contrato de comando de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

A fundação persistente de categorias foi aprovada, mas uma futura edição ainda precisa de regras portáteis que impeçam campos arbitrários, atores indevidos e concorrência não declarada antes de acessar PostgreSQL.

## Decisão

- limitar o comando a nome, ordem e versão esperada de uma categoria existente;
- exigir ao menos uma alteração, nome não vazio de até 80 caracteres e ordem inteira entre 0 e 10.000;
- exigir UUIDs técnicos válidos para ator, tenant e categoria;
- autorizar somente proprietário ou gerente vinculado ao tenant;
- negar administrador da plataforma e acesso cruzado antes do repositório;
- manter o repositório como porta abstrata;
- não implementar adaptador PostgreSQL, privilégio, Server Action ou formulário nesta fase.

## Consequências

Validação e autorização podem ser testadas sem banco, navegador ou fornecedor de identidade. Criação, slug, arquivamento e exclusão não pertencem ao comando e continuam bloqueados.

## Reversão

Remover contrato, serviço, porta de repositório e testes. A migration `0008` permanece independente e sem uso pelo runtime.

## Evidência de aceitação

Em 2026-08-16, 74 testes unitários, lint, verificação de tipos e build de produção foram aprovados. Os testes confirmaram autorização, negações, limites, versão e ausência de chamada ao repositório para entradas inválidas.
