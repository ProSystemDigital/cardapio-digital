# ADR 0026 — Perfil do estabelecimento somente leitura

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

Nome curto, slogan, modalidades, canal e momento do pagamento fazem parte da configuração pública do tenant e influenciam a experiência do cardápio. A área administrativa exibe o nome principal e dados operacionais, mas ainda não oferece uma revisão coesa desse perfil. Canal e pagamento não podem sugerir integração, envio ou transação já disponíveis.

## Decisão

- apresentar nome curto, slogan, modalidades, canal planejado e momento do pagamento do tenant derivado;
- rotular WhatsApp explicitamente como planejado e sem envio nesta fase;
- rotular pagamento como realizado no atendimento ou entrega, sem pagamento online;
- renderizar o perfil no Server Component usando o catálogo já autorizado;
- não adicionar coleta de dados, integração, Server Action, migration ou privilégio PostgreSQL;
- manter toda edição do perfil bloqueada até contratos e gates próprios.

## Consequências

Proprietário e gerente podem conferir a identidade e as configurações públicas sem ampliar a superfície de escrita ou criar expectativa de capacidade operacional inexistente. A leitura continua limitada ao tenant derivado e às permissões já aprovadas.

## Reversão

Remover o resumo do perfil da página administrativa. Persistência, permissões, comandos existentes e experiência pública permanecem inalterados.

## Evidência de aceitação

Em 2026-08-16, testes unitários, lint, tipos, build, regressão visual e PWA foram aprovados. A revisão humana autenticada, visual, funcional e arquitetural aprovou o perfil derivado, seus limites operacionais e o comportamento responsivo, sem integração, mutação ou novo privilégio.
