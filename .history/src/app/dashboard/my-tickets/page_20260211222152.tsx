import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Folder, Plus, FolderPlus, ChevronLeft } from 'lucide-react';
import NewProjectCard from '@/components/projects/NewProjectCard';
import TicketContextMenu from '@/components/tickets/TicketContextMenu';
import styles from './page.module.css';

export default async function MyTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { project: projectId } = await searchParams;

  if (!user) {
    return <div>Please log in to view tickets.</div>;
  }

  const [tickets, projects] = await Promise.all([
    prisma.ticket.findMany({
      where: { 
        userId: user.id,
        ...(projectId ? { projectId } : {}) 
      },
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
            {projectId ? (
                <>
                    <Link href="/dashboard/my-tickets" className={styles.backLink} style={{ marginBottom: '0.5rem', paddingLeft: 0 }}>
                        <ChevronLeft size={16} />
                        Back to All Tickets
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 className={styles.title}>
                            {projects.find(p => p.id === projectId)?.name}
                        </h1>
                        <span className={styles.projectCountBadge} style={{ fontSize: '1rem', padding: '0.2rem 0.8rem' }}>
                            {tickets.length} tickets
                        </span>
                    </div>
                </>
            ) : (
                <>
                    <h1 className={styles.title}>My Tickets</h1>
                    <p className={styles.subtitle}>Manage and organize your project tickets</p>
                </>
            )}
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
            {projects.map(project => {
                const isSelected = project.id === projectId;
                return (
                    <Link 
                        key={project.id} 
                        href={isSelected ? '/dashboard/my-tickets' : `/dashboard/my-tickets?project=${project.id}`} 
                        className={`${styles.projectCard} ${isSelected ? styles.selectedProject : ''}`} 
                        style={{ '--project-color': project.color || 'var(--primary)' } as any}
                    >
                        <div className={styles.folderIconArea}>
                            {isSelected ? <FolderPlus size={24} /> : <Folder size={24} fill="currentColor" fillOpacity={0.2} />}
                        </div>
                        <div className={styles.projectInfo}>
                            <h3 className={styles.projectName}>{project.name}</h3>
                            <span className={styles.projectCount}>
                                {ticketsByProject[project.id] || 0} tickets
                            </span>
                        </div>
                        {isSelected && (
                            <div className={styles.clearFilterBadge}>
                                <small>Selected</small>
                            </div>
                        )}
                    </Link>
                )
            })}

            {/* "New Project" Card - Always visible as the last item or first if empty */}
            <NewProjectCard />
        </div>
      </section>

      <div className={styles.divider} />

      <div className={styles.divider} />

      <section className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>
            {projectId ? 'Tickets in this Project' : 'Recent Tickets'}
        </h2>
        
        {tickets.length === 0 ? (
            <div className={styles.emptyState}>
            <p>No tickets saved yet.</p>
            </div>
        ) : (
            <div className={styles.grid}>
            {tickets.map((ticket) => (
                <Link key={ticket.id} href={`/dashboard/my-tickets/${ticket.id}`} className={styles.card}>
                <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={styles.typeBadge}>{ticket.type}</span>
                        <span className={`${styles.statusBadge} ${ticket.projectId ? styles.hasProject : ''}`}>
                            {ticket.projectId ? 'Linked' : ticket.status}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {ticket.projectId && projects.find(p => p.id === ticket.projectId) && (
                            <div 
                                className={styles.projectDot} 
                                title={projects.find(p => p.id === ticket.projectId)?.name}
                                style={{ backgroundColor: projects.find(p => p.id === ticket.projectId)?.color || '#ccc' }}
                            />
                        )}
                        <TicketContextMenu 
                            ticketId={ticket.id} 
                            currentProjectId={ticket.projectId} 
                            projects={projects}
                        />
                    </div>
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
