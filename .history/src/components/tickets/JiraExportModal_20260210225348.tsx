'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  Settings, 
  Check, 
  Loader2,
  ExternalLink
} from 'lucide-react'
import { listJiraProjects, listJiraIssueTypes, createIssueInJira } from '@/app/actions/jira'
import styles from './TicketWizard.module.css' // Reusing styles for consistency

interface JiraExportModalProps {
  isOpen: boolean
  onClose: () => void
  ticketData: {
    title: string
    type: string
    coreContent: string // The description/content
  }
}

export default function JiraExportModal({ isOpen, onClose, ticketData }: JiraExportModalProps) {
    const [projects, setProjects] = useState<any[]>([])
    const [issueTypes, setIssueTypes] = useState<any[]>([])
    const [selectedProject, setSelectedProject] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [createdKey, setCreatedKey] = useState<string | null>(null)
    const [createdLink, setCreatedLink] = useState<string | null>(null)
    
    // Dynamic Fields State
    const [requiredFields, setRequiredFields] = useState<any[]>([])
    const [fieldValues, setFieldValues] = useState<Record<string, any>>({})

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!isOpen) return
        
        async function load() {
            setIsLoading(true)
            setError(null)
            try {
                const projs = await listJiraProjects()
                setProjects(projs)
                if (projs.length > 0) {
                    setSelectedProject(projs[0].id)
                } else {
                    setError('No Jira projects found. Please check your Jira permissions.')
                }
            } catch (pluginError) {
                console.error(pluginError)
                setError('Could not fetch Jira projects. Please ensure you are connected in Settings.')
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [isOpen])

    useEffect(() => {
        if (!selectedProject) return
        async function loadTypes() {
            try {
                const types = await listJiraIssueTypes(selectedProject)
                setIssueTypes(types)
                if (types.length > 0) {
                    const story = types.find((t: any) => t.name === 'Story')
                    const task = types.find((t: any) => t.name === 'Task')
                    const defaultType = story ? story.id : (task ? task.id : types[0].id)
                    setSelectedType(defaultType)
                }
            } catch (e) {
                console.error(e)
            }
        }
        loadTypes()
    }, [selectedProject])

    // Effect to identify required fields for selected type
    useEffect(() => {
        if (!selectedType || issueTypes.length === 0) return
        
        const type = issueTypes.find(t => t.id === selectedType)
        if (!type || !type.fields) {
            setRequiredFields([])
            return
        }

        const ignoredFields = ['summary', 'description', 'project', 'issuetype', 'attachment', 'issuelinks', 'reporter']
        const required = Object.values(type.fields).filter((f: any) => 
            f.required && !ignoredFields.includes(f.key) && !ignoredFields.includes(f.name.toLowerCase())
        )
        
        setRequiredFields(required as any[])
        
        // Initialize values
        const initialValues: any = {}
        required.forEach((f: any) => {
            if (f.allowedValues && f.allowedValues.length > 0) {
                initialValues[f.key] = { id: f.allowedValues[0].id }
            } else {
                initialValues[f.key] = ''
            }
        })
        setFieldValues(initialValues)
        
    }, [selectedType, issueTypes])

    const handleCreate = async () => {
        setIsCreating(true)
        setError(null)
        try {
            // Prepare additional fields
            const additionalFields: any = {}
            requiredFields.forEach(f => {
                const val = fieldValues[f.key]
                if (f.schema?.type === 'array' || f.schema?.items) {
                    if (val && val.id) {
                         additionalFields[f.key] = [val]
                    } else if (val) {
                         additionalFields[f.key] = [val]
                    }
                } else {
                    additionalFields[f.key] = val
                }
            })

            const result = await createIssueInJira(ticketData, selectedProject, selectedType, additionalFields)
            
            if (result.success && result.data) {
                setCreatedKey(result.data.key)
                setCreatedLink(result.data.self) // Note: self is API link, not browser link
            } else {
                throw new Error(result.error || 'Failed to create ticket')
            }
        } catch (e: any) {
            setError(e.message)
        } finally {
            setIsCreating(false)
        }
    }

    if (!isOpen || !mounted) return null

    return createPortal(
      <div className={styles.lightboxOverlay} onClick={onClose}>
        <div className={styles.jiraModal} onClick={e => e.stopPropagation()}>
           <div className={styles.jiraHeader}>
             <span className={styles.jiraTitle}>
                <Settings size={20} color="#0052CC" />
                Export to Jira
             </span>
             <button className={styles.buttonGhost} onClick={onClose}>
               <X size={20} />
             </button>
           </div>
           
           {createdKey ? (
               <div className={styles.jiraForm} style={{ textAlign: 'center', padding: '2rem' }}>
                   <div style={{ color: 'green', marginBottom: '1rem' }}><Check size={48} /></div>
                   <h3>Ticket Created!</h3>
                   <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '1rem 0' }}>{createdKey}</p>
                   {createdLink && (
                       <p style={{ fontSize: '0.9rem', color: '#666' }}>
                           (Note: Check your Jira board to view the ticket)
                       </p>
                   )}
                   <button className={styles.buttonPrimary} onClick={onClose} style={{ marginTop: '1rem' }}>
                       Done
                   </button>
               </div>
           ) : (
               <>
               <div className={styles.jiraForm} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                 {isLoading ? (
                     <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className={styles.spin} /> Loading Jira info...</div>
                 ) : error ? (
                     <div style={{ padding: '1rem', color: 'red' }}>
                         {error}
                         <br /><br />
                         <a href="/dashboard/settings" style={{ textDecoration: 'underline', color: '#0052CC' }}>Go to Settings to Connect</a>
                     </div>
                 ) : (
                     <>
                        <div>
                            <label className={styles.jiraLabel}>Project</label>
                            <select 
                                className={styles.jiraInput} 
                                value={selectedProject}
                                onChange={e => setSelectedProject(e.target.value)}
                            >
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.key} - {p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={styles.jiraLabel}>Issue Type</label>
                            <select 
                                className={styles.jiraInput} 
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                            >
                                {issueTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {requiredFields.length > 0 && (
                            <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#DE350B' }}>
                                    Required Fields
                                </div>
                                {requiredFields.map(f => (
                                    <div key={f.key} style={{ marginBottom: '0.75rem' }}>
                                        <label className={styles.jiraLabel}>{f.name} <span style={{color:'red'}}>*</span></label>
                                        {f.allowedValues && f.allowedValues.length > 0 ? (
                                            <select 
                                                className={styles.jiraInput}
                                                value={fieldValues[f.key]?.id || ''}
                                                onChange={e => setFieldValues({...fieldValues, [f.key]: { id: e.target.value }})}
                                            >
                                                {f.allowedValues.map((v: any) => (
                                                    <option key={v.id} value={v.id}>{v.value || v.name || v.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input 
                                                type="text" 
                                                className={styles.jiraInput}
                                                value={fieldValues[f.key] || ''}
                                                onChange={e => setFieldValues({...fieldValues, [f.key]: e.target.value})}
                                                placeholder={`Enter ${f.name}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                     </>
                 )}
               </div>

               <div className={styles.jiraActions}>
                 <button className={styles.jiraCancelBtn} onClick={onClose}>Cancel</button>
                 <button 
                    className={styles.jiraSaveBtn} 
                    onClick={handleCreate}
                    disabled={isCreating || !selectedProject || !selectedType}
                 >
                   {isCreating ? <Loader2 className={styles.spin} size={16} /> : 'Create Ticket'}
                 </button>
               </div>
               </>
           )}
        </div>
      </div>,
      document.body
    )
}
