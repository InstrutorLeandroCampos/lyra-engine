import { Container } from 'pixi.js'
import { Transform } from './Transform'
import { Component } from './Component'

export { Transform, Component }

/**
 * The base unit of the Lyra engine scene graph.
 *
 * `GameObject` extends PixiJS `Container`, so every instance IS a PixiJS node
 * and can be added to the stage, another container, or a `GameScene` directly.
 *
 * ── PixiJS transform properties ─────────────────────────────────────────────
 *   gameObject.x / .y          — position
 *   gameObject.rotation        — rotation in radians  (PixiJS native)
 *   gameObject.angle           — rotation in degrees  (PixiJS native)
 *   gameObject.scale.set(x, y) — scale
 *   gameObject.zIndex          — draw order (alias: zOrder)
 *   gameObject.visible         — PixiJS render visibility
 *
 * ── Display children vs. GameObject children ────────────────────────────────
 *   Use addChild(sprite / graphics) to attach PixiJS display objects created
 *   by components. These are plain PixiJS nodes — lifecycle is NOT cascaded.
 *
 *   Use addGameObject(child) to attach child GameObjects. Lifecycle (awake,
 *   start, update, …) IS cascaded to them automatically.
 */
export class GameObject extends Container {
  readonly id: string
  readonly tags = new Set<string>()

  private _components: Component[] = []
  private _awoken    = false
  private _started   = false
  private _destroyed = false
  private _active    = true

  constructor(name = 'GameObject') {
    super()
    this.id               = crypto.randomUUID()
    this.label            = name
    this.sortableChildren = true
    // Wire into PixiJS's per-frame pre-render callback.
    // PixiJS calls onRender on every node in the scene graph automatically,
    // so we only cascade to components here — children are handled by PixiJS.
    this.onRender = () => {
      if (!this.activeInHierarchy || this._destroyed) return
      for (const comp of this._components) {
        if (comp.enabled) comp.onRender()
      }
    }
  }

  // ── name (maps to PixiJS v8 label) ───────────────────────────────────────

  get name(): string {
    return this.label ?? ''
  }

  set name(value: string) {
    this.label = value
  }

  // ── zOrder (maps to PixiJS zIndex) ────────────────────────────────────────

  get zOrder(): number {
    return this.zIndex
  }

  set zOrder(value: number) {
    this.zIndex = value
  }

  // ── Active ────────────────────────────────────────────────────────────────

  get active(): boolean {
    return this._active
  }

  /**
   * Toggling `active` also syncs `visible` so PixiJS stops rendering the node.
   * Fires `onEnable` / `onDisable` on all enabled components.
   */
  set active(value: boolean) {
    if (value === this._active) return
    this._active = value
    this.visible = value
    for (const comp of this._components) {
      if (comp.enabled) {
        if (value) comp.onEnable()
        else       comp.onDisable()
      }
    }
  }

  /**
   * `true` only when this object and every ancestor `GameObject` are active.
   */
  get activeInHierarchy(): boolean {
    if (!this._active) return false
    const p = this.parent
    return p instanceof GameObject ? p.activeInHierarchy : true
  }

  // ── Component API ─────────────────────────────────────────────────────────

  addComponent<T extends Component>(Ctor: new () => T): T {
    const comp = new Ctor()
    ;(comp as { gameObject: GameObject }).gameObject = this
    this._components.push(comp)
    if (this._awoken)  comp.awake()
    if (this._started) comp.start()
    return comp
  }

  getComponent<T extends Component>(Ctor: new () => T): T | null {
    return (this._components.find((c) => c instanceof Ctor) as T | undefined) ?? null
  }

  getComponents<T extends Component>(Ctor: new () => T): T[] {
    return this._components.filter((c) => c instanceof Ctor) as T[]
  }

  removeComponent(comp: Component): void {
    const i = this._components.indexOf(comp)
    if (i === -1) return
    comp.onDestroy()
    this._components.splice(i, 1)
  }

  // ── Child GameObjects ─────────────────────────────────────────────────────

  /**
   * Add a child `GameObject`. Fires `awake` / `start` if the parent is already
   * running. Use this (not plain `addChild`) for game-object hierarchies.
   */
  addGameObject(child: GameObject): this {
    this.addChild(child)
    if (this._awoken)  child.awake()
    if (this._started) child.start()
    return this
  }

  removeGameObject(child: GameObject): void {
    this.removeChild(child)
  }

  /** Filters `children` to only `GameObject` instances (excludes Sprites, Graphics, etc.). */
  get gameObjectChildren(): GameObject[] {
    return this.children.filter((c): c is GameObject => c instanceof GameObject)
  }

  /** Depth-first search for a descendant `GameObject` by name. */
  findByName(name: string): GameObject | null {
    for (const child of this.gameObjectChildren) {
      if (child.name === name) return child
      const found = child.findByName(name)
      if (found) return found
    }
    return null
  }

  /** Returns all descendants (including self) that carry the given tag. */
  findWithTag(tag: string): GameObject[] {
    const result: GameObject[] = []
    if (this.tags.has(tag)) result.push(this)
    for (const child of this.gameObjectChildren) {
      result.push(...child.findWithTag(tag))
    }
    return result
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag)
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  awake(): void {
    if (this._awoken) return
    this._awoken = true
    for (const comp of this._components) comp.awake()
    for (const child of this.gameObjectChildren) child.awake()
  }

  start(): void {
    if (!this._awoken) this.awake()
    if (this._started) return
    this._started = true
    for (const comp of this._components) comp.start()
    for (const child of this.gameObjectChildren) child.start()
  }

  update(dt: number): void {
    if (!this.activeInHierarchy || this._destroyed) return
    for (const comp of this._components) {
      if (comp.enabled) comp.update(dt)
    }
    for (const child of this.gameObjectChildren) child.update(dt)
  }

  fixedUpdate(dt: number): void {
    if (!this.activeInHierarchy || this._destroyed) return
    for (const comp of this._components) {
      if (comp.enabled) comp.fixedUpdate(dt)
    }
    for (const child of this.gameObjectChildren) child.fixedUpdate(dt)
  }

  lateUpdate(dt: number): void {
    if (!this.activeInHierarchy || this._destroyed) return
    for (const comp of this._components) {
      if (comp.enabled) comp.lateUpdate(dt)
    }
    for (const child of this.gameObjectChildren) child.lateUpdate(dt)
  }

  /**
   * Override PixiJS `destroy` to fire `onDestroy` on all components before
   * the PixiJS node is torn down. Passing `{ children: true }` also destroys
   * child GameObjects recursively via their own overridden `destroy`.
   */
  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    if (this._destroyed) return
    this._destroyed = true
    for (const comp of this._components) comp.onDestroy()
    this._components = []
    super.destroy(options)
  }
}
