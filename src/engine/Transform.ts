import { Container } from 'pixi.js'

export class Transform {
  x        = 0
  y        = 0
  rotation = 0   // degrees
  scaleX   = 1
  scaleY   = 1

  get rotationRadians(): number {
    return (this.rotation * Math.PI) / 180
  }

  translate(dx: number, dy: number): this {
    this.x += dx
    this.y += dy
    return this
  }

  rotate(degrees: number): this {
    this.rotation = (this.rotation + degrees) % 360
    return this
  }

  scale(sx: number, sy = sx): this {
    this.scaleX *= sx
    this.scaleY *= sy
    return this
  }

  copyFrom(src: Transform): this {
    this.x        = src.x
    this.y        = src.y
    this.rotation = src.rotation
    this.scaleX   = src.scaleX
    this.scaleY   = src.scaleY
    return this
  }

  clone(): Transform {
    return new Transform().copyFrom(this)
  }

  /** Writes this transform's values into a PixiJS Container. */
  applyTo(container: Container): void {
    container.x        = this.x
    container.y        = this.y
    container.rotation = this.rotationRadians
    container.scale.set(this.scaleX, this.scaleY)
  }

  /** Reads a PixiJS Container's current transform into a new Transform instance. */
  static readFrom(container: Container): Transform {
    const t = new Transform()
    t.x        = container.x
    t.y        = container.y
    t.rotation = (container.rotation * 180) / Math.PI
    t.scaleX   = container.scale.x
    t.scaleY   = container.scale.y
    return t
  }
}
