import { useEffect, useRef, useState } from 'react'
import { VscAdd, VscChevronDown, VscClose, VscEdit } from 'react-icons/vsc'
import { Scene } from '../../types/project'
import { useProject } from '../../context/ProjectContext'
import styles from './HierarchyPanel.module.css'

// ── Scene selector ────────────────────────────────────────────────────────────

interface SceneSelectorProps {
  scenes: Scene[]
  activeSceneId: string | null
}

function SceneSelector({ scenes, activeSceneId }: SceneSelectorProps) {
  const { dispatch } = useProject()
  const [open, setOpen]             = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const wrapRef   = useRef<HTMLDivElement>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  // close dropdown on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setRenamingId(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // focus rename input when it appears
  useEffect(() => {
    if (renamingId) renameRef.current?.select()
  }, [renamingId])

  const active = scenes.find((s) => s.id === activeSceneId) ?? scenes[0]

  function addScene() {
    const scene: Scene = {
      id: crypto.randomUUID(),
      name: `Scene ${scenes.length + 1}`,
      gameObjects: [],
    }
    dispatch({ type: 'ADD_SCENE', payload: scene })
    setOpen(false)
  }

  function startRename(scene: Scene) {
    setRenamingId(scene.id)
    setRenameValue(scene.name)
  }

  function commitRename() {
    if (!renamingId) return
    const trimmed = renameValue.trim()
    if (trimmed) dispatch({ type: 'RENAME_SCENE', payload: { sceneId: renamingId, name: trimmed } })
    setRenamingId(null)
  }

  function deleteScene(sceneId: string) {
    if (scenes.length <= 1) return   // keep at least one scene
    dispatch({ type: 'DELETE_SCENE', payload: { sceneId } })
  }

  return (
    <div className={styles.sceneSelectorWrap} ref={wrapRef}>
      <div className={styles.sceneBar}>
        <button
          className={styles.sceneNameBtn}
          onClick={() => setOpen((v) => !v)}
          title="Switch scene"
        >
          <span className={styles.sceneIcon}>◎</span>
          <span className={styles.sceneLabel}>{active?.name ?? 'No scene'}</span>
          <VscChevronDown className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
        </button>
        <button className={styles.addSceneBtn} onClick={addScene} title="New scene">
          <VscAdd />
        </button>
      </div>

      {open && (
        <div className={styles.sceneDropdown}>
          {scenes.map((scene) => {
            const isActive   = scene.id === activeSceneId
            const isRenaming = renamingId === scene.id

            return (
              <div
                key={scene.id}
                className={`${styles.sceneItem} ${isActive ? styles.sceneItemActive : ''}`}
              >
                {isRenaming ? (
                  <input
                    ref={renameRef}
                    className={styles.sceneRenameInput}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                  />
                ) : (
                  <button
                    className={styles.sceneItemName}
                    onClick={() => {
                      dispatch({ type: 'SET_ACTIVE_SCENE', payload: scene.id })
                      setOpen(false)
                    }}
                  >
                    {scene.name}
                  </button>
                )}

                <div className={styles.sceneActions}>
                  <button
                    className={styles.sceneActionBtn}
                    onClick={(e) => { e.stopPropagation(); startRename(scene) }}
                    title="Rename scene"
                  >
                    <VscEdit />
                  </button>
                  <button
                    className={`${styles.sceneActionBtn} ${styles.sceneDeleteBtn}`}
                    onClick={(e) => { e.stopPropagation(); deleteScene(scene.id) }}
                    title="Delete scene"
                    disabled={scenes.length <= 1}
                  >
                    <VscClose />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Object list ───────────────────────────────────────────────────────────────

interface EditingState {
  sceneId: string
  objectId: string
  value: string
}

function HierarchyPanel() {
  const { dispatch, state } = useProject()
  const { project, activeSceneId, selectedObjectId } = state
  const [editing, setEditing] = useState<EditingState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing?.objectId])

  if (!project) return null

  const activeScene =
    project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0] ?? null

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

  return (
    <div className={styles.panel}>
      <SceneSelector scenes={project.scenes} activeSceneId={activeSceneId} />

      {!activeScene ? (
        <p className={styles.empty}>No scenes. Create one above.</p>
      ) : activeScene.gameObjects.length === 0 ? (
        <p className={styles.empty}>Right-click the viewport to add objects</p>
      ) : (
        <ul className={styles.list}>
          {activeScene.gameObjects.map((obj) => {
            const isEditing  = editing?.objectId === obj.id
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
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    onBlur={confirmRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename()
                      if (e.key === 'Escape') setEditing(null)
                    }}
                  />
                ) : (
                  <span
                    className={styles.objName}
                    onDoubleClick={() =>
                      setEditing({ sceneId: activeScene.id, objectId: obj.id, value: obj.name })
                    }
                    title="Double-click to rename"
                  >
                    {obj.name}
                  </span>
                )}

                {!obj.active && <span className={styles.inactiveBadge}>off</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default HierarchyPanel
