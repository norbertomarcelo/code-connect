import type { ComponentProps } from 'react'
import { Link } from 'react-router'
import { Icon, type IconName } from '../Icon'

type TextLinkVariant = 'underline' | 'primary'

interface TextLinkProps extends ComponentProps<typeof Link> {
  variant?: TextLinkVariant
  icon?: IconName
}

const variantClasses: Record<TextLinkVariant, string> = {
  underline: 'text-offwhite underline hover:text-primary',
  primary: 'text-primary font-medium hover:underline',
}

export function TextLink({
  variant = 'underline',
  icon,
  className,
  children,
  ...props
}: TextLinkProps) {
  return (
    <Link
      className={[
        'inline-flex items-center gap-1 text-sm',
        variantClasses[variant],
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
      {icon ? <Icon name={icon} /> : null}
    </Link>
  )
}
