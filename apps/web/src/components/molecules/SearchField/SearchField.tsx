import { useId } from 'react'
import { Icon } from '../../atoms/Icon'
import { Label } from '../../atoms/Label'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  id?: string
}

export function SearchField({
  value,
  onChange,
  label = 'Buscar publicações',
  placeholder = 'Digite o que você procura',
  id,
}: SearchFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div
      role="search"
      className="flex items-center gap-4 rounded bg-page px-4 py-2 text-muted"
    >
      <Icon name="search" size="lg" />
      <Label htmlFor={inputId} className="sr-only">
        {label}
      </Label>
      <input
        id={inputId}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-xl text-muted outline-none placeholder:text-muted focus-visible:underline"
      />
    </div>
  )
}
