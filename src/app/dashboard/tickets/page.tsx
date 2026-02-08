import { createClient } from "@/utils/supabase/server";
import styles from "../page.module.css";
import TicketWizard from "@/components/tickets/TicketWizard";

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const emailName = user?.email?.split('@')[0] || 'User';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ticket Generator</h1>
        <p className={styles.subtitle}>Welcome back, {emailName}. Ready to ship?</p>
      </header>
      
      <TicketWizard />
    </div>
  );
}
