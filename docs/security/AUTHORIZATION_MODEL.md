# Modelo de autorização

## Fronteira de confiança

O futuro adaptador de autenticação valida a sessão e entrega somente um `principalId` técnico ao servidor. `AuthorizationService` consulta o PostgreSQL para derivar status, membership e papel. Nenhum campo de formulário, header personalizado, parâmetro de rota ou estado cliente pode fornecer papel, tenant autorizado ou permissão.

```text
sessão validada -> principalId -> membership persistida -> permissão -> comando
```

Cada etapa pode negar; nenhuma etapa concede por ausência de informação.

## Separação de papéis

- `owner`: catálogo, operação, configurações, memberships e auditoria do tenant;
- `manager`: catálogo, operação e auditoria do tenant;
- `platform_admin`: funções globais da plataforma, sem acesso implícito ao tenant.

Membership revogada, principal desabilitado, tenant diferente ou identidade inválida resultam em negação. O acesso de suporte futuro não será equivalente a `platform_admin`; exigirá concessão temporária própria.

## Estado desta fase

Existe login administrativo Clerk em desenvolvimento, mas ele comprova somente a identidade externa. A rota real falha fechada até que `(issuer, subject)` resolva um `principalId` interno ativo; mesmo após o vínculo, tenant e permissão continuam derivados das tabelas PostgreSQL. Não existe endpoint ou painel de gestão de acessos.
