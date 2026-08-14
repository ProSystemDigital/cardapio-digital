import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MenuExperience from "../../components/MenuExperience/MenuExperience";
import { catalogRepository } from "../../../data/catalog-repository.server";

type TenantMenuPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export async function generateStaticParams() {
  const slugs = await catalogRepository.listTenantSlugs();
  return slugs.map((tenantSlug) => ({ tenantSlug }));
}

export async function generateMetadata({ params }: TenantMenuPageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  const catalog = await catalogRepository.findByTenantSlug(tenantSlug);

  if (!catalog) {
    return { title: "Cardápio não encontrado" };
  }

  return {
    title: `${catalog.tenant.displayName} | Cardápio digital`,
    description: `Consulte o cardápio demonstrativo de ${catalog.tenant.displayName}.`,
  };
}

export default async function TenantMenuPage({ params }: TenantMenuPageProps) {
  const { tenantSlug } = await params;
  const catalog = await catalogRepository.findByTenantSlug(tenantSlug);

  if (!catalog) {
    notFound();
  }

  return <MenuExperience key={catalog.tenant.id} catalog={catalog} />;
}
