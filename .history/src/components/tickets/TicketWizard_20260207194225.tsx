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

const OUTPUT_FORMATS = [
  { id: 'gherkin', label: 'Gherkin Scenarios', description: 'Given / When / Then format for BDD' },
  { id: 'user_stories', label: 'User Stories', description: 'As a [user], I want [feature] so that [benefit]' },
  { id: 'acceptance', label: 'Acceptance Criteria', description: 'Checklist of requirements for QA' },
  { id: 'tracking', label: 'Event Tracking', description: 'Analytics events to track (Mixpanel/Amplitude)' },
]

export default function TicketWizard() {
  const [step, setStep] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const [formData, setFormData] = useState({
    featureName: '',
    platforms: [] as string[],
    problem: '',
    behavior: '',
    screenshots: [] as Screenshot[],
    formats: [] as string[]
  })

  // ... (previous code)

  const toggleFormat = (id: string) => {
    setFormData(prev => ({
      ...prev,
      formats: prev.formats.includes(id) 
        ? prev.formats.filter(f => f !== id)
        : [...prev.formats, id]
    }))
  }

  const handleContinue = (e?: React.MouseEvent) => {
    e?.preventDefault()
    console.log('Current Step:', step)

    if (step === 1) {
       if (!formData.featureName || formData.platforms.length === 0) {
         console.warn('Validation failed for Step 1')
         return
       }
       setStep(2)
    } else if (step === 2) {
       if (!formData.problem || !formData.behavior) return
       setStep(3)
    } else if (step === 3) {
       setStep(4)
    } else if (step === 4) {
       if (formData.formats.length === 0) return
       console.log('GENERATING TICKET...', formData)
       // Trigger actual generation here
    }
  }

  return (
    <div className={styles.wizardContainer}>
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
        {/* ... Steps 1, 2, 3 ... */}
        
        {step === 3 && (
            // ... existing Step 3 content ...
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
               (step === 2 && (!formData.problem || !formData.behavior)) ||
               (step === 4 && formData.formats.length === 0)
            }
            onClick={handleContinue}
          >
            {step === 4 ? 'Generate Logic' : 'Continue'} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

