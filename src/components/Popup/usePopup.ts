import { useCallback } from 'react'
import { usePopupContext } from './PopupProvider'

export const usePopup = () => {
  const { open, close } = usePopupContext()

  const show = useCallback(
    (node: React.ReactNode) => {
      const { id, close: closeFn } = open(node)
      return { id, close: () => closeFn() }
    },
    [open],
  )

  return { show, close }
}

export default usePopup
