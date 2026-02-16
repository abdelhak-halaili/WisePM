'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return redirect(`/auth/update-password?error=Passwords do not match`)
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return redirect(`/auth/update-password?error=${encodeURIComponent(error.message)}`)
  }

  // Sign out user to force login with new password
  await supabase.auth.signOut()

  return redirect('/login?message=Password updated successfully. Please log in with your new password.')
}
