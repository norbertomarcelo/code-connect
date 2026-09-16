import type { ReactNode } from 'react'

interface AuthTemplateProps {
  bannerSrc: string
  bannerAlt: string
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthTemplate({
  bannerSrc,
  bannerAlt,
  title,
  subtitle,
  children,
  footer,
}: AuthTemplateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-surface md:grid-cols-2">
        <img
          src={bannerSrc}
          alt={bannerAlt}
          className="h-48 w-full object-cover md:h-full"
        />

        <div className="flex flex-col gap-8 p-8">
          <div>
            <h1 className="text-3xl font-semibold text-offwhite">{title}</h1>
            <p className="mt-4 text-offwhite">{subtitle}</p>
          </div>

          {children}

          {footer}
        </div>
      </div>
    </main>
  )
}
