import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../../test/renderWithRouter'
import { ForgotPasswordPage } from './ForgotPasswordPage'

describe('ForgotPasswordPage', () => {
  it('renders the heading and a link back to the login', () => {
    renderWithRouter(<ForgotPasswordPage />)

    expect(
      screen.getByRole('heading', { name: 'Recuperar senha' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Voltar para o login' }),
    ).toHaveAttribute('href', '/login')
  })
})
