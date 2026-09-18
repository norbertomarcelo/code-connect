import { useState } from 'react'
import { Icon } from '../../atoms/Icon'

interface PostThumbnailProps {
  /** `null` when the post has no image. */
  src: string | null
  alt?: string
}

/**
 * Fills its parent. Shows a placeholder when there is no image AND when the
 * image fails to load (dead link, blocked host), so a card never renders the
 * browser's broken-image icon.
 */
export function PostThumbnail({ src, alt = '' }: PostThumbnailProps) {
  // Remember WHICH url failed, so a new src gets a fresh chance without an
  // effect to reset state.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailedSrc(src)}
        className="size-full rounded-lg object-cover shadow-xl"
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      data-testid="thumbnail-placeholder"
      className="flex size-full items-center justify-center rounded-lg bg-muted text-page"
    >
      <Icon name="image" size="lg" />
    </div>
  )
}
