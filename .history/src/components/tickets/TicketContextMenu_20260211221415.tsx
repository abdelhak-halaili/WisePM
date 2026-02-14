'use client'

import { useState } from 'react'
import { MoreHorizontal, FolderInput, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { moveTicketToProjectAction } from '@/app/dashboard/tickets/actions'
import styles from './TicketContextMenu.module.css'

interface Project {
    id: string
    name: string
    color?: string
}

interface TicketContextMenuProps {
    ticketId: string
    currentProjectId: string | null
    projects: Project[]
}

export default function TicketContextMenu({ ticketId, currentProjectId, projects }: TicketContextMenuProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [showProjects, setShowProjects] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleMove = async (projectId: string | null) => {
        setIsLoading(true)
        try {
            const result = await moveTicketToProjectAction(ticketId, projectId)
            if (result.success) {
                setIsOpen(false)
                setShowProjects(false)
                router.refresh()
            }
        } catch (error) {
            console.error('Failed to move ticket', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.menuContainer} onClick={e => e.stopPropagation()}>
            <button 
                className={styles.menuTrigger} 
                onClick={(e) => {
                    e.preventDefault()
                    setIsOpen(!isOpen)
                }}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <>
                    <div className={styles.overlay} onClick={() => setIsOpen(false)} />
                    <div className={styles.dropdown}>
                        <button 
                            className={styles.menuItem}
                            onClick={(e) => {
                                e.preventDefault()
                                setShowProjects(!showProjects)
                            }}
                        >
                            <FolderInput size={16} />
                            Move to Project
                        </button>

                        {showProjects && (
                            <div className={styles.projectList}>
                                {currentProjectId && (
                                    <button 
                                        className={styles.projectItem}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleMove(null)
                                        }}
                                        disabled={isLoading}
                                    >
                                        Remove from Project
                                    </button>
                                )}
                                {projects.map(project => (
                                    <button
                                        key={project.id}
                                        className={styles.projectItem}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleMove(project.id)
                                        }}
                                        disabled={isLoading || project.id === currentProjectId}
                                        style={project.id === currentProjectId ? { opacity: 0.5, cursor: 'default' } : {}}
                                    >
                                        <span 
                                            style={{ 
                                                width: 8, 
                                                height: 8, 
                                                borderRadius: '50%', 
                                                background: project.color || '#ccc',
                                                display: 'inline-block'
                                            }} 
                                        />
                                        {project.name}
                                        {project.id === currentProjectId && <Check size={12} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
