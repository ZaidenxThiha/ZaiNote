import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

export function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function generateId() {
  return crypto.randomUUID()
}

export const NOTE_COLORS = [
  { label: 'Default', value: '#ffffff', darkValue: '#1c1917', class: 'note-default' },
  { label: 'Yellow', value: '#fef3c7', darkValue: '#451a03', class: 'note-yellow' },
  { label: 'Green', value: '#d1fae5', darkValue: '#064e3b', class: 'note-green' },
  { label: 'Blue', value: '#dbeafe', darkValue: '#1e3a8a', class: 'note-blue' },
  { label: 'Purple', value: '#e9d5ff', darkValue: '#4c1d95', class: 'note-purple' },
  { label: 'Pink', value: '#fce7f3', darkValue: '#831843', class: 'note-pink' },
  { label: 'Orange', value: '#fed7aa', darkValue: '#7c2d12', class: 'note-orange' },
  { label: 'Gray', value: '#e5e5e5', darkValue: '#292524', class: 'note-gray' },
]

export function getNoteColorStyle(color, isDark) {
  const found = NOTE_COLORS.find(c => c.value === color)
  if (!found || found.value === '#ffffff') return {}
  return { backgroundColor: isDark ? found.darkValue : found.value }
}
