import { useRef, useState } from 'react'
import { VscFolder, VscFileMedia, VscNewFolder } from 'react-icons/vsc'
import { Asset } from '../../types/project'
import { useProject } from '../../context/ProjectContext'
import styles from './AssetPanel.module.css'

/* ── folder helpers ────────────────────────────────────────────────────────── */

function isDirectChildFolder(folder: string, parent: string): boolean {
  if (folder === parent || !folder.startsWith(parent)) return false
  const rest = folder.slice(parent.length) // e.g. 'sprites/' or 'sprites/player/'
  return rest.endsWith('/') && !rest.slice(0, -1).includes('/')
}

function buildPath(parent: string, name: string): string {
  return `${parent}${name}/`
}

/* ── component ─────────────────────────────────────────────────────────────── */

function AssetPanel() {
  const { state, dispatch } = useProject()
  const project = state.project!

  const [currentPath, setCurrentPath] = useState('/')
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── derived data ────────────────────────────────────────────────────────── */
  const subfolders = project.assetFolders.filter((f) => isDirectChildFolder(f, currentPath))
  const currentAssets = project.assets.filter((a) => a.folder === currentPath)

  // breadcrumb segments: '/' → []; '/sprites/ui/' → ['sprites', 'ui']
  const pathSegments = currentPath.split('/').filter(Boolean)

  /* ── handlers ────────────────────────────────────────────────────────────── */
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        dispatch({
          type: 'IMPORT_ASSET',
          payload: {
            id: crypto.randomUUID(),
            name: file.name,
            type: 'image',
            path: ev.target!.result as string,
            folder: currentPath,
          },
        })
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  function handleCreateFolder() {
    const name = newFolderName.trim().replace(/\//g, '')
    if (!name) return
    dispatch({ type: 'CREATE_ASSET_FOLDER', payload: { path: buildPath(currentPath, name) } })
    setNewFolderName('')
    setNewFolderOpen(false)
  }

  function handleDeleteSelected() {
    if (!selectedId) return
    dispatch({ type: 'DELETE_ASSET', payload: { assetId: selectedId } })
    setSelectedId(null)
  }

  function navigateTo(path: string) {
    setCurrentPath(path)
    setSelectedId(null)
  }

  /* ── breadcrumb ──────────────────────────────────────────────────────────── */
  function renderBreadcrumb() {
    return (
      <div className={styles.breadcrumb}>
        <button
          className={`${styles.crumb} ${currentPath === '/' ? styles.crumbActive : ''}`}
          onClick={() => navigateTo('/')}
        >
          Assets
        </button>
        {pathSegments.map((seg, i) => {
          const segPath = '/' + pathSegments.slice(0, i + 1).join('/') + '/'
          const isLast = i === pathSegments.length - 1
          return (
            <span key={segPath} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span className={styles.crumbSep}>/</span>
              <button
                className={`${styles.crumb} ${isLast ? styles.crumbActive : ''}`}
                onClick={() => !isLast && navigateTo(segPath)}
              >
                {seg}
              </button>
            </span>
          )
        })}
      </div>
    )
  }

  /* ── render ──────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.panel} style={{ position: 'relative' }}>
      {/* Header */}
      <div className={styles.header}>
        {renderBreadcrumb()}
        <div className={styles.actions}>
          {selectedId && (
            <button className={styles.actionBtn} onClick={handleDeleteSelected}>
              Delete
            </button>
          )}
          <button
            className={styles.actionBtn}
            onClick={() => setNewFolderOpen(true)}
            title="New Folder"
          >
            <VscNewFolder />
            Folder
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={() => fileInputRef.current?.click()}
            title="Import sprite images"
          >
            <VscFileMedia />
            Import Sprite
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {subfolders.length === 0 && currentAssets.length === 0 && (
          <p className={styles.empty}>
            {currentPath === '/' ? 'No assets yet — import sprites or create a folder' : 'Empty folder'}
          </p>
        )}

        {/* Folders */}
        {subfolders.map((folder) => {
          const name = folder.slice(currentPath.length, -1) // remove parent prefix and trailing slash
          return (
            <div
              key={folder}
              className={styles.item}
              onDoubleClick={() => navigateTo(folder)}
              onClick={() => setSelectedId(null)}
              title={`${name} (double-click to open)`}
            >
              <div className={`${styles.iconBox} ${styles.iconBoxFolder}`}>
                <VscFolder />
              </div>
              <span className={styles.itemName}>{name}</span>
            </div>
          )
        })}

        {/* Assets */}
        {currentAssets.map((asset) => (
          <AssetItem
            key={asset.id}
            asset={asset}
            selected={selectedId === asset.id}
            onClick={() => setSelectedId(asset.id)}
          />
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleImport}
      />

      {/* New folder mini-dialog */}
      {newFolderOpen && (
        <div className={styles.folderDialog}>
          <span className={styles.folderDialogTitle}>New Folder</span>
          <input
            className={styles.folderDialogInput}
            type="text"
            placeholder="folder-name"
            value={newFolderName}
            autoFocus
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') { setNewFolderOpen(false); setNewFolderName('') }
            }}
          />
          <div className={styles.folderDialogActions}>
            <button
              className={styles.actionBtn}
              onClick={() => { setNewFolderOpen(false); setNewFolderName('') }}
            >
              Cancel
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={handleCreateFolder}
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── AssetItem ──────────────────────────────────────────────────────────────── */

interface AssetItemProps {
  asset: Asset
  selected: boolean
  onClick: () => void
}

function AssetItem({ asset, selected, onClick }: AssetItemProps) {
  return (
    <div
      className={`${styles.item} ${selected ? styles.itemSelected : ''}`}
      onClick={onClick}
      title={asset.name}
    >
      {asset.type === 'image' ? (
        <img src={asset.path} alt={asset.name} className={styles.thumbnail} draggable={false} />
      ) : (
        <div className={styles.iconBox}>
          <VscFileMedia />
        </div>
      )}
      <span className={styles.itemName}>{asset.name}</span>
    </div>
  )
}

export default AssetPanel
