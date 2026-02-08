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
    Task: Rewrite the following "${fieldName}" draft to be more professional, clear, and actionable.
    Keep the original meaning but improve grammar, structure, and technical precision.
    
    Draft: "${text}"
    
    Output only the rewritten text.
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
    
    Analyze any attached screenshots for UI/UX context.

    Output Schema (JSON):
    {
      "title": "A concise and standard ticket title (e.g. [FE] Implement...)",
      "type": "The most appropriate type (Feature, Bug, Task, Story)",
      "coreContent": "The main body of the ticket in Markdown format. Include the requested formats (User Stories, Gherkin, etc.) here.",
      "missingElements": "A markdown list of potential edge cases, missing design states, error handling info, or unclear behavior that the user should consider adding. If none, say 'None'."
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
