import type { TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={[
        'min-h-32 w-full resize-y rounded-lg bg-input px-4 py-3 text-surface placeholder:text-surface/60 outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
