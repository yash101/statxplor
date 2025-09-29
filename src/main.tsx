import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PopupProvider } from './components/Popup/PopupProvider'
import { SimulatorProvider } from './contexts/simulator.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SimulatorProvider>
      <PopupProvider>
        <App />
      </PopupProvider>
    </SimulatorProvider>
  </StrictMode>,
)
