import { useEffect } from 'react'

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      const meta = e.metaKey || e.ctrlKey
      for (const [combo, fn] of Object.entries(shortcuts)) {
        const parts = combo.toLowerCase().split('+')
        const key = parts[parts.length - 1]
        const needsMeta = parts.includes('cmd') || parts.includes('ctrl')
        const needsShift = parts.includes('shift')
        if (
          e.key.toLowerCase() === key &&
          (!needsMeta || meta) &&
          (!needsShift || e.shiftKey)
        ) {
          e.preventDefault()
          fn(e)
          break
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}
