import { useRef } from 'react'
import { useProject } from '../context/ProjectContext'
import { Project } from '../types/project'

function validateProject(data: unknown): data is Project {
  if (!data || typeof data !== 'object') return false
  const p = data as Record<string, unknown>
  return (
    typeof p.name === 'string' &&
    typeof p.version === 'string' &&
    Array.isArray(p.scenes) &&
    Array.isArray(p.assets) &&
    Array.isArray(p.scripts)
  )
}

export function useOpenProject() {
  const { dispatch } = useProject()
  const inputRef = useRef<HTMLInputElement>(null)

  function open() {
    inputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const raw: unknown = JSON.parse(event.target?.result as string)

        if (!validateProject(raw)) {
          dispatch({
            type: 'SET_ERROR',
            payload: `"${file.name}" is not a valid Lyra project file.`,
          })
          return
        }

        dispatch({ type: 'LOAD_PROJECT', payload: raw })
      } catch {
        dispatch({
          type: 'SET_ERROR',
          payload: `Failed to parse "${file.name}". Make sure it is a valid JSON file.`,
        })
      }
    }

    reader.onerror = () => {
      dispatch({
        type: 'SET_ERROR',
        payload: `Could not read "${file.name}".`,
      })
    }

    reader.readAsText(file)
    e.target.value = ''
  }

  return { open, inputRef, handleFileChange }
}
