'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

const TPM_PERSONA = `
  You are an expert Technical Product Manager (TPM) at a top-tier tech company.
  Your writing is concise, precise, and focused on clarity and implementation details.
  You anticipate edge cases and engineering constraints.
`

export async function reformTextAction(text: string, fieldName: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  
  const prompt = `
    ${TPM_PERSONA}
    Task: Polish the following "${fieldName}" draft for clarity and grammar.
    Constraint: Do NOT add any new feature details, assumptions, or extra context. Only clarify what is written.
    
    Draft: "${text}"
    
    Output only the refined text.
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return { success: true, data: response.text() }
  } catch (error) {
    return { success: false, error: 'Failed to reform text.' }
  }
}

export async function generateTicketAction(formData: FormData) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: "application/json" }
  })

  const featureName = formData.get('featureName') as string
  const platforms = formData.get('platforms') as string
  const problem = formData.get('problem') as string
  const behavior = formData.get('behavior') as string
  const formats = formData.get('formats') as string
  
  // Handle Images
  const files = formData.getAll('screenshots') as File[]
  const imageParts = await Promise.all(
    files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer()
      return {
        inlineData: {
          data: Buffer.from(arrayBuffer).toString('base64'),
          mimeType: file.type,
        },
      }
    })
  )

  const prompt = `
    ${TPM_PERSONA}
    
    Task: Generate a comprehensive engineering ticket based on the provided feature request and context.
    
    Context:
    - Feature: ${featureName}
    - Platforms: ${platforms}
    - Problem: ${problem}
    - Expected Behavior: ${behavior}
    - Desired Formats: ${formats}
    
    Media:
    - Analyzed ${files.length} screenshots.
    
    Instructions:
    1. **Core Content (coreContent)**: 
       - Write a clean, professional, left-aligned specification.
       - Do NOT use conversational filler ("Here is your ticket").
       - When describing UI/Screens, EXPLICITLY reference the provided screenshots by index or description (e.g., "See Screen 1: Login Page" or "Refer to Dashboard Screenshot").
       - Use standard Markdown headers (#, ##, ###).
    
    2. **Engineering Considerations (missingElements)**:
       - Move ALL technical constraints, edge cases, error handling, and potential missing logic here.
       - Do not put these in the core ticket unless they are defined requirements.
       - This section is for the "AI Suggestions" box to help the engineer think.

    Output Schema (JSON):
    {
      "title": "A concise and standard ticket title (e.g. [FE] Implement...)",
      "type": "The most appropriate type (Feature, Bug, Task, Story)",
      "coreContent": "The main body of the ticket in Markdown format. Clean, left-aligned, no extra fluff.",
      "missingElements": "A markdown list of technical considerations, edge cases, and missing design states."
    }
  `

  try {
    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const jsonString = response.text()
    const data = JSON.parse(jsonString)
    
    return { success: true, data }
  } catch (error) {
    console.error('Error generating ticket:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function saveTicketAction(ticketData: {
    title: string;
    type: string;
    content: string;
    missingElements: string;
    status: string;
    metadata: any;
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return { success: false, error: 'User not authenticated' }
    }

    try {
        const ticket = await prisma.ticket.create({
            data: {
                title: ticketData.title,
                type: ticketData.type,
                content: ticketData.content,
                missingElements: ticketData.missingElements,
                status: ticketData.status,
                metadata: ticketData.metadata,
                userId: user.id
            }
        })
        return { success: true, data: ticket }
    } catch (error) {
        console.error('Error saving ticket:', error)
        return { success: false, error: 'Failed to save ticket' }
    }
}
