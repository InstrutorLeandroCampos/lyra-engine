import { createContext, useContext, useReducer, ReactNode } from 'react'
import { Project, Scene, GameObject, Component, Transform, Asset } from '../types/project'

interface ProjectState {
  project: Project | null
  isLoaded: boolean
  activeSceneId: string | null
  selectedObjectId: string | null
  error: string | null
}

type ProjectAction =
  | { type: 'LOAD_PROJECT'; payload: Project }
  | { type: 'CLOSE_PROJECT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_ACTIVE_SCENE'; payload: string }
  | { type: 'SELECT_GAME_OBJECT'; payload: string | null }
  | { type: 'ADD_GAME_OBJECT'; payload: GameObject }
  | { type: 'RENAME_GAME_OBJECT'; payload: { sceneId: string; objectId: string; name: string } }
  | { type: 'TOGGLE_GAME_OBJECT_ACTIVE'; payload: { objectId: string } }
  | { type: 'UPDATE_GAME_OBJECT_TRANSFORM'; payload: { objectId: string; transform: Partial<Transform> } }
  | { type: 'UPDATE_GAME_OBJECT_ZORDER'; payload: { objectId: string; zOrder: number } }
  | { type: 'ADD_COMPONENT'; payload: { objectId: string; component: Component } }
  | { type: 'REMOVE_COMPONENT'; payload: { objectId: string; componentIndex: number } }
  | { type: 'UPDATE_COMPONENT'; payload: { objectId: string; componentIndex: number; data: Partial<Component> } }
  | { type: 'IMPORT_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: { assetId: string } }
  | { type: 'CREATE_ASSET_FOLDER'; payload: { path: string } }

const initialState: ProjectState = {
  project: null,
  isLoaded: false,
  activeSceneId: null,
  selectedObjectId: null,
  error: null,
}

function updateObjectInScenes(
  scenes: Scene[],
  objectId: string,
  updater: (obj: GameObject) => GameObject,
): Scene[] {
  return scenes.map((scene) => ({
    ...scene,
    gameObjects: scene.gameObjects.map((obj) =>
      obj.id === objectId ? updater(obj) : obj
    ),
  }))
}

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'LOAD_PROJECT': {
      const p = action.payload
      return {
        project: {
          ...p,
          // migrate: ensure every asset has a folder field
          assets: p.assets.map((a) => ({ ...a, folder: a.folder ?? '/' })),
          assetFolders: p.assetFolders ?? [],
        },
        isLoaded: true,
        activeSceneId: p.scenes[0]?.id ?? null,
        selectedObjectId: null,
        error: null,
      }
    }

    case 'CLOSE_PROJECT':
      return initialState

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'SET_ACTIVE_SCENE':
      return { ...state, activeSceneId: action.payload }

    case 'SELECT_GAME_OBJECT':
      return { ...state, selectedObjectId: action.payload }

    case 'ADD_GAME_OBJECT': {
      if (!state.project) return state

      let scenes = state.project.scenes
      let activeSceneId = state.activeSceneId

      if (scenes.length === 0) {
        const defaultScene: Scene = {
          id: crypto.randomUUID(),
          name: 'Main Scene',
          gameObjects: [],
        }
        scenes = [defaultScene]
        activeSceneId = defaultScene.id
      }

      const targetId = activeSceneId ?? scenes[0].id

      return {
        ...state,
        activeSceneId: targetId,
        project: {
          ...state.project,
          scenes: scenes.map((scene) =>
            scene.id === targetId
              ? { ...scene, gameObjects: [...scene.gameObjects, action.payload] }
              : scene
          ),
        },
      }
    }

    case 'RENAME_GAME_OBJECT': {
      if (!state.project) return state
      const { sceneId, objectId, name } = action.payload
      return {
        ...state,
        project: {
          ...state.project,
          scenes: state.project.scenes.map((scene) =>
            scene.id === sceneId
              ? {
                  ...scene,
                  gameObjects: scene.gameObjects.map((obj) =>
                    obj.id === objectId ? { ...obj, name } : obj
                  ),
                }
              : scene
          ),
        },
      }
    }

    case 'TOGGLE_GAME_OBJECT_ACTIVE': {
      if (!state.project) return state
      return {
        ...state,
        project: {
          ...state.project,
          scenes: updateObjectInScenes(
            state.project.scenes,
            action.payload.objectId,
            (obj) => ({ ...obj, active: !obj.active }),
          ),
        },
      }
    }

    case 'UPDATE_GAME_OBJECT_TRANSFORM': {
      if (!state.project) return state
      return {
        ...state,
        project: {
          ...state.project,
          scenes: updateObjectInScenes(
            state.project.scenes,
            action.payload.objectId,
            (obj) => ({ ...obj, transform: { ...obj.transform, ...action.payload.transform } }),
          ),
        },
      }
    }

    case 'UPDATE_GAME_OBJECT_ZORDER': {
      if (!state.project) return state
      return {
        ...state,
        project: {
          ...state.project,
          scenes: updateObjectInScenes(
            state.project.scenes,
            action.payload.objectId,
            (obj) => ({ ...obj, zOrder: action.payload.zOrder }),
          ),
        },
      }
    }

    case 'ADD_COMPONENT': {
      if (!state.project) return state
      return {
        ...state,
        project: {
          ...state.project,
          scenes: updateObjectInScenes(
            state.project.scenes,
            action.payload.objectId,
            (obj) => ({ ...obj, components: [...obj.components, action.payload.component] }),
          ),
        },
      }
    }

    case 'REMOVE_COMPONENT': {
      if (!state.project) return state
      return {
        ...state,
        project: {
          ...state.project,
          scenes: updateObjectInScenes(
            state.project.scenes,
            action.payload.objectId,
            (obj) => ({
              ...obj,
              components: obj.components.filter((_, i) => i !== action.payload.componentIndex),
            }),
          ),
        },
      }
    }

    case 'UPDATE_COMPONENT': {
      if (!state.project) return state
      return {
        ...state,
        project: {
          ...state.project,
          scenes: updateObjectInScenes(
            state.project.scenes,
            action.payload.objectId,
            (obj) => ({
              ...obj,
              components: obj.components.map((c, i) =>
                i === action.payload.componentIndex ? { ...c, ...action.payload.data } : c,
              ),
            }),
          ),
        },
      }
    }

    case 'IMPORT_ASSET': {
      if (!state.project) return state
      return {
        ...state,
        project: { ...state.project, assets: [...state.project.assets, action.payload] },
      }
    }

    case 'DELETE_ASSET': {
      if (!state.project) return state
      return {
        ...state,
        project: {
          ...state.project,
          assets: state.project.assets.filter((a) => a.id !== action.payload.assetId),
        },
      }
    }

    case 'CREATE_ASSET_FOLDER': {
      if (!state.project) return state
      if (state.project.assetFolders.includes(action.payload.path)) return state
      return {
        ...state,
        project: {
          ...state.project,
          assetFolders: [...state.project.assetFolders, action.payload.path],
        },
      }
    }
  }
}

interface ProjectContextValue {
  state: ProjectState
  dispatch: React.Dispatch<ProjectAction>
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState)
  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider')
  return ctx
}
