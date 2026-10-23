import type { TenantCatalog } from "../domain/catalog";

export const mesaVivaCatalog = {
  tenant: {
    id: "tenant-mesa-viva",
    slug: "mesa-viva",
    displayName: "Mesa Viva",
    shortName: "Mesa Viva",
    tagline: "cozinha de verdade",
    fulfillmentModes: ["dine_in", "pickup", "delivery"],
    paymentTiming: "on_fulfillment",
    orderChannel: "whatsapp",
    operations: {
      businessHours: [
        { weekday: "monday", opensAt: "11:30", closesAt: "22:30" },
        { weekday: "tuesday", opensAt: "11:30", closesAt: "22:30" },
        { weekday: "wednesday", opensAt: "11:30", closesAt: "22:30" },
        { weekday: "thursday", opensAt: "11:30", closesAt: "22:30" },
        { weekday: "friday", opensAt: "11:30", closesAt: "23:00" },
        { weekday: "saturday", opensAt: "11:30", closesAt: "23:00" },
        { weekday: "sunday", opensAt: "11:30", closesAt: "21:00" },
      ],
      minimumOrderInCents: 3000,
      deliveryFeeInCents: 700,
      diningTables: ["Salão principal · Mesa 01", "Salão principal · Mesa 02", "Salão principal · Mesa 03", "Varanda · Mesa 01"],
    },
  },
  categories: [
    { id: "entradas", tenantId: "tenant-mesa-viva", name: "Entradas", sortOrder: 1 },
    { id: "principais", tenantId: "tenant-mesa-viva", name: "Principais", sortOrder: 2 },
    { id: "bebidas", tenantId: "tenant-mesa-viva", name: "Bebidas", sortOrder: 3 },
    { id: "sobremesas", tenantId: "tenant-mesa-viva", name: "Sobremesas", sortOrder: 4 },
  ],
  products: [
    { id: "burrata", tenantId: "tenant-mesa-viva", categoryId: "entradas", name: "Burrata da casa", description: "Tomates assados, pesto de manjericão e pão de fermentação natural.", priceInCents: 3800, emoji: "🍅", tag: "Mais pedido", isAvailable: true, fulfillmentModes: ["dine_in", "pickup"] },
    { id: "croqueta", tenantId: "tenant-mesa-viva", categoryId: "entradas", name: "Croqueta de costela", description: "Quatro unidades, aioli defumado e picles artesanal.", priceInCents: 3200, emoji: "🥟", isAvailable: true, fulfillmentModes: ["dine_in", "pickup", "delivery"] },
    { id: "nhoque", tenantId: "tenant-mesa-viva", categoryId: "principais", name: "Nhoque verde", description: "Massa de espinafre, fonduta de queijo e castanha crocante.", priceInCents: 5600, emoji: "🍝", tag: "Vegetariano", isAvailable: true, fulfillmentModes: ["dine_in", "pickup", "delivery"], variations: [{ id: "individual", name: "Individual", priceDeltaInCents: 0, isAvailable: true }, { id: "para-dois", name: "Para dois", priceDeltaInCents: 4200, isAvailable: true }] },
    { id: "frango", tenantId: "tenant-mesa-viva", categoryId: "principais", name: "Frango na brasa", description: "Sobrecoxa desossada, purê rústico e molho de ervas.", priceInCents: 5200, emoji: "🍗", isAvailable: true, fulfillmentModes: ["dine_in", "pickup", "delivery"] },
    { id: "burger", tenantId: "tenant-mesa-viva", categoryId: "principais", name: "Burger Mesa Viva", description: "Blend 160g, queijo, cebola tostada e maionese da casa.", priceInCents: 4400, emoji: "🍔", tag: "Favorito", isAvailable: true, fulfillmentModes: ["dine_in", "pickup", "delivery"], addonGroups: [{ id: "extras", name: "Adicionais", minimumSelections: 0, maximumSelections: 2, addons: [{ id: "bacon", name: "Bacon", priceInCents: 600, isAvailable: true }, { id: "queijo", name: "Queijo extra", priceInCents: 500, isAvailable: true }] }] },
    { id: "limonada", tenantId: "tenant-mesa-viva", categoryId: "bebidas", name: "Limonada de capim-santo", description: "Limão, capim-santo e pouco açúcar. 400 ml.", priceInCents: 1400, emoji: "🍋", isAvailable: true, fulfillmentModes: ["dine_in", "pickup", "delivery"] },
    { id: "cha-mate", tenantId: "tenant-mesa-viva", categoryId: "bebidas", name: "Chá mate cítrico", description: "Mate da casa, laranja e hortelã. 400 ml.", priceInCents: 1300, emoji: "🧋", isAvailable: true, fulfillmentModes: ["dine_in", "pickup", "delivery"] },
    { id: "pudim", tenantId: "tenant-mesa-viva", categoryId: "sobremesas", name: "Pudim de cumaru", description: "Pudim cremoso, caramelo salgado e cumaru.", priceInCents: 2400, emoji: "🍮", tag: "Novo", isAvailable: true, fulfillmentModes: ["dine_in", "pickup"] },
  ],
} as const satisfies TenantCatalog;

export const casaDoPortoCatalog = {
  tenant: {
    id: "tenant-casa-do-porto",
    slug: "casa-do-porto",
    displayName: "Casa do Porto",
    shortName: "Casa do Porto",
    tagline: "sabores do litoral",
    fulfillmentModes: ["dine_in", "pickup"],
    paymentTiming: "on_fulfillment",
    orderChannel: "whatsapp",
    operations: {
      businessHours: [
        { weekday: "tuesday", opensAt: "12:00", closesAt: "22:00" },
        { weekday: "wednesday", opensAt: "12:00", closesAt: "22:00" },
        { weekday: "thursday", opensAt: "12:00", closesAt: "22:00" },
        { weekday: "friday", opensAt: "12:00", closesAt: "23:00" },
        { weekday: "saturday", opensAt: "12:00", closesAt: "23:00" },
        { weekday: "sunday", opensAt: "12:00", closesAt: "20:00" },
      ],
      minimumOrderInCents: 2500,
      diningTables: ["Salão principal · Mesa 01", "Salão principal · Mesa 02"],
    },
  },
  categories: [
    { id: "petiscos", tenantId: "tenant-casa-do-porto", name: "Petiscos", sortOrder: 1 },
    { id: "pescados", tenantId: "tenant-casa-do-porto", name: "Pescados", sortOrder: 2 },
    { id: "bebidas-porto", tenantId: "tenant-casa-do-porto", name: "Bebidas", sortOrder: 3 },
  ],
  products: [
    { id: "bolinho-bacalhau", tenantId: "tenant-casa-do-porto", categoryId: "petiscos", name: "Bolinho de bacalhau", description: "Seis unidades com aioli de limão-siciliano.", priceInCents: 3600, emoji: "🐟", tag: "Da casa", isAvailable: true, fulfillmentModes: ["dine_in", "pickup"] },
    { id: "peixe-grelhado", tenantId: "tenant-casa-do-porto", categoryId: "pescados", name: "Peixe grelhado", description: "Peixe do dia, legumes tostados e arroz de ervas.", priceInCents: 6800, emoji: "🐠", isAvailable: true, fulfillmentModes: ["dine_in", "pickup"], variations: [{ id: "executivo", name: "Executivo", priceDeltaInCents: 0, isAvailable: true }, { id: "completo", name: "Completo", priceDeltaInCents: 1800, isAvailable: true }] },
    { id: "camarao", tenantId: "tenant-casa-do-porto", categoryId: "pescados", name: "Camarão ao alho", description: "Camarões salteados, alho dourado e pão artesanal.", priceInCents: 7400, emoji: "🦐", isAvailable: true, fulfillmentModes: ["dine_in", "pickup"] },
    { id: "agua-coco", tenantId: "tenant-casa-do-porto", categoryId: "bebidas-porto", name: "Água de coco", description: "Água de coco gelada. 400 ml.", priceInCents: 1200, emoji: "🥥", isAvailable: true, fulfillmentModes: ["dine_in", "pickup"] },
  ],
} as const satisfies TenantCatalog;

export const demoCatalogs = [mesaVivaCatalog, casaDoPortoCatalog] as const;
