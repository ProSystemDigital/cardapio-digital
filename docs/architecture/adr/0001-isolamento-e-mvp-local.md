# ADR 0001 — Isolamento do boilerplate e MVP local

| Campo | Valor |
| --- | --- |
| Status | Aceito e implementado |
| Data | 2026-08-10 |
| Decisores | Produto e Engenharia |

## Contexto

O Cardápio Digital parte da estrutura técnica de uma aplicação institucional, mas deve possuir repositório, marca, dados e ciclo de entrega independentes. A primeira fase precisa demonstrar catálogo e carrinho sem antecipar integrações ou coleta de dados.

## Decisão

- remover o histórico Git, vínculos de hospedagem, ambientes e fluxos SMTP da origem;
- manter Next.js, React, TypeScript, SCSS, Serwist e Playwright já validados;
- implementar catálogo estático, busca, categorias e carrinho somente em memória;
- não enviar pedidos nem persistir dados no MVP;
- exigir uma nova decisão arquitetural e revisão de privacidade antes de qualquer integração externa.

## Consequências

O MVP é simples, verificável e não depende de credenciais. Recarregar a página descarta o carrinho. Preços e disponibilidade são demonstrativos até a definição de uma fonte de verdade. O rollback é a reversão do commit no novo repositório, sem impacto no projeto de origem.
