import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { AuthRedirect } from './AuthRedirect'

describe('AuthRedirect', () => {
  it('shows the question and links to the given path', () => {
    renderWithRouter(
      <AuthRedirect
        question="Ainda não tem conta?"
        linkText="Crie seu cadastro!"
        to="/cadastro"
      />,
    )

    expect(screen.getByText('Ainda não tem conta?')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Crie seu cadastro!' }),
    ).toHaveAttribute('href', '/cadastro')
  })
})
