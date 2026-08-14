# ADR 0007 — PostgreSQL e isolamento multitenant

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-12 |
| Decisores | Produto e Engenharia |

## Contexto

O repositório em memória comprovou os contratos do catálogo, mas a próxima evolução exige uma fonte persistente sem permitir referências ou leituras entre tenants. Persistência, autenticação e dados pessoais possuem riscos diferentes e não devem ser introduzidos simultaneamente.

## Decisão

- adotar PostgreSQL como banco relacional futuro;
- usar UUID gerado pelo servidor, `timestamptz` e valores monetários em centavos inteiros;
- exigir `tenant_id NOT NULL` em cada entidade pertencente ao tenant;
- usar chaves estrangeiras compostas com `tenant_id` para impedir referências cruzadas;
- habilitar e forçar Row-Level Security em todas as tabelas, sem política permissiva quando `app.tenant_id` estiver ausente;
- definir o contexto do tenant somente dentro de transação confiável do backend futuro;
- manter catálogo referenciado por pedidos com exclusão restrita e arquivamento lógico;
- guardar nomes e preços como snapshots nos itens para preservar o histórico do pedido;
- separar projeções públicas das operações administrativas nos repositórios futuros, sem acesso direto do navegador ao banco;
- versionar migrations imutáveis com arquivos `up` e `down` transacionais;
- não provisionar banco, cliente SQL, credencial, autenticação ou dado pessoal nesta etapa.

## Consequências

RLS atua como defesa em profundidade; não substitui autorização da aplicação. O proprietário da conexão e papéis com `BYPASSRLS` não poderão ser usados pelo runtime comum. A resolução pública por slug deverá ocorrer no servidor e estabelecer o UUID do tenant antes de qualquer consulta de catálogo.

As restrições compostas impedem categoria, produto, modalidade, variação, adicional, pedido e item de apontarem para outro tenant. Os snapshots tornam o total histórico independente de alterações futuras no catálogo.

Identificação de mesa, cliente, telefone, endereço, pagamento e trilha de auditoria continuam bloqueados até decisões próprias de privacidade e autorização.

## Reversão

`0001_initial_schema.down.sql` remove as tabelas em ordem inversa dentro de uma transação. Como a migration ainda não é executada por aplicação ou ambiente remoto, sua reversão nesta fase consiste também na remoção dos artefatos locais.
