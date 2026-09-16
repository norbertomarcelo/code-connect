import type { LabelHTMLAttributes } from 'react'

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={['mb-2 block text-sm font-medium', className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </label>
  )
}
