# ADR 0008 — Ferramentas de persistência

| Campo | Valor |
| --- | --- |
| Status | Em avaliação humana |
| Data | 2026-08-12 |
| Decisores | Produto e Engenharia |

## Contexto

A fundação PostgreSQL precisa ser comprovada primeiro em ambiente descartável e depois administrada sem misturar credenciais locais, produção ou dados pessoais. Produto escolheu pgAdmin 4 e Neon Postgres Console como ferramentas padrão.

## Decisão

- usar PostgreSQL 18 local já instalado para testes descartáveis da fundação;
- usar `psql` nos testes automatizáveis, porque sua execução é reproduzível e falha ao primeiro erro;
- usar pgAdmin 4 como interface humana de inspeção e administração local;
- reservar Neon Postgres Console para o futuro ambiente remoto gerenciado;
- não conectar o Neon, criar projeto remoto ou registrar credenciais nesta fase;
- não tratar pgAdmin ou o console do provedor como mecanismo de migration: os arquivos SQL versionados continuam sendo a fonte auditável;
- manter senha somente na sessão local por `PGPASSWORD`, removida pelo executor ao final, sem `.env`, URL, log ou commit;
- executar testes com banco `cardapio_digital_test` e papel `cardapio_runtime_test`, abortando se qualquer um já existir.

## Consequências

O pgAdmin permite revisão humana, enquanto `psql` mantém o gate repetível. O Neon somente poderá ser conectado depois da aprovação dos testes locais, definição de ambientes, menor privilégio, rotação e armazenamento seguro de segredos.

O executor remove o banco e o papel de teste mesmo após falha. A exclusão é limitada a nomes fixos e somente ocorre quando o próprio fluxo os criou após confirmar que não existiam.

O gate foi executado com sucesso em 2026-08-12 no PostgreSQL 18 local. A evidência confirmou o ciclo `up/down/up`, RLS negativa por padrão, isolamento entre tenants, integridade referencial composta, snapshots históricos e remoção do papel de teste.

## Reversão

Remover o executor, o teste SQL e este ADR. Nenhum recurso remoto foi criado e nenhum banco permanente é alterado.
