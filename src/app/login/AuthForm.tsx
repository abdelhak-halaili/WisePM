'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, UserPlus, KeyRound, Eye, EyeOff } from 'lucide-react'
import styles from './page.module.css'
import { login, signup, forgotPassword } from './actions'

type AuthFormProps = {
  mode?: string
  error?: string
  message?: string
}

export default function AuthForm({ mode, error, message }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  const isLogin = !isSignup && !isForgot

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className="font-semibold text-3xl tracking-tight text-white">Wise<span className="font-bold text-yellow-500">PM</span></span>
          </div>
          <h1 className={styles.title}>
            {isLogin && 'Welcome to WisePM'}
            {isSignup && 'Create an account'}
            {isForgot && 'Reset Password'}
          </h1>
          <p className={styles.subtitle}>
            {isLogin && 'Sign in to your workflow space'}
            {isSignup && 'Start building AI-powered workflows'}
            {isForgot && 'Enter your email to receive instructions'}
          </p>
        </div>
        
        <form className={styles.form}>
         <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className={styles.input} 
              placeholder="product@manager.com"
            />
          </div>
          
          {!isForgot && (
            <div className={styles.inputGroup}>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password" className={styles.label}>Password</label>
                    {isLogin && (
                        <Link href="/login?mode=forgot" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                            Forgot Password?
                        </Link>
                    )}
                </div>
                <div className="relative">
                  <input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className={styles.input} 
                  placeholder="••••••••"
                  minLength={6}
                  style={{ paddingRight: '2.5rem', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
            </div>
          )}

          {isSignup && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <div className="relative">
                <input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  className={styles.input} 
                  placeholder="••••••••"
                  minLength={6}
                  style={{ paddingRight: '2.5rem', width: '100%' }}
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            {isLogin && (
              <button formAction={login} className={styles.buttonPrimary}>
                Log in <ArrowRight size={16} />
              </button>
            )}
            {isSignup && (
              <button formAction={signup} className={styles.buttonPrimary}>
                Sign up <UserPlus size={16} />
              </button>
            )}
            {isForgot && (
                <button formAction={forgotPassword} className={styles.buttonPrimary}>
                    Send Reset Link <KeyRound size={16} />
                </button>
            )}
          </div>
          
          <div className={styles.footer}>
            {isLogin && (
              <p>
                Don't have an account?{' '}
                <Link href="/login?mode=signup" className={styles.link}>
                  Sign up
                </Link>
              </p>
            )}
            {isSignup && (
              <p>
                Already have an account?{' '}
                <Link href="/login" className={styles.link}>
                  Log in
                </Link>
              </p>
            )}
            {isForgot && (
                <p>
                    <Link href="/login" className={styles.link}>
                        Back to Login
                    </Link>
                </p>
            )}
          </div>

          {error && (
            <p className={styles.error}>{error}</p>
          )}
          {message && (
            <p className={styles.message}>{message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
