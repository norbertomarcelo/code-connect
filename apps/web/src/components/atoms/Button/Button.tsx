import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from '../Icon'

type ButtonVariant = 'primary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: IconName
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-surface hover:brightness-95 focus-visible:outline-primary',
}

export function Button({
  variant = 'primary',
  icon,
  fullWidth,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100',
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
      {icon ? <Icon name={icon} /> : null}
    </button>
  )
}
