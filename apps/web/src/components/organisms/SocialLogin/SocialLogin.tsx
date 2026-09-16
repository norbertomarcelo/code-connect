import { Divider } from '../../atoms/Divider'
import { SocialButton } from '../../atoms/SocialButton'

export type SocialProvider = 'github' | 'google'

interface SocialLoginProps {
  label: string
  onSelect: (provider: SocialProvider) => void
}

const providers: { id: SocialProvider; src: string; alt: string }[] = [
  { id: 'github', src: '/github.png', alt: 'Github' },
  { id: 'google', src: '/gmail.png', alt: 'Gmail' },
]

export function SocialLogin({ label, onSelect }: SocialLoginProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Divider label={label} />
      <div className="flex items-center gap-6">
        {providers.map((provider) => (
          <SocialButton
            key={provider.id}
            src={provider.src}
            alt={provider.alt}
            onClick={() => onSelect(provider.id)}
          />
        ))}
      </div>
    </div>
  )
}
