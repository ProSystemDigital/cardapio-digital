# ADR 0070 — Composição local de cobertura de entrega

| Campo | Valor |
| --- | --- |
| Status | Aceito somente para desenvolvimento e teste |
| Data | 2026-08-22 |
| Decisores | Produto e Engenharia |

## Contexto

O contrato portátil da ADR 0069 precisava ser exercitado de ponta a ponta sem contratar geocodificação ou roteamento e sem apresentar uma cobertura fictícia ao cliente como real.

## Decisão

- manter origem, destinos, coordenadas e rotas em um registro local explicitamente fictício por tenant;
- compor a avaliação em módulo `server-only`, recebendo o tenant já confiável e seu limite operacional;
- habilitar fixtures somente com `DELIVERY_COVERAGE_PROVIDER=local_fixtures` fora de produção;
- falhar fechado como `temporarily_unavailable` em produção, configuração ausente, tenant desconhecido ou limite ausente;
- não criar interface, endpoint, persistência, SDK, chamada externa ou coleta de endereço real.

## Consequências

O encadeamento origem → geocodificação → rota → comparação está funcional e testável localmente sem custo. Ele não constitui cobertura geográfica real e permanece indisponível ao cliente.

## Próximo gate

Antes da produção, selecionar e avaliar fornecedor, definir finalidade/base legal/transparência/retenção, cadastrar origem real com autorização, medir qualidade de geocodificação e rota, aplicar limites operacionais e executar testes por região.
