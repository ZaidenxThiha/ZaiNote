import { NOTE_COLORS } from '@/lib/utils'
import { Check } from 'lucide-react'

export function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 p-1">
      {NOTE_COLORS.map(color => (
        <button
          key={color.value}
          onClick={() => onChange(color.value)}
          className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110"
          style={{
            backgroundColor: color.value,
            borderColor: value === color.value ? 'var(--accent)' : 'var(--border-strong)',
          }}
          title={color.label}
        >
          {value === color.value && <Check className="h-3 w-3" style={{ color: color.value === '#ffffff' ? '#000' : '#000' }} />}
        </button>
      ))}
    </div>
  )
}
