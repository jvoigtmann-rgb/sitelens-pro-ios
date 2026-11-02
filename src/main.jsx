
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { installNativeBridge } from './native/revenuecatBridge.js'
import '@/index.css'

function showError(message) {
  const display = () => {
    let panel = document.getElementById('startup-error')
    if (!panel) {
      panel = document.createElement('pre')
      panel.id = 'startup-error'
      panel.style.cssText =
        'position:fixed;inset:0;z-index:999999;background:white;color:red;padding:20px;overflow:auto;white-space:pre-wrap;font:14px monospace;'
      document.body.appendChild(panel)
    }
    panel.textContent += message + '\n\n'
  }
  if (document.body) display()
  else document.addEventListener('DOMContentLoaded', display, { once: true })
}

window.addEventListener('error', (event) => {
  showError('JavaScript error:\n' + event.message + '\n\n' + (event.error?.stack || 'No stack available'))
})

window.addEventListener('unhandledrejection', (event) => {
  showError('Promise error:\n' + (event.reason?.stack || String(event.reason)))
})

try {
  installNativeBridge()
  ReactDOM.createRoot(document.getElementById('root')).render(<App />)
} catch (error) {
  showError('Startup error:\n' + (error.stack || String(error)))
}
