import { createContext, useContext, useReducer, ReactNode } from 'react'
import { Project, Scene, GameObject, Transform } from '../types/project'

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
    case 'LOAD_PROJECT':
      return {
        project: action.payload,
        isLoaded: true,
        activeSceneId: action.payload.scenes[0]?.id ?? null,
        selectedObjectId: null,
        error: null,
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
