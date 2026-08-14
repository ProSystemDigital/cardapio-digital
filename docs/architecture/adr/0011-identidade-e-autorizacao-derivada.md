# ADR 0011 — Identidade e autorização derivada

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-14 |
| Decisores | Produto e Engenharia |

## Contexto

Os comandos de catálogo já exigem ator, papel e tenant, mas esses valores não podem ser confiados ao navegador. Antes de escolher um provedor de autenticação, o domínio precisa definir como uma identidade externa será reduzida a um principal técnico e como o servidor derivará autoridade persistida.

## Decisão

- a entrada confiável futura conterá somente `principalId` validado pelo adaptador de autenticação do servidor;
- não aceitar papel, permissões ou lista de tenants da requisição;
- persistir `principals` sem nome, e-mail, telefone ou credencial;
- separar `tenant_memberships` de `platform_role_assignments`;
- permitir somente `owner` e `manager` como memberships de tenant;
- impedir que `platform_admin` herde qualquer permissão de tenant;
- derivar acesso por membership e principal ativos sob RLS baseada em `app.principal_id`;
- executar comandos de catálogo somente pela composição `AuthorizedCatalogAdministrationService`;
- manter tabelas de identidade somente leitura para o runtime nesta fase;
- definir eventos de concessão, alteração, revogação e pedido de suporte, ainda sem expor comandos de gestão;
- adiar fornecedor, login, sessão, vínculo de subject externo, convite e recuperação de conta.

## Matriz inicial

| Permissão | Proprietário | Gerente | Administrador da plataforma |
| --- | --- | --- | --- |
| Ler catálogo | Sim | Sim | Não |
| Atualizar produto | Sim | Sim | Não |
| Atualizar operação | Sim | Sim | Não |
| Atualizar configurações do tenant | Sim | Não | Não |
| Gerenciar memberships | Sim | Não | Não |
| Ler auditoria do tenant | Sim | Sim | Não |
| Listar tenants na operação da plataforma | Não | Não | Sim |
| Solicitar acesso de suporte | Não | Não | Sim |

Solicitar acesso de suporte não concede acesso. Qualquer elevação futura deverá ser temporária, justificada e auditada em decisão própria.

## Consequências

Desabilitar um principal ou revogar uma membership remove a autorização derivada sem alterar sessões no domínio. A autenticação futura poderá mudar de fornecedor sem modificar a matriz ou os comandos de negócio.

`app.principal_id` é defesa em profundidade e só poderá ser definido por código de servidor após validar a sessão. O navegador nunca terá conexão direta ao PostgreSQL.

O gate PostgreSQL local foi concluído em 2026-08-14. Ele comprovou membership ativa, negação de principal desabilitado, separação do papel de plataforma, RLS do runtime, rollback e limpeza integral dos recursos descartáveis.

## Reversão

Executar `0004_identity_authorization.down.sql` e remover serviços/repositórios de autorização. As fases de catálogo e pedidos locais permanecem independentes.
