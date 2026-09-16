import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Input } from '../../atoms/Input'
import { Label } from '../../atoms/Label'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}
