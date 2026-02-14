import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Folder, Plus, FolderPlus } from 'lucide-react';
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
        <div>
            <h1 className={styles.title}>My Tickets</h1>
            <p className={styles.subtitle}>Manage and organize your project tickets</p>
        </div>
        <Link href="/dashboard/tickets" className={styles.createBtn}>
          <Plus size={20} />
          New Ticket
        </Link>
      </header>

      <section className={styles.projectSection}>
        <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
                <Folder size={20} />
                Projects
            </h2>
        </div>
        
        <div className={styles.projectGrid}>
            {/* Project Cards */}
            {projects.map(project => (
                <Link key={project.id} href={`/dashboard/my-tickets?project=${project.id}`} className={styles.projectCard} style={{ '--project-color': project.color || 'var(--primary)' } as any}>
                    <div className={styles.folderIconArea}>
                        <Folder size={24} fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <div className={styles.projectInfo}>
                        <h3 className={styles.projectName}>{project.name}</h3>
                        <span className={styles.projectCount}>
                            {ticketsByProject[project.id] || 0} tickets
                        </span>
                    </div>
                </Link>
            ))}

            {/* "New Project" Card - Always visible as the last item or first if empty */}
            <Link href="/dashboard/tickets?step=3" className={styles.newProjectCard}>
                <div className={styles.newProjectIcon}>
                    <Plus size={24} />
                </div>
                <span className={styles.newProjectText}>Create Project</span>
            </Link>
        </div>
      </section>

      <div className={styles.divider} />

      <section className={styles.recentSection}>
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
                    {ticket.projectId && projects.find(p => p.id === ticket.projectId) && (
                        <div 
                            className={styles.projectDot} 
                            title={projects.find(p => p.id === ticket.projectId)?.name}
                            style={{ backgroundColor: projects.find(p => p.id === ticket.projectId)?.color || '#ccc' }}
                        />
                    )}
                </div>
                <h3 className={styles.ticketTitle}>{ticket.title}</h3>
                <div className={styles.cardFooter}>
                    <span>{formatDistanceToNow(new Date(ticket.createdAt))} ago</span>
                </div>
                </Link>
            ))}
            </div>
        )}
      </section>
    </div>
  );
}
