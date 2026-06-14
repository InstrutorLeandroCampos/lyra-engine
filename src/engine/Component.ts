import type { GameObject } from './GameObject'

/**
 * Base class for all components. Subclass and override only the hooks you need;
 * everything is a no-op by default.
 *
 * `gameObject` is injected by `GameObject.addComponent` before any hook fires.
 * Since `GameObject` extends PixiJS `Container`, `this.gameObject` gives direct
 * access to the PixiJS scene-graph node (position, scale, addChild, etc.).
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

  /**
   * Called by the PixiJS ticker every frame, just before PixiJS renders.
   * Override to imperatively update PixiJS display objects owned by this
   * component (e.g. reposition a Sprite, update a Graphics mesh, etc.).
   */
  onRender(): void {}

  /** Called when the component or its game object is enabled. */
  onEnable(): void {}

  /** Called when the component or its game object is disabled. */
  onDisable(): void {}

  /** Called just before the component is removed or its game object is destroyed. */
  onDestroy(): void {}
}
