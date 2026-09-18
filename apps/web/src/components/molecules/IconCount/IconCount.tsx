import { Icon, type MaterialIconName } from '../../atoms/Icon'

interface IconCountProps {
  icon: MaterialIconName
  /** Spoken name of the action, e.g. "Aprovar". The icon itself is hidden. */
  label: string
  count: number
  onClick?: () => void
  pressed?: boolean
}

export function IconCount({
  icon,
  label,
  count,
  onClick,
  pressed,
}: IconCountProps) {
  const content = (
    <>
      <Icon name={icon} size="md" />
      <span className="sr-only">{label} </span>
      <span className="text-sm">{count}</span>
    </>
  )

  if (!onClick) {
    return (
      <span className="inline-flex flex-col items-center text-input">
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={[
        'inline-flex flex-col items-center rounded hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
        pressed ? 'text-primary' : 'text-input',
      ].join(' ')}
    >
      {content}
    </button>
  )
}
