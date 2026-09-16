import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={[
        'w-full rounded-lg bg-input px-4 py-3 text-surface placeholder:text-surface/60 outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
