import { BrowserRouter, Routes, Route } from 'react-router'
import { ProjectProvider } from './context/ProjectContext'
import Home from './pages/home/Home'
import Editor from './pages/editor/Editor'
import GameRunner from './pages/game/GameRunner'

function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/game" element={<GameRunner />} />
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  )
}

export default App
