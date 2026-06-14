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
}
