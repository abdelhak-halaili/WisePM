import styles from "./page.module.css";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          WisePM
        </h1>
        <p className={styles.subtitle}>
          Turn manual product work into intelligent, <br />
          AI-assisted workflows.
        </p>
        
        <div className={styles.ctaGroup}>
          <Link href="/dashboard" className={styles.buttonPrimary}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Get Started <ArrowRight size={18} />
            </span>
          </Link>
          <Link href="/about" className={styles.buttonSecondary}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Learn More <Sparkles size={18} />
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
