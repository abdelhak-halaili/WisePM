'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from '@/components/tickets/TicketWizard.module.css' // Reuse styles
import { refineTicketAction, updateTicketAction } from '@/app/dashboard/tickets/actions'
import { 
  Check, 
  Copy,
  Sparkles,
  FileText,
  Send,
  MessageSquare,
  Maximize2,
  Minimize2,
  Loader2,
  Calendar,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import TicketMainPanel from './TicketMainPanel'

interface TicketEditorProps {
    ticket: {
        id: string;
        title: string;
        type: string;
        content: string;
        missingElements: string | null;
        createdAt: Date;
    }
}

export default function TicketEditor({ ticket }: TicketEditorProps) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis')
    const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([])
    const [chatInput, setChatInput] = useState('')
    const [isRefining, setIsRefining] = useState(false)
    const [isChatExpanded, setIsChatExpanded] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Local state for the ticket content being edited/refined
    const [currentTicket, setCurrentTicket] = useState({
        title: ticket.title,
        type: ticket.type,
        coreContent: ticket.content,
        missingElements: ticket.missingElements || ''
    })

    useEffect(() => {
        if (activeTab === 'chat' && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [chatHistory, activeTab])

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return
        
        const userMsg = chatInput.trim()
        setChatInput('')
        setIsRefining(true)
        
        // Optimistic update
        const newHistory = [...chatHistory, { role: 'user', content: userMsg }]
        setChatHistory(newHistory)
        
        const result = await refineTicketAction(
            currentTicket,
            newHistory,
            userMsg
        )
        
        setIsRefining(false)
        
        if (result.success && result.data) {
            // Update the ticket content locally
            setCurrentTicket(prev => ({
                ...prev,
                ...result.data.updatedTicket
            }))
            
            // Add AI response
            setChatHistory([...newHistory, { role: 'model', content: result.data.message }])
        } else {
            alert('Failed to refine ticket: ' + (result.error || 'Unknown error'))
        }
    }

    const handleSaveChanges = async () => {
        setIsSaving(true)
        const result = await updateTicketAction(ticket.id, {
            title: currentTicket.title,
            content: currentTicket.coreContent,
            missingElements: currentTicket.missingElements
        })
        setIsSaving(false)

        if (result.success) {
            setIsEditing(false)
            router.refresh() // Refresh server data
        } else {
            alert('Failed to save changes: ' + result.error)
        }
    }

    const handleContentChange = useCallback((newContent: string) => {
        setCurrentTicket(prev => ({ ...prev, coreContent: newContent }))
    }, [])

    return (
        <div className={styles.wizardContainerFull} style={{ height: 'calc(100vh - 64px)', padding: '1rem', maxWidth: 'none' }}>
            {/* Header Override for Details View */}
            <header className={styles.resultHeader} style={{ marginBottom: '1rem' }}>
                 <div>
                    <Link href="/dashboard/my-tickets" className={styles.buttonGhost} style={{ paddingLeft: 0, marginBottom: '0.5rem' }}>
                        <ArrowLeft size={16} /> Back to List
                    </Link>
                    <div className={styles.headerMeta}>
                       <span className={styles.ticketTypeBadge}>{currentTicket.type}</span>
                       <span className={styles.dateBadge} suppressHydrationWarning><Calendar size={12} style={{ marginRight: 4 }}/> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h2 className={styles.documentTitle}>{currentTicket.title}</h2>
                 </div>
                 <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                     <button 
                         className={styles.buttonGhost}
                         onClick={() => setIsEditing(!isEditing)}
                     >
                         {isEditing ? <Check size={16} /> : <FileText size={16} />}
                         {isEditing ? 'Done Editing' : 'Edit Manually'}
                     </button>
                     <button 
                         className={styles.buttonGhost}
                         onClick={() => navigator.clipboard.writeText(currentTicket.coreContent)}
                     >
                         <Copy size={16} /> Copy
                     </button>
                     <button 
                         className={styles.buttonPrimary} 
                         onClick={handleSaveChanges}
                         disabled={isSaving}
                         style={{ height: '36px' }}
                     >
                         {isSaving ? <Loader2 size={16} className={styles.spin} /> : <Check size={16} />}
                         Save Changes
                     </button>
                 </div>
            </header>

            <div className={styles.resultLayout} style={{ marginTop: 0 }}>
                {/* Main Content (Ticket) */}
                {/* Main Content (Ticket) */}
                <TicketMainPanel 
                    isEditing={isEditing}
                    content={currentTicket.coreContent}
                    isChatExpanded={isChatExpanded}
                    onContentChange={handleContentChange}
                />

                {/* Side Panel (Chat/Analysis) */}
                <div className={styles.sidePanel} style={{ flex: isChatExpanded ? 1 : undefined, minWidth: isChatExpanded ? '50%' : '320px', transition: 'all 0.3s ease' }}>
                    <div className={styles.tabContainer}>
                       <button 
                         className={`${styles.tabButton} ${activeTab === 'analysis' ? styles.tabActive : ''}`}
                         onClick={() => setActiveTab('analysis')}
                       >
                         <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
                         Analysis
                       </button>
                       <button 
                         className={`${styles.tabButton} ${activeTab === 'chat' ? styles.tabActive : ''}`}
                         onClick={() => setActiveTab('chat')}
                       >
                         <MessageSquare size={14} style={{ display: 'inline', marginRight: 4 }} />
                         Chat
                       </button>
                       <button
                         className={styles.tabButton}
                         style={{ flex: 0, padding: '0.5rem', marginLeft: '0.25rem' }}
                         onClick={() => setIsChatExpanded(!isChatExpanded)}
                         title={isChatExpanded ? "Collapse" : "Expand"}
                       >
                         {isChatExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                       </button>
                    </div>
                    
                    <div className={styles.advisorBox} style={{ display: activeTab === 'analysis' ? 'flex' : 'none' }}>
                        <div className={styles.advisorHeader}>
                            <Sparkles size={16} className={styles.iconGold} />
                            <span>AI Analysis</span>
                        </div>
                        <div className={styles.missingContent}>
                             <div className={styles.markdownContent}>
                                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                     {(currentTicket.missingElements || '')
                                        .replace(/^#*\s*(Engineering Considerations|AI Analysis)[:\s]*/i, '')}
                                 </ReactMarkdown>
                             </div>
                        </div>
                    </div>

                    <div className={styles.chatContainer} style={{ display: activeTab === 'chat' ? 'flex' : 'none' }}>
                        <div className={styles.chatMessages}>
                            {chatHistory.length === 0 && (
                                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
                                    <p>👋 I'm here to help.</p>
                                    <p style={{ marginTop: '0.5rem' }}>Ask me to split stories, add edge cases, or refine the acceptance criteria.</p>
                                </div>
                            )}
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`${styles.chatMessage} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            ))}
                            {isRefining && (
                                <div className={styles.typingIndicator}>
                                    <span>Thinking</span>
                                    <div className={styles.dot}></div>
                                    <div className={styles.dot}></div>
                                    <div className={styles.dot}></div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className={styles.chatInputArea}>
                            <textarea
                                className={styles.chatInput}
                                placeholder="Type..."
                                rows={1}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <button 
                                className={styles.sendButton}
                                onClick={handleSendMessage}
                                disabled={!chatInput.trim() || isRefining}
                            >
                                {isRefining ? <Loader2 size={18} className={styles.spin} /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
