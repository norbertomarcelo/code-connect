import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../atoms/Button'
import { Label } from '../../atoms/Label'
import { Textarea } from '../../atoms/Textarea'

interface CommentFormProps {
  /**
   * The field is cleared once this resolves. Reject (or throw) to keep what the
   * user typed, e.g. after a network failure.
   */
  onSubmit: (body: string) => void | Promise<void>
  isSubmitting?: boolean
  submitError?: string | null
  label?: string
  placeholder?: string
  submitLabel?: string
  autoFocus?: boolean
}

export function CommentForm({
  onSubmit,
  isSubmitting = false,
  submitError,
  label = 'Comentário',
  placeholder = 'Escreva um comentário',
  submitLabel = 'Comentar',
  autoFocus,
}: CommentFormProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!body.trim()) {
      setError('Escreva um comentário')
      return
    }
    setError(null)

    try {
      await onSubmit(body.trim())
      setBody('')
    } catch {
      // The caller already reported the failure; keep the text.
    }
  }

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor={inputId} className="sr-only">
          {label}
        </Label>
        <Textarea
          id={inputId}
          value={body}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setBody(event.target.value)}
        />
        {error ? (
          <p id={errorId} className="mt-1 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p role="alert" className="text-sm text-danger">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" size="sm" className="self-end" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : submitLabel}
      </Button>
    </form>
  )
}
