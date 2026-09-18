import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithAuth } from '../../../test/renderWithAuth'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('renders the sidebar next to a single main landmark with the page inside', () => {
    renderWithAuth(
      <AppShell>
        <h1>Conteúdo da página</h1>
      </AppShell>,
    )

    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { name: 'Conteúdo da página' }),
    )
  })
})
