# Gate de privacidade — localização para entrega

| Campo | Estado |
| --- | --- |
| Avaliação técnica de privacidade | Concluída em 2026-08-22 |
| Tratamento de endereço real | Bloqueado |
| Modelo controlador/operadora | Aprovado pelo produto; revisão jurídica final pendente |
| Aprovação do controlador/encarregado/jurídico | Pendente antes da publicação |
| Provedor contratado e DPA revisado | Pendente |

Este documento é uma avaliação de engenharia e não substitui parecer jurídico. A ANPD recomenda que o controlador elabore o RIPD antes de iniciar tratamento que possa gerar alto risco e atribui ao controlador a responsabilidade pelo relatório.

## Finalidade delimitada

Usar o endereço informado pelo cliente exclusivamente para:

1. verificar se a entrega está dentro da área atendida;
2. calcular distância e duração viária necessárias à entrega;
3. executar o pedido quando o cliente prosseguir.

É proibido reutilizar localização para publicidade, perfil comportamental, venda, enriquecimento de cadastro ou acompanhamento contínuo.

## Dados mínimos

- CEP, logradouro, número, cidade, UF e país;
- complemento somente quando necessário à entrega, fora da consulta de cobertura quando possível;
- coordenadas derivadas somente no servidor;
- resultado público sem coordenadas;
- origem logística do estabelecimento, que deve receber proteção equivalente quando puder identificar residência de pessoa natural.

## Ciclo proposto

| Momento | Tratamento | Retenção técnica proposta |
| --- | --- | --- |
| Simulação de cobertura | endereço → coordenada → rota | memória da requisição; sem persistência |
| Pedido não concluído | resultado de cobertura | sessão curta; sem coordenadas |
| Pedido confirmado | endereço necessário à entrega | política do pedido ainda deve definir prazo legal/operacional |
| Logs | estado, latência, provedor e erro sanitizado | sem endereço, CEP completo, coordenadas ou chave |

## Hipótese legal candidata

A necessidade para execução de contrato ou procedimentos preliminares solicitados pelo titular (art. 7º, V) é a hipótese candidata para validação de cobertura vinculada a um pedido. A definição final pertence ao controlador e à revisão jurídica; consentimento não deve ser usado como substituto automático quando não for livre ou necessário.

## Salvaguardas obrigatórias

- aviso antes do primeiro campo de endereço, com finalidade e compartilhamento;
- TLS, credencial apenas no servidor, timeout, rate limit e quotas de custo;
- minimização da resposta do provedor;
- falha fechada sem afirmar cobertura;
- nenhuma coordenada no navegador, URL, auditoria ou log;
- canal para direitos do titular e contato do encarregado/controlador;
- contrato/DPA, subprocessadores, região de processamento e transferência internacional revisados;
- teste de precisão por cidades atendidas e procedimento para contestação/correção;
- revisão do RIPD quando finalidade, fornecedor, dados ou arquitetura mudarem.

## Decisões humanas obrigatórias antes de desbloquear

- identificar formalmente controlador, operador(es) e encarregado/canal;
- aprovar hipótese legal, aviso de privacidade e política de retenção dos pedidos;
- classificar risco e decidir/assinar o RIPD;
- revisar DPA, termos, subprocessadores e transferência internacional do provedor;
- aprovar cidades/regiões de lançamento e critérios mínimos de precisão.

## Modelo de papéis adotado

Cada estabelecimento é controlador dos dados necessários aos próprios pedidos. A plataforma atua como operadora nesse fluxo e como controladora das atividades institucionais próprias, como contas administrativas e segurança. O provedor geográfico será suboperador no cálculo de cobertura. O detalhamento versionado está em `DATA_PROCESSING_ROLES.md`.

## Referências oficiais

- [LGPD — Lei nº 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm)
- [ANPD — perguntas e respostas sobre RIPD](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/relatorio-de-impacto-a-protecao-de-dados-pessoais-ripd)
- [ANPD — Guia de Legítimo Interesse](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_hipoteses_legais_tratamento_de_dados_pessoais_legitimo_interesse)
- [ANPD — materiais e guias orientativos](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes)
