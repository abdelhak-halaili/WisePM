'use server'

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import prisma from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

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
  const schema = {
    description: "Engineering ticket structure",
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: "Concise ticket title" },
      type: { type: SchemaType.STRING, description: "Ticket type (Feature, Bug, etc.)" },
      coreContent: { type: SchemaType.STRING, description: "Main markdown content, strictly escaped" },
      missingElements: { type: SchemaType.STRING, description: "Engineering considerations in markdown" }
    },
    required: ["title", "type", "coreContent", "missingElements"]
  } as any; // Cast to any to bypass strict Schema type validation issues in the SDK types

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: schema
    }
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
    - **Image Reference Map** (Use STRICTLY based on content):
    ${screenshotDescriptions.map((desc, i) => `  - [[${i}]]: ${desc || 'Screenshot ' + (i+1)}`).join('\n    ')}
    
    Instructions:
    1. **Core Content (coreContent)**: 
       - Write a clean, professional, left-aligned specification.
       - Do NOT use conversational filler ("Here is your ticket").
       - **IMAGES**: Use the placeholder '[[N]]' (where N is the index: '[[0]]', '[[1]]') to inject the image.
       - Place the image placeholder **immediately after** the header or title it relates to.
       - **SEPARATION**: Separate each Scenario or User Story with a horizontal rule '---'.
       - Example (Gherkin):
         ### Scenario: Login Flow
         [[0]]
         Given I am on the login page...
         
         ---
         
         ### Scenario: Password Reset
         [[1]]
         Given I clicked reset...
       
       - Example (User Story):
         ### User Story 1
         [[0]]
         As a user...
         
       - Do NOT write "See Screen 1". Embed it with the placeholder.
       - Use standard Markdown headers (#, ##, ###).
    
    2. **Engineering Considerations (missingElements)**:
       - Move ALL technical constraints, edge cases, error handling, and potential missing logic here.
       - Do not put these in the core ticket unless they are defined requirements.
       - This section is for the "AI Suggestions" box to help the engineer think.

    CRITICAL JSON INSTRUCTION:
    - You are outputting a JSON object.
    - The "coreContent" and "missingElements" fields contain Markdown text.
    - YOU MUST ESCAPE ALL special characters properly for JSON strings.
    - Escape double quotes (\") inside the markdown.
    - Escape backslashes (\\).
    - Ensure newlines are encoded as \\n.
  `

  try {
    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const jsonString = response.text()
    
    // Attempt to parse
    let data;
    try {
        data = JSON.parse(jsonString)
    } catch (e) {
        console.error("JSON Parse Error. Raw string:", jsonString)
        // Fallback: Simple cleanup for common issues if schema fails slightly
        const cleaned = jsonString.replace(/\\([^"\\/bfnrtu])/g, '$1'); 
        data = JSON.parse(cleaned)
    }
    
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
