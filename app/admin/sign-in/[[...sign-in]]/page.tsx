import { SignIn } from "@clerk/nextjs";
import styles from "../../admin.module.scss";

export default function AdminSignInPage() {
  return (
    <main className={styles.page}>
      <section className={styles.signIn} aria-label="Acesso administrativo">
        <SignIn
          path="/admin/sign-in"
          routing="path"
          fallbackRedirectUrl="/admin"
        />
      </section>
    </main>
  );
}
