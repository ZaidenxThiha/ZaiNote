import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Input = forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn('input-base', className)}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
