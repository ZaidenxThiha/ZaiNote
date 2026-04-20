import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex h-9 items-center justify-center rounded-md p-1', className)}
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-sm transition-all duration-150',
        'data-[state=active]:shadow-sm disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      style={{ color: 'var(--text-secondary)' }}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn('mt-4', className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
