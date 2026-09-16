import { TextLink } from '../../atoms/TextLink'
import type { IconName } from '../../atoms/Icon'

interface AuthRedirectProps {
  question: string
  linkText: string
  to: string
  icon?: IconName
}

export function AuthRedirect({
  question,
  linkText,
  to,
  icon,
}: AuthRedirectProps) {
  return (
    <p className="text-center text-sm text-offwhite">
      {question}{' '}
      <TextLink to={to} variant="primary" icon={icon}>
        {linkText}
      </TextLink>
    </p>
  )
}
