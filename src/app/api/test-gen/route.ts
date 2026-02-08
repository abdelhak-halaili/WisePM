
import { NextResponse } from 'next/server'
import { generateTicketAction } from '@/app/dashboard/tickets/actions'

export async function GET() {
  try {
    const formData = new FormData()
    formData.append('featureName', 'Dark Mode')
    formData.append('platforms', 'Web, iOS')
    formData.append('problem', 'Users are blinded by bright white screens at night.')
    formData.append('behavior', 'Add a toggle in settings to switch ui to dark theme.')
    formData.append('formats', 'user_stories, gherkin')
    
    // We won't test images in this simple terminal test to avoid complexity,
    // but the logic is there.

    console.log('Testing Generate Action...')
    const result = await generateTicketAction(formData)
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
