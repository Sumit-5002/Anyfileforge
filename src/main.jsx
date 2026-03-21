import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { ModeProvider } from './contexts/ModeContext'
import { BrowserRouter as Router } from 'react-router-dom';
import './config/i18n';
import './styles/index.css'
import './pwa/registerSW'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ModeProvider>
        <Router>
          <App />
        </Router>
      </ModeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
