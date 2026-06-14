import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { VscNewFile, VscFolderOpened } from 'react-icons/vsc'
import Button from '../../components/button/Button'
import Card from '../../components/card/Card'
import NewProjectModal from '../../components/modal/NewProjectModal'
import { useProject } from '../../context/ProjectContext'
import { useOpenProject } from '../../hooks/useOpenProject'
import { Project } from '../../types/project'
import styles from './Home.module.css'

const recentProjects = [
  {
    id: 1,
    title: 'Dungeon Crawler',
    description: 'Roguelike with procedural dungeons and real-time combat.',
    tags: ['RPG', 'Roguelike', 'Today'],
  },
  {
    id: 2,
    title: 'Space Shooter',
    description: "Shoot'em up with enemy waves and power-ups.",
    tags: ['Arcade', 'Shooter', 'Yesterday'],
  },
  {
    id: 3,
    title: '2D Platformer',
    description: 'Platformer game with physics and sprite animations.',
    tags: ['Platformer', '2D', '3 days ago'],
  },
]

const examples = [
  {
    id: 1,
    title: 'Hello PixiJS',
    description: 'Basic sprite rendering and transformations.',
    tags: ['PixiJS', 'Sprites'],
  },
  {
    id: 2,
    title: 'Audio with Howler',
    description: 'Play sounds, music and effects with volume control.',
    tags: ['Howler', 'Audio'],
  },
  {
    id: 3,
    title: 'Input & Controls',
    description: 'Keyboard, mouse and gamepad input capture.',
    tags: ['Input', 'Events'],
  },
]

const basics = [
  {
    id: 1,
    title: 'Creating a Scene',
    description: 'Learn how to structure scenes and transitions between them.',
    tags: ['Concept'],
  },
  {
    id: 2,
    title: 'Asset System',
    description: 'How to load images, sounds and tilemaps in Lyra.',
    tags: ['Assets'],
  },
  {
    id: 3,
    title: 'Game Loop',
    description: 'Understand the update/render cycle and how to use it.',
    tags: ['Engine'],
  },
]

function Home() {
  const { state, dispatch } = useProject()
  const { open, inputRef, handleFileChange } = useOpenProject()
  const navigate = useNavigate()
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)

  useEffect(() => {
    if (state.isLoaded) navigate('/editor')
  }, [state.isLoaded, navigate])

  function handleCreateProject(project: Project) {
    dispatch({ type: 'LOAD_PROJECT', payload: project })
    setIsNewProjectOpen(false)
  }

  return (
    <div className={styles.page}>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* New project modal */}
      <NewProjectModal
        open={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onConfirm={handleCreateProject}
      />

      {/* Error banner */}
      {state.error && (
        <div className={styles.errorBanner}>
          <span>{state.error}</span>
          <button className={styles.errorClose} onClick={() => dispatch({ type: 'CLEAR_ERROR' })}>✕</button>
        </div>
      )}

      {/* Logo */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoSymbol}>◈</span>
          <span className={styles.logoText}>Lyra Engine</span>
        </div>
        <p className={styles.tagline}>Create 2D Games with Power and Freedom</p>
      </header>

      {/* New project / Open project */}
      <section className={styles.actions}>
        <Button variant="primary" size="lg" leftIcon={<VscNewFile />} onClick={() => setIsNewProjectOpen(true)}>
          New Project
        </Button>
        <Button variant="secondary" size="lg" leftIcon={<VscFolderOpened />} onClick={open}>
          Open Project
        </Button>
      </section>

      {/* Recent projects */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Projects</h2>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className={styles.grid}>
          {recentProjects.map((project) => (
            <Card
              key={project.id}
              title={project.title}
              description={project.description}
              tags={project.tags}
              onClick={() => console.log('abrir', project.title)}
            />
          ))}
        </div>
      </section>

      {/* Example area */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className={styles.grid}>
          {examples.map((example) => (
            <Card
              key={example.id}
              title={example.title}
              description={example.description}
              tags={example.tags}
              onClick={() => console.log('abrir exemplo', example.title)}
            />
          ))}
        </div>
      </section>

      {/* Learn the basics */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Learn the Basics</h2>
          <Button variant="ghost" size="sm">View Documentation</Button>
        </div>
        <div className={styles.grid}>
          {basics.map((item) => (
            <Card
              key={item.id}
              title={item.title}
              description={item.description}
              tags={item.tags}
              onClick={() => console.log('abrir doc', item.title)}
            />
          ))}
        </div>
      </section>

    </div>
  )
}

export default Home
