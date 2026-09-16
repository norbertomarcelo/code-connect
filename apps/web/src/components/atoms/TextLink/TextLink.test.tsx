import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { TextLink } from './TextLink'

describe('TextLink', () => {
  it('renders a link pointing to the given path', () => {
    renderWithRouter(<TextLink to="/cadastro">Crie seu cadastro!</TextLink>)

    const link = screen.getByRole('link', { name: 'Crie seu cadastro!' })
    expect(link).toHaveAttribute('href', '/cadastro')
  })
})
