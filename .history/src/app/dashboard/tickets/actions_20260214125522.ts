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

const STAFF_ENGINEER_PERSONA = `
  You are a Staff Software Engineer at a top-tier tech company (like Google, Meta, Netflix).
  Your role is to translate loose requirements into rigorous Technical Specifications.
  
  Focus on:
  - **System Design & Architecture**: How components interact.
  - **Data Models**: Schema definitions, relationships, and migrations.
  - **API Contracts**: REST/GraphQL definitions with request/response examples.
  - **Scalability & Performance**: Caching strategies, N+1 query prevention, indexing.
  - **Edge Cases**: Race conditions, error states, and security implications (RBAC, IDOR).
  
  Your output is directed at Senior Engineers who need to implement this feature.
`

import { checkSubscription } from '@/lib/subscription'

export async function checkUserSubscriptionAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false;
    
    return await checkSubscription(user.id);
}

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

import { checkTicketGenerationLimit } from '@/lib/subscription'

export async function generateTicketAction(formData: FormData) {
  // 1. Auth & Limit Check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
      return { success: false, error: 'User not authenticated' }
  }

  const limitCheck = await checkTicketGenerationLimit(user.id);
  if (!limitCheck.allowed) {
      return { 
          success: false, 
          error: 'LIMIT_REACHED', // Special error code for UI handling
          message: limitCheck.reason 
      }
  }

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
  const ticketType = formData.get('ticketType') as string || 'functional'
  const problem = formData.get('problem') as string
  const behavior = formData.get('behavior') as string
  const formats = formData.get('formats') as string
  
  // Parse descriptions for context
  let screenshotDescriptions: string[] = [];
  try {
    const descRaw = formData.get('screenshot_descriptions') as string;
    if (descRaw) screenshotDescriptions = JSON.parse(descRaw);
  } catch (e) {
    console.error("Failed to parse screenshot descriptions", e);
  }

  const imageParts = await Promise.all(
    Array.from(formData.entries())
      .filter(([key, value]) => key.startsWith('screenshot_') && value instanceof File)
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

  const isTechnical = ticketType === 'technical';
  const selectedPersona = isTechnical ? STAFF_ENGINEER_PERSONA : TPM_PERSONA;

  const prompt = `
    ${selectedPersona}
    
    Task: Generate a ${isTechnical ? 'Technical Design Document (TDD) / Engineering Ticket' : 'comprehensive Product Requirement Document (PRD) / Ticket'} based on the context.
    
    Context:
    - Feature: ${featureName}
    - Platforms: ${platforms}
    - Problem: ${problem}
    - Expected Behavior: ${behavior}
    - Desired Formats: ${formats}
    
    Media Context (CRITICAL):
    - The user has uploaded ${screenshotDescriptions.length} screenshots.
    - **Image Reference Map**:
    ${screenshotDescriptions.map((desc, i) => `  - [[${i}]]: ${desc}`).join('\n    ')}
    
    Instructions:
    1. **Core Content (coreContent)**: 
       - Write a clean, professional specification.
       - **IMAGES**: Use placeholders '[[N]]' exactly where relevant.
       
       ${isTechnical ? `
       **TECHNICAL TICKET STRUCTURE**:
       
       ### 1. High-Level Approach
       - Briefly explain the architectural changes.
       - Mention new components or services.
       
       ---

       ### 2. Database Design (Schema)
       - Provide Prisma/SQL schema changes.
       - Explain relationships and indexes.
       - Example:
         \`\`\`prisma
         model User {
           id String @id
           ...
         }
         \`\`\`
       
       ---
       
       ### 3. API Contract
       - Define new endpoints (Method, URL, Body, Response).
       - Include validation rules (Zod/Joi).
       
       ---
       
       ### 4. Implementation Steps
       - Step-by-step guide for the engineer.
       - Logical order of execution (e.g., 1. DB Migration, 2. Backend Service, 3. UI Components).
       
       ---
       
       ### 5. Frontend & UI
       [[0]] (Show relevant UI mocks here)
       - Component hierarchy.
       - State management (React Query / Redux).
       
       ` : `
       **FUNCTIONAL TICKET STRUCTURE**:
       - **User Stories** or **Gherkin Scenarios** (based on request).
       - **Acceptance Criteria**.
       - Focus on the *What* and *Why*, not the *How*.
       ${formats.includes('Gherkin') 
          ? "Provide a Unified Story followed by strict Given/When/Then scenarios." 
          : "Provide a comprehensive list of User Stories."}
       `}
       
       - Use standard Markdown headers (#, ##, ###).
    
    2. **AI Analysis (missingElements)**:
       ${isTechnical ? `
       - Focus on **Engineering Risks**:
       - **Security**: IDOR, XSS, Rate Limiting?
       - **Scalability**: Will this perform with 1M users? Database locking?
       - **Observability**: What logs/metrics are needed?
       - **Tech Debt**: Any hacks we should avoid?
       ` : `
       - Focus on **Product Logic**:
       - Missing User Flows.
       - UX Edge Cases.
       - Business Logic gaps.
       `}
       - Format as a numbered list.
       
    CRITICAL JSON INSTRUCTION:
    - Output strictly valid JSON.
    - Escape specific characters in markdown strings safely.
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
    projectId?: string; // Add optional projectId
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
                userId: user.id,
                projectId: ticketData.projectId || null // Link to project
            }
        })
        return { success: true, data: ticket }
    } catch (error) {
        console.error('Error saving ticket:', error)
        return { success: false, error: 'Failed to save ticket' }
    }
}

export async function refineTicketAction(
  currentTicket: any, 
  chatHistory: { role: string, content: string }[], 
  userPrompt: string
) {
  // Schema for the chat response (Updated Ticket + Message)
  const responseSchema = {
    description: "Refined ticket structure and explanation",
    type: SchemaType.OBJECT,
    properties: {
      updatedTicket: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
          coreContent: { type: SchemaType.STRING, description: "The full markdown content. ONLY change this if the user explicitly asks for an update/edit." },
          missingElements: { type: SchemaType.STRING, description: "Updated AI Analysis / Engineering Considerations" }
        },
        required: ["title", "type", "coreContent", "missingElements"]
      },
      message: { type: SchemaType.STRING, description: "The AI response. If the user asked a question, put the full answer here. If the user asked for an edit, put a brief confirmation here." }
    },
    required: ["updatedTicket", "message"]
  } as any;

  // Use Flash model for speed/cost - Using 2.0 consistent with generator
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: responseSchema
    }
  })

  // Construct context from history
  const historyText = chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n');

  const prompt = `
    ${TPM_PERSONA}
    
    TASK: You are a "Contextual Copilot" helping a Product Manager refine a ticket.
    
    Current Ticket Context:
    ${JSON.stringify(currentTicket, null, 2)}
    
    Chat History:
    ${historyText}
    
    Latest User Request: "${userPrompt}"
    
    CRITICAL INSTRUCTION ON BEHAVIOR:
    1. **ANALYZE INTENT**: 
       - **ACTION**: Does the user explicitly ask you to "add", "change", "remove", "update", or "fix" something in the ticket?
       - **DISCUSSION**: Is the user asking a question, seeking ideas, or asking "what if"?
    
    2. **IF ACTION (Explicit Edit Request)**:
       - **DO NOT CHANGE** the ticket content directly. The \`updatedTicket\` field must match \`currentTicket\` EXACTLY.
       - provide the specific section of changed content in the \`message\` field.
       - **FORMATTING**: Use a Markdown code block (\`\`\`markdown ... \`\`\`) for the new content so the user can easily copy/paste.
       - Explain briefly what specific changes were made.
    
    3. **IF DISCUSSION (Question/Brainstorming)**:
       - **DO NOT CHANGE** the ticket content. Return \`updatedTicket\` EXACTLY as it is in \`currentTicket\`.
       - Set \`message\` to your detailed answer, suggestion, or explanation.
       - **FORMATTING**: Use Markdown (bullet points, bold text) to make the response easy to read. Avoid long paragraphs.
    
    4. **INTELLIGENT**: 
       - If unsure, err on the side of DISCUSSION (don't touch the ticket).
       - If the user says "Yes, do that", treat it as an ACTION based on previous context.
    
    OUTPUT: A JSON object with \`updatedTicket\` and \`message\`.
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const jsonString = response.text()
    
    return { success: true, data: JSON.parse(jsonString) }
  } catch (error) {
    console.error('Error refining ticket:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function updateTicketAction(ticketId: string, updates: {
    content?: string;
    missingElements?: string;
    title?: string;
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return { success: false, error: 'User not authenticated' }
    }

    try {
        // Verify ownership
        const existing = await prisma.ticket.findUnique({
            where: { id: ticketId }
        })
        
        if (!existing || existing.userId !== user.id) {
            return { success: false, error: 'Ticket not found or unauthorized' }
        }

// ... existing updateTicketAction ...
        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                content: updates.content,
                missingElements: updates.missingElements,
                title: updates.title,
                updatedAt: new Date()
            }
        })
        return { success: true, data: ticket }
    } catch (error) {
        console.error('Error updating ticket:', error)
        return { success: false, error: 'Failed to update ticket' }
    }
}

// Project Actions
export async function createProjectAction(name: string, color?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Unauthorized' }

    try {
        const project = await prisma.project.create({
            data: {
                name,
                color,
                userId: user.id
            }
        })
        return { success: true, data: project }
    } catch (error) {
        return { success: false, error: 'Failed to create project' }
    }
}

export async function listProjectsAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return []

    try {
        return await prisma.project.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        })
    } catch (error) {
        return []
    }
}

export async function moveTicketToProjectAction(ticketId: string, projectId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Unauthorized' }

    try {
        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: { projectId }
        })
        return { success: true, data: ticket }
    } catch (error) {
        return { success: false, error: 'Failed to move ticket' }
    }
}
