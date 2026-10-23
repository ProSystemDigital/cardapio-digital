# ADR 0053 — Composição autorizada de Consumo no local

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O banco persistente está preparado, mas o adaptador não deve receber ator, papel, tenant ou modalidade diretamente de uma futura entrada do navegador.

## Decisão

- introduzir a permissão específica `tenant.fulfillment_modes.update`;
- renovar identidade e membership internas antes de construir o ator do domínio;
- derivar `dine_in` dentro da composição, sem recebê-lo do navegador;
- aceitar somente tenant já derivado e lista de produtos iniciais na fronteira `server-only`;
- manter Server Action, formulário e ativação efetiva fora desta fase.

## Consequências

Proprietário e gerente vinculados podem futuramente iniciar a ativação sem forjar contexto ou modalidade. Administrador da plataforma e principal sem membership continuam negados antes do adaptador.

## Reversão

Remover a permissão, o serviço autorizado e a composição. Banco, tenant e produtos permanecem inalterados.

## Evidência de aceitação

Em 2026-08-16, 95 testes unitários, lint, tipos e build de produção foram aprovados. Os testes confirmaram modalidade e ator derivados e ausência de chamada ao repositório sem membership.
