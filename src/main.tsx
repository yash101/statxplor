import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PopupProvider } from './components/Popup/PopupProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupProvider>
      <App />
    </PopupProvider>
  </StrictMode>,
)
