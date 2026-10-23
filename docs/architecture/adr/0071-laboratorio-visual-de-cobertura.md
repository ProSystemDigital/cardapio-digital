# ADR 0071 — Laboratório visual local de cobertura

| Campo | Valor |
| --- | --- |
| Status | Em revisão humana |
| Data | 2026-08-22 |
| Decisores | Produto e Engenharia |

## Contexto

A composição local precisava ser observável e testável por pessoas antes de qualquer coleta de endereço real ou escolha de fornecedor.

## Decisão

- exibir o laboratório somente na etapa **Operação** e fora de produção;
- oferecer apenas dois cenários fixos e fictícios: rota próxima e rota distante;
- não disponibilizar campo livre de endereço, CEP ou coordenadas;
- derivar novamente identidade, tenant e limite operacional no servidor;
- apresentar estado de cobertura, distância e duração da rota simulada, esclarecendo que duração não é prazo do pedido;
- manter a capacidade oculta quando `DELIVERY_COVERAGE_PROVIDER=disabled`.

## Consequências

UX, responsividade e mensagens podem ser avaliadas sem tratar localização pessoal. Aprovação desta tela não autoriza cobertura real nem substitui análise jurídica, segurança, qualidade geográfica e contrato com fornecedor.

## Próximos gates

1. aprovação visual, funcional e de experiência do laboratório;
2. contrato e autorização administrativa da origem logística real;
3. avaliação LGPD com finalidade, transparência, minimização, retenção e atendimento aos titulares;
4. matriz atualizada de fornecedores, custos, disponibilidade, limites e termos;
5. adaptadores externos em sandbox, observabilidade e testes geográficos controlados;
6. interface real de endereço e gate ponta a ponta antes de produção.
