import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AboutPage } from './AboutPage'

describe('AboutPage', () => {
  it('renders its heading and a short description', () => {
    render(<AboutPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Sobre nós' })).toBeInTheDocument()
    expect(screen.getByText(/Code Connect é um lugar/)).toBeInTheDocument()
  })
})
