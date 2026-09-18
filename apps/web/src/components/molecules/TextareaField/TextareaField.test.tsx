import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextareaField } from './TextareaField'

describe('TextareaField', () => {
  it('finds the textarea by its label', () => {
    render(<TextareaField label="Descrição" />)

    expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
  })

  it('links the error message to the textarea via aria-describedby', () => {
    render(<TextareaField label="Descrição" error="Informe uma descrição" />)

    const field = screen.getByLabelText('Descrição')
    const error = screen.getByText('Informe uma descrição')

    expect(field).toHaveAttribute('aria-describedby', error.id)
    expect(field).toBeInvalid()
  })
})
