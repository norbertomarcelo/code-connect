type SortValue = 'recent' | 'popular'

interface SortTabsProps {
  value: SortValue
  onChange: (value: SortValue) => void
}

const options: { value: SortValue; label: string }[] = [
  { value: 'recent', label: 'Recentes' },
  { value: 'popular', label: 'Populares' },
]

/**
 * Not ARIA tabs: there are no distinct tab panels, only a different order of
 * the same list. A pressed-state button group says exactly that.
 */
export function SortTabs({ value, onChange }: SortTabsProps) {
  return (
    <div
      role="group"
      aria-label="Ordenar publicações"
      className="flex items-start justify-center gap-6"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={[
              'rounded px-1 text-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
              active ? 'font-semibold text-primary underline' : 'text-input',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
