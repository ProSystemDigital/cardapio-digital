# ADR 0028 — Contrato de comando do perfil do tenant

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

A fundação persistente da escrita foi aprovada, mas ainda não existe contrato portável que limite campos, atores e concorrência antes do PostgreSQL. Expor uma ação diretamente sobre SQL misturaria autorização, validação e infraestrutura.

## Decisão

- definir comando independente para nome curto e slogan, com versão esperada obrigatória;
- limitar nome da empresa e slogan a 30 caracteres não vazios;
- autorizar somente proprietário ou gerente vinculado ao tenant;
- negar administrador da plataforma, outro tenant e ator técnico inválido;
- manter o repositório como porta abstrata e validar antes de chamá-lo;
- não implementar PostgreSQL, Server Action, formulário ou privilégio nesta fase.

## Consequências

As regras podem ser verificadas sem banco ou fornecedor de autenticação. A próxima fase poderá implementar o adaptador PostgreSQL e sua auditoria atômica atrás do contrato, ainda sem expor uma superfície ao navegador.

## Reversão

Remover contrato, serviço, porta de repositório e testes. A migration aprovada na Fase 3.17 permanece independente e sem uso pelo runtime.

## Evidência de aceitação

Em 2026-08-16, os testes unitários confirmaram autorização de proprietário e gerente, negação de administrador da plataforma, outro tenant e ator inválido, limites textuais e versão obrigatória antes do repositório. Lint e verificação de tipos também foram aprovados; nenhum banco, privilégio ou navegador foi conectado.

Em 2026-10-23, o limite do nome da empresa foi ampliado de 20 para 30 caracteres e a identidade pública móvel passou a admitir quebra discreta em até duas linhas.
