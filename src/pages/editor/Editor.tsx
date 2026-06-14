import { useNavigate } from 'react-router'
import { VscHome, VscSave, VscPlay } from 'react-icons/vsc'
import { useProject } from '../../context/ProjectContext'
import Button from '../../components/button/Button'
import Panel from '../../components/panel/Panel'
import styles from './Editor.module.css'

function Editor() {
  const { state, dispatch } = useProject()
  const navigate = useNavigate()
  const { project } = state

  function handleClose() {
    dispatch({ type: 'CLOSE_PROJECT' })
    navigate('/')
  }

  if (!project) {
    navigate('/')
    return null
  }

  return (
    <div className={styles.layout}>

      {/* Top bar */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.logoBtn} onClick={handleClose} title="Back to Home">
            <span className={styles.logoSymbol}>◈</span>
          </button>
          <span className={styles.projectName}>{project.name}</span>
          <span className={styles.projectVersion}>v{project.version}</span>
        </div>

        <div className={styles.topbarCenter}>
          <Button variant="ghost" size="sm" leftIcon={<VscPlay />}>Play</Button>
        </div>

        <div className={styles.topbarRight}>
          <Button variant="ghost" size="sm" leftIcon={<VscSave />}>Save</Button>
          <Button variant="ghost" size="sm" leftIcon={<VscHome />} onClick={handleClose}>Home</Button>
        </div>
      </header>

      {/* Main area */}
      <div className={styles.workspace}>

        {/* Hierarchy panel */}
        <Panel title="Hierarchy" className={styles.panelLeft}>
          {project.scenes.length === 0 ? (
            <p className={styles.empty}>No objects</p>
          ) : (
            <ul className={styles.list}>
              {project.scenes.map((scene) => (
                <li key={scene.id} className={styles.listItem}>
                  <span className={styles.sceneIcon}>◎</span>
                  {scene.name}
                  {scene.gameObjects.length > 0 && (
                    <ul className={styles.subList}>
                      {scene.gameObjects.map((obj) => (
                        <li key={obj.id} className={styles.listItem}>
                          <span className={styles.objIcon}>▸</span>
                          {obj.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Viewport */}
        <main className={styles.viewport}>
          <div className={styles.viewportPlaceholder}>
            <span className={styles.viewportIcon}>◈</span>
            <p>Viewport</p>
            <p className={styles.viewportSub}>
              {project.settings.resolution.width} × {project.settings.resolution.height} · {project.settings.targetFps} fps
            </p>
          </div>
        </main>

        {/* Inspector panel */}
        <Panel title="Inspector" className={styles.panelRight}>
          <p className={styles.empty}>Select an object</p>
        </Panel>

      </div>

      {/* Bottom bar */}
      <footer className={styles.bottombar}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${styles.tabActive}`}>Assets ({project.assets.length})</button>
          <button className={styles.tab}>Scripts ({project.scripts.length})</button>
          <button className={styles.tab}>Console</button>
        </div>
        <div className={styles.assetList}>
          {project.assets.length === 0 ? (
            <span className={styles.empty}>No assets</span>
          ) : (
            project.assets.map((asset) => (
              <span key={asset.id} className={styles.assetChip}>
                {asset.name}
                <em className={styles.assetType}>{asset.type}</em>
              </span>
            ))
          )}
        </div>
      </footer>

    </div>
  )
}

export default Editor
