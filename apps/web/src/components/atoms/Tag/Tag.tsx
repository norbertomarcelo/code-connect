import type { ReactNode } from 'react'
import { Icon } from '../Icon'

interface TagProps {
  children: ReactNode
  /** Darker chip: a filter that is currently applied. */
  active?: boolean
  /** When set, the chip gets a remove button. */
  onRemove?: () => void
  removeLabel?: string
}

export function Tag({ children, active, onRemove, removeLabel }: TagProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded px-2 py-1 text-lg text-page',
        active ? 'bg-input' : 'bg-muted',
      ].join(' ')}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `Remover ${String(children)}`}
          className="inline-flex rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon name="close" />
        </button>
      ) : null}
    </span>
  )
}
