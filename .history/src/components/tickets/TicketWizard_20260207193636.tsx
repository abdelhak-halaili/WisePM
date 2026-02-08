'use client'

import { useState, useRef } from 'react'
import styles from './TicketWizard.module.css'
import { 
  ArrowRight, 
  Check, 
  Upload, 
  X, 
  Trash2, 
  Grid, 
  List, 
  GripVertical 
} from 'lucide-react'

const PLATFORMS = [
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
  { id: 'web', label: 'Web' },
  { id: 'backend', label: 'Backend' },
  { id: 'dashboard', label: 'Dashboard' },
]

interface Screenshot {
  id: string
  file: File
  preview: string
  description: string
}

export default function TicketWizard() {
  const [step, setStep] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const [formData, setFormData] = useState({
    featureName: '',
    platforms: [] as string[],
    problem: '',
    behavior: '',
    screenshots: [] as Screenshot[]
  })

  // Drag & Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const togglePlatform = (id: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter(p => p !== id)
        : [...prev.platforms, id]
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

  const handleContinue = (e?: React.MouseEvent) => {
    e?.preventDefault()
    console.log('Current Step:', step)
    console.log('Form Data:', formData)

    if (step === 1) {
       if (!formData.featureName || formData.platforms.length === 0) {
         console.warn('Validation failed for Step 1')
         return
       }
       console.log('Moving to Step 2')
       setStep(2)
    } else if (step === 2) {
       if (!formData.problem || !formData.behavior) return
       setStep(3)
    } else if (step === 3) {
       console.log('Generating Ticket with:', formData)
    }
  }

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.stepIndicator}>
        <span className={step >= 1 ? styles.stepActive : styles.stepInactive}>Step 1: Setup</span>
        <span className={styles.stepDivider}>/</span>
        <span className={step >= 2 ? styles.stepActive : styles.stepInactive}>Details</span>
        <span className={styles.stepDivider}>/</span>
        <span className={step >= 3 ? styles.stepActive : styles.stepInactive}>Flow</span>
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
                className={styles.input}
                placeholder="e.g. User Authentication Flow"
                value={formData.featureName}
                onChange={(e) => setFormData({ ...formData, featureName: e.target.value })}
              />
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
                    onClick={() => togglePlatform(platform.id)}
                  >
                    {formData.platforms.includes(platform.id) && <Check size={16} className={styles.checkIcon} />}
                    {platform.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className={styles.cardTitle}>Define the Feature</h2>
            <p className={styles.cardSubtitle}>Describe the problem and expected behavior clearly.</p>

            <div className={styles.formGroup}>
              <label htmlFor="problem" className={styles.label}>
                Problem to Solve <span className={styles.required}>*</span>
              </label>
              <textarea
                id="problem"
                className={styles.textarea}
                placeholder="What user pain exists? e.g. Users currently cannot find the logout button..."
                rows={3}
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="behavior" className={styles.label}>
                Expected Behavior <span className={styles.required}>*</span>
              </label>
              <textarea
                id="behavior"
                className={styles.textarea}
                placeholder="What should success look like? e.g. Clicking settings should show a red logout button..."
                rows={3}
                value={formData.behavior}
                onChange={(e) => setFormData({ ...formData, behavior: e.target.value })}
              />
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
                        <img src={shot.preview} alt="Preview" className={styles.preview} />
                        <button 
                           className={styles.removeBtn}
                           onClick={() => removeScreenshot(shot.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <input 
                        type="text"
                        className={styles.captionInput}
                        placeholder="Short description (required)"
                        value={shot.description}
                        onChange={(e) => updateScreenshotDesc(shot.id, e.target.value)}
                        required
                      />
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
                      <img src={shot.preview} className={styles.miniPreview} alt="Flow step" />
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

        <div className={styles.actions}>
          {step > 1 && (
             <button 
                className={styles.buttonSecondary}
                onClick={() => setStep(step - 1)}
             >
               Back
             </button>
          )}
          <button 
            className={styles.buttonPrimary}
            disabled={
               (step === 1 && (!formData.featureName || formData.platforms.length === 0)) ||
               (step === 2 && (!formData.problem || !formData.behavior))
            }
            onClick={handleContinue}
          >
            {step === 3 ? 'Generate Ticket' : 'Continue'} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
