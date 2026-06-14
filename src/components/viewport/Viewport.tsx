import { useEffect, useRef, useState } from 'react'
import { Application, TextureSource } from 'pixi.js'
import {
  VscAdd,
  VscZoomIn,
  VscZoomOut,
  VscScreenFull,
  VscTarget,
  VscSettings,
} from 'react-icons/vsc'
import { Project } from '../../types/project'
import { useProject } from '../../context/ProjectContext'
import ContextMenu, { ContextMenuEntry } from '../context-menu/ContextMenu'
import styles from './Viewport.module.css'

interface ViewportProps {
  project: Project
}

interface MenuState {
  x: number
  y: number
}

function Viewport({ project }: ViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [scale, setScale] = useState(1)
  const [ready, setReady] = useState(false)
  const [menu, setMenu] = useState<MenuState | null>(null)

  const { dispatch, state } = useProject()
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

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  function handleAddGameObject() {
    const totalObjects = state.project?.scenes.reduce(
      (acc, s) => acc + s.gameObjects.length, 0
    ) ?? 0

    dispatch({
      type: 'ADD_GAME_OBJECT',
      payload: {
        id: crypto.randomUUID(),
        name: `GameObject (${totalObjects + 1})`,
        active: true,
        zOrder: 0,
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        components: [],
        children: [],
        tags: [],
      },
    })
  }

  const menuItems: ContextMenuEntry[] = [
    {
      type: 'item',
      id: 'new-object',
      label: 'New Game Object',
      icon: <VscAdd />,
      onClick: handleAddGameObject,
    },
    { type: 'separator' },
    {
      type: 'item',
      id: 'zoom-in',
      label: 'Zoom In',
      icon: <VscZoomIn />,
      disabled: true,
    },
    {
      type: 'item',
      id: 'zoom-out',
      label: 'Zoom Out',
      icon: <VscZoomOut />,
      disabled: true,
    },
    {
      type: 'item',
      id: 'zoom-fit',
      label: 'Zoom to Fit Content',
      icon: <VscScreenFull />,
      disabled: true,
    },
    {
      type: 'item',
      id: 'zoom-reset',
      label: 'Zoom to Initial Position',
      icon: <VscTarget />,
      disabled: true,
    },
    { type: 'separator' },
    {
      type: 'item',
      id: 'scene-props',
      label: 'Open Scene Properties',
      icon: <VscSettings />,
      disabled: true,
    },
  ]

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onContextMenu={handleContextMenu}
    >
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

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}

export default Viewport
