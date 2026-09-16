import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from './FormField'

describe('FormField', () => {
  it('finds the input by its label', () => {
    render(<FormField label="Senha" type="password" />)

    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('links the error message to the input via aria-describedby', () => {
    render(<FormField label="Senha" error="Informe sua senha" />)

    const input = screen.getByLabelText('Senha')
    const error = screen.getByText('Informe sua senha')

    expect(input).toHaveAttribute('aria-describedby', error.id)
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
