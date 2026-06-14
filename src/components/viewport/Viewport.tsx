import { useEffect, useRef, useState } from 'react'
import { Application, TextureSource } from 'pixi.js'
import { Project } from '../../types/project'
import styles from './Viewport.module.css'

interface ViewportProps {
  project: Project
}

function Viewport({ project }: ViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [scale, setScale] = useState(1)
  const [ready, setReady] = useState(false)

  const { width, height } = project.settings.resolution
  const { backgroundColor, targetFps, pixelArt } = project.settings

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (pixelArt) {
        TextureSource.defaultOptions.scaleMode = 'nearest'
      }

      const app = new Application()
      await app.init({
        width,
        height,
        background: backgroundColor,
        antialias: !pixelArt,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      if (cancelled) {
        app.destroy(true)
        return
      }

      appRef.current = app
      canvasWrapperRef.current?.appendChild(app.canvas)
      setReady(true)
    }

    init()

    return () => {
      cancelled = true
      appRef.current?.destroy(true)
      appRef.current = null
      setReady(false)
    }
  // Only run on mount — project settings are baked in at open time
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      const cw = container.clientWidth
      const ch = container.clientHeight
      const s = Math.min((cw / width) * 0.94, (ch / height) * 0.94)
      setScale(s)
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [width, height])

  return (
    <div ref={containerRef} className={styles.container}>
      {!ready && (
        <div className={styles.loading}>
          <span className={styles.loadingIcon}>◈</span>
          <p>Initializing renderer…</p>
        </div>
      )}

      <div
        ref={canvasWrapperRef}
        className={styles.canvasWrapper}
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          opacity: ready ? 1 : 0,
        }}
      />

      <div className={styles.badge}>
        {width} × {height} · {targetFps} fps{pixelArt ? ' · pixel art' : ''}
      </div>
    </div>
  )
}

export default Viewport
