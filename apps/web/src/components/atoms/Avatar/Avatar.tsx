type AvatarSize = 'sm' | 'md'

interface AvatarProps {
  name: string
  size?: AvatarSize
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'size-8 text-sm',
  md: 'size-12 text-lg',
}

const colorClasses = [
  'bg-emerald-700',
  'bg-sky-700',
  'bg-violet-700',
  'bg-amber-700',
  'bg-rose-700',
  'bg-teal-700',
]

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Same name, same color: the palette index comes from a hash of the name. */
function colorFor(name: string): string {
  let hash = 0
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return colorClasses[hash % colorClasses.length]
}

/**
 * Decorative: the author's handle always appears as text next to it, so the
 * initials would only be read twice by a screen reader.
 */
export function Avatar({ name, size = 'sm' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white',
        sizeClasses[size],
        colorFor(name),
      ].join(' ')}
    >
      {initialsOf(name)}
    </span>
  )
}
