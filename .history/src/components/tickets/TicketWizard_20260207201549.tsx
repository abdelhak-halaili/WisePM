import { useState, useRef } from 'react'
import styles from './TicketWizard.module.css'
import { generateTicketAction, reformTextAction } from '@/app/dashboard/tickets/actions'
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
  AlertTriangle
} from 'lucide-react'

// ... (constants)

export default function TicketWizard() {
  const [step, setStep] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reformingField, setReformingField] = useState<string | null>(null)
  
  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    type: string;
    coreContent: string;
    missingElements: string;
  } | null>(null)
  
  const [formData, setFormData] = useState({
    featureName: '',
    platforms: [] as string[],
    problem: '',
    behavior: '',
    screenshots: [] as Screenshot[],
    formats: [] as string[]
  })

  // ... (drag drop logic)

  const handleReform = async (field: 'problem' | 'behavior') => {
    if (!formData[field]) return
    setReformingField(field)
    
    const result = await reformTextAction(formData[field], field)
    if (result.success && result.data) {
        setFormData(prev => ({ ...prev, [field]: result.data }))
    }
    setReformingField(null)
  }

  // ... (existing handlers)

  const handleContinue = async (e?: React.MouseEvent) => {
    e?.preventDefault()

    if (step === 1) {
       if (!formData.featureName || formData.platforms.length === 0) return
       setStep(2)
    } else if (step === 2) {
       if (!formData.problem || !formData.behavior) return
       setStep(3)
    } else if (step === 3) {
       setStep(4)
    } else if (step === 4) {
       if (formData.formats.length === 0) return
       
       setIsGenerating(true)
       
       const data = new FormData()
       data.append('featureName', formData.featureName)
       data.append('platforms', formData.platforms.join(', '))
       data.append('problem', formData.problem)
       data.append('behavior', formData.behavior)
       data.append('formats', formData.formats.join(', '))
       
       formData.screenshots.forEach(shot => {
         data.append('screenshots', shot.file)
       })

       const result = await generateTicketAction(data)
       setIsGenerating(false)
       
       if (result.success && result.data) {
          setGeneratedResult(result.data)
          setStep(5)
       } else {
          alert('Generation failed: ' + result.error)
       }
    }
  }

  if (step === 5 && generatedResult) {
    return (
        <div className={styles.wizardContainer} style={{ maxWidth: '1000px' }}>
            <div className={styles.resultLayout}>
                <div className={styles.mainContent}>
                    <div className={styles.resultHeader}>
                        <div>
                           <span className={styles.ticketTypeBadge}>{generatedResult.type}</span>
                           <h2 className={styles.cardTitle}>{generatedResult.title}</h2>
                        </div>
                        <button 
                            className={styles.buttonSecondary}
                            onClick={() => navigator.clipboard.writeText(generatedResult.coreContent)}
                        >
                            <Copy size={16} /> Copy
                        </button>
                    </div>
                    
                    <div className={styles.editorContainer}>
                        <label className={styles.label}>Core Ticket (Editable)</label>
                        <textarea 
                            className={styles.resultEditor}
                            value={generatedResult.coreContent}
                            onChange={(e) => setGeneratedResult({ ...generatedResult, coreContent: e.target.value })}
                        />
                    </div>
                </div>

                <div className={styles.sidePanel}>
                    <div className={styles.advisorBox}>
                        <div className={styles.advisorHeader}>
                             <Sparkles size={16} className={styles.iconGold} />
                             <span>AI Suggestions</span>
                        </div>
                        
                        <div className={styles.missingContent}>
                             <h4>Missing Elements & Improvements</h4>
                             <div className={styles.markdownContent}>
                                 {generatedResult.missingElements}
                             </div>
                        </div>
                        <div className={styles.advisorFooter}>
                             <AlertTriangle size={14} />
                             <span>These are suggestions. Currently read-only.</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button className={styles.buttonSecondary} onClick={() => setStep(4)}>Back to Edit</button>
                <button className={styles.buttonPrimary} onClick={() => alert('Saved!')}>Save to Workflows</button>
            </div>
        </div>
    )
  }

  return (
    <div className={styles.wizardContainer}>
      {/* ... Step Indicator ... */}

      <div className={styles.card}>
        {/* ... Step 1 ... */}

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
                className={styles.textarea}
                placeholder="What user pain exists? e.g. Users currently cannot find the logout button..."
                rows={3}
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              />
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
                className={styles.textarea}
                placeholder="What should success look like? e.g. Clicking settings should show a red logout button..."
                rows={3}
                value={formData.behavior}
                onChange={(e) => setFormData({ ...formData, behavior: e.target.value })}
              />
            </div>

            {/* ... Screenshots ... */}

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
               (step === 4 && formData.formats.length === 0) ||
               isGenerating
            }
            onClick={handleContinue}
          >
            {isGenerating ? (
                <>
                    <Loader2 size={18} className={styles.spin} /> Generating...
                </>
            ) : (
                <>
                    {step === 4 ? 'Generate Logic' : 'Continue'} <ArrowRight size={18} />
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
