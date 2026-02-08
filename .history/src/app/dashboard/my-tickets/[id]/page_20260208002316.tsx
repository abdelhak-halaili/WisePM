import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './page.module.css';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>
}

export default async function TicketDetailsPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in.</div>;
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { 
      id,
      userId: user.id 
    }
  });

  if (!ticket) {
    notFound();
  }

  // Parse Metadata if needed, but we mainly need content
  // We need to render content and missingElements separate if we stored them that way.
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/dashboard/my-tickets" className={styles.backBtn}>
          <ArrowLeft size={20} /> Back to List
        </Link>
        <div className={styles.meta}>
            <span className={styles.typeBadge}>{ticket.type}</span>
            <h1 className={styles.title}>{ticket.title}</h1>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Main Content */}
        <div className={styles.mainPanel}>
            <div className={`${styles.document} ${styles.markdownBody}`}>
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    urlTransform={(url) => url}
                    components={{
                        // Reuse the image transform logic if images are stored?
                        img: ({node, ...props}) => {
                             if (!props.src) return null;
                             return <img {...props} className={styles.embeddedImage} alt={props.alt || ''} />;
                        }
                    }}
                >
                    {ticket.content}
                </ReactMarkdown>
            </div>
        </div>

        {/* AI Side Panel */}
        <div className={styles.sidePanel}>
            <div className={styles.advisorBox}>
                <h3 className={styles.advisorTitle}>Engineering Considerations</h3>
                <div className={styles.missingContent}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {(ticket.missingElements || '')
                            .replace(/^#*\s*Engineering Considerations[:\s]*/i, '') // Remove redundant title
                            || 'No additional considerations.'}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
