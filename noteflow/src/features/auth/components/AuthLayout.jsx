import { StickyNote } from 'lucide-react'

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Brand panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ backgroundColor: 'var(--accent)', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <StickyNote className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">ZaiNote</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white mb-4 text-balance">Capture every idea, wherever you are.</h1>
          <p className="text-white/70 text-lg">Offline-first notes with real-time collaboration.</p>
        </div>
        <p className="text-white/40 text-sm">© 2025 ZaiNote</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-6 py-12 sm:px-12">
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
            <StickyNote className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>ZaiNote</span>
        </div>
        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          {subtitle && <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
