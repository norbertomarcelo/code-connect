import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAuth } from './useAuth'

function Probe() {
  useAuth()
  return null
}

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Probe />)).toThrow(
      'useAuth must be used inside an AuthProvider',
    )

    consoleError.mockRestore()
  })
})
