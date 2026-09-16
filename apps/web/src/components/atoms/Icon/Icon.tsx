export type IconName = 'arrow-right' | 'clipboard'

interface IconProps {
  name: IconName
  className?: string
}

const paths: Record<IconName, React.ReactNode> = {
  'arrow-right': (
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  clipboard: (
    <>
      <rect
        x="6"
        y="4"
        width="12"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M9 4a3 3 0 0 1 6 0"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </>
  ),
}

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
