# 🎨 Design System

Target: **polished, distinctive, not generic "ChatGPT-default"**. Think Linear / Notion / Things 3 level of polish.

## Design Principles

1. **Content first** — chrome fades, notes shine
2. **Responsive fluidity** — every layout reflows gracefully 320px → 2560px
3. **Motion with purpose** — transitions guide attention, never decorate
4. **Dark mode = first-class** — not an afterthought tint
5. **Accessibility by default** — WCAG 2.1 AA minimum

## Color Palette

### Light Theme
```css
--bg-primary: #fafaf9;        /* warm off-white, not stark */
--bg-secondary: #ffffff;      /* cards, elevated */
--bg-tertiary: #f4f4f3;       /* subtle sections */
--border: #e7e5e4;
--border-strong: #d6d3d1;
--text-primary: #1c1917;      /* near-black, warm */
--text-secondary: #57534e;
--text-muted: #a8a29e;
--accent: #6366f1;            /* indigo — primary actions */
--accent-hover: #4f46e5;
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;
```

### Dark Theme
```css
--bg-primary: #0c0a09;        /* deep, slightly warm */
--bg-secondary: #1c1917;      /* cards */
--bg-tertiary: #292524;       /* elevated */
--border: #292524;
--border-strong: #44403c;
--text-primary: #fafaf9;
--text-secondary: #d6d3d1;
--text-muted: #78716c;
--accent: #818cf8;            /* lighter indigo for dark bg */
--accent-hover: #a5b4fc;
```

### Note Colors (pastel, muted)
```css
--note-default: #ffffff / #1c1917
--note-yellow: #fef3c7 / #451a03
--note-green:  #d1fae5 / #064e3b
--note-blue:   #dbeafe / #1e3a8a
--note-purple: #e9d5ff / #4c1d95
--note-pink:   #fce7f3 / #831843
--note-orange: #fed7aa / #7c2d12
--note-gray:   #e5e5e5 / #292524
```

## Typography

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-serif: 'Fraunces', 'Georgia', serif;  /* optional for note content */
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;

/* Scale (perfect fourth, 1.333) */
--text-xs: 0.75rem;    /* 12 */
--text-sm: 0.875rem;   /* 14 */
--text-base: 1rem;     /* 16 */
--text-lg: 1.125rem;   /* 18 */
--text-xl: 1.333rem;   /* ~21 */
--text-2xl: 1.777rem;  /* ~28 */
--text-3xl: 2.369rem;  /* ~38 */

/* Font size preference (user setting) multipliers */
--user-size-small:  0.875;
--user-size-medium: 1;
--user-size-large:  1.125;
```

## Spacing & Layout

- Grid gap: 16px mobile, 20px tablet, 24px desktop
- Sidebar: 240px desktop (collapsible), drawer on mobile
- Note card max-width in grid: 280-320px
- Editor max-width: 760px (optimal reading width)
- Border radius: 8px (cards), 12px (dialogs), 6px (inputs), 999px (pills/buttons-sm)

## Key Screens

### 1. Login / Register
- Split layout desktop: branded left panel + form right
- Stacked mobile
- Subtle animated gradient or pattern in brand panel (not overdone)
- Input focus: border animates to accent color + subtle glow
- Inline validation (check email format as user types)

### 2. Main Dashboard (Notes List)
- **Top bar**: logo/menu, live search (center), view toggle + new-note button (right), avatar menu
- **Sidebar**: All Notes, Pinned, Shared with me, Labels (expandable list), Settings
- **Unverified banner**: warm amber strip at top, dismissable-but-persistent, "Verify your email → Resend link"
- **Notes grid**: masonry-like (varying heights), each card shows:
  - Title (truncated if long)
  - Content preview (2-3 lines)
  - First image thumbnail if attached
  - Label chips (up to 2 + "+N" overflow)
  - Status icons top-right: 🔒 pin, 🔐 locked, 👥 shared
  - Color bar on left edge or full bg
  - Hover: subtle lift + actions reveal (pin, label, share, delete)
- **Empty state**: friendly illustration + "Create your first note"

### 3. Note Editor
- **Minimal chrome**: title as large editable heading, content below
- **Toolbar** (TipTap): appears on selection (floating) or top (sticky)
  - Bold, italic, underline, strike
  - Heading levels, list, quote, code
  - Insert image, link
- **Right panel** (desktop) / drawer (mobile):
  - Labels (chip picker)
  - Color picker (swatches)
  - Share (opens dialog)
  - Password lock (opens dialog)
  - Pin toggle
  - Delete
- **Bottom status bar**: "Saving..." → "Saved" with timestamp; collaborators (avatars) if shared
- **Auto-save indicator**: subtle, top-right corner

### 4. Share Dialog
- Email input with avatar+name autocomplete (matches registered users as you type)
- Permission selector: toggle between "Can view" / "Can edit" with icons
- Currently shared list below: avatar, name, permission dropdown, remove button
- "Send invite" button

### 5. Password Lock Dialog
Three modes based on note state:
- **Enable**: "Enter password" + "Confirm password" → two inputs, match validation, strength meter
- **Unlock**: single password input to access locked note
- **Change**: "Current password" + "New password" + "Confirm new password"
- **Disable**: "Enter current password to disable protection"

### 6. Settings Page
Tabs: Profile · Preferences · Security
- Profile: avatar upload with crop, display name, email (read-only)
- Preferences: theme (radio with previews), font size (slider), default note color, default view
- Security: change password, active sessions (optional)

## Component Patterns

### Note Card
```
┌──────────────────────────────────┐
│  ● yellow              🔒 🔐 👥  │  ← color dot + status icons
│                                  │
│  Meeting Notes                   │  ← title (font-semibold)
│  Discussed Q4 roadmap and        │  ← content preview
│  prioritization framework...     │
│                                  │
│  [image-thumb]                   │  ← if attached
│                                  │
│  🏷 work  🏷 meetings  +2        │  ← label chips
│                                  │
│  Updated 2h ago                  │  ← metadata
└──────────────────────────────────┘
```

### Button Hierarchy
- **Primary**: solid accent bg, white text (key actions)
- **Secondary**: border, transparent bg
- **Ghost**: no border, hover bg (tertiary actions)
- **Danger**: red variants for destructive
- All: 36px default, 28px sm, 44px lg, rounded-md

### Dialogs
- Backdrop: semi-transparent bg with subtle blur (backdrop-filter)
- Entry animation: scale 0.95 → 1 + fade in, 200ms ease-out
- Close: Esc key, backdrop click, X button
- Focus trap while open, return focus on close

### Toasts
- Position: top-right desktop, bottom mobile
- Types: success (green), error (red), info (blue), loading (gray)
- Auto-dismiss: 4s (success), 6s (error), never (loading)
- Stack vertically, max 3 visible

## Micro-Interactions

- Note card hover: `translate-y-[-2px]` + shadow bump, 150ms
- Pin action: icon wiggles + moves note to top with layout animation
- Delete: fade + collapse height, then remove
- Loading states: skeleton screens (not spinners) for content
- Search typing: results fade-in from ~30% to 100% opacity as query stabilizes
- Color change: smooth bg transition on note card
- Theme toggle: all colors transition 200ms together (not staggered)

## Motion

Use **Framer Motion** for:
- Layout animations when notes reorder (pin/unpin)
- Dialog enter/exit
- Tab underline slide

Prefer CSS transitions for:
- Hover states
- Simple property changes

Ease functions:
- Entry: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo, snappy)
- Exit: `cubic-bezier(0.7, 0, 0.84, 0)` (ease-in-expo)
- Default: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)

## Responsive Breakpoints

```css
sm: 640px   /* large phones */
md: 768px   /* tablets portrait */
lg: 1024px  /* tablets landscape, small laptops */
xl: 1280px  /* desktops */
2xl: 1536px /* large desktops */
```

### Layout Adaptation

| Element | Mobile (< 768) | Tablet (768-1024) | Desktop (> 1024) |
|---------|---------------|---------------------|-----------------|
| Sidebar | Drawer (hidden) | Drawer (hidden) | Fixed 240px |
| Notes grid | 1 col | 2 cols | 3-4 cols |
| Editor panel | Bottom sheet | Right drawer | Right sidebar |
| Search bar | Icon → expands | Partial width | Full center |
| New note | FAB (bottom-right) | Header button | Header button |

## Accessibility

- All interactive elements: min 44×44px tap targets on mobile
- Focus rings: 2px accent outline, 2px offset
- Skip link: "Skip to notes" at top (visible on focus)
- ARIA labels on icon-only buttons
- Live regions for "Saving..." indicator (`aria-live="polite"`)
- Keyboard shortcuts:
  - `⌘/Ctrl + K`: search
  - `⌘/Ctrl + N`: new note
  - `⌘/Ctrl + B/I/U`: formatting in editor
  - `Esc`: close dialog / blur search
- Color contrast: 4.5:1 minimum for text, 3:1 for UI

## Anti-Patterns to Avoid

❌ Generic purple/blue gradients everywhere  
❌ Rounded-2xl on everything (overused)  
❌ Emoji in every label  
❌ "Glassmorphism" (trendy, dated quickly)  
❌ Forced modals for simple actions  
❌ Hidden functionality behind hamburger on desktop  
❌ Tiny touch targets on mobile  
❌ Bounce animations on app-level elements  
❌ Icons without labels (except universal ones like X)
