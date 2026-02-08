import Link from 'next/link'
import { login, signup } from './actions'
import styles from './page.module.css'
import { ArrowRight, Fingerprint, UserPlus } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const mode = resolvedParams?.mode === 'signup' ? 'signup' : 'login'
  const isLogin = mode === 'login'

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Fingerprint size={32} />
          </div>
          <h1 className={styles.title}>
            {isLogin ? 'Welcome to WisePM' : 'Create an account'}
          </h1>
          <p className={styles.subtitle}>
            {isLogin ? 'Sign in to your workflow space' : 'Start building AI-powered workflows'}
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
          
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className={styles.input} 
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div className={styles.actions}>
            {isLogin ? (
              <button formAction={login} className={styles.buttonPrimary}>
                Log in <ArrowRight size={16} />
              </button>
            ) : (
              <button formAction={signup} className={styles.buttonPrimary}>
                Sign up <UserPlus size={16} />
              </button>
            )}
          </div>
          
          <div className={styles.footer}>
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <Link href="/login?mode=signup" className={styles.link}>
                  Sign up
                </Link>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <Link href="/login" className={styles.link}>
                  Log in
                </Link>
              </p>
            )}
          </div>

          {resolvedParams?.error && (
            <p className={styles.error}>{resolvedParams.error}</p>
          )}
          {resolvedParams?.message && (
            <p className={styles.message}>{resolvedParams.message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
