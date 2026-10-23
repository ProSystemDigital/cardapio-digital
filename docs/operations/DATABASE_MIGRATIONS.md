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

Na Fase 3.1, o gate aplica a migration 0005 e comprova que somente o par exato `(issuer, subject)` ativo, ligado a principal ativo, resolve um `principalId`. A tabela tem RLS habilitada sem política e todos os privilégios são revogados do runtime; somente a função estreita `resolve_external_principal_id`, executada pelo proprietário da migration com `search_path` fixo, pode ser chamada. O rollback remove 0005 antes da fundação de identidade.

O gate da migration 0005 foi executado com sucesso em 2026-08-14. A conclusão confirmou resolução do vínculo ativo, negação de principal desabilitado, negação de vínculo revogado, migrations `down/up` e limpeza do papel descartável por `DROP ROLE`. Nenhum subject real, credencial Clerk ou fixture foi retido.

Na Fase 3.45, o gate passa a aplicar também a migration 0011, que cria somente metadados de logo e imagem de produto com FK por tenant, RLS forçada e sem concessões ao runtime. O ciclo deve comprovar `up/down/up` antes de qualquer SDK, armazenamento remoto ou upload ser habilitado.

O gate da Fase 3.45 foi aprovado em 2026-08-18. A evidência humana confirmou `up`, RLS, isolamento dos metadados, limites, `down`, novo `up` e remoção do papel descartável por `DROP ROLE`. Nenhum objeto, SDK, token ou armazenamento remoto participou do teste.

Na Fase 3.48, o gate aplica a migration 0012 e uma fixture descartável que concede ao papel de teste somente leitura, inserção e atualização dos metadados, além de inserção nas auditorias existentes. O teste de integração cria e substitui logo e imagem de produto, comprova versões, conflito, RLS, chave anterior e ausência de URL/chave na auditoria. Antes do `down`, um cleanup exclusivo do banco descartável remove esses eventos de teste, permitindo restaurar com segurança as restrições anteriores sem fazer a migration apagar auditoria real. Nenhuma concessão é aplicada ao banco persistente.

Para aplicar 0011/0012 e habilitar os privilégios mínimos no banco local persistente:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCatalogImageMetadataWrite
```

O comando recusa fundações parciais, concede somente `SELECT`/`INSERT`/`UPDATE` nos metadados, mantém sua exclusão revogada e preserva as auditorias sem alteração ou exclusão. Ele não instala SDK, envia objetos nem expõe interface.

## Provisionamento administrativo local controlado

A Fase 3.3 possui um gate separado para o banco persistente `cardapio_digital_dev`. Ele aceita somente chaves Clerk Development, exige exatamente um usuário na instância, cria um runtime sem superusuário ou `BYPASSRLS` e grava a URL gerada apenas em `.env.local` ignorado. O terminal não imprime senha, `issuer`, `subject` ou UUID.

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action Provision
```

Após reiniciar `npm run dev`, o login deve mostrar identidade interna validada. A revogação e a reativação do mesmo vínculo são verificadas sem excluir o banco:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action Revoke
.\scripts\database\manage-local-admin-link.ps1 -Action Activate
```

As três ações solicitam a senha administrativa local de forma oculta. O script recusa sobrescrever banco ou papel existentes e não concede tenant ou papel com base em claims Clerk; a membership `owner` é criada explicitamente para a fixture local e registrada em auditoria.

O gate persistente foi aprovado em 2026-08-15. A evidência humana confirmou provisionamento, identidade interna validada, revogação com acesso negado e reativação com acesso restaurado. O `.env.local` permaneceu ignorado e nenhum segredo, `issuer`, `subject` ou UUID foi copiado para terminal, documentação ou commit.

Na Fase 3.4, aplique a migration incremental e a concessão estreita ao runtime persistente:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action Upgrade
```

O comando é idempotente para a função existente, não recria principal, membership ou vínculo e não concede leitura direta das tabelas de identidade. Após reiniciar o servidor, `/admin` deve informar um tenant autorizado e o papel `Proprietário` derivado do PostgreSQL.

O gate da migration 0006 foi aprovado em 2026-08-15. O banco descartável confirmou `up/down/up`, RLS, isolamento e limpeza; o banco persistente confirmou exatamente um tenant e papel `owner` derivados pelo runtime sem aceitar claims externos.

Para o gate de catálogo administrativo somente leitura, conceda `SELECT` apenas às tabelas operacionais necessárias:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCatalogRead
```

O comando não concede `INSERT`, `UPDATE` ou `DELETE` e não altera identidade, vínculo ou membership. A RLS continua definindo o tenant visível na transação do servidor.

O gate da Fase 3.5 foi aprovado em 2026-08-15. O banco descartável confirmou novamente `up/down/up`, RLS, isolamento e limpeza; o banco persistente exibiu somente o catálogo do tenant derivado, com um produto e sem controles ou privilégios de mutação.

Para habilitar exclusivamente a mutação de disponibilidade da Fase 3.6 no banco persistente local:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCatalogAvailabilityWrite
```

O comando concede somente `UPDATE` em `products.is_available`, `products.version` e `products.updated_at`, além de `INSERT` na auditoria. Ele não concede alteração de preço, leitura de identidade ou modificação da trilha existente.

O gate da Fase 3.6 foi aprovado em 2026-08-15. O ciclo descartável confirmou novamente migrations, RLS, isolamento, snapshots e `up/down/up`; o banco persistente confirmou a concessão mínima e a interface alterou a disponibilidade com confirmação explícita e retorno de auditoria concluída.

Para habilitar exclusivamente a edição de preço da Fase 3.7 no banco persistente local:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCatalogPriceWrite
```

O comando concede `UPDATE` somente em `products.base_price_in_cents`, `products.version` e `products.updated_at`, além de garantir `INSERT` na auditoria. Ele não amplia permissões para conteúdo, categorias ou exclusão.

O gate da Fase 3.7 foi aprovado em 2026-08-15. O ciclo descartável confirmou migrations, RLS, isolamento, snapshots e `up/down/up`; o banco persistente confirmou a concessão mínima e a interface persistiu e auditou o novo preço, seguida de revisão visual, funcional e arquitetural humana.

Para habilitar a consulta limitada da auditoria da Fase 3.8 no banco persistente local:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCatalogAuditRead
```

O comando concede somente `SELECT` em `catalog_audit_events`. A interface mantém limite fixo de 20 eventos, aplica RLS pelo tenant derivado e não recebe escopo ou paginação do navegador.

O gate da Fase 3.8 foi aprovado em 2026-08-15. O ciclo descartável confirmou novamente migrations, RLS, isolamento, snapshots e `up/down/up`; o banco persistente confirmou a leitura mínima e a interface apresentou somente os eventos recentes do tenant derivado, seguida de revisão visual, funcional e arquitetural humana.

Para habilitar nome e descrição na Fase 3.9 no banco persistente local:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCatalogContentWrite
```

O comando concede `UPDATE` somente em `products.name`, `products.description`, `products.version` e `products.updated_at`, além de garantir `INSERT` na auditoria. Criação, exclusão, categorias, imagens e demais colunas permanecem bloqueadas.

O gate da Fase 3.9 foi aprovado em 2026-08-15. O ciclo descartável confirmou novamente migrations, RLS, isolamento, snapshots e `up/down/up`; o banco persistente confirmou a alteração mínima de conteúdo e sua auditoria, seguida de revisão visual, funcional e arquitetural humana.

Para habilitar a classificação do produto na Fase 3.11 no banco persistente local:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCatalogCategoryAssignmentWrite
```

O comando cria idempotentemente uma segunda categoria fictícia chamada `Categoria de validação` no tenant local e concede `UPDATE` somente em `products.category_id`, `products.version` e `products.updated_at`, além de garantir `INSERT` na auditoria. A categoria de destino precisa existir no mesmo tenant; a estrutura das categorias permanece somente leitura. Essa fixture existe apenas no banco de desenvolvimento e pode ser arquivada ou removida conscientemente após o gate.

O gate da Fase 3.11 foi aprovado em 2026-08-15. O ciclo descartável confirmou novamente migrations, RLS, isolamento, snapshots, mudança real de categoria auditada e `up/down/up`; o banco persistente confirmou a concessão mínima, a atualização das contagens e a revisão visual, funcional e arquitetural humana.

Para habilitar a mutação limitada das modalidades por produto da Fase 3.13 no banco persistente local, execute conscientemente:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCatalogFulfillmentModesWrite
```

O comando concede somente `UPDATE` em `products.version` e `products.updated_at`, `INSERT/DELETE` em `product_fulfillment_modes` e `INSERT` na auditoria. Ele não permite criar ou remover modalidades do tenant, alterar outras colunas do produto ou editar eventos existentes.

O gate da Fase 3.13 foi aprovado em 2026-08-15. O banco descartável confirmou isolamento, conjunto não vazio, relação e auditoria atômicas e ciclo `up/down/up`; o banco persistente recebeu a concessão mínima e a interface passou pela revisão visual, funcional e arquitetural humana.

## Fundação da escrita do perfil do tenant

A Fase 3.17 adiciona a migration `0007_tenant_profile_writes` ao gate descartável. Ela versiona o tenant e cria uma trilha de auditoria própria, protegida por RLS, sem conceder qualquer privilégio ao runtime e sem expor formulário ou comando.

```powershell
.\scripts\database\test-local-postgres.ps1
```

O gate deve confirmar aplicação e reversão de `0007` no ciclo `up/down/up`. A aplicação no banco persistente, as concessões mínimas e a interface permanecem bloqueadas até a próxima fase.

Na Fase 3.19, o mesmo gate concede apenas no banco descartável `UPDATE` de nome curto, slogan, versão e instante, além de `SELECT/INSERT` na auditoria do perfil. O teste deve confirmar atualização, incremento de versão, conflito otimista e exatamente um evento atômico; nenhuma concessão é aplicada ao banco persistente.

Para aplicar a fundação e a concessão mínima da Fase 3.20 no banco persistente local:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableTenantProfileWrite
```

O comando recusa estado parcial, aplica `0007` quando necessário e concede somente `UPDATE` de nome curto, slogan, versão e instante, além de `INSERT` na auditoria. Nenhum formulário ou Server Action é habilitado nesta fase.

Para habilitar exclusivamente a leitura persistente da auditoria do perfil na Fase 3.24:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableTenantProfileAuditRead
```

O comando exige a tabela já provisionada e concede somente `SELECT`, sem modificar privilégios de escrita ou outras trilhas.

## Fundação da escrita de categorias

A Fase 3.26 adiciona `0008_category_writes` ao gate descartável. A migration versiona categorias existentes e cria `category_audit_events` com referência composta ao mesmo tenant, RLS forçada e políticas separadas de leitura e inserção. Ela não contém `GRANT` e não habilita formulário ou comando.

```powershell
.\scripts\database\test-local-postgres.ps1
```

O gate deve confirmar aplicação e reversão de `0008` no ciclo `up/down/up`. Aplicação persistente, privilégios, contrato de comando e interface permanecem bloqueados para fases posteriores.

Na Fase 3.28, o executor concede somente no banco descartável `UPDATE` de nome, ordem, versão e instante, além de `SELECT/INSERT` na auditoria de categorias. O teste deve confirmar atualização, incremento de versão, conflito otimista e evento atômico. Nenhuma concessão é aplicada ao banco persistente.

Para aplicar a fundação e a concessão mínima da Fase 3.29 no banco persistente local:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCategoryWrite
```

O comando recusa estado parcial, aplica `0008` quando necessário e concede somente `UPDATE` de nome, ordem, versão e instante, além de `INSERT` na auditoria. Leitura da trilha, composição, formulário e Server Action permanecem desabilitados.

Para habilitar exclusivamente a leitura persistente da auditoria de categorias na Fase 3.33:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCategoryAuditRead
```

O comando exige a tabela provisionada e concede somente `SELECT`, sem modificar escrita ou outras trilhas.

## Persistência auditada da criação de categorias

A Fase 3.36 adiciona `0009_category_creation` ao gate descartável para admitir `category.created`. O adaptador gera UUID e slug técnico no servidor e insere categoria e evento atomicamente. O executor remove apenas as linhas fictícias desse teste antes de comprovar o rollback e o novo `up`.

```powershell
.\scripts\database\test-local-postgres.ps1
```

Nenhuma migration ou concessão é aplicada ao banco persistente nesta fase.

Para aplicar `0009` e habilitar somente a inserção necessária no banco persistente local:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableCategoryCreation
```

O comando exige a fundação de categorias, aplica a ampliação da ação de auditoria quando necessário e concede apenas `INSERT` em categorias e eventos. Composição e formulário continuam ausentes.

## Habilitação persistente de Consumo no local

A Fase 3.41 valida `0010_tenant_fulfillment_activation` no ciclo descartável sem alterar o tenant persistente. Para aplicar a migration e conceder somente a superfície necessária ao adaptador:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableTenantFulfillmentActivation
```

O comando não insere `dine_in` e não seleciona produtos. Ele apenas habilita inserções nas relações e auditorias e atualização de `version`/`updated_at` dos produtos, mantendo as trilhas append-only.
## 0015 — Origem logística do tenant

Cria `tenant_delivery_origins` e `tenant_delivery_origin_audit_events` com RLS forçada, versão e estado de geocodificação. A migration não concede privilégios nem insere endereço real. O rollback remove primeiro a auditoria e depois a origem.

## 0016 — Governança de privacidade do tenant

Cria `tenant_privacy_settings` e `tenant_privacy_audit_events`. Cada tenant deve declarar nome empresarial do controlador, canal funcional e prazo explícito de retenção do endereço do pedido. A migration aplica RLS forçada, é reversível, não insere valores padrão e não concede privilégios.

## Habilitação persistente da governança de entrega

Depois de validar `0015` e `0016` no banco descartável, aplique as migrations ausentes e conceda ao runtime local somente as colunas usadas pelos comandos autorizados:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableDeliveryGovernanceWrite
```

O comando não cadastra endereço, controlador ou canal de privacidade. A origem e a configuração de privacidade ficam sob RLS, sem `DELETE`; as auditorias aceitam apenas leitura e inserção, sem alteração ou exclusão.

## 0017 — Criação auditada de produtos

Amplia a trilha do catálogo para `product.created`, sem conceder privilégios. O adaptador gera UUID e slug técnico no servidor, confirma categoria e opções sob RLS e grava produto indisponível, modalidades e auditoria em uma única transação. A imagem permanece no fluxo separado após a criação.

Valide primeiro o ciclo descartável completo:

```powershell
.\scripts\database\test-local-postgres.ps1
```

Depois, habilite no banco persistente somente as colunas e inserções necessárias:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableProductCreation
```

O runtime não recebe `DELETE` em produtos nem alteração/exclusão da auditoria.
### Arquivamento de produtos

`0018_product_archiving` amplia somente o vocabulário da auditoria para `product.archived`. A aplicação remove o produto das leituras por `archived_at`, preservando pedidos e referências históricas; o runtime não recebe `DELETE` sobre `products`.

`0019_category_archiving` amplia a auditoria para `category.archived`. O comando arquiva somente categorias sem produtos ativos, mantém `DELETE` revogado e concede ao runtime apenas as colunas necessárias. Após o gate descartável, habilite localmente com `manage-local-admin-link.ps1 -Action EnableCategoryArchiving`.

## 0020 — Onboarding de assinaturas

Cria intents pseudônimos de onboarding, registro idempotente de eventos Stripe e funções restritas para ativar, suspender e retomar o acesso. Dados de cartão ou conta bancária não são persistidos. Para aplicar no banco local persistente e conceder ao runtime somente a execução dessas funções:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableSubscriptionOnboarding
```

O comando solicita a senha administrativa do PostgreSQL sem exibi-la. A operação do webhook também exige `STRIPE_WEBHOOK_SECRET`; a rota de retorno do Checkout nunca provisiona acesso.

## 0021 — Modalidades padrão para todos os tenants

Registra e adiciona somente as modalidades ausentes (`pickup`, `delivery` e `dine_in`) em contas existentes. Novas contas já recebem as três modalidades pela função de onboarding. O rollback recusa remover uma modalidade que já esteja vinculada a produto.

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableDefaultFulfillmentModes
```

## 0022 — Identificações de mesas

Adiciona até 100 identificações de mesas à configuração operacional isolada do tenant. A aplicação limita cada identificação a 30 caracteres, rejeita duplicidades e aceita a seleção pública somente entre os valores publicados pelo estabelecimento.

Para aplicar a migration e renovar o privilégio mínimo no banco local:

```powershell
.\scripts\database\manage-local-admin-link.ps1 -Action EnableTenantOperationsWrite
```
