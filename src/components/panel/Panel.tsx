import { ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  title: string
  children: ReactNode
  actions?: ReactNode
  className?: string
  bodyClassName?: string
}

function Panel({ title, children, actions, className, bodyClassName }: PanelProps) {
  return (
    <aside className={`${styles.panel} ${className ?? ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={`${styles.body} ${bodyClassName ?? ''}`}>
        {children}
      </div>
    </aside>
  )
}

export default Panel
