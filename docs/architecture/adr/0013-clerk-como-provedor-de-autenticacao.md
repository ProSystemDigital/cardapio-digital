# ADR 0013 — Clerk como provedor de autenticação

| Campo | Valor |
| --- | --- |
| Status | Aceito com gates operacionais pendentes |
| Data | 2026-08-14 |
| Decisores | Produto e Engenharia |

## Contexto

A fronteira portável da Fase 3.1 exige um provedor capaz de validar sessões no servidor sem assumir a autorização multitenant. Foram considerados Clerk, Descope, Auth0 e Auth.js. Produto aprovou Clerk para a primeira implementação controlada.

## Decisão

- usar `@clerk/nextjs` somente como adaptador de autenticação e ciclo de sessão;
- usar o `userId` verificado como subject externo e o `iss` verificado como emissor;
- ignorar claims de organização, papel e permissão do Clerk;
- manter `tenant_memberships`, papéis e permissões exclusivamente no PostgreSQL;
- manter chaves em arquivos `.local` ignorados ou no cofre do ambiente, nunca no repositório;
- não habilitar tela, cadastro público ou rota administrativa antes do vínculo persistente e dos testes de revogação;
- revisar custo e recursos antes de promover a produção.

## Evidência de governança

Verificação em 2026-08-14 nas fontes oficiais:

- Hobby: até 50.000 MRUs por aplicação, sessão fixa de sete dias e sem MFA em produção;
- Pro: USD 20/mês na cobrança anual, 50.000 MRUs incluídos, MFA e duração configurável de sessão;
- B2B sem add-on: 100 organizações retidas mensais e até 20 membros por organização;
- não existe seleção regional de residência; a infraestrutura informada fica nos Estados Unidos;
- o DPA caracteriza o cliente como controlador e Clerk como operador/processador para Customer Data, com subprocessadores e transferências internacionais documentados;
- exportação pelo painel/API e exclusão individual pela Backend API estão disponíveis;
- encerramento contratual prevê devolução quando solicitada e exclusão das cópias restantes em até 90 dias, conforme o DPA.

Fontes: `https://clerk.com/pricing`, `https://clerk.com/legal/dpa`, `https://clerk.com/legal/subprocessors` e `https://clerk.com/docs/guides/development/migrating/overview`.

## Estratégia de saída

1. Manter o UUID interno e toda autorização independentes do Clerk.
2. Exportar usuários pelo painel ou Backend API antes da troca.
3. Criar novos vínculos `(issuer, subject)` para o provedor substituto sem alterar memberships.
4. Invalidar acessos Clerk, revogar chaves e remover webhooks/variáveis.
5. Solicitar exclusão contratual e guardar somente a evidência administrativa necessária.

## Consequências e gates

O desenvolvimento local pode usar Hobby, mas produção com MFA obrigatório pressupõe Pro ou renegociação da decisão. A transferência internacional e a ausência de residência regional exigem avaliação LGPD humana antes de dados reais. Preços e limites devem ser reconfirmados na contratação.

O gate PostgreSQL local do vínculo pseudônimo foi aprovado em 2026-08-14, incluindo vínculo ativo, principal desabilitado, revogação, isolamento do runtime e ciclo `up/down/up`. Login, logout e revogação de sessão Clerk real continuam como gate separado.

## Reversão

Remover o adaptador, `proxy.ts`, pacote e placeholders. Como ainda não há conta conectada, chave ou dado real, a reversão atual é inteiramente local.
