import { Button } from '../../atoms/Button'
import { Tag } from '../../atoms/Tag'

interface FilterTag {
  slug: string
  label: string
}

interface TagFilterBarProps {
  /** Every tag that can be filtered on. */
  tags: FilterTag[]
  /** Slugs of the tags currently applied. */
  selected: string[]
  onAdd: (slug: string) => void
  onRemove: (slug: string) => void
  onClear: () => void
}

export function TagFilterBar({
  tags,
  selected,
  onAdd,
  onRemove,
  onClear,
}: TagFilterBarProps) {
  if (tags.length === 0) return null

  return (
    <div className="flex items-center justify-between gap-4">
      <ul aria-label="Filtrar por tag" className="flex flex-wrap items-center gap-4">
        {tags.map((tag) => (
          <li key={tag.slug}>
            {selected.includes(tag.slug) ? (
              <Tag
                active
                onRemove={() => onRemove(tag.slug)}
                removeLabel={`Remover filtro ${tag.label}`}
              >
                {tag.label}
              </Tag>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(tag.slug)}
                aria-label={`Filtrar por ${tag.label}`}
                className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Tag>{tag.label}</Tag>
              </button>
            )}
          </li>
        ))}
      </ul>
      {selected.length > 0 ? (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Limpar tudo
        </Button>
      ) : null}
    </div>
  )
}
