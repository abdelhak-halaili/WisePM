'use client'

import { useState } from 'react'
import styles from './TicketWizard.module.css'
import { ArrowRight, Check } from 'lucide-react'

const PLATFORMS = [
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
  { id: 'web', label: 'Web' },
  { id: 'backend', label: 'Backend' },
  { id: 'dashboard', label: 'Dashboard' },
]

export default function TicketWizard() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    featureName: '',
    platforms: [] as string[],
  })

  const togglePlatform = (id: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter(p => p !== id)
        : [...prev.platforms, id]
    }))
  }

  const handleContinue = () => {
    if (!formData.featureName || formData.platforms.length === 0) return
    console.log('Continuing with data:', formData)
    // Next step logic will go here
    // setStep(2) 
  }

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepActive}>Step 1: Setup</span>
        <span className={styles.stepDivider}>/</span>
        <span className={styles.stepInactive}>Details</span>
        <span className={styles.stepDivider}>/</span>
        <span className={styles.stepInactive}>Review</span>
      </div>

      <div className={styles.card}>
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

        <div className={styles.actions}>
          <button 
            className={styles.buttonPrimary}
            disabled={!formData.featureName || formData.platforms.length === 0}
            onClick={handleContinue}
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
