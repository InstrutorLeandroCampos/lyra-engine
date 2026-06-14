import { useEffect, useMemo, useState } from 'react'
import { Scene, GameObject, Transform } from '../../types/project'
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

/* ── Object inspector (rendered only when an object is selected) ─────────────── */

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
      dispatch({
        type: 'RENAME_GAME_OBJECT',
        payload: { sceneId: scene.id, objectId: obj.id, name: trimmed },
      })
    } else {
      setLocalName(obj.name)
    }
  }

  function updateTransform(partial: Partial<Transform>) {
    dispatch({
      type: 'UPDATE_GAME_OBJECT_TRANSFORM',
      payload: { objectId: obj.id, transform: partial },
    })
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
            <NumberField label="X" value={obj.transform.x}  onChange={(v) => updateTransform({ x: v })} />
            <NumberField label="Y" value={obj.transform.y}  onChange={(v) => updateTransform({ y: v })} />
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
            <NumberField label="X" value={obj.transform.scaleX} onChange={(v) => updateTransform({ scaleX: v })} />
            <NumberField label="Y" value={obj.transform.scaleY} onChange={(v) => updateTransform({ scaleY: v })} />
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
        {obj.components.length === 0 ? (
          <p className={styles.noComponents}>No components added</p>
        ) : (
          obj.components.map((comp, i) => (
            <div key={i} className={styles.component}>
              <span className={styles.componentType}>{comp.type}</span>
            </div>
          ))
        )}
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
