# ADR 0031 — Composição autorizada do perfil do tenant

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O banco persistente possui a fundação e os privilégios mínimos, mas o adaptador não deve receber ator, papel ou tenant diretamente do navegador. A permissão genérica de produto também não representa corretamente a edição do perfil.

## Decisão

- criar a permissão específica `tenant.profile.update` para proprietário e gerente;
- manter administrador da plataforma negado por padrão;
- derivar principal, papel e tenant pela autorização interna antes do comando;
- compor autorização, serviço e adaptador somente em módulo `server-only`;
- retornar indisponibilidade segura quando `DATABASE_URL` não existir;
- manter Server Action e formulário fora desta fase.

## Consequências

O futuro ponto de entrada não poderá fornecer ator, papel ou permissão. Membership revogada ou identidade inválida falham antes do repositório. A próxima fase poderá criar uma Server Action estreita que renove a sessão e derive novamente o tenant.

## Reversão

Remover a permissão, o serviço autorizado e a composição de servidor. O adaptador e o banco persistente permanecem inacessíveis ao navegador.

## Evidência de aceitação

Em 2026-08-16, testes unitários confirmaram a permissão específica para proprietário e gerente, derivação interna do ator e negação antes do repositório quando a membership está ausente. Lint e tipos foram aprovados, sem Server Action ou formulário.
