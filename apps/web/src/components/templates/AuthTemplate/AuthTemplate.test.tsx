import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthTemplate } from './AuthTemplate'

describe('AuthTemplate', () => {
  it('renders the banner, heading, subtitle, content and footer', () => {
    render(
      <AuthTemplate
        bannerSrc="/banner-login.webp"
        bannerAlt="Code Connect"
        bannerWidth={407}
        bannerHeight={628}
        title="Login"
        subtitle="Boas-vindas! Faça seu login."
        footer={<p>rodapé</p>}
      >
        <p>conteúdo do formulário</p>
      </AuthTemplate>,
    )

    expect(screen.getByRole('img', { name: 'Code Connect' })).toHaveAttribute(
      'src',
      '/banner-login.webp',
    )
    expect(
      screen.getByRole('heading', { name: 'Login' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Boas-vindas! Faça seu login.'),
    ).toBeInTheDocument()
    expect(screen.getByText('conteúdo do formulário')).toBeInTheDocument()
    expect(screen.getByText('rodapé')).toBeInTheDocument()
  })
})
