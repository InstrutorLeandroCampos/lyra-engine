# Lyra Engine

A browser-based 2D game engine editor built with React, TypeScript and PixiJS.

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

```bash
# Type-check without emitting
npx tsc --noEmit

# Production build
npm run build

# Preview the production build
npm run preview
```

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 + TypeScript |
| Bundler | Vite 8 |
| 2D renderer | PixiJS 8 |
| Routing | React Router 7 |
| Audio | Howler 2 |
| Icons | React Icons 5 |

---

## What Has Been Built

### Home Screen
- Project cards grid with name, description and metadata.
- **New Project** modal — name, description, authors, resolution presets (or custom), target FPS (30/60/120), background colour, and pixel-art mode toggle.
- **Open Project** — loads a `.json` project file from disk and navigates to the editor.

### Editor Layout
A three-column + bottom-bar layout:

```
┌──────────────────────────────────────────┐
│               Top Bar                    │
├──────────┬─────────────────┬─────────────┤
│ Hierarchy│    Viewport     │  Inspector  │
│  Panel   │   (PixiJS)      │   Panel     │
├──────────┴─────────────────┴─────────────┤
│  Assets / Scripts / Console (tabs)       │
└──────────────────────────────────────────┘
```

### Hierarchy Panel
- Lists all game objects in the active scene.
- Inline rename (click-to-edit).
- Object selection synced with inspector and viewport.
- Right-click context menu in the viewport to create new game objects.

### Viewport (PixiJS 8)
- Auto-fit scaling — the canvas scales to fill the panel while preserving the project's target resolution.
- Each game object is a **PixiJS Container** positioned by its `Transform`.
- **Gizmos** appear on the selected object:
  - **Move** — X axis (red), Y axis (green) arrows and a free-move white square.
  - **Rotate** — yellow arc with a drag handle.
  - **Scale** — red (X) and green (Y) squares at the arrow tips.
- Drag updates the PixiJS container directly every frame; the React store is updated only on pointer-up, keeping renders smooth.
- **SpriteRenderer** support — selecting a sprite asset in the Inspector updates the PixiJS container to display the image. Textures are loaded via `Image.onload` to handle base64 data URLs reliably in PixiJS v8.

### Inspector Panel
- **Transform** section — X/Y position, rotation (degrees), X/Y scale, Z-Order.
- Object **name** field with inline rename.
- **Active** toggle checkbox.
- **Components** section — lists attached components and renders a dedicated UI per type.
- **Add Component** button — filtered dropdown listing only component types not yet on the object.

#### SpriteRenderer Component
- Sprite dropdown — shows all imported image assets by name.
- Flip X / Flip Y checkboxes.
- Remove component button.

### Asset Panel
- Folder-based navigation with a breadcrumb path bar.
- **Create Folder** — dialog with Enter/Escape keyboard support.
- **Import Sprites** — opens a native file picker (`image/*`, multi-select). Images are read with `FileReader.readAsDataURL` and stored as base64 in the project JSON.
- Grid view with image thumbnails (checkerboard background for transparency) and file-type fallback icons.

### Data Model (`src/types/project.ts`)
```
Project
├── settings      (resolution, FPS, background colour, pixel-art flag)
├── scenes[]
│   └── Scene
│       └── gameObjects[]
│           └── GameObject
│               ├── transform   (x, y, rotation, scaleX, scaleY)
│               ├── components[] (SpriteRenderer, …)
│               ├── tags[]
│               └── children[]
├── assets[]      (id, name, type, base64 path, folder)
├── assetFolders[]
└── scripts[]
```

Global state is managed with React `useReducer` + `Context` (`ProjectContext`).

### Engine Runtime (`src/engine/`)
Standalone TypeScript classes for the game runtime (independent of the editor UI):

| File | Description |
|---|---|
| `Transform.ts` | Position, rotation, scale with `translate`, `rotate`, `scale`, `clone` helpers. |
| `Component.ts` | Abstract base class. Override `awake`, `start`, `update`, `fixedUpdate`, `lateUpdate`, `draw`, `onEnable`, `onDisable`, `onDestroy`. |
| `GameObject.ts` | Manages a component list and a child hierarchy. Cascades all lifecycle calls. Supports `addComponent<T>`, `getComponent<T>`, `removeComponent`, `addChild`, `find`, `findWithTag`, `destroy`. |

---

## Roadmap

### Editor
- [ ] Multi-scene management (create, rename, delete, switch scenes)
- [ ] Save / auto-save project to JSON file
- [ ] Undo / redo (command history)
- [ ] Copy, paste and duplicate game objects
- [ ] Drag-and-drop asset assignment (drop sprite onto object in viewport)
- [ ] Viewport grid and snap-to-grid
- [ ] Camera pan and zoom in viewport
- [ ] Prefab system (save and instantiate reusable objects)

### Components
- [ ] **Camera** — viewport position, zoom, background colour override
- [ ] **Animator** — frame-based sprite animation from sprite sheets
- [ ] **Tilemap** — grid-based tile rendering
- [ ] **RigidBody** — physics body integration
- [ ] **Collider** — box, circle and polygon shapes
- [ ] **AudioSource** — play / stop sounds via Howler
- [ ] **ParticleSystem** — built-in particle emitter
- [ ] **Script** — attach TypeScript/JavaScript files with a live code editor

### Engine Runtime
- [ ] `Scene` class — manages a root object list, calls awake/start/update/draw
- [ ] `Engine` class — main loop with fixed-update accumulator, delta time, FPS cap
- [ ] `Input` module — keyboard, mouse and gamepad state
- [ ] `Physics` module — AABB / circle collision detection and resolution
- [ ] `AssetLoader` — async loading of textures, audio and JSON at runtime
- [ ] `SceneManager` — load, unload and transition between scenes
- [ ] `EventEmitter` — typed pub/sub bus for game events

### Export
- [ ] Export project as a self-contained HTML + JS bundle
- [ ] Export as Electron desktop application
- [ ] Export project JSON for version control

---

## Project Structure

```
src/
├── components/
│   ├── assets/        AssetPanel (import, folder navigation)
│   ├── button/        Reusable Button
│   ├── card/          Home page Card
│   ├── context-menu/  Right-click ContextMenu
│   ├── hierarchy/     HierarchyPanel
│   ├── inspector/     InspectorPanel + component inspectors
│   ├── modal/         Modal base + NewProjectModal
│   ├── panel/         Reusable Panel wrapper
│   └── viewport/      Viewport (PixiJS renderer + gizmos)
├── context/
│   └── ProjectContext.tsx   Global state (useReducer + Context)
├── engine/
│   ├── Transform.ts
│   ├── Component.ts
│   └── GameObject.ts
├── hooks/
│   └── useOpenProject.ts    Open + validate project JSON from disk
├── pages/
│   ├── home/          Home screen
│   └── editor/        Editor layout
└── types/
    └── project.ts     All data-layer TypeScript interfaces
```
