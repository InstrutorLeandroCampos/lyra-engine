import { createContext, useContext, useReducer, ReactNode } from 'react'
import { Project } from '../types/project'

interface ProjectState {
  project: Project | null
  isLoaded: boolean
  error: string | null
}

type ProjectAction =
  | { type: 'LOAD_PROJECT'; payload: Project }
  | { type: 'CLOSE_PROJECT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_ERROR'; payload: string }

const initialState: ProjectState = {
  project: null,
  isLoaded: false,
  error: null,
}

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'LOAD_PROJECT':
      return { project: action.payload, isLoaded: true, error: null }
    case 'CLOSE_PROJECT':
      return initialState
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
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
