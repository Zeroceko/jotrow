import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Editor from './pages/Editor'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/editor/:noteId" element={<Editor />} />
        <Route path="/:username" element={<Profile />} />
        <Route path="/:username/:courseCode" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
