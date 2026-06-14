import { useEffect, useRef } from 'react'
import styles from './ContextMenu.module.css'

export type ContextMenuEntry =
  | { type: 'separator' }
  | {
      type: 'item'
      id: string
      label: string
      icon?: React.ReactNode
      disabled?: boolean
      onClick?: () => void
    }

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuEntry[]
  onClose: () => void
}

function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Adjust position so the menu never overflows the viewport
  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const { width, height } = menu.getBoundingClientRect()
    let left = x
    let top = y
    if (x + width > window.innerWidth) left = x - width
    if (y + height > window.innerHeight) top = y - height
    menu.style.left = `${Math.max(0, left)}px`
    menu.style.top = `${Math.max(0, top)}px`
  }, [x, y])

  // Close on outside click or Escape
  useEffect(() => {
    function handleClick() { onClose() }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((entry, i) => {
        if (entry.type === 'separator') {
          return <div key={i} className={styles.separator} />
        }
        return (
          <button
            key={entry.id}
            className={styles.item}
            disabled={entry.disabled}
            onClick={() => {
              entry.onClick?.()
              onClose()
            }}
          >
            {entry.icon && <span className={styles.icon}>{entry.icon}</span>}
            <span className={styles.label}>{entry.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ContextMenu
