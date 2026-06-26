import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n.js'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import {PaymentProvider} from './context/PaymentContext.jsx'
import { EnrollmentProvider } from './context/EnrollmentContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import DirectionManager from './components/DirectionManager.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <DirectionManager>
    <ToastProvider>
      <AuthProvider>
        <EnrollmentProvider>
          <PaymentProvider>
            <App />
          </PaymentProvider>
        </EnrollmentProvider>
      </AuthProvider> 
    </ToastProvider>
  </DirectionManager>
  </BrowserRouter>
)
