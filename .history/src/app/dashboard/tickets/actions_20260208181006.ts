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
    - The user has uploaded ${screenshotDescriptions.length} screenshots.
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
       
       - **GHERKIN RULES (If Gherkin format is requested)**:
       - **USER STORY & GHERKIN RULES**:
         ${formats.includes('Gherkin') 
            ? "1. **Unified Story**: Since Gherkin is requested, provide exactly ONE high-level User Story." 
            : "1. **Multiple Stories**: Provide a comprehensive list of ALL relevant User Stories (Happy path, edge cases, admin views)."}
         
         ${formats.includes('Gherkin') ? `2. **Gherkin Scenarios**:
            - Follow the User Story with exhaustive Gherkin Scenarios.
            - **CRITICAL FORMATTING**: Each Given/When/Then/And step MUST be on its own line. NEVER paragraph style.
            - Format:
              ### Scenario: [Title]
              [[N]] (Image Placeholder)
              
              Given [context]
              When [action]
              Then [result]
              And [check]
         ` : ''}
         
       - **Other Formats**:
         - If Acceptance Criteria is requested: List them clearly (checklist style).
         - If Event Tracking is requested: Use a table (Event Name, Properties, Trigger).
            
       - **Example Output**:
         ${formats.includes('Gherkin') ? `
         ### User Story
         As a driver, I want to view my wallet...
         
         ---

         ### Scenario: View Balance
         [[0]]
         Given I am on the home screen
         When I tap the wallet icon
         Then I see my current balance
         ` : `
         ### User Story: View Dashboard
         [[0]]
         As a user, I want to see my stats...

         ---

         ### User Story: Export Data
         [[1]]
         As an admin, I want to export CSVs...

         ---
         
         ### Acceptance Criteria
         - [ ] Verify stats are accurate.
         - [ ] Ensure export button is visible for admins only.
         `}
       
       - Do NOT write "See Screen 1". Embed it with the placeholder.
       - Use standard Markdown headers (#, ##, ###).
    
    2. **AI Analysis (missingElements)**:
       - Focus strictly on **Product Management** perspectives: Missing User Flows, Business Logic gaps, UX Edge Cases, and Scalability from a user/business view.
       - Do **NOT** include low-level technical implementation details (e.g. specific error handling code, database constraints) unless they directly impact the user experience.
       - **FORMATTING**:
         - Do NOT include a main title (e.g. "AI Analysis"). Start directly with the content.
         - Use a Numbered List format: "1. **Topic Name**: Description..."
         - Use bold text for the topic name.
         - Avoid excessive vertical spacing.
       - This section is for the "AI Suggestions" box to help the PM refine the spec.

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
