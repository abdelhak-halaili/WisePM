'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Map, 
  Settings, 
  LogOut, 
  PlusCircle 
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const links = [
    { name: 'Ticket Generator', href: '/dashboard/tickets', icon: FileText, disabled: false },
    { name: 'Discovery', href: '/dashboard/discovery', icon: Search, disabled: true, badge: 'Soon' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, disabled: false },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>W</div>
        <span className={styles.brand}>WisePM</span>
      </div>

      {/* Removed "New Workflow" button as Ticket Generator is the main action now */}
      <div className={styles.action}>
      </div>

      <nav className={styles.nav}>
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          
          if (link.disabled) {
             return (
                <div key={link.name} className={`${styles.link} ${styles.disabled}`}>
                    <Icon size={20} />
                    <span>{link.name}</span>
                    {link.badge && <span className={styles.badge}>{link.badge}</span>}
                </div>
             )
          }

          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`${styles.link} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className={styles.footer}>
        <button onClick={handleSignOut} className={styles.signOut}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
