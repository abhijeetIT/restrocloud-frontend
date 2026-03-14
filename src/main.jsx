import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#1a1a2e',
              border: '1px solid #e2e6f0',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(29,53,87,.12)',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#2dc653', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#e63946', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
