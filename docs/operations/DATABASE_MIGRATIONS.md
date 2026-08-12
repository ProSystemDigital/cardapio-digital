# Política de migrations do banco

## Estado atual

Os arquivos em `database/migrations/` são uma especificação arquitetural revisável. Eles não estão conectados a banco, pipeline, ambiente remoto ou credencial e não devem ser executados em produção nesta fase.

## Convenções

- cada alteração usa um número sequencial e arquivos `.up.sql` e `.down.sql`;
- ambos devem conter uma única transação explícita;
- uma migration aplicada é imutável; correções são novas migrations;
- o rollback deve ser testado em banco local descartável antes de qualquer implantação;
- o contexto `app.tenant_id` deve ser definido localmente na transação do backend e nunca aceito diretamente do cliente;
- o runtime comum não pode ser superusuário, proprietário das tabelas nem possuir `BYPASSRLS`;
- backup, restauração e compatibilidade de rollback serão gates obrigatórios antes do primeiro ambiente persistente.

## Sequência futura segura

1. aprovar o ADR e o esquema;
2. selecionar ferramenta de migrations e versão suportada do PostgreSQL em ADR complementar;
3. criar banco local descartável sem dados pessoais;
4. validar `up`, isolamento RLS, referências cruzadas e `down` com testes de integração;
5. somente então avaliar provisionamento e segredos por ambiente.
