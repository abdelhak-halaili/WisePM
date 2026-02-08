import { login, signup } from './actions'
import styles from './page.module.css' // We will create this module
import { ArrowRight, Fingerprint } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Fingerprint size={32} />
          </div>
          <h1 className={styles.title}>Welcome to WisePM</h1>
          <p className={styles.subtitle}>Sign in to your workflow space</p>
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
            />
          </div>

          <div className={styles.actions}>
            <button formAction={login} className={styles.buttonPrimary}>
              Log in <ArrowRight size={16} />
            </button>
            <button formAction={signup} className={styles.buttonSecondary}>
              Sign up
            </button>
          </div>
          
          {searchParams?.error && (
            <p className={styles.error}>{searchParams.error}</p>
          )}
        </form>
      </div>
    </div>
  )
}
