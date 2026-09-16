import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from '../Input'
import { Label } from './Label'

describe('Label', () => {
  it('associates with its input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="password">Senha</Label>
        <Input id="password" />
      </>,
    )

    expect(screen.getByLabelText('Senha')).toBe(
      screen.getByRole('textbox'),
    )
  })
})
