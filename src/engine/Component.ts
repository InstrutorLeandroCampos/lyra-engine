import type { GameObject } from './GameObject'

/**
 * Base class for all components. Subclass and override the lifecycle hooks
 * you need; unoverridden hooks are no-ops.
 *
 * `gameObject` is injected by `GameObject.addComponent` before any hook fires.
 */
export abstract class Component {
  // Injected by addComponent — treat as readonly after construction.
  gameObject!: GameObject

  private _enabled = true

  get enabled(): boolean {
    return this._enabled
  }

  set enabled(value: boolean) {
    if (value === this._enabled) return
    this._enabled = value
    if (value) this.onEnable()
    else this.onDisable()
  }

  // ── Lifecycle hooks ───────────────────────────────────────────────────────

  /** Called once when the component is first activated. Fires before `start`. */
  awake(): void {}

  /** Called once before the first `update`, after `awake`. */
  start(): void {}

  /** Called every frame while active.
   *  @param dt  Delta time in seconds. */
  update(_dt: number): void {}

  /** Called at a fixed time-step for physics / deterministic logic.
   *  @param dt  Fixed delta time in seconds. */
  fixedUpdate(_dt: number): void {}

  /** Called every frame after all `update` calls have completed. */
  lateUpdate(_dt: number): void {}

  /** Called when the component or its game object is enabled. */
  onEnable(): void {}

  /** Called when the component or its game object is disabled. */
  onDisable(): void {}

  /** Called just before the component is removed or its game object is destroyed. */
  onDestroy(): void {}

  /** Called each render pass. Override to perform custom 2D canvas drawing.
   *  @param ctx  The 2D rendering context for the current frame. */
  draw(_ctx: CanvasRenderingContext2D): void {}
}
