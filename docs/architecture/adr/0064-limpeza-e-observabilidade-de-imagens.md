# ADR 0064 — Limpeza e observabilidade de imagens

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-18 |
| Decisores | Produto e Engenharia |

## Contexto

Uma falha após gravar ou substituir um objeto pode deixar um WebP sem referência persistente. A operação também precisa acompanhar volume, bytes e falhas sem registrar credenciais, identidades, URLs ou chaves.

## Decisão

- listar somente `catalog/tenants/` com paginação e timeout;
- reconhecer exclusivamente chaves canônicas de logo e produto;
- consultar referências PostgreSQL sob RLS para cada tenant derivado das chaves válidas;
- operar em `dry_run` por padrão;
- considerar removível somente objeto não referenciado com no mínimo 24 horas;
- exigir `--apply` e `--confirm-delete-orphans` simultaneamente, com limite de 100 exclusões por padrão e máximo configurável de 500;
- nunca excluir objetos fora do namespace reconhecido;
- emitir logs JSON agregados de objetos, bytes, operações e falhas, sem chave, URL, tenant, ator ou mensagem bruta de exceção;
- acompanhar custo por unidades reais de consumo; valores monetários permanecem no painel do provedor para evitar uma tabela de preços desatualizada.

## Consequências

A simulação pode ser executada repetidamente sem mutação. A aplicação registra falha operacional de upload e limpeza anterior pendente em formato sanitizado. Agendamento distribuído, alertas externos e exclusão automática permanecem adiados até existir ambiente remoto e política operacional.

O gate local de 2026-08-18 listou 2 objetos e 99.626 bytes, todos referenciados, sem órfãos, namespace inválido, falha ou exclusão.

## Reversão

Remover o executor, os contratos de reconciliação e os logs estruturados. Nenhuma migration ou privilégio novo precisa ser revertido.
