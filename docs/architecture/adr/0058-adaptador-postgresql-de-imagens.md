# ADR 0058 — Adaptador PostgreSQL de imagens

| Campo | Valor |
| --- | --- |
| Status | Aceito para gate local |
| Data | 2026-08-18 |
| Decisores | Produto e Engenharia |

## Contexto

O processador e o contrato de upload já estão aprovados. Falta comprovar que os metadados normalizados podem ser criados e substituídos no PostgreSQL sob RLS, concorrência otimista e auditoria, sem conectar armazenamento remoto ou banco persistente.

## Decisão

- implementar `PostgresCatalogImageMetadataRepository` atrás da porta existente;
- abrir transação e definir `app.tenant_id` localmente antes de qualquer consulta;
- verificar a existência do tenant ou produto sob RLS;
- bloquear o metadado atual com `FOR UPDATE`;
- usar `expectedVersion = null` exclusivamente para criação e versão positiva para substituição;
- incrementar a versão do metadado e devolver a chave anterior somente após persistência bem-sucedida;
- registrar `tenant.logo.updated` ou `product.image.updated` na auditoria existente, sem URL, chave ou hash;
- criar a migration reversível 0012 somente para ampliar os valores permitidos das ações de auditoria;
- conceder acesso às tabelas de imagem apenas ao papel descartável dentro da fixture do gate.

## Consequências

Metadado e auditoria são atômicos no PostgreSQL. A exclusão do objeto anterior continua fora da transação e será coordenada pelo serviço compensatório já aprovado. A chave anterior não é exposta ao navegador.

## Limites

Não há privilégio no banco persistente, SDK Blob, objeto real, composição de runtime, Server Action ou interface.

## Reversão

Remover o adaptador e executar `0012_catalog_image_audit_actions.down.sql`. A migration 0011 e os contratos permanecem independentes.
