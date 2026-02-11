'use client'

import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from '@/components/tickets/TicketWizard.module.css'

interface TicketMainPanelProps {
    isEditing: boolean;
    content: string;
    displayContent?: string; // Optional: for when display differs from edit (e.g. placeholders vs blobs)
    isChatExpanded: boolean;
    onContentChange: (newContent: string) => void;
}

const TicketMainPanel = memo(function TicketMainPanel({ 
    isEditing, 
    content, 
    displayContent,
    isChatExpanded, 
    onContentChange 
}: TicketMainPanelProps) {
    return (
        <div className={styles.mainContent} style={{ flex: isChatExpanded ? 1 : 3, transition: 'all 0.3s ease' }}>
            <div className={styles.documentContainer}>
                {isEditing ? (
                    <textarea 
                        className={styles.documentEditor}
                        value={content}
                        onChange={(e) => onContentChange(e.target.value)}
                        placeholder="Ticket content..."
                    />
                ) : (
                    <div className={styles.markdownBody}>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            urlTransform={(url) => url}
                            components={{
                                img: ({node, ...props}) => {
                                    if (!props.src) return null;
                                    return <img {...props} className={styles.thumbnail} alt={props.alt || ''} />;
                                }
                            }}
                        >
                            {displayContent || content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    )
})

export default TicketMainPanel
