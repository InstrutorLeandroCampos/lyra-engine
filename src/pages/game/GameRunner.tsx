import { useEffect, useRef, useState } from 'react'
import { Application, Sprite, Texture } from 'pixi.js'
import { GameScene } from '../../engine/GameScene'
import { GameObject as EngineObject } from '../../engine/GameObject'
import type { Project, GameObject as DataObject } from '../../types/project'
import styles from './GameRunner.module.css'

// ── Types stored in sessionStorage ───────────────────────────────────────────

interface PlayData {
  project: Project
  activeSceneId: string | null
}

// ── Texture loader (same reliable approach used in the Viewport) ──────────────

function loadTexture(dataUrl: string): Promise<Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(Texture.from(img))
    img.onerror = reject
    img.src = dataUrl
  })
}

// ── Recursive builder: DataObject → EngineObject ─────────────────────────────

function buildObject(data: DataObject, textures: Map<string, Texture>): EngineObject {
  const obj = new EngineObject(data.name)
  obj.x      = data.transform.x
  obj.y      = data.transform.y
  obj.angle  = data.transform.rotation   // PixiJS Container.angle accepts degrees
  obj.scale.set(data.transform.scaleX, data.transform.scaleY)
  obj.zIndex  = data.zOrder
  obj.visible = data.active

  for (const tag of data.tags) obj.tags.add(tag)

  for (const comp of data.components) {
    if (comp.type === 'SpriteRenderer') {
      const assetId = comp.assetId as string | null | undefined
      if (assetId) {
        const texture = textures.get(assetId)
        if (texture) {
          const sprite = new Sprite(texture)
          sprite.anchor.set(0.5)
          if (comp.flipX) sprite.scale.x *= -1
          if (comp.flipY) sprite.scale.y *= -1
          obj.addChild(sprite)
        }
      }
    }
  }

  for (const child of data.children ?? []) {
    obj.addGameObject(buildObject(child, textures))
  }

  return obj
}

// ── GameCanvas — initialises PixiJS and runs the game loop ───────────────────

function GameCanvas({ data }: { data: PlayData }) {
  const { project, activeSceneId } = data
  const { width, height } = project.settings.resolution

  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Keep canvas scaled to fill the window at the correct aspect ratio
  useEffect(() => {
    function updateScale() {
      setScale(Math.min(window.innerWidth / width, window.innerHeight / height))
    }
    window.addEventListener('resize', updateScale)
    updateScale()
    return () => window.removeEventListener('resize', updateScale)
  }, [width, height])

  // PixiJS init + game loop
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    let app: Application | null = null
    let cancelled = false

    async function run() {
      const sceneData =
        project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0]

      if (!sceneData) return

      const bgColor = sceneData.backgroundColor ?? project.settings.backgroundColor

      // Initialise PixiJS
      app = new Application()
      await app.init({
        width,
        height,
        background: bgColor,
        antialias: !project.settings.pixelArt,
        resolution: window.devicePixelRatio,
        autoDensity: true,
      })

      if (cancelled) { app.destroy(); return }

      el.appendChild(app.canvas)

      // Pre-load every image asset before building the scene
      const textures = new Map<string, Texture>()
      await Promise.all(
        project.assets
          .filter((a) => a.type === 'image')
          .map(async (asset) => {
            try {
              textures.set(asset.id, await loadTexture(asset.path))
            } catch {
              // skip assets that fail to load
            }
          }),
      )

      if (cancelled) { app.destroy(); return }

      // Build the engine scene
      const scene = new GameScene(sceneData.name, bgColor)

      for (const objData of sceneData.gameObjects) {
        scene.add(buildObject(objData, textures))
      }

      app.stage.addChild(scene)
      scene.awake()
      scene.start()

      // Game loop — drive update and lateUpdate every frame
      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000
        scene.update(dt)
        scene.lateUpdate(dt)
      })
    }

    run()

    return () => {
      cancelled = true
      // destroy(true) also destroys all children
      app?.destroy(true)
    }
  }, [project, activeSceneId, width, height])

  return (
    <div className={styles.outer}>
      <div
        ref={wrapRef}
        className={styles.canvas}
        style={{ width, height, transform: `scale(${scale})` }}
      />
    </div>
  )
}

// ── GameRunner — loads the project from sessionStorage ───────────────────────

function GameRunner() {
  const [data, setData]   = useState<PlayData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('lyra-play-project')
    if (!raw) {
      setError('No project found. Use the ▶ Play button inside the editor.')
      return
    }
    try {
      setData(JSON.parse(raw) as PlayData)
    } catch {
      setError('Could not parse project data. Try pressing Play again.')
    }
  }, [])

  if (error) {
    return (
      <div className={styles.error}>
        <strong>Cannot start game</strong>
        <span>{error}</span>
      </div>
    )
  }

  if (!data) return null

  return <GameCanvas data={data} />
}

export default GameRunner
