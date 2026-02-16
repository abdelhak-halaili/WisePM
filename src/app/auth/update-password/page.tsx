import AuthForm from '@/app/login/AuthForm'
import { updatePassword } from './actions'
import styles from '@/app/login/page.module.css'
import { KeyRound, ArrowRight } from 'lucide-react'

export default function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const error = searchParams.error as string | undefined
  const message = searchParams.message as string | undefined

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className="font-semibold text-3xl tracking-tight text-white">Wise<span className="font-bold text-yellow-500">PM</span></span>
          </div>
          <h1 className={styles.title}>Set New Password</h1>
          <p className={styles.subtitle}>
            Enter your new password below.
          </p>
        </div>
        
        <form className={styles.form} action={updatePassword}>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>New Password</label>
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

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
            <input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              required 
              className={styles.input} 
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div className={styles.actions}>
            <button className={styles.buttonPrimary}>
                Update Password <ArrowRight size={16} />
            </button>
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
