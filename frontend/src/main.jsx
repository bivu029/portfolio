import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applyPageTitle, applyTheme, getStoredThemeMode, getStoredLightPalette, getStoredDarkPalette } from './theme'
import './index.css'

applyPageTitle()
applyTheme(getStoredThemeMode(), getStoredLightPalette(), getStoredDarkPalette())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
