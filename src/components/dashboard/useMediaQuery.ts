import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (aoMudar) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', aoMudar)
      return () => mq.removeEventListener('change', aoMudar)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
