interface SocialButtonProps {
  src: string
  alt: string
  onClick?: () => void
}

export function SocialButton({ src, alt, onClick }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-full p-2 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <img src={src} alt={alt} className="h-10 w-10 object-contain" />
    </button>
  )
}
