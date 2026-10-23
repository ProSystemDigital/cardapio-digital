# Checklist de ativação da cobertura real

## Contas e canais — responsabilidade do proprietário da plataforma

- [ ] manter ativo o e-mail profissional de privacidade da plataforma;
- [ ] confirmar o nome empresarial que será exibido publicamente;
- [ ] criar conta gratuita Geoapify sem cadastrar chave no navegador;
- [ ] restringir a chave por origem/IP quando o ambiente permitir;
- [ ] manter acesso administrativo e recuperação das contas em local seguro;
- [ ] revisar termos, DPA, subprocessadores, atribuição e região do provedor;
- [ ] solicitar análise jurídica final dos documentos de privacidade e contratos.

## Configuração da plataforma — exclusivamente no servidor

```dotenv
PLATFORM_LEGAL_NAME=
PLATFORM_PRIVACY_EMAIL=
GEOAPIFY_API_KEY=
```

Valores reais pertencem ao `.env.local` ignorado ou ao cofre de variáveis do ambiente. Nunca devem ser enviados ao navegador, documentação ou commit.

## Configuração por estabelecimento

- [ ] nome empresarial do controlador;
- [ ] e-mail funcional de privacidade;
- [ ] prazo explícito de retenção do endereço após o pedido;
- [ ] origem logística autorizada;
- [ ] cidades/regiões atendidas;
- [ ] aprovação do aviso apresentado antes do endereço;
- [ ] procedimento de correção, exclusão e contestação de cobertura.

## Gates automáticos de produção

A cobertura real somente poderá ser habilitada quando todos forem verdadeiros:

1. identidade profissional da plataforma válida;
2. configuração de privacidade do tenant válida;
3. origem geocodificada e verificada;
4. credencial do provedor presente apenas no servidor;
5. referência de aprovação jurídica/privacidade registrada;
6. teste regional e limites de custo aprovados;
7. logs sanitizados, rate limit, timeout e fallback validados;
8. retenção e eliminação exercitadas em teste.

## Política técnica inicial

- simulação não confirmada: endereço e coordenadas somente em memória;
- pedido confirmado: endereço persistido no domínio do pedido, nunca no log;
- prazo de retenção: decisão explícita por estabelecimento, inicialmente sugerida em 90 dias para teste de política, sujeita à revisão jurídica;
- registros financeiros/fiscais: política separada, sem presumir que o endereço operacional precise seguir o mesmo prazo;
- eliminação: job auditável futuro, com preservação somente quando existir fundamento documentado.
