'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { createProjectAction } from '@/app/dashboard/tickets/actions'
import styles from './NewProjectCard.module.css'

const COLORS = [
    '#0052CC', // Blue
    '#00875A', // Green
    '#FF991F', // Orange
    '#DE350B', // Red
    '#5243AA', // Purple
    '#FF5630', // Red-Orange
    '#00B8D9', // Teal
    '#6554C0', // Violet
]

export default function NewProjectCard() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState('')
    const [color, setColor] = useState(COLORS[0])
    const [isLoading, setIsLoading] = useState(false)

    const handleCreate = async () => {
        if (!name.trim()) return

        setIsLoading(true)
        try {
            const result = await createProjectAction(name, color)
            if (result.success) {
                setIsOpen(false)
                setName('')
                router.refresh()
            }
        } catch (error) {
            console.error('Failed to create project', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className={styles.card} onClick={() => setIsOpen(true)}>
                <div className={styles.icon}>
                    <Plus size={24} />
                </div>
                <span className={styles.text}>Create Project</span>
            </div>

            {isOpen && createPortal(
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.header}>
                            <h3 className={styles.title}>Create New Project</h3>
                            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Project Name</label>
                                <input 
                                    type="text" 
                                    className={styles.input}
                                    placeholder="e.g. Website Redesign"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleCreate()
                                    }}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Color</label>
                                <div className={styles.colors}>
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            className={`${styles.colorBtn} ${color === c ? styles.selected : ''}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.footer}>
                            <button 
                                className={styles.cancelBtn} 
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.submitBtn} 
                                onClick={handleCreate}
                                disabled={!name.trim() || isLoading}
                            >
                                {isLoading ? <Loader2 size={16} className={styles.spin} /> : 'Create Project'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
