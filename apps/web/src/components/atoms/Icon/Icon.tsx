export type IconName = 'arrow-right' | 'clipboard' | 'login'

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
  login: (
    <path
      d="M11 7l-1.41 1.41L12.17 11H3v2h9.17l-2.58 2.59L11 17l5-5-5-5zm9-3h-8v2h8v12h-8v2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
      fill="currentColor"
    />
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
