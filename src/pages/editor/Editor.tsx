import { useNavigate } from 'react-router'
import { VscHome, VscSave, VscPlay } from 'react-icons/vsc'
import { useProject } from '../../context/ProjectContext'
import Button from '../../components/button/Button'
import Panel from '../../components/panel/Panel'
import HierarchyPanel from '../../components/hierarchy/HierarchyPanel'
import InspectorPanel from '../../components/inspector/InspectorPanel'
import Viewport from '../../components/viewport/Viewport'
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
          <HierarchyPanel scenes={project.scenes} />
        </Panel>

        {/* Viewport */}
        <main className={styles.viewport}>
          <Viewport project={project} />
        </main>

        {/* Inspector panel */}
        <Panel title="Inspector" className={styles.panelRight}>
          <InspectorPanel />
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
