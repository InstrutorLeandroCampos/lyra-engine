export interface Transform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
}

export interface Component {
  type: string
  [key: string]: unknown
}

export interface GameObject {
  id: string
  name: string
  active: boolean
  zOrder: number
  transform: Transform
  components: Component[]
  children: GameObject[]
  tags: string[]
}

export interface Scene {
  id: string
  name: string
  gameObjects: GameObject[]
  backgroundColor?: string
}

export interface Asset {
  id: string
  name: string
  type: 'image' | 'audio' | 'tilemap' | 'font' | 'json' | 'other'
  path: string
  metadata?: Record<string, unknown>
}

export interface Script {
  id: string
  name: string
  language: 'typescript' | 'javascript'
  content: string
}

export interface ProjectSettings {
  resolution: { width: number; height: number }
  backgroundColor: string
  targetFps: number
  pixelArt: boolean
  gravity?: { x: number; y: number }
}

export interface Project {
  name: string
  description: string
  authors: string[]
  version: string
  engineVersion: string
  createdAt: string
  updatedAt: string
  scenes: Scene[]
  assets: Asset[]
  scripts: Script[]
  settings: ProjectSettings
}
