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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,  // data stays fresh for 2 minutes
      gcTime: 1000 * 60 * 10,     // keep in cache for 10 minutes
    },
  },
});

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
  </BrowserRouter>
)
