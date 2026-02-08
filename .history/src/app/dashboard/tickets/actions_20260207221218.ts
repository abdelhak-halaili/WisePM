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
  // Parse descriptions for context
  let screenshotDescriptions: string[] = [];
  try {
    const descRaw = formData.get('screenshot_descriptions') as string;
    if (descRaw) screenshotDescriptions = JSON.parse(descRaw);
  } catch (e) {
    console.error("Failed to parse screenshot descriptions", e);
  }

  const files = await Promise.all(
    Array.from(formData.entries())
      .filter(([key]) => key.startsWith('screenshot_'))
      .map(async ([_, file]) => {
        const bytes = await (file as File).arrayBuffer()
        return {
          inlineData: {
            data: Buffer.from(bytes).toString('base64'),
            mimeType: (file as File).type
          }
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
    
    Media Context (CRITICAL):
    - The user has uploaded ${files.length} screenshots.
    - **Image Reference Map** (Use this to match images to scenarios):
    ${screenshotDescriptions.map((desc, i) => `  - [[${i}]]: ${desc}`).join('\n    ')}
    
    Instructions:
    1. **Core Content (coreContent)**: 
       - Write a clean, professional specification.
       - Do NOT use conversational filler ("Here is your ticket").
       - **IMAGES**: You MUST strictly map the image to the scenario using the "Image Reference Map" above.
       - If a scenario is about "Login", look for the image described as "Login" and use its index (e.g. [[0]]).
       - Do NOT guess. If unsure, use the most relevant image based on the description.
       - Place the image placeholder '[[N]]' **immediately after** the Scenario header.
       
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
