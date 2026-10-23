# ADR 0072 — Origem logística e provedor geográfico

| Campo | Valor |
| --- | --- |
| Status | Fundação aceita; ativação real bloqueada |
| Data | 2026-08-22 |
| Decisores | Produto e Engenharia |

## Decisão

- persistir uma origem por tenant com endereço brasileiro, coordenadas opcionais, estado de geocodificação e versão;
- aplicar RLS forçada e auditoria separada, sem privilégios de runtime nesta fundação;
- tratar origem residencial como potencial dado pessoal;
- selecionar **Geoapify apenas para sandbox futuro**, atrás das portas existentes e sem SDK;
- manter credencial no servidor e nenhuma chamada externa ativa sem `GEOAPIFY_API_KEY`;
- impedir produção até revisão de privacidade, DPA/termos, qualidade e custos.

## Matriz verificada em 2026-08-22

| Opção | Desenvolvimento sem custo | Pontos relevantes | Decisão |
| --- | --- | --- | --- |
| Geoapify | 3.000 créditos/dia, sem cartão | geocodificação e rota; atribuição; plano grátis com uso comercial limitado | Sandbox provisório |
| Mapbox | franquias gratuitas publicadas | geocodificação temporária não autoriza persistência; permanente possui preço/termos próprios | Alternativa |
| Google Maps | franquias por SKU | exige faturamento e chave; quotas configuráveis | Adiar |
| HERE | plano base gratuito anunciado | termos, limites e qualidade regional ainda não comparados em teste | Alternativa |
| Nominatim público OSMF | acesso público limitado | máximo absoluto de 1 req/s, atribuição e capacidade doada; sem SLA | Rejeitado como backend |

Preços e termos mudam; a matriz deve ser refeita antes da produção.

## Fontes oficiais

- [Geoapify pricing](https://www.geoapify.com/pricing/)
- [Geoapify Routing API](https://apidocs.geoapify.com/docs/routing/)
- [Mapbox pricing](https://www.mapbox.com/pricing)
- [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [HERE pricing](https://www.here.com/get-started/pricing)
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
