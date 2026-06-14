import { Transform } from './Transform'
import { Component } from './Component'

export { Transform, Component }

export class GameObject {
  readonly id: string
  name: string
  zOrder   = 0
  readonly transform = new Transform()
  readonly tags      = new Set<string>()

  parent: GameObject | null = null

  private _children:   GameObject[] = []
  private _components: Component[]  = []

  private _active    = true
  private _awoken    = false
  private _started   = false
  private _destroyed = false

  constructor(name = 'GameObject') {
    this.id   = crypto.randomUUID()
    this.name = name
  }

  // ── Active / destroyed ────────────────────────────────────────────────────

  get active(): boolean {
    return this._active
  }

  /**
   * Setting `active = false` calls `onDisable` on all enabled components.
   * Re-enabling calls `onEnable`. Children are affected via `activeInHierarchy`.
   */
  set active(value: boolean) {
    if (value === this._active) return
    this._active = value
    for (const comp of this._components) {
      if (comp.enabled) {
        if (value) comp.onEnable()
        else comp.onDisable()
      }
    }
  }

  /** `true` only when this object and every ancestor are active. */
  get activeInHierarchy(): boolean {
    return this._active && (this.parent?.activeInHierarchy ?? true)
  }

  get destroyed(): boolean {
    return this._destroyed
  }

  // ── Component API ─────────────────────────────────────────────────────────

  /**
   * Instantiate a component, inject `gameObject`, and fire `awake` / `start`
   * immediately if the object is already running.
   */
  addComponent<T extends Component>(Ctor: new () => T): T {
    const comp = new Ctor()
    ;(comp as { gameObject: GameObject }).gameObject = this
    this._components.push(comp)
    if (this._awoken)  comp.awake()
    if (this._started) comp.start()
    return comp
  }

  /** Returns the first component of the given class, or `null`. */
  getComponent<T extends Component>(Ctor: new () => T): T | null {
    return (this._components.find((c) => c instanceof Ctor) as T | undefined) ?? null
  }

  /** Returns all components of the given class. */
  getComponents<T extends Component>(Ctor: new () => T): T[] {
    return this._components.filter((c) => c instanceof Ctor) as T[]
  }

  /**
   * Remove a specific component instance, firing `onDestroy` first.
   * No-op if the component does not belong to this object.
   */
  removeComponent(comp: Component): void {
    const i = this._components.indexOf(comp)
    if (i === -1) return
    comp.onDestroy()
    this._components.splice(i, 1)
  }

  // ── Hierarchy ─────────────────────────────────────────────────────────────

  get children(): readonly GameObject[] {
    return this._children
  }

  /** Add a child, reparenting it if necessary. Returns `this` for chaining. */
  addChild(child: GameObject): this {
    if (child === this) return this
    child.parent?.removeChild(child)
    child.parent = this
    this._children.push(child)
    return this
  }

  /** Detach a direct child. No-op if not a direct child. */
  removeChild(child: GameObject): void {
    const i = this._children.indexOf(child)
    if (i === -1) return
    this._children.splice(i, 1)
    child.parent = null
  }

  /** Depth-first search for a descendant by name. Returns the first match or `null`. */
  find(name: string): GameObject | null {
    for (const child of this._children) {
      if (child.name === name) return child
      const found = child.find(name)
      if (found) return found
    }
    return null
  }

  /** Returns all descendants (including this object) that carry the given tag. */
  findWithTag(tag: string): GameObject[] {
    const result: GameObject[] = []
    if (this.tags.has(tag)) result.push(this)
    for (const child of this._children) result.push(...child.findWithTag(tag))
    return result
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag)
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Called once before the first frame. Cascades to components and children. */
  awake(): void {
    if (this._awoken) return
    this._awoken = true
    for (const comp of this._components) comp.awake()
    for (const child of this._children) child.awake()
  }

  /** Called once after `awake`, before the first `update`. */
  start(): void {
    if (!this._awoken) this.awake()
    if (this._started) return
    this._started = true
    for (const comp of this._components) comp.start()
    for (const child of this._children) child.start()
  }

  /** Called every frame. Skipped when inactive or destroyed.
   *  @param dt  Delta time in seconds. */
  update(dt: number): void {
    if (!this.activeInHierarchy || this._destroyed) return
    for (const comp of this._components) {
      if (comp.enabled) comp.update(dt)
    }
    for (const child of this._children) child.update(dt)
  }

  /** Called at a fixed time-step for physics / deterministic logic.
   *  @param dt  Fixed delta time in seconds. */
  fixedUpdate(dt: number): void {
    if (!this.activeInHierarchy || this._destroyed) return
    for (const comp of this._components) {
      if (comp.enabled) comp.fixedUpdate(dt)
    }
    for (const child of this._children) child.fixedUpdate(dt)
  }

  /** Called every frame after all `update` calls.
   *  @param dt  Delta time in seconds. */
  lateUpdate(dt: number): void {
    if (!this.activeInHierarchy || this._destroyed) return
    for (const comp of this._components) {
      if (comp.enabled) comp.lateUpdate(dt)
    }
    for (const child of this._children) child.lateUpdate(dt)
  }

  /**
   * Render pass — cascades to enabled components then to children sorted by
   * `zOrder` ascending (lower values render first / behind).
   * @param ctx  The 2D rendering context for this frame.
   */
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.activeInHierarchy || this._destroyed) return
    for (const comp of this._components) {
      if (comp.enabled) comp.draw(ctx)
    }
    const sorted = this._children.slice().sort((a, b) => a.zOrder - b.zOrder)
    for (const child of sorted) child.draw(ctx)
  }

  /**
   * Permanently destroy this object: fires `onDestroy` on all components,
   * recursively destroys children, and detaches from the parent.
   */
  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    for (const comp of this._components) comp.onDestroy()
    this._components = []
    for (const child of this._children) child.destroy()
    this._children = []
    this.parent?.removeChild(this)
  }
}
