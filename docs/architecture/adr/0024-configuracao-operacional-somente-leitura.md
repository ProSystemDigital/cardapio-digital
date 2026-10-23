# ADR 0024 — Configuração operacional somente leitura

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

Pedido mínimo, taxa de entrega e horários semanais afetam a cotação e a disponibilidade percebida pelo cliente. Esses dados já são reconstruídos pelo repositório PostgreSQL, mas ainda não são verificáveis na área administrativa. Horários também não modelam fuso, feriados ou exceções.

## Decisão

- apresentar pedido mínimo, taxa de entrega e intervalos semanais do tenant derivado;
- renderizar os dados diretamente no Server Component administrativo;
- usar apenas o catálogo já autorizado e as permissões de leitura existentes;
- não calcular ou afirmar o estado “aberto agora”;
- não adicionar Server Action, migration ou privilégio PostgreSQL;
- bloquear qualquer edição até contrato, autorização, versionamento e auditoria próprios.

## Consequências

Proprietário e gerente podem revisar a configuração que alimenta a cotação sem ampliar a superfície de escrita. Exceções, fusos e múltiplos intervalos permanecem sujeitos à modelagem existente e às decisões futuras.

## Reversão

Remover o resumo operacional da página administrativa. Persistência, permissões e experiência pública permanecem inalteradas.

## Evidência de aceitação

Em 2026-08-16, os gates unitário, estático, de tipos, build, visual e PWA foram aprovados. A revisão humana autenticada confirmou o tenant e o papel derivados do PostgreSQL e os valores operacionais somente leitura, sem controles de edição nem afirmação de “aberto agora”. Uma validação posterior em dispositivo real identificou falha no breakpoint de `544px`; após a correção do fluxo flexível e a inclusão de teste de regressão, novo gate humano no dispositivo real aprovou a responsividade.
