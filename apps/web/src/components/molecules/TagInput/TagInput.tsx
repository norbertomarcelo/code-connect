import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Tag } from '../../atoms/Tag'
import { FormField } from '../FormField'

interface TagInputProps {
  label: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  error?: string
}

export function TagInput({
  label,
  value,
  onChange,
  placeholder,
  error,
}: TagInputProps) {
  const [draft, setDraft] = useState('')

  function commit() {
    const tag = draft.trim()
    setDraft('')
    if (!tag) return
    const exists = value.some((item) => item.toLowerCase() === tag.toLowerCase())
    if (!exists) onChange([...value, tag])
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      // Enter must not submit the surrounding form.
      event.preventDefault()
      commit()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <FormField
        label={label}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        error={error}
      />
      {value.length > 0 ? (
        <ul aria-label="Tags adicionadas" className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <li key={tag}>
              <Tag
                onRemove={() => onChange(value.filter((item) => item !== tag))}
              >
                {tag}
              </Tag>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
