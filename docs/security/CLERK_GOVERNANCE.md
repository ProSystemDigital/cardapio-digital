# Governança do Clerk

## Configuração aprovada para o gate

- desenvolvimento somente, sem cadastro público;
- login administrativo futuro restrito por convite;
- `CLERK_SECRET_KEY` somente no servidor;
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` é identificador público, nunca autoridade;
- nenhum dado de perfil copiado para tokens customizados;
- nenhuma organização ou role do Clerk usada na autorização;
- logs da aplicação não registram cookies, tokens, subject, e-mail ou telefone.
- `/admin/sign-in` é a única rota administrativa pública;
- o Proxy inicializa o Clerk somente no espaço administrativo;
- cada página, Route Handler ou Server Function sensível deve exigir autenticação no próprio recurso;
- login, logout e revogação de dispositivo foram validados na instância de desenvolvimento.

## Antes de dados reais

- revisão humana LGPD da transferência internacional e do DPA;
- aprovação da finalidade e retenção de `issuer` e `subject`;
- definição do atendimento a exportação e exclusão do titular;
- plano Pro ou controle equivalente para MFA obrigatório;
- teste de logout, revogação de sessão e principal desabilitado;
- inventário dos subprocessadores vigente na data da produção.

## Regra de custo

MRU, MRO, membros por organização, retenção de logs e add-ons devem ser medidos mensalmente. O produto não ativará Organizations, Billing ou roles customizadas do Clerk sem nova justificativa, pois o PostgreSQL já possui o modelo multitenant autoritativo.
