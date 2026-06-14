import { useEffect, useMemo, useRef, useState } from 'react'
import { VscClose, VscAdd } from 'react-icons/vsc'
import { Scene, GameObject, Transform, Component } from '../../types/project'
import { useProject } from '../../context/ProjectContext'
import styles from './InspectorPanel.module.css'

/* ── Number field ────────────────────────────────────────────────────────────── */

interface NumberFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
}

function NumberField({ label, value, onChange }: NumberFieldProps) {
  const [local, setLocal] = useState(String(value))

  useEffect(() => { setLocal(String(value)) }, [value])

  function commit() {
    const parsed = parseFloat(local)
    if (!isNaN(parsed)) onChange(parsed)
    else setLocal(String(value))
  }

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        className={styles.fieldInput}
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
      />
    </div>
  )
}

/* ── SpriteRenderer inspector ───────────────────────────────────────────────── */

interface SpriteRendererProps {
  comp: Component
  index: number
  objectId: string
}

function SpriteRendererInspector({ comp, index, objectId }: SpriteRendererProps) {
  const { dispatch, state } = useProject()
  const imageAssets = (state.project?.assets ?? []).filter((a) => a.type === 'image')

  function update(data: Partial<Component>) {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { objectId, componentIndex: index, data } })
  }

  return (
    <div className={styles.component}>
      <div className={styles.componentHeader}>
        <span className={styles.componentType}>Sprite Renderer</span>
        <button
          className={styles.removeComp}
          onClick={() => dispatch({ type: 'REMOVE_COMPONENT', payload: { objectId, componentIndex: index } })}
          title="Remove component"
        >
          <VscClose />
        </button>
      </div>

      <div className={styles.componentBody}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Sprite</label>
          <select
            className={styles.fieldSelect}
            value={(comp.assetId as string) ?? ''}
            onChange={(e) => update({ assetId: e.target.value || null })}
          >
            <option value="">None</option>
            {imageAssets.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={!!(comp.flipX as boolean)}
              onChange={(e) => update({ flipX: e.target.checked })}
            />
            Flip X
          </label>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={!!(comp.flipY as boolean)}
              onChange={(e) => update({ flipY: e.target.checked })}
            />
            Flip Y
          </label>
        </div>
      </div>
    </div>
  )
}

/* ── Component renderer dispatcher ─────────────────────────────────────────── */

function ComponentInspector({ comp, index, objectId }: { comp: Component; index: number; objectId: string }) {
  if (comp.type === 'SpriteRenderer') {
    return <SpriteRendererInspector comp={comp} index={index} objectId={objectId} />
  }
  // Generic fallback for unknown component types
  return (
    <div className={styles.component}>
      <div className={styles.componentHeader}>
        <span className={styles.componentType}>{comp.type}</span>
      </div>
    </div>
  )
}

/* ── Add Component button ───────────────────────────────────────────────────── */

const AVAILABLE_COMPONENTS: { type: string; label: string }[] = [
  { type: 'SpriteRenderer', label: 'Sprite Renderer' },
]

interface AddComponentProps {
  objectId: string
  existing: Component[]
}

function AddComponentButton({ objectId, existing }: AddComponentProps) {
  const { dispatch } = useProject()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function add(type: string) {
    const defaults: Record<string, Component> = {
      SpriteRenderer: { type: 'SpriteRenderer', assetId: null, flipX: false, flipY: false },
    }
    dispatch({ type: 'ADD_COMPONENT', payload: { objectId, component: defaults[type] } })
    setOpen(false)
  }

  const available = AVAILABLE_COMPONENTS.filter(
    (c) => !existing.some((e) => e.type === c.type),
  )

  if (available.length === 0) return null

  return (
    <div className={styles.addCompWrap} ref={ref}>
      <button className={styles.addCompBtn} onClick={() => setOpen((v) => !v)}>
        <VscAdd />
        Add Component
      </button>
      {open && (
        <div className={styles.addCompMenu}>
          {available.map((c) => (
            <button key={c.type} className={styles.addCompItem} onClick={() => add(c.type)}>
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Object inspector ────────────────────────────────────────────────────────── */

interface ObjectInspectorProps {
  scene: Scene
  obj: GameObject
}

function ObjectInspector({ scene, obj }: ObjectInspectorProps) {
  const { dispatch } = useProject()
  const [localName, setLocalName] = useState(obj.name)

  useEffect(() => { setLocalName(obj.name) }, [obj.name])

  function commitName() {
    const trimmed = localName.trim()
    if (trimmed && trimmed !== obj.name) {
      dispatch({ type: 'RENAME_GAME_OBJECT', payload: { sceneId: scene.id, objectId: obj.id, name: trimmed } })
    } else {
      setLocalName(obj.name)
    }
  }

  function updateTransform(partial: Partial<Transform>) {
    dispatch({ type: 'UPDATE_GAME_OBJECT_TRANSFORM', payload: { objectId: obj.id, transform: partial } })
  }

  return (
    <div className={styles.inspector}>

      {/* Object header */}
      <div className={styles.objectHeader}>
        <label className={styles.activeToggle} title="Active">
          <input
            type="checkbox"
            checked={obj.active}
            onChange={() =>
              dispatch({ type: 'TOGGLE_GAME_OBJECT_ACTIVE', payload: { objectId: obj.id } })
            }
          />
        </label>
        <input
          className={styles.nameInput}
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') { setLocalName(obj.name); e.currentTarget.blur() }
          }}
          spellCheck={false}
        />
      </div>

      {/* Transform */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Transform</h3>

        <div className={styles.fieldGroup}>
          <span className={styles.fieldGroupLabel}>Position</span>
          <div className={styles.fieldRow}>
            <NumberField label="X" value={obj.transform.x}        onChange={(v) => updateTransform({ x: v })} />
            <NumberField label="Y" value={obj.transform.y}        onChange={(v) => updateTransform({ y: v })} />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.fieldGroupLabel}>Rotation</span>
          <div className={styles.fieldRow}>
            <NumberField label="°" value={obj.transform.rotation} onChange={(v) => updateTransform({ rotation: v })} />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.fieldGroupLabel}>Scale</span>
          <div className={styles.fieldRow}>
            <NumberField label="X" value={obj.transform.scaleX}   onChange={(v) => updateTransform({ scaleX: v })} />
            <NumberField label="Y" value={obj.transform.scaleY}   onChange={(v) => updateTransform({ scaleY: v })} />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.fieldGroupLabel}>Z-Order</span>
          <div className={styles.fieldRow}>
            <NumberField
              label="Z"
              value={obj.zOrder}
              onChange={(v) =>
                dispatch({ type: 'UPDATE_GAME_OBJECT_ZORDER', payload: { objectId: obj.id, zOrder: Math.round(v) } })
              }
            />
          </div>
        </div>
      </section>

      {/* Tags */}
      {obj.tags.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Tags</h3>
          <div className={styles.tags}>
            {obj.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </section>
      )}

      {/* Components */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Components</h3>
        {obj.components.map((comp, i) => (
          <ComponentInspector key={i} comp={comp} index={i} objectId={obj.id} />
        ))}
        <AddComponentButton objectId={obj.id} existing={obj.components} />
      </section>

    </div>
  )
}

/* ── Inspector panel ─────────────────────────────────────────────────────────── */

function InspectorPanel() {
  const { state } = useProject()
  const { selectedObjectId, project } = state

  const found = useMemo(() => {
    if (!project || !selectedObjectId) return null
    for (const scene of project.scenes) {
      const obj = scene.gameObjects.find((o) => o.id === selectedObjectId)
      if (obj) return { scene, obj }
    }
    return null
  }, [project, selectedObjectId])

  if (!found) {
    return <p className={styles.empty}>Select an object</p>
  }

  return <ObjectInspector scene={found.scene} obj={found.obj} />
}

export default InspectorPanel
