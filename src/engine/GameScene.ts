import { Container } from 'pixi.js'
import { GameObject } from './GameObject'

/**
 * A scene in the Lyra engine.
 *
 * `GameScene` extends PixiJS `Container`, so it slots directly into the PixiJS
 * scene graph:
 *
 *   app.stage.addChild(scene)
 *
 * ── Lifecycle wiring ─────────────────────────────────────────────────────────
 * PixiJS handles `onRender` automatically for every node in the scene graph.
 * `update`, `fixedUpdate` and `lateUpdate` must be driven by the Engine or by
 * the caller (e.g. inside a Ticker listener):
 *
 *   app.ticker.add((ticker) => scene.update(ticker.deltaMS / 1000))
 *
 * ── Background colour ────────────────────────────────────────────────────────
 * `backgroundColor` is stored as a data property. Apply it to the renderer
 * when loading the scene:
 *
 *   app.renderer.background.color = scene.backgroundColor
 */
export class GameScene extends Container {
  readonly id: string

  /** Hex colour string used as the canvas background for this scene. */
  backgroundColor: string

  private _awoken    = false
  private _started   = false
  private _destroyed = false

  constructor(name = 'Scene', backgroundColor = '#000000') {
    super()
    this.id               = crypto.randomUUID()
    this.label            = name
    this.backgroundColor  = backgroundColor
    this.sortableChildren = true
  }

  // ── name (maps to PixiJS v8 label) ───────────────────────────────────────

  get name(): string {
    return this.label ?? ''
  }

  set name(value: string) {
    this.label = value
  }

  // ── Object management ─────────────────────────────────────────────────────

  /**
   * All direct-child `GameObject` instances. Plain PixiJS nodes added via
   * `addChild` (e.g. a background Sprite) are excluded.
   */
  get gameObjects(): GameObject[] {
    return this.children.filter((c): c is GameObject => c instanceof GameObject)
  }

  /**
   * Add a root-level `GameObject`. Fires `awake` / `start` immediately if the
   * scene is already running. Returns `this` for chaining.
   */
  add(obj: GameObject): this {
    this.addChild(obj)
    if (this._awoken)  obj.awake()
    if (this._started) obj.start()
    return this
  }

  /**
   * Remove a root-level `GameObject` from the scene.
   * Does NOT destroy it — call `obj.destroy()` explicitly if needed.
   */
  remove(obj: GameObject): void {
    this.removeChild(obj)
  }

  /**
   * Depth-first search across all root objects and their descendants.
   * Returns the first match by name, or `null`.
   */
  findByName(name: string): GameObject | null {
    for (const obj of this.gameObjects) {
      if (obj.name === name) return obj
      const found = obj.findByName(name)
      if (found) return found
    }
    return null
  }

  /** Returns every object in the scene (root + descendants) that carries the given tag. */
  findWithTag(tag: string): GameObject[] {
    return this.gameObjects.flatMap((obj) => obj.findWithTag(tag))
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Called once before the first frame. Cascades to all root GameObjects. */
  awake(): void {
    if (this._awoken) return
    this._awoken = true
    for (const obj of this.gameObjects) obj.awake()
  }

  /** Called once after `awake`, before the first `update`. */
  start(): void {
    if (!this._awoken) this.awake()
    if (this._started) return
    this._started = true
    for (const obj of this.gameObjects) obj.start()
  }

  /**
   * Drive the game logic for one frame.
   * @param dt  Delta time in seconds since the last frame.
   */
  update(dt: number): void {
    if (this._destroyed) return
    for (const obj of this.gameObjects) obj.update(dt)
  }

  /**
   * Drive physics / deterministic logic at a fixed time-step.
   * @param dt  Fixed delta time in seconds.
   */
  fixedUpdate(dt: number): void {
    if (this._destroyed) return
    for (const obj of this.gameObjects) obj.fixedUpdate(dt)
  }

  /**
   * Called every frame after all `update` calls have completed.
   * @param dt  Delta time in seconds.
   */
  lateUpdate(dt: number): void {
    if (this._destroyed) return
    for (const obj of this.gameObjects) obj.lateUpdate(dt)
  }

  /**
   * Override PixiJS `destroy` to guard against double-destroy.
   * Passing `{ children: true }` destroys all child GameObjects recursively.
   */
  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    if (this._destroyed) return
    this._destroyed = true
    super.destroy(options)
  }
}
