# ADR 0050 — Contrato de ativação de Consumo no local

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

`dine_in` já pertence ao vocabulário do domínio, mas o tenant PostgreSQL local possui somente entrega e retirada. Inserir a nova modalidade diretamente faria a opção aparecer no catálogo público antes de existir produto compatível.

## Decisão

- criar contrato e porta próprios para habilitação de modalidade no tenant;
- limitar esta fase exclusivamente a `dine_in`, apresentado como “Consumo no local”;
- exigir de 1 a 200 produtos iniciais, com UUIDs únicos e válidos;
- exigir ator técnico válido, membership no tenant e negar administrador da plataforma;
- manter banco, privilégio, composição, formulário e catálogo público desconectados;
- exigir que a futura persistência trate a compatibilidade inicial dos produtos antes da exposição pública;
- não implementar desativação nesta fase.

## Consequências

A intenção de ativação fica validada sem alterar a operação atual. Entrega e retirada não podem ser reenviadas por este contrato e nenhum tenant passa a anunciar consumo local prematuramente.

## Reversão

Remover contrato, porta, serviço e testes. Nenhum dado persistido é alterado por esta fase.

## Evidência de aceitação

Em 2026-08-16, 90 testes unitários, lint, tipos e build de produção foram aprovados. O contrato comprovou negação antes da porta para outra modalidade, outro tenant, administrador da plataforma e identificadores inválidos. A persistência subsequente tornou explícita a seleção inicial não vazia de produtos.
