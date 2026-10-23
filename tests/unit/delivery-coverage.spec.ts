import { expect, test } from "@playwright/test";
import { DeliveryCoverageService } from "../../application/delivery-coverage-service";
import { LocalDeliveryGeocoder, LocalDeliveryRouter } from "../../data/local-delivery-location-adapters";
import { DeliveryCoverageValidationError, normalizeBrazilianDeliveryAddress, type BrazilianDeliveryAddress } from "../../domain/delivery-coverage";

const origin = { latitude: -23.55052, longitude: -46.633308 };
const near = { latitude: -23.561684, longitude: -46.655981 };
const far = { latitude: -23.681531, longitude: -46.875481 };
const address: BrazilianDeliveryAddress = {
  postalCode: "01001-000", street: "Praça da Sé", number: "100",
  city: "São Paulo", state: "sp", country: "BR",
};
const normalizedAddress = normalizeBrazilianDeliveryAddress(address);

function serviceFor(destination = near, distanceInMeters = 5_000) {
  return new DeliveryCoverageService(
    new LocalDeliveryGeocoder([{ address: normalizedAddress, result: { kind: "found", point: destination } }]),
    new LocalDeliveryRouter([{ origin, destination, result: { kind: "found", distanceInMeters, durationInSeconds: 1_200 } }]),
  );
}

test("normaliza endereço fictício e aprova cobertura pela distância viária", async () => {
  expect(normalizedAddress).toMatchObject({ postalCode: "01001000", state: "SP" });
  await expect(serviceFor().evaluate({ origin, destination: address, maximumDistanceInMeters: 10_000 })).resolves.toEqual({
    kind: "covered", distanceInMeters: 5_000, durationInSeconds: 1_200,
  });
});

test("informa fora da cobertura sem expor coordenadas", async () => {
  const result = await serviceFor(far, 12_500).evaluate({ origin, destination: address, maximumDistanceInMeters: 10_000 });
  expect(result).toEqual({ kind: "outside_coverage", distanceInMeters: 12_500, durationInSeconds: 1_200 });
  expect(result).not.toHaveProperty("origin");
  expect(result).not.toHaveProperty("destination");
});

test("distingue endereço ambíguo, ausente e rota ausente", async () => {
  for (const [geocodeKind, expectedKind] of [["ambiguous", "address_ambiguous"], ["not_found", "address_not_found"]] as const) {
    const service = new DeliveryCoverageService(
      new LocalDeliveryGeocoder([{ address: normalizedAddress, result: { kind: geocodeKind } }]),
      new LocalDeliveryRouter([]),
    );
    await expect(service.evaluate({ origin, destination: address, maximumDistanceInMeters: 10_000 })).resolves.toEqual({ kind: expectedKind });
  }
  const service = new DeliveryCoverageService(
    new LocalDeliveryGeocoder([{ address: normalizedAddress, result: { kind: "found", point: near } }]),
    new LocalDeliveryRouter([]),
  );
  await expect(service.evaluate({ origin, destination: address, maximumDistanceInMeters: 10_000 })).resolves.toEqual({ kind: "route_not_found" });
});

test("falha fechada em timeout e recusa entrada inválida antes das portas", async () => {
  const hanging = new DeliveryCoverageService(
    { geocode: () => new Promise(() => undefined) },
    new LocalDeliveryRouter([]),
    5,
  );
  await expect(hanging.evaluate({ origin, destination: address, maximumDistanceInMeters: 10_000 })).resolves.toEqual({ kind: "temporarily_unavailable" });
  await expect(serviceFor().evaluate({ origin, destination: { ...address, postalCode: "1" }, maximumDistanceInMeters: 10_000 })).rejects.toBeInstanceOf(DeliveryCoverageValidationError);
  await expect(serviceFor().evaluate({ origin, destination: address, maximumDistanceInMeters: 300_000 })).rejects.toBeInstanceOf(DeliveryCoverageValidationError);
});
