# Fundação da autenticação

## Fluxo de confiança

```text
cookie/token opaco
  -> adaptador do fornecedor no servidor
  -> sessão externa verificada e vigente
  -> vínculo (issuer, subject)
  -> principalId interno
  -> membership e permissão derivadas no PostgreSQL
```

Cada seta pode negar e nenhuma concede acesso por ausência de informação. O retorno do núcleo de autenticação contém somente `principalId`; papéis e tenants continuam sob `AuthorizationService`.

## Estado atual

O login, logout e a revogação foram comprovados em uma instância Clerk de desenvolvimento restrita. A rota `/admin` exige a sessão no próprio recurso e tenta resolver o vínculo pseudônimo exclusivamente no servidor. Ausência de `DATABASE_URL`, vínculo inexistente, vínculo revogado ou principal inativo falham fechados sem expor identificadores. O provisionamento de um vínculo real local e a derivação de tenant permanecem gates separados.

## Casos obrigatórios do adaptador

- validar assinatura, emissor, audiência, expiração e estado da sessão;
- aceitar HTTP somente para emissor local de desenvolvimento;
- não registrar token, cookie, subject ou dados de perfil em logs;
- produzir erro indistinguível para sessão inválida e vínculo inexistente;
- confirmar revogação e logout em testes de integração;
- manter segredos exclusivamente no servidor e fora do repositório.
