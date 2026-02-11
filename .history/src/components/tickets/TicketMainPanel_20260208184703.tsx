'use client'

import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import styles from '@/components/tickets/TicketWizard.module.css'

interface TicketMainPanelProps {
    isEditing: boolean;
    content: string;
    displayContent?: string; // Optional: for when display differs from edit (e.g. placeholders vs blobs)
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
                <textarea 
                    className={styles.documentEditor}
                    value={content}
                    onChange={(e) => onContentChange(e.target.value)}
                    placeholder="Ticket content..."
                />
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
                                            console.log('Image clicked:', props.src); // DEBUG
                                            if (onImageClick && typeof props.src === 'string') {
                                                console.log('Calling onImageClick with:', props.src); // DEBUG
                                                onImageClick(props.src);
                                            } else {
                                                console.log('onImageClick missing or src not string', { onImageClick: !!onImageClick, srcType: typeof props.src }); // DEBUG
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
