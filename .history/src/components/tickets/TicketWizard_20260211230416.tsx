'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './TicketWizard.module.css'
import { generateTicketAction, reformTextAction, saveTicketAction, refineTicketAction, listProjectsAction, createProjectAction } from '@/app/dashboard/tickets/actions'
import { listJiraProjects, listJiraIssueTypes, createIssueInJira } from '@/app/actions/jira'
import JiraExportModal from './JiraExportModal'
import TicketMainPanel from './TicketMainPanel'
import { 
  ArrowRight, 
  Check, 
  Upload, 
  X, 
  Trash2, 
  Grid, 
  List, 
  GripVertical,
  Loader2,
  Copy,
  Sparkles,
  AlertTriangle,
  FileText,
  Send,
  MessageSquare,
  Maximize2,
  Minimize2,
  ExternalLink,
  Settings,
  Cpu,
  Pencil
} from 'lucide-react'

const PLATFORMS = [
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
  { id: 'web', label: 'Web' },
  { id: 'backend', label: 'Backend' },
  { id: 'dashboard', label: 'Dashboard' },
]

const OUTPUT_FORMATS = [
  { id: 'gherkin', label: 'Gherkin Scenarios', description: 'Given / When / Then format for BDD' },
  { id: 'user_stories', label: 'User Stories', description: 'As a [user], I want [feature] so that [benefit]' },
  { id: 'acceptance', label: 'Acceptance Criteria', description: 'Checklist of requirements for QA' },
  { id: 'tracking', label: 'Event Tracking', description: 'Analytics events to track (Mixpanel/Amplitude)' },
]

interface Screenshot {
  id: string
  file: File
  preview: string
  description: string
}

export default function TicketWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [errors, setErrors] = useState<{
    featureName?: string;
    platforms?: string;
    problem?: string;
    behavior?: string;
  }>({})

  // Clear error on change
  const handleChange = (field: keyof typeof errors, value: any) => {
    if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handlePlatformToggle = (id: string) => {
      if (errors.platforms) {
          setErrors(prev => ({ ...prev, platforms: undefined }))
      }
      togglePlatform(id)
  }

  const handleNext = () => {
    const newErrors: typeof errors = {}
    let isValid = true

    // Step 1 Validation
    if (step === 1) {
      if (!formData.featureName.trim()) {
        newErrors.featureName = 'Feature name is required'
        isValid = false
      }
      if (formData.platforms.length === 0) {
        newErrors.platforms = 'Select at least one platform'
        isValid = false
      }
    }

    // Step 2 Validation
    if (step === 2) {
      if (!formData.problem.trim()) {
        newErrors.problem = 'Problem description is required'
        isValid = false
      }
      if (!formData.behavior.trim()) {
        newErrors.behavior = 'Expected behavior is required'
        isValid = false
      }
    }

    setErrors(newErrors)

    if (isValid) {
      setStep(step + 1)
    }
  }

  const [reformingField, setReformingField] = useState<string | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    type: string;
    coreContent: string;
    missingElements: string;
  } | null>(null)

  // Jira State
  const [showJiraModal, setShowJiraModal] = useState(false)

  const handleJiraExport = () => {
    setShowJiraModal(true)
  }
  
  const [formData, setFormData] = useState({
    featureName: '',
    platforms: [] as string[],
    ticketType: 'functional' as 'functional' | 'technical',
    problem: '',
    behavior: '',
    screenshots: [] as Screenshot[],
    formats: [] as string[]
  })

  // Chat State
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis')
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([])
  const [chatInput, setChatInput] = useState('')
  
  // Project State
  const [projects, setProjects] = useState<{id: string, name: string}[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  useEffect(() => {
    if (step === 3 || step === 4) { // Load projects when reaching review/save step
        listProjectsAction().then(setProjects)
    }
  }, [step])

  const handleCreateProject = async () => {
      if (!newProjectName.trim()) return;
      const result = await createProjectAction(newProjectName);
      if (result.success && result.data) {
          setProjects(prev => [result.data!, ...prev]);
          setSelectedProjectId(result.data!.id);
          setIsCreatingProject(false);
          setNewProjectName('');
      }
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [chatInput])
  const [isRefining, setIsRefining] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, activeTab])

  // Lightbox Component
  const Lightbox = () => {
    if (!lightboxSrc || !mounted) return null
    
    return createPortal(
      <div className={styles.lightboxOverlay} onClick={() => setLightboxSrc(null)}>
        <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
           <img src={lightboxSrc} className={styles.lightboxImage} alt="Fullscreen preview" />
           <button className={styles.lightboxClose} onClick={() => setLightboxSrc(null)}>
             <X size={24} />
           </button>
        </div>
      </div>,
      document.body
    )
  }



  const handleSendMessage = async () => {
    if (!chatInput.trim() || !generatedResult) return
    
    const userMsg = chatInput.trim()
    setChatInput('')
    setIsRefining(true)
    
    // Optimistic update
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }]
    setChatHistory(newHistory)
    
    const result = await refineTicketAction(
        generatedResult,
        newHistory,
        userMsg
    )
    
    setIsRefining(false)
    
    if (result.success && result.data) {
        // Update the ticket content
        setGeneratedResult(prev => ({
            ...prev!,
            ...result.data.updatedTicket
        }))
        
        // Add AI response
        setChatHistory([...newHistory, { role: 'model', content: result.data.message }])
    } else {
        // Revert or show error
        alert('Failed to refine ticket: ' + (result.error || 'Unknown error'))
    }
  }

  // Drag & Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null)
  
  const handleContentChange = useCallback((newContent: string) => {
    setGeneratedResult(prev => prev ? ({ ...prev, coreContent: newContent }) : null)
  }, [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const togglePlatform = (id: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter(p => p !== id)
        : [...prev.platforms, id]
    }))
  }

  const toggleFormat = (id: string) => {
    setFormData(prev => ({
      ...prev,
      formats: prev.formats.includes(id) 
        ? prev.formats.filter(f => f !== id)
        : [...prev.formats, id]
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newScreenshots = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        description: ''
      }))
      
      setFormData(prev => ({
        ...prev,
        screenshots: [...prev.screenshots, ...newScreenshots]
      }))
    }
  }

  const removeScreenshot = (id: string) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter(s => s.id !== id)
    }))
  }

  const updateScreenshotDesc = (id: string, desc: string) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.map(s => s.id === id ? { ...s, description: desc } : s)
    }))
  }

  // Native Drag & Drop Logic
  const handleDragStart = (id: string) => setDraggedId(id)
  
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const sourceIndex = formData.screenshots.findIndex(s => s.id === draggedId)
    const targetIndex = formData.screenshots.findIndex(s => s.id === targetId)
    
    if (sourceIndex === -1 || targetIndex === -1) return

    const newScreenshots = [...formData.screenshots]
    const [reorderedItem] = newScreenshots.splice(sourceIndex, 1)
    newScreenshots.splice(targetIndex, 0, reorderedItem)

    setFormData(prev => ({ ...prev, screenshots: newScreenshots }))
  }

  const handleDragEnd = () => setDraggedId(null)

  const handleReform = async (field: 'problem' | 'behavior') => {
    if (!formData[field]) return
    setReformingField(field)
    
    const result = await reformTextAction(formData[field], field)
    if (result.success && result.data) {
        setFormData(prev => ({ ...prev, [field]: result.data }))
    }
    setReformingField(null)
  }

  const handleScreenshotReform = async (id: string, text: string) => {
    if (!text) return
    setReformingField(id)
    
    const result = await reformTextAction(text, 'Screenshot Description')
    if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          screenshots: prev.screenshots.map(s => s.id === id ? { ...s, description: result.data } : s)
        }))
    }
    setReformingField(null)
  }

  const handleGenerate = async (currentStep: number) => {
    // Validation
    if (formData.featureName.trim().length === 0) {
        setStep(1)
        alert('Please enter a feature name')
        return
    }
    if (formData.problem.trim().length === 0 || formData.behavior.trim().length === 0) {
        setStep(2)
        alert('Please describe the problem and expected behavior')
        return
    }
    
    // Only validate formats for functional tickets
    if (formData.ticketType !== 'technical' && formData.formats.length === 0) {
        setStep(4)
        alert('Please select at least one output format')
        return
    }

    setIsGenerating(true)
    
    try {
       const data = new FormData()
       data.append('featureName', formData.featureName)
       data.append('ticketType', formData.ticketType)
       data.append('problem', formData.problem)
       data.append('behavior', formData.behavior)
       data.append('platforms', formData.platforms.join(', '))
       data.append('formats', formData.formats.join(', '))
       
       // Append screenshot descriptions for AI Context
       const descriptions = formData.screenshots.map(s => s.description || `Screenshot ${s.id}`)
       data.append('screenshot_descriptions', JSON.stringify(descriptions))

       formData.screenshots.forEach((shot, index) => {
         if (shot.file) {
           data.append(`screenshot_${index}`, shot.file)
         }
       })

       const result = await generateTicketAction(data)
       setIsGenerating(false)
       
       if (result.success && result.data) {
          setGeneratedResult(result.data)
          setChatHistory([]) // Reset chat
          setActiveTab('analysis') // Reset tab
          setStep(5)
       } else {
          alert('Generation failed: ' + result.error)
       }
    } catch (e) {
       console.error(e)
       alert('An unexpected error occurred during generation')
    } finally {
       setIsGenerating(false)
    }
  }


  const handleSave = async () => {
    if (!generatedResult) return
    setIsSaving(true)
    
    // Embed images permanently into the content for saving
    let finalContent = generatedResult.coreContent;
    console.log('Original Content:', finalContent.substring(0, 100));
    console.log('Screenshots:', formData.screenshots);

    try {
        const base64Images = await Promise.all(formData.screenshots.map(async (shot) => {
            if (!shot.file) {
                console.warn('Screenshot missing file:', shot);
                return null;
            }
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(shot.file!);
            });
        }));
        
        console.log('Base64 Images generated:', base64Images.length);

        finalContent = finalContent.replace(
            /\[\[(?:\s*(?:SCREEN|Screen|Image|img)\s*[_-\s]?)?(\d+)\s*\]\]/gi, 
            (match, index) => {
                const i = parseInt(index);
                const imgData = base64Images[i] || base64Images[i - 1]; // Try exact match or 1-based fallback
                const shot = formData.screenshots[i] || formData.screenshots[i - 1]; // Same fallback
                
                console.log(`Replacing ${match} with image index ${i}`);
                if (imgData && shot) {
                   // Remove spaces to ensure valid Markdown link parsing
                   return `\n![${shot.description || `Screenshot ${i}`}](${imgData.trim()})\n`;
                }
                console.warn(`No image found for index ${i}`);
                return `\n> [Missing Image #${index}]\n`;
            }
        );
        console.log('Final Content Length:', finalContent.length);
    } catch (e) {
        console.error("Failed to embed images", e);
    }
    
    const result = await saveTicketAction({
        title: generatedResult.title,
        type: generatedResult.type,
        content: generatedResult.coreContent,
        missingElements: generatedResult.missingElements,
        status: "saved",
        metadata: formData,
        projectId: selectedProjectId || undefined
    })
    
    setIsSaving(false)
    
    if (result.success) {
        router.push('/dashboard/my-tickets') 
    } else {
        alert('Failed to save ticket: ' + result.error)
    }
  }


  if (step === 5 && generatedResult) {
    // Process content to inject images
    // Process content to inject images
      const contentWithImages = generatedResult.coreContent.replace(
        /\[\[(?:\s*(?:SCREEN|Screen|Image|img)\s*[_-\s]?)?(\d+)\s*\]\]/gi, 
        (match, index) => {
            const i = parseInt(index);
            // Handle both 0-based and potentially 1-based if AI messes up, or strict 0-based
            // The prompt asks for index.
            const shot = formData.screenshots[i] || formData.screenshots[i - 1]; 
            if (!shot) {
                // If there are no screenshots, clean up the placeholder completely
                if (formData.screenshots.length === 0) return '';
                return `\n> [Missing Image #${index}]\n`;
            }
            return `\n![${shot.description || 'Screenshot'}](${shot.preview})\n`;
        }
    );

    return (
        <div className={styles.wizardContainerFull}>
             <Lightbox />
             {generatedResult && (
                 <JiraExportModal 
                     isOpen={showJiraModal} 
                     onClose={() => setShowJiraModal(false)}
                     ticketData={generatedResult}
                 />
             )}
             {/* Header */}
             <div className={styles.resultHeader} style={{ marginBottom: '1rem' }}>
                  <div>
                      <div className={styles.headerMeta}>
                        <span className={styles.dateBadge}>{new Date().toLocaleDateString()}</span>
                        <span className={styles.stepDivider}>•</span>
                        <span className={styles.dateBadge}>{generatedResult.type} Ticket</span>
                        <span className={styles.stepDivider}>•</span>
                        <button 
                            className={styles.buttonJira} 
                            onClick={handleJiraExport}
                        >
                            <ExternalLink size={14} /> Open in Jira
                        </button>
                      </div>
                      <h2 className={styles.documentTitle}>{generatedResult.title}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                          className={styles.buttonGhost}
                          onClick={() => setIsEditing(!isEditing)}
                      >
                          {isEditing ? <Check size={16} /> : <FileText size={16} />}
                          {isEditing ? 'Done Editing' : 'Edit'}
                      </button>
                      <button 
                          className={styles.buttonGhost}
                          onClick={() => navigator.clipboard.writeText(generatedResult.coreContent)}
                      >
                          <Copy size={16} /> Copy
                      </button>
                      <button 
                          className={styles.buttonPrimary}
                          onClick={handleSave}
                          disabled={isSaving}
                      >
                          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                          Save Ticket
                      </button>
                  </div>
             </div>

             <div className={styles.resultLayout} style={{ marginTop: 0 }}>
                 {/* Main Content (Ticket) */}
                 <div className={styles.mainContent} style={{ flex: isChatExpanded ? 1 : 3, transition: 'all 0.3s ease' }}>
                     <TicketMainPanel 
                         isEditing={isEditing}
                         content={generatedResult.coreContent}
                         displayContent={contentWithImages}
                         onContentChange={(newContent) => setGeneratedResult({ ...generatedResult, coreContent: newContent })}
                         onImageClick={setLightboxSrc}
                     />
                 </div>

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
                        
                        {activeTab === 'analysis' ? (
                            <div className={styles.advisorBox}>
                                <div className={styles.advisorHeader}>
                                    <Sparkles size={16} className={styles.iconGold} />
                                    <span>AI Analysis</span>
                                </div>
                                <div className={styles.missingContent}>
                                     <div className={styles.markdownContent}>
                                         <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                             {(generatedResult.missingElements || '')
                                                .replace(/^#*\s*(Engineering Considerations|AI Analysis)[:\s]*/i, '')}
                                         </ReactMarkdown>
                                     </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.chatContainer}>
                                <div className={styles.chatMessages}>
                                    {chatHistory.length === 0 && (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
                                            <p>👋 I'm here to help.</p>
                                            <p style={{ marginTop: '0.5rem' }}>Ask me to split stories, add edge cases, or refine the acceptance criteria.</p>
                                        </div>
                                    )}
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} className={`${styles.chatMessage} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
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
                                        ref={textareaRef}
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
                        )}
                    </div>
                </div>

                <div className={styles.actions}>
                    <div className={styles.projectSelector}>
                        <select 
                            className={styles.selectInput}
                            value={selectedProjectId || ''}
                            onChange={(e) => {
                                if (e.target.value === 'new') {
                                    setIsCreatingProject(true);
                                    setSelectedProjectId(null);
                                } else {
                                    setSelectedProjectId(e.target.value || null);
                                }
                            }}
                        >
                            <option value="">Select Project (Optional)</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                            <option value="new">+ Create New Project</option>
                        </select>
                        {isCreatingProject && (
                            <div className={styles.newProjectInput}>
                                <input 
                                    type="text" 
                                    placeholder="Project Name"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className={styles.textInput}
                                    autoFocus
                                />
                                <button 
                                    className={styles.buttonSecondary}
                                    onClick={handleCreateProject}
                                    disabled={!newProjectName.trim()}
                                >
                                    <Check size={14} />
                                </button>
                                <button 
                                    className={styles.buttonGhost}
                                    onClick={() => setIsCreatingProject(false)}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <button className={styles.buttonSecondary} onClick={() => setStep(4)}>Back to Setup</button>
                    <button 
                        className={styles.buttonPrimary} 
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 size={16} className={styles.spin} /> : <Check size={16} />}
                        Save to My Tickets
                    </button>
            </div>
        </div>
    )
  }



  return (
    <div className={styles.wizardContainer}>
      <Lightbox />
      <div className={styles.stepIndicator}>
        <span className={step >= 1 ? styles.stepActive : styles.stepInactive}>Setup</span>
        <span className={styles.stepDivider}>/</span>
        <span className={step >= 2 ? styles.stepActive : styles.stepInactive}>Details</span>
        <span className={styles.stepDivider}>/</span>
        <span className={step >= 3 ? styles.stepActive : styles.stepInactive}>Flow</span>
        <span className={styles.stepDivider}>/</span>
        <span className={step >= 4 ? styles.stepActive : styles.stepInactive}>Generate</span>
      </div>

      <div className={styles.card}>
        {step === 1 && (
          <>
            <h2 className={styles.cardTitle}>Create New Ticket</h2>
            <p className={styles.cardSubtitle}>Let's start with the basics of what you're building.</p>

            <div className={styles.formGroup}>
              <label htmlFor="featureName" className={styles.label}>
                Feature Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="featureName"
                className={`${styles.input} ${errors.featureName ? styles.inputError : ''}`}
                placeholder="e.g. User Authentication Flow"
                value={formData.featureName}
                onChange={(e) => handleChange('featureName', e.target.value)}
              />
              {errors.featureName && (
                  <span className={styles.errorMessage}>
                      <AlertTriangle size={12} /> {errors.featureName}
                  </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Ticket Type <span className={styles.required}>*</span>
              </label>
              <div className={styles.ticketTypeGrid}>
                <button
                  className={`${styles.ticketTypeCard} ${formData.ticketType === 'functional' ? styles.selected : ''}`}
                  onClick={() => setFormData({ ...formData, ticketType: 'functional' })}
                >
                  <div className={styles.typeIconWrapper}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className={styles.typeTitle}>Functional Ticket</div>
                    <div className={styles.typeDesc}>For PMs & Stakeholders. Focuses on User Stories and Acceptance Criteria.</div>
                  </div>
                </button>
                <button
                  className={`${styles.ticketTypeCard} ${formData.ticketType === 'technical' ? styles.selected : ''}`}
                  onClick={() => setFormData({ ...formData, ticketType: 'technical' })}
                >
                   <div className={styles.typeIconWrapper}>
                    <Cpu size={24} />
                  </div>
                  <div>
                    <div className={styles.typeTitle}>Technical Ticket</div>
                    <div className={styles.typeDesc}>For Engineers. Focuses on Implementation Details, database changes, and APIs.</div>
                  </div>
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Platform(s) <span className={styles.required}>*</span>
              </label>
              <div className={styles.platformGrid}>
                {PLATFORMS.map(platform => (
                  <button
                    key={platform.id}
                    className={`${styles.platformCard} ${formData.platforms.includes(platform.id) ? styles.selected : ''}`}
                    onClick={() => handlePlatformToggle(platform.id)}
                    style={errors.platforms ? { borderColor: '#ef4444' } : undefined}
                  >
                    {formData.platforms.includes(platform.id) && <Check size={16} className={styles.checkIcon} />}
                    {platform.label}
                  </button>
                ))}
              </div>
               {errors.platforms && (
                  <span className={styles.errorMessage}>
                      <AlertTriangle size={12} /> {errors.platforms}
                  </span>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className={styles.cardTitle}>Define the Feature</h2>
            <p className={styles.cardSubtitle}>Describe the problem and expected behavior clearly.</p>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                  <label htmlFor="problem" className={styles.label}>
                    Problem to Solve <span className={styles.required}>*</span>
                  </label>
                  <button 
                     className={styles.reformBtn}
                     onClick={() => handleReform('problem')}
                     disabled={!formData.problem || !!reformingField}
                  >
                     {reformingField === 'problem' ? <Loader2 size={12} className={styles.spin} /> : <Sparkles size={12} />}
                     Reform with AI
                  </button>
              </div>
              <textarea
                id="problem"
                className={`${styles.textarea} ${errors.problem ? styles.inputError : ''}`}
                placeholder="What user pain exists? e.g. Users currently cannot find the logout button..."
                rows={3}
                value={formData.problem}
                onChange={(e) => handleChange('problem', e.target.value)}
              />
               {errors.problem && (
                  <span className={styles.errorMessage}>
                      <AlertTriangle size={12} /> {errors.problem}
                  </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                  <label htmlFor="behavior" className={styles.label}>
                    Expected Behavior <span className={styles.required}>*</span>
                  </label>
                  <button 
                     className={styles.reformBtn}
                     onClick={() => handleReform('behavior')}
                     disabled={!formData.behavior || !!reformingField}
                  >
                     {reformingField === 'behavior' ? <Loader2 size={12} className={styles.spin} /> : <Sparkles size={12} />}
                     Reform with AI
                  </button>
              </div>
              <textarea
                id="behavior"
                className={`${styles.textarea} ${errors.behavior ? styles.inputError : ''}`}
                placeholder="What should success look like? e.g. Clicking settings should show a red logout button..."
                rows={3}
                value={formData.behavior}
                onChange={(e) => handleChange('behavior', e.target.value)}
              />
               {errors.behavior && (
                  <span className={styles.errorMessage}>
                      <AlertTriangle size={12} /> {errors.behavior}
                  </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.uploadHeader}>
                <label className={styles.label}>
                  Design / Screenshots <span className={styles.optional}>(Optional)</span>
                </label>
                <div className={styles.viewToggle}>
                  <button 
                    className={`${styles.iconBtn} ${viewMode === 'grid' ? styles.activeIcon : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <Grid size={16} />
                  </button>
                  <button 
                    className={`${styles.iconBtn} ${viewMode === 'list' ? styles.activeIcon : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
              
              <div 
                className={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} className={styles.uploadIcon} />
                <p>Click to upload PNG/JPG</p>
                <span className={styles.uploadSubtext}>Supports multiple files</span>
                <input 
                  type="file" 
                  hidden 
                  ref={fileInputRef} 
                  multiple 
                  accept="image/png, image/jpeg"
                  onChange={handleFileSelect}
                />
              </div>

              {formData.screenshots.length > 0 && (
                <div className={viewMode === 'grid' ? styles.screenshotGrid : styles.screenshotList}>
                  {formData.screenshots.map((shot) => (
                    <div 
                      key={shot.id} 
                      className={styles.screenshotCard}
                      draggable
                      onDragStart={() => handleDragStart(shot.id)}
                      onDragOver={(e) => handleDragOver(e, shot.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className={styles.dragHandle}>
                        <GripVertical size={14} />
                      </div>
                      <div className={styles.previewWrapper}>
                        <img 
                          src={shot.preview} 
                          alt="Preview" 
                          className={styles.preview} 
                          onClick={() => setLightboxSrc(shot.preview)}
                          style={{ cursor: 'zoom-in' }}
                        />
                        <button 
                           className={styles.removeBtn}
                           onClick={() => removeScreenshot(shot.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className={styles.captionRow}>
                          <input 
                            type="text"
                            className={styles.captionInput}
                            style={{ borderColor: !shot.description.trim() ? '#ef4444' : undefined }}
                            placeholder="Short description (required)"
                            value={shot.description}
                            onChange={(e) => updateScreenshotDesc(shot.id, e.target.value)}
                            required
                          />
                          <button 
                             className={styles.reformMiniBtn}
                             onClick={() => handleScreenshotReform(shot.id, shot.description)}
                             disabled={!shot.description || !!reformingField}
                             title="Refine with AI"
                          >
                             {reformingField === shot.id ? <Loader2 size={12} className={styles.spin} /> : <Sparkles size={12} />}
                          </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className={styles.cardTitle}>User Flow Builder</h2>
            <p className={styles.cardSubtitle}>Arrange your screens to define the user journey (A → B → C).</p>

            {formData.screenshots.length === 0 ? (
               <div className={styles.emptyFlow}>
                  <p>No screenshots uploaded in Step 2.</p>
                  <button className={styles.buttonSecondary} onClick={() => setStep(2)}>
                     Go back to upload
                  </button>
               </div>
            ) : (
              <div className={styles.flowContainer}>
                {formData.screenshots.map((shot, index) => (
                  <div key={shot.id} className={styles.flowStep}>
                    <div 
                      className={styles.screenNode}
                      draggable
                      onDragStart={() => handleDragStart(shot.id)}
                      onDragOver={(e) => handleDragOver(e, shot.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className={styles.orderBadge}>{index + 1}</div>
                      <div className={styles.dragHandle}>
                         <GripVertical size={14} />
                      </div>
                      <img 
                         src={shot.preview} 
                         className={styles.miniPreview} 
                         alt="Flow step" 
                         onClick={() => setLightboxSrc(shot.preview)}
                         style={{ cursor: 'zoom-in' }}
                      />
                      <span className={styles.nodeCaption}>{shot.description || 'Untitled Screen'}</span>
                    </div>
                    {index < formData.screenshots.length - 1 && (
                      <ArrowRight size={24} className={styles.arrowRight} />
                    )}
                  </div>
                ))}
              </div>
            )}
           
            <div className={styles.formGroup}>
              <label className={styles.label}>Flow Logic (Optional)</label>
              <textarea 
                 className={styles.textarea}
                 rows={2}
                 placeholder="Describe any specific logic between these steps (e.g. If user fails validation on Step 1, stay on Step 1)..."
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className={styles.cardTitle}>Generation Options</h2>
            <p className={styles.cardSubtitle}>Choose how you want your ticket formatted.</p>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Output Format(s) <span className={styles.required}>*</span>
              </label>
              <div className={styles.formatGrid}>
                {OUTPUT_FORMATS.map(fmt => (
                  <button
                    key={fmt.id}
                    className={`${styles.formatCard} ${formData.formats.includes(fmt.id) ? styles.selectedFormat : ''}`}
                    onClick={() => toggleFormat(fmt.id)}
                  >
                    <div className={styles.formatHeader}>
                       <span className={styles.formatLabel}>{fmt.label}</span>
                       {formData.formats.includes(fmt.id) && <Check size={18} className={styles.checkIcon} />}
                    </div>
                    <p className={styles.formatDesc}>{fmt.description}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className={styles.summaryBox}>
               <p><strong>Generating for:</strong> {formData.featureName} on {formData.platforms.join(', ')}</p>
               <p><strong>Screens:</strong> {formData.screenshots.length} uploaded</p>
            </div>
          </>
        )}

        <div className={styles.actions}>
          {step > 1 && (
            <button className={styles.buttonSecondary} onClick={() => setStep(step - 1)}>
             Back
            </button>
          )}
          
          {step === 3 && formData.ticketType === 'technical' ? (
             <button 
               className={styles.buttonPrimary} 
               onClick={() => handleGenerate(step)}
               disabled={isGenerating}
             >
               {isGenerating ? <Loader2 className={styles.spin} size={16} /> : <Sparkles size={16} />}
               Generate Technical Ticket
             </button>
          ) : step < 4 ? (
            <button className={styles.buttonPrimary} onClick={handleNext}>
              Next: {step === 1 ? 'Details' : step === 2 ? 'Flow' : 'Generation'} <ArrowRight size={16} />
            </button>
          ) : (
             <button 
               className={styles.buttonPrimary} 
               onClick={() => handleGenerate(4)}
               disabled={isGenerating}
             >
               {isGenerating ? <Loader2 className={styles.spin} size={16} /> : <Sparkles size={16} />}
               Generate Ticket
             </button>
          )}
        </div>
      </div>
    </div>
  )
}
