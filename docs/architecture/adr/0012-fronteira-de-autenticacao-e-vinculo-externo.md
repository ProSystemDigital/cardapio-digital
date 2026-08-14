# ADR 0012 — Fronteira de autenticação e vínculo externo

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-14 |
| Decisores | Produto e Engenharia |

## Contexto

A Fase 3.0 deriva autorização de um `principalId`, mas ainda não existe sessão capaz de fornecê-lo. Acoplar o domínio ao identificador, token ou SDK de um fornecedor dificultaria substituição, aumentaria a superfície de dados e permitiria que claims externos fossem confundidos com papéis internos.

## Decisão

- um adaptador de servidor validará a sessão com o fornecedor escolhido;
- o núcleo recebe do adaptador somente emissor, subject e expiração já verificados;
- emissor e subject resolvem um `principalId` por vínculo persistido; não concedem papel ou tenant;
- claims de organização, papel ou permissão do fornecedor não alimentam a autorização do produto;
- sessão ausente, expirada, malformada, sem vínculo ou ligada a principal inválido falha fechada com a mesma resposta;
- o navegador nunca fornece `principalId`, emissor confiável, papel ou tenant;
- nenhuma chave, token, cookie, e-mail ou senha é persistida pelo contrato desta fase;
- rota de login, cookie e migration do vínculo aguardam o gate do adaptador Clerk e a governança operacional dos identificadores pseudônimos.

## Critérios para escolha do fornecedor

A comparação entre Clerk, Descope, Auth0 e uma solução baseada em Auth.js deve registrar: custo previsível, portabilidade, MFA, recuperação, logs de segurança, exclusão/exportação, integração Next.js, operação local e dependência do fornecedor. Organizações do provedor não substituirão `tenant_memberships`.

## Consequências

O serviço de aplicação permanece testável sem rede e sem SDK. Trocar o provedor exige substituir o adaptador e preservar o vínculo, não alterar regras de autorização. O subject externo é um identificador pseudônimo e não será persistido antes de finalidade, retenção e descarte serem aprovados.

## Reversão

Remover os contratos e o serviço da Fase 3.1. Como não há fornecedor, migration, segredo ou rota, nenhuma reversão externa é necessária.
