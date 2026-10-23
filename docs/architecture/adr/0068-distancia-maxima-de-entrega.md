# ADR 0068 — Distância máxima de entrega

| Campo | Valor |
| --- | --- |
| Status | Aceito para gate local e revisão humana |
| Data | 2026-08-22 |
| Decisores | Produto e Engenharia |

## Contexto

O estabelecimento precisa declarar o alcance logístico da entrega antes da futura coleta e validação do endereço do cliente.

## Decisão

- configurar de `0,5` a `200 km` na etapa Operação;
- persistir um inteiro entre `500` e `200000` metros em `tenant_operations`;
- atualizar distância, demais dados operacionais, versão e auditoria na mesma transação;
- não coletar endereço, coordenadas ou localização do cliente nesta etapa;
- não bloquear pedidos nem estimar tempo até existir origem geográfica, geocodificação e cálculo de rota confiável.

## Consequências

A loja registra seu limite operacional sem antecipar tratamento de localização pessoal. A configuração não representa garantia de cobertura até o gate futuro de endereço e rota.

## Reversão

Revogar a coluna do privilégio de atualização e executar `0014_delivery_distance.down.sql`.
