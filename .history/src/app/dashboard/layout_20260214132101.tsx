import Sidebar from "@/components/Sidebar";
import styles from "./layout.module.css";

import { createClient } from "@/utils/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isPro = user ? await checkSubscription(user.id) : false;

  return (
    <div className={styles.container}>
      <Sidebar isPro={isPro} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
