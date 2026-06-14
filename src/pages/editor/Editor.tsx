import { useState } from 'react'
import { useNavigate } from 'react-router'
import { VscHome, VscSave, VscPlay } from 'react-icons/vsc'
import { useProject } from '../../context/ProjectContext'
import Button from '../../components/button/Button'
import Panel from '../../components/panel/Panel'
import HierarchyPanel from '../../components/hierarchy/HierarchyPanel'
import InspectorPanel from '../../components/inspector/InspectorPanel'
import Viewport from '../../components/viewport/Viewport'
import AssetPanel from '../../components/assets/AssetPanel'
import styles from './Editor.module.css'

type BottomTab = 'assets' | 'scripts' | 'console'

function Editor() {
  const { state, dispatch } = useProject()
  const navigate = useNavigate()
  const { project } = state
  const [activeTab, setActiveTab] = useState<BottomTab>('assets')

  function handleClose() {
    dispatch({ type: 'CLOSE_PROJECT' })
    navigate('/')
  }

  function handlePlay() {
    sessionStorage.setItem(
      'lyra-play-project',
      JSON.stringify({ project, activeSceneId: state.activeSceneId }),
    )
    window.open('/game', '_blank', 'noopener')
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
          <Button variant="primary" size="sm" leftIcon={<VscPlay />} onClick={handlePlay}>Play</Button>
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
          <HierarchyPanel />
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
          <button
            className={`${styles.tab} ${activeTab === 'assets' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            Assets ({project.assets.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'scripts' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('scripts')}
          >
            Scripts ({project.scripts.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'console' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('console')}
          >
            Console
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'assets' && <AssetPanel />}
          {activeTab === 'scripts' && (
            <span className={styles.empty}>Scripts panel coming soon</span>
          )}
          {activeTab === 'console' && (
            <span className={styles.empty}>Console coming soon</span>
          )}
        </div>
      </footer>

    </div>
  )
}

export default Editor
