import { FormEvent, useState } from 'react'
import Modal from './Modal'
import Button from '../button/Button'
import { Project } from '../../types/project'
import styles from './NewProjectModal.module.css'

const RESOLUTION_PRESETS = [
  { label: '1280 × 720 (HD)', width: 1280, height: 720 },
  { label: '1920 × 1080 (Full HD)', width: 1920, height: 1080 },
  { label: '2560 × 1440 (QHD)', width: 2560, height: 1440 },
  { label: '800 × 600', width: 800, height: 600 },
  { label: '480 × 270', width: 480, height: 270 },
]

interface NewProjectModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (project: Project) => void
}

function NewProjectModal({ open, onClose, onConfirm }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [authors, setAuthors] = useState('')
  const [presetIndex, setPresetIndex] = useState(0)
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const [fps, setFps] = useState<30 | 60 | 120>(60)
  const [bgColor, setBgColor] = useState('#000000')
  const [useCustomRes, setUseCustomRes] = useState(false)
  const [pixelArt, setPixelArt] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Project name is required.')
      return
    }

    let width: number
    let height: number

    if (useCustomRes) {
      width = parseInt(customWidth)
      height = parseInt(customHeight)
      if (!width || !height || width < 1 || height < 1) {
        setError('Enter a valid resolution.')
        return
      }
    } else {
      const preset = RESOLUTION_PRESETS[presetIndex]
      width = preset.width
      height = preset.height
    }

    const now = new Date().toISOString()

    const project: Project = {
      name: name.trim(),
      description: description.trim(),
      authors: authors.split(',').map((a) => a.trim()).filter(Boolean),
      version: '1.0.0',
      engineVersion: '0.1.0',
      createdAt: now,
      updatedAt: now,
      scenes: [],
      assets: [],
      assetFolders: [],
      scripts: [],
      settings: {
        resolution: { width, height },
        backgroundColor: bgColor,
        targetFps: fps,
        pixelArt,
      },
    }

    onConfirm(project)
  }

  return (
    <Modal open={open} onClose={onClose} title="New Project" width="500px">
      <form className={styles.form} onSubmit={handleSubmit}>

        {/* Project name */}
        <div className={styles.field}>
          <label className={styles.label}>Project Name</label>
          <input
            className={styles.input}
            type="text"
            placeholder="My Awesome Game"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className={styles.field}>
          <label className={styles.label}>Description <span className={styles.optional}>(optional)</span></label>
          <textarea
            className={styles.textarea}
            placeholder="A short description of your game…"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Authors */}
        <div className={styles.field}>
          <label className={styles.label}>Authors <span className={styles.optional}>(optional, comma-separated)</span></label>
          <input
            className={styles.input}
            type="text"
            placeholder="Alice, Bob"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
          />
        </div>

        {/* Resolution */}
        <div className={styles.field}>
          <label className={styles.label}>Resolution</label>
          <div className={styles.resRow}>
            <select
              className={styles.input}
              value={useCustomRes ? 'custom' : presetIndex}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setUseCustomRes(true)
                } else {
                  setUseCustomRes(false)
                  setPresetIndex(Number(e.target.value))
                }
              }}
            >
              {RESOLUTION_PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
              <option value="custom">Custom…</option>
            </select>
          </div>
          {useCustomRes && (
            <div className={styles.customRes}>
              <input
                className={styles.input}
                type="number"
                placeholder="Width"
                min={1}
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
              />
              <span className={styles.resSep}>×</span>
              <input
                className={styles.input}
                type="number"
                placeholder="Height"
                min={1}
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Target FPS */}
        <div className={styles.field}>
          <label className={styles.label}>Target FPS</label>
          <div className={styles.fpsGroup}>
            {([30, 60, 120] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={`${styles.fpsBtn} ${fps === v ? styles.fpsBtnActive : ''}`}
                onClick={() => setFps(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Background color */}
        <div className={styles.field}>
          <label className={styles.label}>Background Color</label>
          <div className={styles.colorRow}>
            <input
              type="color"
              className={styles.colorPicker}
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
            />
            <input
              className={styles.input}
              type="text"
              value={bgColor}
              maxLength={7}
              onChange={(e) => {
                const v = e.target.value
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBgColor(v)
              }}
            />
          </div>
        </div>

        {/* Pixel art */}
        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={pixelArt}
            onChange={(e) => setPixelArt(e.target.checked)}
          />
          <div className={styles.checkboxText}>
            <span className={styles.checkboxLabel}>Optimize for pixel art</span>
            <span className={styles.checkboxHint}>Disables texture smoothing in PixiJS (nearest-neighbor filtering)</span>
          </div>
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="md">Create Project</Button>
        </div>

      </form>
    </Modal>
  )
}

export default NewProjectModal
