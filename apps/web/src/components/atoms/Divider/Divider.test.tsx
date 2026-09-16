import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Divider } from './Divider'

describe('Divider', () => {
  it('shows its label', () => {
    render(<Divider label="ou entre com outras contas" />)

    expect(
      screen.getByText('ou entre com outras contas'),
    ).toBeInTheDocument()
  })
})
