import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext'
import './config/i18n';
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
