import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AcademyProvider } from './context/AcademyContext.jsx'
import { TeacherProvider } from './context/TeachersContext.jsx'
import { GradeProvider } from './context/gradecontext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AcademyProvider>
          <TeacherProvider>
            <GradeProvider>
              <App />
            </GradeProvider>
          </TeacherProvider>
        </AcademyProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
