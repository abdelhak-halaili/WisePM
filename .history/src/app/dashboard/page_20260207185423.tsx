import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome back, {user?.email}</h1>
        <p className={styles.subtitle}>Here is what's happening in your product.</p>
      </header>
      
      <div className={styles.emptyState}>
        <div className={styles.emptyCard}>
            <p>No active workflows. Start a new one!</p>
        </div>
      </div>
    </div>
  );
}
