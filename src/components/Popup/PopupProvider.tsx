import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { XIcon } from 'lucide-react'
import './Popup.css'

type Popup = { id: string; node: ReactNode }

type PopupContextType = {
  open: (node: ReactNode) => { id: string; close: () => void }
  close: (id: string) => void
}

const PopupContext = createContext<PopupContextType | null>(null)

export const PopupProvider = ({ children }: { children: ReactNode }) => {
  const [popups, setPopups] = useState<Popup[]>([])

  const close = useCallback((id: string) => {
    setPopups((p) => p.filter((x) => x.id !== id))
  }, [])

  const open = useCallback((node: ReactNode) => {
    const id = `popup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const popup: Popup = { id, node }
    setPopups((p) => [...p, popup])
    return { id, close: () => close(id) }
  }, [close])

  return (
    <PopupContext.Provider value={{
      open,
      close
    }}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className='popup-portal' aria-live="polite">
          {popups.map((p) => (
            <div className='popup-overlay transition-all' key={p.id} onClick={() => close(p.id)}>
              <button
                className="popup-close btn-primary p-2 z-10"
                aria-label="Close popup"
                onClick={() => close(p.id)}
              >
                <XIcon />
              </button>
              <div
                className='popup-content max-w-[90vw] max-h-[90vh] p-4'
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                <div className="popup-body p-4">{p.node}</div>
              </div>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </PopupContext.Provider>
  )
}

export const usePopupContext = () => {
  const ctx = useContext(PopupContext)
  if (!ctx)
    throw new Error('usePopupContext must be used within a PopupProvider')
  return ctx
}

export default PopupProvider
