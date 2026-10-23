import { expect, test } from "@playwright/test";
import { GeoapifyDeliveryGeocoder, GeoapifyDeliveryRouter } from "../../data/geoapify-delivery-location-adapters";
import type { BrazilianDeliveryAddress } from "../../domain/delivery-coverage";

const address: BrazilianDeliveryAddress = { postalCode: "01001000", street: "Rua de Teste", number: "10", city: "São Paulo", state: "SP", country: "BR" };
const signal = new AbortController().signal;

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("adapta geocodificação Geoapify sem expor chave no resultado", async () => {
  let requestedUrl = "";
  const request = async (input: URL | RequestInfo) => {
    requestedUrl = input.toString();
    return response({ results: [{ lat: -23.55, lon: -46.63, result_type: "building", rank: { confidence: 0.95 } }] });
  };
  await expect(new GeoapifyDeliveryGeocoder("segredo", request as typeof fetch).geocode(address, signal))
    .resolves.toEqual({ kind: "found", point: { latitude: -23.55, longitude: -46.63 } });
  expect(requestedUrl).toContain("filter=countrycode%3Abr");
  expect(requestedUrl).toContain("limit=2");
});

test("geocodificador distingue ausência, ambiguidade e indisponibilidade", async () => {
  await expect(new GeoapifyDeliveryGeocoder("key", (async () => response({ results: [] })) as typeof fetch).geocode(address, signal)).resolves.toEqual({ kind: "not_found" });
  await expect(new GeoapifyDeliveryGeocoder("key", (async () => response({ results: [
    { lat: 1, lon: 1, result_type: "building", rank: { confidence: 0.9 } },
    { lat: 2, lon: 2, result_type: "building", rank: { confidence: 0.8 } },
  ] })) as typeof fetch).geocode(address, signal)).resolves.toEqual({ kind: "ambiguous" });
  await expect(new GeoapifyDeliveryGeocoder("key", (async () => response({ results: [
    { lat: 1, lon: 1, result_type: "city", rank: { confidence: 0.25 } },
  ] })) as typeof fetch).geocode(address, signal)).resolves.toEqual({ kind: "ambiguous" });
  await expect(new GeoapifyDeliveryGeocoder("", (async () => { throw new Error("não deve chamar"); }) as typeof fetch).geocode(address, signal)).resolves.toEqual({ kind: "unavailable" });
});

test("geocodificador consolida edifício e ponto interno do mesmo local", async () => {
  const results = [
    { lat: -23.561414, lon: -46.655881, result_type: "building", rank: { confidence: 1, match_type: "full_match" } },
    { lat: -23.561600, lon: -46.655700, result_type: "amenity", rank: { confidence: 1, match_type: "inner_part" } },
  ];
  await expect(new GeoapifyDeliveryGeocoder("key", (async () => response({ results })) as typeof fetch).geocode(address, signal))
    .resolves.toEqual({ kind: "found", point: { latitude: results[0].lat, longitude: results[0].lon } });
});

test("adapta rota Geoapify para metros e segundos e falha fechada", async () => {
  const origin = { latitude: -23.55, longitude: -46.63 };
  const destination = { latitude: -23.56, longitude: -46.64 };
  await expect(new GeoapifyDeliveryRouter("key", (async () => response({ results: [{ distance: 4800.4, time: 780.2 }] })) as typeof fetch)
    .calculateRoute(origin, destination, signal)).resolves.toEqual({ kind: "found", distanceInMeters: 4800, durationInSeconds: 780 });
  await expect(new GeoapifyDeliveryRouter("key", (async () => response({}, 500)) as typeof fetch)
    .calculateRoute(origin, destination, signal)).resolves.toEqual({ kind: "unavailable" });
});
