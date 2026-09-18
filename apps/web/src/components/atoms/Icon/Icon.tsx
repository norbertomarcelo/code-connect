export type SvgIconName = 'arrow-right' | 'clipboard' | 'login'

/**
 * Material Symbols are rendered as ligatures: the glyph name IS the text
 * content. Never add a name here that already exists in `SvgIconName`: the SVG
 * map is checked first and would silently win.
 */
export type MaterialIconName =
  | 'feed'
  | 'account_circle'
  | 'info'
  | 'logout'
  | 'search'
  | 'close'
  | 'code'
  | 'share'
  | 'chat'
  | 'image'
  | 'upload'
  | 'delete'
  | 'expand_more'
  | 'expand_less'
  | 'chevron_left'
  | 'chevron_right'

export type IconName = SvgIconName | MaterialIconName

export type IconSize = 'sm' | 'md' | 'lg'

interface IconProps {
  name: IconName
  size?: IconSize
  className?: string
}

const svgSize: Record<IconSize, number> = { sm: 20, md: 24, lg: 32 }

const glyphSize: Record<IconSize, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
}

const paths: Record<SvgIconName, React.ReactNode> = {
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

function isSvgIcon(name: IconName): name is SvgIconName {
  return name in paths
}

export function Icon({ name, size = 'sm', className }: IconProps) {
  if (isSvgIcon(name)) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={svgSize[size]}
        height={svgSize[size]}
        className={className}
        role="presentation"
        aria-hidden="true"
      >
        {paths[name]}
      </svg>
    )
  }

  return (
    <span
      // aria-hidden keeps the ligature text ("account_circle") out of the
      // accessibility tree; translate="no" keeps machine translation from
      // rewriting it and destroying the glyph. The fixed box and
      // overflow-hidden cap the damage if the icon font never loads.
      aria-hidden="true"
      translate="no"
      className={[
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-icon leading-none',
        glyphSize[size],
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {name}
    </span>
  )
}
