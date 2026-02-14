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

  const [tickets, projects] = await Promise.all([
    prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
        projectId: true,
      }
    }),
    prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    })
  ]);

  // Group tickets by project
  const ticketsByProject: Record<string, number> = {};
  tickets.forEach(t => {
    if (t.projectId) {
      ticketsByProject[t.projectId] = (ticketsByProject[t.projectId] || 0) + 1;
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Tickets</h1>
        <div className={styles.actions}>
            {/* Link to create project could go here */}
            <Link href="/dashboard/tickets" className={styles.createBtn}>
            + New Ticket
            </Link>
        </div>
      </header>

      {/* Projects Grid */}
      {projects.length > 0 && (
        <section className={styles.projectSection}>
            <h2 className={styles.sectionTitle}>Projects</h2>
            <div className={styles.projectGrid}>
                {projects.map(project => (
                    <Link key={project.id} href={`/dashboard/my-tickets?project=${project.id}`} className={styles.projectCard}>
                        <div className={styles.folderIcon}>📁</div>
                        <div className={styles.projectInfo}>
                            <h3 className={styles.projectName}>{project.name}</h3>
                            <span className={styles.projectCount}>
                                {ticketsByProject[project.id] || 0} tickets
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
      )}

      <h2 className={styles.sectionTitle}>Recent Tickets</h2>
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
                <span className={`${styles.statusBadge} ${ticket.projectId ? styles.hasProject : ''}`}>
                    {ticket.projectId ? 'Linked' : ticket.status}
                </span>
                {/* Project Indicator */}
                {ticket.projectId && projects.find(p => p.id === ticket.projectId) && (
                    <div 
                        className={styles.projectDot} 
                        title={projects.find(p => p.id === ticket.projectId)?.name}
                        style={{ backgroundColor: projects.find(p => p.id === ticket.projectId)?.color || '#ccc' }}
                    />
                )}
              </div>
              <h3 className={styles.ticketTitle}>{ticket.title}</h3>
              {/* Content snippet removed for performance */}
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
