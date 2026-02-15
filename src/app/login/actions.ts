'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'

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

import { headers } from 'next/headers'

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const data = {
    email: (formData.get('email') as string).toLowerCase(),
    password: formData.get('password') as string,
  }

  // Check if user already exists in DB (Bypass Supabase Enumeration protection)
  const existingUser = await prisma.userProfile.findUnique({
    where: { email: data.email }
  })

  if (existingUser) {
    return redirect(`/login?mode=signup&error=User already registered`)
  }

  const { error, data: authData } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Signup error:', error)
    return redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`)
  }

  // Create Profile in Database (same as before)
  if (authData.user) {
    try {
      await prisma.userProfile.create({
        data: {
          id: authData.user.id,
          email: data.email,
          fullName: data.email.split('@')[0],
        }
      })
    } catch (e) {
      console.error('Profile creation error:', e)
    }
  }

  if (authData?.user && !authData.session) {
    redirect('/login?message=Signup successful! Please check your email and click the confirmation link to access the dashboard.')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
