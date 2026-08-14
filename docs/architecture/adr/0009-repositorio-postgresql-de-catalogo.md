# ADR 0009 — Repositório PostgreSQL de catálogo

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-12 |
| Decisores | Produto e Engenharia |

## Contexto

O contrato `CatalogRepository` já isola domínio e apresentação da fonte de dados. A próxima etapa deve comprovar sua implementação PostgreSQL sem tornar o banco obrigatório no desenvolvimento, conectar o Neon ou permitir que configuração inválida degrade silenciosamente para dados demonstrativos.

## Decisão

- manter `CatalogRepository` inalterado;
- implementar `PostgresCatalogRepository` com o driver enxuto `pg` e instanciá-lo exclusivamente pelo ponto de composição marcado `server-only`;
- selecionar memória por padrão e PostgreSQL somente com `CATALOG_REPOSITORY=postgres` e `DATABASE_URL` presente;
- falhar fechado quando a seleção explícita estiver inválida ou incompleta;
- resolver apenas UUID e slugs públicos por funções SQL restritas e executar a leitura do catálogo em transação `READ ONLY` com `app.tenant_id` local;
- reconstruir e validar o agregado `TenantCatalog` antes de entregá-lo à interface;
- limitar o pool a cinco conexões e aplicar tempos de espera finitos;
- preservar o repositório em memória como retorno operacional explícito, sem fallback após erro de conexão ou inconsistência persistida;
- manter Neon, dados pessoais, escrita administrativa e pedidos persistidos fora desta fase.

## Dependência

`pg@8` é a única dependência de produção adicionada. Ela implementa o protocolo PostgreSQL sem ORM, geração de esquema ou estado global. `@types/pg` é usada somente no desenvolvimento. A instalação foi auditada sem vulnerabilidades conhecidas no momento da inclusão.

## Consequências

A página continua consumindo o mesmo contrato. A persistência pode ser exercitada localmente e removida por configuração sem alterar domínio ou apresentação. Erros de banco permanecem visíveis, evitando servir catálogo demonstrativo como se fosse dado comercial.

As funções de descoberta expõem apenas slugs públicos e UUID técnico; nenhuma linha de catálogo é retornada antes do contexto RLS. Permissões do runtime e segredo da URL deverão ser reproduzidos por ambiente antes do Neon.

O gate local ampliado foi concluído em 2026-08-12. Ele comprovou a reconstrução do agregado pelo adaptador real, usando papel sem `BYPASSRLS`, fixture fictícia, migrations reversíveis e limpeza integral dos recursos descartáveis.

## Reversão

Selecionar `CATALOG_REPOSITORY=memory` ou omitir a variável restaura imediatamente a fonte em memória. A reversão estrutural executa `0002_catalog_repository.down.sql` e remove o adaptador, o driver e a composição de servidor.
