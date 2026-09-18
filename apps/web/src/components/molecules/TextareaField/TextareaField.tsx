import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { Label } from '../../atoms/Label'
import { Textarea } from '../../atoms/Textarea'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextareaField({
  label,
  error,
  id,
  ...textareaProps
}: TextareaFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <Textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...textareaProps}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
