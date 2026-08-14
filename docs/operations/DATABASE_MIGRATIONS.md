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

## Validação local no Windows

Ferramentas detectadas: PostgreSQL 18 em `127.0.0.1:5432` e pgAdmin 4. O executor usa os binários oficiais em `C:\Program Files\PostgreSQL\18\bin` e não exige dependência npm.

Execute o gate; o prompt seguro mantém a senha somente na memória do processo:

```powershell
.\scripts\database\test-local-postgres.ps1
```

O script:

1. recusa continuar se o banco ou o papel fixo de teste já existirem;
2. cria um papel de login descartável, com senha aleatória, sem superusuário e sem `BYPASSRLS`;
3. cria somente `cardapio_digital_test`;
4. executa migrations `up`, testes reais de RLS, snapshots e repositório e migrations `down`;
5. confirma ausência de tabelas e executa um segundo `up`;
6. força UTF-8 apenas no cliente `psql` durante o gate e restaura a configuração anterior ao final;
7. remove o banco, o papel, `PGPASSWORD`, `DATABASE_TEST_URL` e as referências temporárias no bloco de limpeza.

Não copie a senha para `.env`, histórico, argumento de linha de comando ou pgAdmin salvo. O Neon permanece desconectado até um gate posterior de provisionamento e segredos.

## Evidência da execução local

Em 2026-08-12, o gate foi executado com sucesso no PostgreSQL 18 local. A saída final confirmou `up`, negação RLS sem contexto, isolamento entre dois tenants, bloqueio de referência cruzada, preservação de snapshots, `down` sem tabelas residuais e novo `up`. O `DROP ROLE` subsequente confirmou a limpeza do papel descartável. Nenhuma senha foi registrada no repositório ou fornecida ao agente.

Na Fase 2.2, o executor foi ampliado para aplicar a migration do adaptador, gerar credencial aleatória exclusiva para o papel de runtime, carregar uma fixture fictícia e executar `npm run test:database`. A nova evidência ainda deve ser produzida pelo mesmo prompt seguro antes da aprovação da fase.

O gate ampliado foi executado com sucesso em 2026-08-12. A mensagem final confirmou migrations 0001/0002, teste real do `PostgresCatalogRepository`, RLS, isolamento, snapshots, rollback e novo `up`; o `DROP ROLE` confirmou a limpeza do papel de runtime. Banco, fixture, URL e credenciais eram descartáveis e não foram retidos.

Na Fase 2.3, o gate também aplica a migration 0003 e testa alteração autorizada, incremento de versão, conflito otimista e evento de auditoria na mesma transação. Essa ampliação requer nova execução humana antes da aprovação da fase.

O gate da Fase 2.3 foi executado com sucesso em 2026-08-14. A conclusão confirmou escrita do produto, incremento de versão, rejeição do comando obsoleto, um único evento de auditoria, migrations `down/up` e limpeza do papel descartável por `DROP ROLE`. Nenhuma credencial ou fixture foi retida.

Na Fase 3.0, o gate também aplica a migration 0004, carrega principals técnicos fictícios e comprova membership ativa, principal desabilitado e separação do administrador da plataforma. O ciclo de rollback passa a remover 0004 antes das migrations anteriores.

O gate da Fase 3.0 foi executado com sucesso em 2026-08-14. A conclusão confirmou derivação de `owner`, negação para principal desabilitado, separação de `platform_admin`, migrations `down/up` e limpeza do papel descartável por `DROP ROLE`. Nenhuma identidade externa, credencial ou fixture foi retida.
