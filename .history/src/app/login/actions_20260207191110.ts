'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

import prisma from '@/lib/prisma'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: authData } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/login?error=${error.message}`)
  }

  // Create Profile in Database
  if (authData.user) {
    try {
      await prisma.userProfile.create({
        data: {
          id: authData.user.id, // Link Profile ID to Auth ID
          email: data.email,
          fullName: data.email.split('@')[0], // Default name
        }
      })
    } catch (e) {
      // Ignore if profile already exists (e.g. repeated signup attempt)
      console.error('Profile creation error:', e)
    }
  }

  if (authData?.user && !authData.session) {
    redirect('/login?message=Check your email to continue.')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
