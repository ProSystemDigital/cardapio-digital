# Privacidade e LGPD — Cardápio Digital

| Campo | Valor |
| --- | --- |
| Estado | Política técnica da fundação |
| Revisão | 2026-08-22 |

A aplicação não solicita, transmite ou persiste dados pessoais de clientes. Busca, filtros e carrinho funcionam localmente em memória e são descartados ao recarregar a aplicação. O catálogo pode publicar o contato comercial informado pelo estabelecimento.

A configuração operacional admite um contato comercial público fornecido pelo estabelecimento. Esse campo não autoriza coleta de telefone de cliente, mensagem, endereço ou histórico. Quando o contato identificar pessoa natural, sua publicação exige responsabilidade do tenant controlador, transparência e canal de correção/remoção. A auditoria registra apenas que há contato configurado.

As decisões por WhatsApp, entrega e administração indicam tratamento futuro, mas não autorizam sua implementação. Antes de habilitá-los, Produto e Engenharia devem definir controlador, operadores, dados mínimos por modalidade, finalidade, base legal, transparência, retenção, direitos do titular e controles de segurança. Números de telefone, endereços, nomes e histórico de pedidos não devem ser adicionados aos dados demonstrativos.

O fluxo local de cobertura não altera essa restrição: origem, endereços, coordenadas e rotas permanecem exclusivamente fictícios em desenvolvimento/testes, sem formulário, persistência ou compartilhamento externo, e são bloqueados em produção. Resultado público futuro deverá omitir coordenadas e exigir transparência antes da coleta.

O laboratório visual aceita somente a escolha entre cenários fictícios predefinidos. Não deve ser adaptado para receber endereço livre antes do gate específico de localização e da revisão jurídica aplicável.

A avaliação técnica específica está em `DELIVERY_LOCATION_PRIVACY_GATE.md`. Ela não autoriza tratamento real: identificação do controlador/operadores/encarregado, hipótese legal, RIPD, aviso, retenção de pedidos, DPA e eventual transferência internacional dependem de decisão formal humana antes da ativação.

Pagamento online e analytics exigem avaliação própria antes da adoção. Esta documentação não substitui validação jurídica.

Uma conta administrativa real existe somente no Clerk Development para validar autenticação, logout e revogação. A aplicação não persiste dados cadastrais do perfil e ainda não grava o identificador pseudônimo real no PostgreSQL. Produção e ampliação de titulares continuam bloqueadas pela revisão humana do DPA, subprocessadores, transferência internacional, finalidade, retenção e direitos.
