# ADR 0069 — Contrato portátil de cobertura de entrega

| Campo | Valor |
| --- | --- |
| Status | Aceito sem fornecedor ou dados reais |
| Data | 2026-08-22 |
| Decisores | Produto e Engenharia |

## Contexto

A distância máxima do tenant permite comparar um futuro endereço com o alcance logístico, mas não autoriza coleta, persistência ou compartilhamento de localização de clientes.

## Decisão

- modelar somente CEP, logradouro, número, cidade, UF e país `BR`;
- separar geocodificação e cálculo de rota por portas independentes de fornecedor;
- usar adaptadores locais determinísticos e endereços fictícios nesta fase;
- comparar distância viária inteira em metros com o limite operacional confiável;
- devolver somente estado, distância e duração, nunca coordenadas;
- tratar ambiguidade, endereço ou rota ausente, falha e timeout de dois segundos como estados seguros;
- não criar formulário, endpoint, banco, SDK, segredo, cache ou chamada externa.

## Consequências

O domínio pode ser testado e evoluído sem custo ou dependência comercial. A cobertura ainda não está disponível ao cliente e duração de rota não representa prazo total de entrega.

## Próximo gate

Definir origem logística fictícia do estabelecimento e testar a composição server-only. Dados reais dependem de decisão LGPD, retenção, transparência, fornecedor e contrato de pedido.
