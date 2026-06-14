import { useEffect, useRef, useState } from 'react'
import { Application, Container, Graphics, TextureSource } from 'pixi.js'
import {
  VscAdd,
  VscZoomIn,
  VscZoomOut,
  VscScreenFull,
  VscTarget,
  VscSettings,
} from 'react-icons/vsc'
import { Project, Transform, GameObject } from '../../types/project'
import { useProject } from '../../context/ProjectContext'
import ContextMenu, { ContextMenuEntry } from '../context-menu/ContextMenu'
import styles from './Viewport.module.css'

/* ── constants ─────────────────────────────────────────────────────────────── */
const MOVE_LEN  = 65
const ARROWHEAD = 9
const HDL       = 7    // handle half-size in pixels
const ROT_R     = 52   // rotation ring radius
const C_X       = 0xee3333
const C_Y       = 0x33ee33
const C_FREE    = 0xffffff
const C_ROT     = 0xffcc00
const PH        = 14   // placeholder rectangle half-size

/* ── drag ──────────────────────────────────────────────────────────────────── */
type DragType = 'move-x' | 'move-y' | 'move-free' | 'rotate' | 'scale-x' | 'scale-y'

interface DragState {
  type: DragType
  objectId: string
  startMouse: { x: number; y: number }
  startTransform: Transform
  objPos: { x: number; y: number }
}

interface ObjEntry {
  container: Container
  selection: Graphics
}

/* ── PixiJS helpers ────────────────────────────────────────────────────────── */
function applyTf(c: Container, t: Transform) {
  c.x = t.x
  c.y = t.y
  c.rotation = t.rotation * (Math.PI / 180)
  c.scale.set(t.scaleX, t.scaleY)
}

function readTf(c: Container): Transform {
  return {
    x: c.x,
    y: c.y,
    rotation: c.rotation * (180 / Math.PI),
    scaleX: c.scale.x,
    scaleY: c.scale.y,
  }
}

function drawArrow(g: Graphics, color: number, toX: number, toY: number) {
  const len = Math.hypot(toX, toY)
  const ux = toX / len, uy = toY / len
  const bx = toX - ux * ARROWHEAD, by = toY - uy * ARROWHEAD
  const px = -uy * ARROWHEAD * 0.45, py = ux * ARROWHEAD * 0.45
  g.moveTo(ux * (HDL + 2), uy * (HDL + 2))
  g.lineTo(bx, by)
  g.stroke({ color, width: 2 })
  g.moveTo(toX, toY)
  g.lineTo(bx + px, by + py)
  g.lineTo(bx - px, by - py)
  g.closePath()
  g.fill({ color })
}

function makePlaceholder(): Graphics {
  const g = new Graphics()
  g.rect(-PH, -PH, PH * 2, PH * 2)
  g.fill({ color: 0x6c3de0, alpha: 0.35 })
  g.rect(-PH, -PH, PH * 2, PH * 2)
  g.stroke({ color: 0xc8bfff, width: 1, alpha: 0.7 })
  g.circle(0, 0, 2)
  g.fill({ color: 0xffffff, alpha: 0.9 })
  return g
}

function makeSelectionRect(): Graphics {
  const g = new Graphics()
  g.rect(-(PH + 4), -(PH + 4), (PH + 4) * 2, (PH + 4) * 2)
  g.stroke({ color: 0xff8800, width: 2 })
  g.visible = false
  return g
}

function makeGizmo(): Container {
  const root = new Container()

  // center free-move square
  const free = new Graphics()
  free.rect(-HDL / 2, -HDL / 2, HDL, HDL)
  free.fill({ color: C_FREE, alpha: 0.9 })
  free.rect(-HDL / 2, -HDL / 2, HDL, HDL)
  free.stroke({ color: 0x000000, width: 1 })
  free.eventMode = 'static'
  free.cursor = 'move'
  free.label = 'move-free'
  root.addChild(free)

  // X axis arrow + invisible wider hit area
  const xg = new Graphics()
  drawArrow(xg, C_X, MOVE_LEN, 0)
  root.addChild(xg)
  const xh = new Graphics()
  xh.rect(HDL + 2, -5, MOVE_LEN - HDL - ARROWHEAD - 4, 10)
  xh.fill({ color: 0xffffff, alpha: 0.01 })
  xh.eventMode = 'static'
  xh.cursor = 'ew-resize'
  xh.label = 'move-x'
  root.addChild(xh)

  // Y axis arrow + invisible wider hit area
  const yg = new Graphics()
  drawArrow(yg, C_Y, 0, -MOVE_LEN)
  root.addChild(yg)
  const yh = new Graphics()
  yh.rect(-5, -(MOVE_LEN - ARROWHEAD - 4), 10, MOVE_LEN - HDL - ARROWHEAD - 4)
  yh.fill({ color: 0xffffff, alpha: 0.01 })
  yh.eventMode = 'static'
  yh.cursor = 'ns-resize'
  yh.label = 'move-y'
  root.addChild(yh)

  // rotate arc + draggable dot
  const ra = new Graphics()
  ra.arc(0, 0, ROT_R, -Math.PI * 1.15, -Math.PI * 0.15)
  ra.stroke({ color: C_ROT, width: 1.5, alpha: 0.5 })
  root.addChild(ra)
  const rd = new Graphics()
  rd.circle(0, -ROT_R, HDL)
  rd.fill({ color: C_ROT })
  rd.circle(0, -ROT_R, HDL)
  rd.stroke({ color: 0x000000, width: 1 })
  rd.eventMode = 'static'
  rd.cursor = 'crosshair'
  rd.label = 'rotate'
  root.addChild(rd)

  // scale X square (placed beyond the X arrow tip)
  const sxp = MOVE_LEN + 12
  const sxg = new Graphics()
  sxg.rect(sxp - HDL / 2, -HDL / 2, HDL, HDL)
  sxg.fill({ color: C_X })
  sxg.rect(sxp - HDL / 2, -HDL / 2, HDL, HDL)
  sxg.stroke({ color: 0x000000, width: 1 })
  sxg.eventMode = 'static'
  sxg.cursor = 'ew-resize'
  sxg.label = 'scale-x'
  root.addChild(sxg)

  // scale Y square (placed beyond the Y arrow tip)
  const syp = -(MOVE_LEN + 12)
  const syg = new Graphics()
  syg.rect(-HDL / 2, syp - HDL / 2, HDL, HDL)
  syg.fill({ color: C_Y })
  syg.rect(-HDL / 2, syp - HDL / 2, HDL, HDL)
  syg.stroke({ color: 0x000000, width: 1 })
  syg.eventMode = 'static'
  syg.cursor = 'ns-resize'
  syg.label = 'scale-y'
  root.addChild(syg)

  root.visible = false
  return root
}

/* ── component ─────────────────────────────────────────────────────────────── */

interface ViewportProps {
  project: Project
}

interface MenuState {
  x: number
  y: number
}

function Viewport({ project }: ViewportProps) {
  const containerRef     = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const appRef           = useRef<Application | null>(null)
  const worldLayerRef    = useRef<Container | null>(null)
  const gizmoRef         = useRef<Container | null>(null)
  const objectMapRef     = useRef<Map<string, ObjEntry>>(new Map())
  const dragRef          = useRef<DragState | null>(null)

  const [scale, setScale] = useState(1)
  const [ready, setReady] = useState(false)
  const [menu, setMenu]   = useState<MenuState | null>(null)

  const { dispatch, state } = useProject()
  // always-fresh ref used inside PixiJS event closures
  const stateRef = useRef(state)
  stateRef.current = state

  const { width, height }                        = project.settings.resolution
  const { backgroundColor, targetFps, pixelArt } = project.settings

  /* ── init PixiJS app ────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (pixelArt) TextureSource.defaultOptions.scaleMode = 'nearest'

      const app = new Application()
      await app.init({
        width,
        height,
        background: backgroundColor,
        antialias: !pixelArt,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      if (cancelled) { app.destroy(true); return }

      // world layer — all game object containers live here
      const worldLayer = new Container()
      worldLayer.sortableChildren = true
      app.stage.addChild(worldLayer)
      worldLayerRef.current = worldLayer

      // gizmo layer — always rendered above game objects
      const gizmo = makeGizmo()
      app.stage.addChild(gizmo)
      gizmoRef.current = gizmo

      // stage acts as the global pointer surface
      app.stage.eventMode = 'static'
      app.stage.hitArea = app.screen

      // click on empty stage → deselect (fires only when no child stopped propagation)
      app.stage.on('pointerdown', () => {
        if (!dragRef.current) {
          dispatch({ type: 'SELECT_GAME_OBJECT', payload: null })
        }
      })

      // drag tracking — update PixiJS directly for smooth visual feedback
      app.stage.on('pointermove', (e) => {
        const drag = dragRef.current
        if (!drag) return
        const cx = e.global.x, cy = e.global.y
        const dx = cx - drag.startMouse.x, dy = cy - drag.startMouse.y
        const t = { ...drag.startTransform }

        if (drag.type === 'move-x')    { t.x = drag.startTransform.x + dx }
        if (drag.type === 'move-y')    { t.y = drag.startTransform.y + dy }
        if (drag.type === 'move-free') { t.x = drag.startTransform.x + dx; t.y = drag.startTransform.y + dy }
        if (drag.type === 'rotate') {
          const a0 = Math.atan2(drag.startMouse.y - drag.objPos.y, drag.startMouse.x - drag.objPos.x)
          const a1 = Math.atan2(cy - drag.objPos.y, cx - drag.objPos.x)
          t.rotation = drag.startTransform.rotation + (a1 - a0) * (180 / Math.PI)
        }
        if (drag.type === 'scale-x') { t.scaleX = Math.max(0.01, drag.startTransform.scaleX + dx * 0.01) }
        if (drag.type === 'scale-y') { t.scaleY = Math.max(0.01, drag.startTransform.scaleY - dy * 0.01) }

        const entry = objectMapRef.current.get(drag.objectId)
        if (entry) {
          applyTf(entry.container, t)
          gizmo.x = entry.container.x
          gizmo.y = entry.container.y
        }
      })

      // commit final transform to React state on release
      app.stage.on('pointerup', () => {
        const drag = dragRef.current
        if (!drag) return
        const entry = objectMapRef.current.get(drag.objectId)
        if (entry) {
          dispatch({
            type: 'UPDATE_GAME_OBJECT_TRANSFORM',
            payload: { objectId: drag.objectId, transform: readTf(entry.container) },
          })
        }
        dragRef.current = null
      })

      app.stage.on('pointerupoutside', () => { dragRef.current = null })

      // wire up each labelled gizmo handle to start a drag
      for (const child of Array.from(gizmo.children) as Container[]) {
        if (!child.label) continue
        child.on('pointerdown', (e) => {
          e.stopPropagation()
          const selId = stateRef.current.selectedObjectId
          if (!selId) return
          const entry = objectMapRef.current.get(selId)
          if (!entry) return
          let tf: Transform | null = null
          for (const scene of stateRef.current.project?.scenes ?? []) {
            const obj = scene.gameObjects.find((o) => o.id === selId)
            if (obj) { tf = { ...obj.transform }; break }
          }
          if (!tf) return
          dragRef.current = {
            type: child.label as DragType,
            objectId: selId,
            startMouse: { x: e.global.x, y: e.global.y },
            startTransform: tf,
            objPos: { x: entry.container.x, y: entry.container.y },
          }
        })
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
      worldLayerRef.current = null
      gizmoRef.current = null
      objectMapRef.current.clear()
      setReady(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── resize observer ────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const s = Math.min((el.clientWidth / width) * 0.94, (el.clientHeight / height) * 0.94)
      setScale(s)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [width, height])

  /* ── sync game objects → PixiJS ─────────────────────────────────────────── */
  useEffect(() => {
    const worldLayer = worldLayerRef.current
    if (!worldLayer) return

    const objectMap = objectMapRef.current
    const allObjs = new Map<string, GameObject>()
    for (const scene of project.scenes) {
      for (const obj of scene.gameObjects) allObjs.set(obj.id, obj)
    }

    // remove objects deleted from state
    for (const [id, entry] of objectMap) {
      if (!allObjs.has(id)) {
        worldLayer.removeChild(entry.container)
        entry.container.destroy({ children: true })
        objectMap.delete(id)
      }
    }

    const selId = stateRef.current.selectedObjectId

    for (const [id, obj] of allObjs) {
      let entry = objectMap.get(id)
      if (!entry) {
        const container = new Container()
        container.addChild(makePlaceholder())
        const selection = makeSelectionRect()
        container.addChild(selection)
        container.eventMode = 'static'
        container.cursor = 'pointer'
        // click on object → select it; stop propagation to avoid deselecting
        container.on('pointerdown', (e) => {
          e.stopPropagation()
          dispatch({ type: 'SELECT_GAME_OBJECT', payload: id })
        })
        worldLayer.addChild(container)
        entry = { container, selection }
        objectMap.set(id, entry)
      }
      applyTf(entry.container, obj.transform)
      entry.container.zIndex = obj.zOrder
      entry.selection.visible = id === selId
    }

    worldLayer.sortChildren()
  // `ready` is included so the effect reruns once the PixiJS app is initialized
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.scenes, dispatch, ready])

  /* ── sync gizmo → selected object ──────────────────────────────────────── */
  useEffect(() => {
    const gizmo = gizmoRef.current
    const objectMap = objectMapRef.current
    const selId = state.selectedObjectId

    for (const [id, entry] of objectMap) {
      entry.selection.visible = id === selId
    }

    if (!selId || !gizmo) { if (gizmo) gizmo.visible = false; return }
    const entry = objectMap.get(selId)
    if (!entry) { if (gizmo) gizmo.visible = false; return }

    gizmo.x = entry.container.x
    gizmo.y = entry.container.y
    gizmo.visible = true
  }, [state.selectedObjectId, project.scenes])

  /* ── context menu ───────────────────────────────────────────────────────── */
  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  function handleAddGameObject() {
    const total = state.project?.scenes.reduce((acc, s) => acc + s.gameObjects.length, 0) ?? 0
    dispatch({
      type: 'ADD_GAME_OBJECT',
      payload: {
        id: crypto.randomUUID(),
        name: `GameObject (${total + 1})`,
        active: true,
        zOrder: 0,
        transform: { x: width / 2, y: height / 2, rotation: 0, scaleX: 1, scaleY: 1 },
        components: [],
        children: [],
        tags: [],
      },
    })
  }

  const menuItems: ContextMenuEntry[] = [
    { type: 'item', id: 'new-object',  label: 'New Game Object',          icon: <VscAdd />,        onClick: handleAddGameObject },
    { type: 'separator' },
    { type: 'item', id: 'zoom-in',     label: 'Zoom In',                  icon: <VscZoomIn />,     disabled: true },
    { type: 'item', id: 'zoom-out',    label: 'Zoom Out',                 icon: <VscZoomOut />,    disabled: true },
    { type: 'item', id: 'zoom-fit',    label: 'Zoom to Fit Content',      icon: <VscScreenFull />, disabled: true },
    { type: 'item', id: 'zoom-reset',  label: 'Zoom to Initial Position', icon: <VscTarget />,     disabled: true },
    { type: 'separator' },
    { type: 'item', id: 'scene-props', label: 'Open Scene Properties',    icon: <VscSettings />,   disabled: true },
  ]

  return (
    <div ref={containerRef} className={styles.container} onContextMenu={handleContextMenu}>
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
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}
    </div>
  )
}

export default Viewport
