'use client'

import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import styles from '@/components/tickets/TicketWizard.module.css'

import RichTextEditor from '@/components/ui/RichTextEditor'

interface TicketMainPanelProps {
    isEditing: boolean;
    content: string;
    displayContent?: string;
    onContentChange: (newContent: string) => void;
    onImageClick?: (src: string) => void;
}

const TicketMainPanel = memo(function TicketMainPanel({ 
    isEditing, 
    content, 
    displayContent,
    onContentChange,
    onImageClick
}: TicketMainPanelProps) {
    return (
        <div className={styles.documentContainer}>
            {isEditing ? (
                <div style={{ minHeight: '500px' }}>
                    <RichTextEditor 
                        content={content}
                        onChange={onContentChange}
                        placeholder="Ticket content..."
                    />
                </div>
            ) : (
                <div className={styles.markdownBody}>
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        urlTransform={(url) => url}
                        components={{
                            img: ({node, ...props}) => {
                                if (!props.src) return null;
                                return (
                                    <img 
                                        {...props} 
                                        className={styles.thumbnail} 
                                        alt={props.alt || ''} 
                                        onClick={() => {
                                            if (onImageClick && typeof props.src === 'string') {
                                                onImageClick(props.src);
                                            }
                                        }}
                                        style={onImageClick ? { cursor: 'zoom-in' } : undefined}
                                    />
                                );
                            }
                        }}
                    >
                        {displayContent || content}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    )
})

export default TicketMainPanel
