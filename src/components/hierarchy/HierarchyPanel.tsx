import { useEffect, useRef, useState } from 'react'
import { Scene } from '../../types/project'
import { useProject } from '../../context/ProjectContext'
import styles from './HierarchyPanel.module.css'

interface HierarchyPanelProps {
  scenes: Scene[]
}

interface EditingState {
  sceneId: string
  objectId: string
  value: string
}

function HierarchyPanel({ scenes }: HierarchyPanelProps) {
  const { dispatch, state } = useProject()
  const { selectedObjectId } = state
  const [editing, setEditing] = useState<EditingState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing?.objectId])

  function startEditing(sceneId: string, objectId: string, currentName: string) {
    setEditing({ sceneId, objectId, value: currentName })
  }

  function confirmRename() {
    if (!editing) return
    const trimmed = editing.value.trim()
    if (trimmed) {
      dispatch({
        type: 'RENAME_GAME_OBJECT',
        payload: { sceneId: editing.sceneId, objectId: editing.objectId, name: trimmed },
      })
    }
    setEditing(null)
  }

  function cancelEditing() {
    setEditing(null)
  }

  if (scenes.length === 0) {
    return <p className={styles.empty}>No objects</p>
  }

  return (
    <ul className={styles.list}>
      {scenes.map((scene) => (
        <li key={scene.id}>
          <div className={styles.sceneRow}>
            <span className={styles.sceneIcon}>◎</span>
            <span className={styles.sceneName}>{scene.name}</span>
          </div>

          {scene.gameObjects.length > 0 && (
            <ul className={styles.subList}>
              {scene.gameObjects.map((obj) => {
                const isEditing = editing?.objectId === obj.id
                const isSelected = selectedObjectId === obj.id

                return (
                  <li
                    key={obj.id}
                    className={`${styles.objRow} ${isSelected ? styles.objRowSelected : ''}`}
                    onClick={() => dispatch({ type: 'SELECT_GAME_OBJECT', payload: obj.id })}
                  >
                    <span className={styles.objIcon}>▸</span>

                    {isEditing ? (
                      <input
                        ref={inputRef}
                        className={styles.renameInput}
                        value={editing.value}
                        onChange={(e) =>
                          setEditing({ ...editing, value: e.target.value })
                        }
                        onBlur={confirmRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename()
                          if (e.key === 'Escape') cancelEditing()
                        }}
                      />
                    ) : (
                      <span
                        className={styles.objName}
                        onDoubleClick={() => startEditing(scene.id, obj.id, obj.name)}
                        title="Double-click to rename"
                      >
                        {obj.name}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

export default HierarchyPanel
