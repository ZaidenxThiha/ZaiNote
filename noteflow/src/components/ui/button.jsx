import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 text-sm font-medium rounded-md transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'text-white',
        secondary: 'border',
        ghost: '',
        danger: 'text-white',
        link: 'underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-7 px-2 text-xs',
        default: 'h-9 px-4',
        lg: 'h-11 px-6',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
)

const Button = forwardRef(({ className, variant = 'primary', size = 'default', style, ...props }, ref) => {
  const variantStyles = {
    primary: { backgroundColor: 'var(--accent)', color: 'white' },
    secondary: { borderColor: 'var(--border-strong)', color: 'var(--text-primary)' },
    ghost: { color: 'var(--text-secondary)' },
    danger: { backgroundColor: 'var(--danger)' },
    link: { color: 'var(--accent)' },
  }
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button }
