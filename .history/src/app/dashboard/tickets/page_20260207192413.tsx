import { createClient } from "@/utils/supabase/server";
import styles from "../page.module.css"; // Reuse dashboard styles for now

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const emailName = user?.email?.split('@')[0] || 'User';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ticket Generator</h1>
        <p className={styles.subtitle}>Welcome back, {emailName}. Ready to write some tickets?</p>
      </header>
      
      <div className={styles.emptyState}>
        <div className={styles.emptyCard}>
            <p>Select a template to start generating tickets.</p>
            {/* We will build the generator UI here */}
        </div>
      </div>
    </div>
  );
}
