import { SignUp } from "@clerk/nextjs";
import styles from "../../admin.module.scss";

export default async function AdminSignUpPage({ searchParams }: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const selectedPlan = plan === "professional" ? "professional" : "essential";
  return (
    <main className={styles.page}>
      <section className={styles.signIn} aria-label="Cadastro de assinante">
        <header>
          <p>Novo estabelecimento</p>
          <h1>Cadastre-se como assinante</h1>
          <p>Após criar a conta, confirme o plano e conclua o pagamento seguro.</p>
        </header>
        <SignUp path="/admin/sign-up" routing="path" forceRedirectUrl={`/planos?plan=${selectedPlan}`} signInUrl="/admin/sign-in" />
      </section>
    </main>
  );
}
