import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import styles from './page.module.css';

export default async function MyTicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to view tickets.</div>;
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Tickets</h1>
        <Link href="/dashboard/tickets" className={styles.createBtn}>
          + New Ticket
        </Link>
      </header>

      {tickets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No tickets saved yet.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/dashboard/my-tickets/${ticket.id}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.typeBadge}>{ticket.type}</span>
                <span className={styles.statusBadge}>{ticket.status}</span>
              </div>
              <h3 className={styles.ticketTitle}>{ticket.title}</h3>
              <p className={styles.ticketSnippet}>
                {ticket.content.slice(0, 150)}...
              </p>
              <div className={styles.cardFooter}>
                <span>{formatDistanceToNow(new Date(ticket.createdAt))} ago</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
