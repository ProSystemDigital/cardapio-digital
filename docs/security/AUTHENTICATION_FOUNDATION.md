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

Existem contratos portáveis, adaptador Clerk, Proxy limitado aos futuros caminhos administrativos e migration revisável do vínculo pseudônimo. Não existem conta conectada, tela, rota, cookie real, token ou segredo. O próximo gate depende da validação PostgreSQL local e, depois, de credenciais Clerk de desenvolvimento para comprovar login e revogação.

## Casos obrigatórios do adaptador futuro

- validar assinatura, emissor, audiência, expiração e estado da sessão;
- aceitar HTTP somente para emissor local de desenvolvimento;
- não registrar token, cookie, subject ou dados de perfil em logs;
- produzir erro indistinguível para sessão inválida e vínculo inexistente;
- confirmar revogação e logout em testes de integração;
- manter segredos exclusivamente no servidor e fora do repositório.
