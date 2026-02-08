'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function generateTicketAction(formData: FormData) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
    You are an expert Product Manager and QA Engineer.
    Role: Generate a comprehensive ticket based on the following feature request.

    Feature Name: ${featureName}
    Target Platforms: ${platforms}
    
    Problem Statement:
    ${problem}
    
    Expected Behavior:
    ${behavior}
    
    Requested Output Formats: ${formats}

    Please analyze the attached screenshots (if any) to understand the UI/UX context.
    
    Generate the response in Markdown format.
    Structure the response clearly with headings for each requested format.
  `

  try {
    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const text = response.text()
    return { success: true, data: text }
  } catch (error) {
    console.error('Error generating ticket:', error)
    return { success: false, error: 'Failed to generate ticket. Please try again.' }
  }
}
