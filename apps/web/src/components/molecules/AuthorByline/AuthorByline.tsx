import { Avatar } from '../../atoms/Avatar'

interface AuthorBylineProps {
  name: string
  handle: string
  size?: 'sm' | 'md'
}

export function AuthorByline({ name, handle, size = 'sm' }: AuthorBylineProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar name={name} size={size} />
      <span className="text-sm font-semibold text-input">@{handle}</span>
    </span>
  )
}
