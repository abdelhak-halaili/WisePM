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
    type: "object",
    properties: {
      title: { type: "string", description: "Concise ticket title" },
      type: { type: "string", description: "Ticket type (Feature, Bug, etc.)" },
      coreContent: { type: "string", description: "Main markdown content, strictly escaped" },
      missingElements: { type: "string", description: "Engineering considerations in markdown" }
    },
    required: ["title", "type", "coreContent", "missingElements"]
  };

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: schema
    }
  })

  // ... (formData extraction) ...

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
