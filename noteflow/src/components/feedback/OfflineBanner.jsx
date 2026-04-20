import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-white" style={{ backgroundColor: '#f59e0b' }}>
      <WifiOff className="h-4 w-4" />
      You're offline — changes will sync when reconnected
    </div>
  )
}
