export function PasswordStrengthMeter({ password }) {
  if (!password) return null
  const strength = getStrength(password)
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#10b981']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className="mt-1">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= strength ? colors[strength] : 'var(--border-strong)' }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[strength] }}>{labels[strength]}</p>
    </div>
  )
}

function getStrength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s - 1, 3)
}
