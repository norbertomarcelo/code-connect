import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName, type IconSize } from '../Icon'

type ButtonVariant = 'primary' | 'outline' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconSize?: IconSize
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-surface hover:brightness-95 focus-visible:outline-primary',
  outline:
    'border border-primary text-primary hover:bg-primary/10 focus-visible:outline-primary',
  secondary:
    'bg-input text-surface hover:brightness-95 focus-visible:outline-input',
  ghost:
    'text-muted underline hover:text-primary focus-visible:outline-primary',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-3',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconSize,
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
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
      {icon ? <Icon name={icon} size={iconSize} /> : null}
    </button>
  )
}
