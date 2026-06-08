import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { TeacherProvider } from './context/TeachersContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <TeacherProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TeacherProvider>
    </AuthProvider>
  </StrictMode>,
)
