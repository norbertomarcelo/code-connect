import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderWithAuth } from '../../../test/renderWithAuth'
import { SidebarNav } from './SidebarNav'

const ana = { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' }

describe('SidebarNav', () => {
  it('links to the main pages', () => {
    renderWithAuth(<SidebarNav />)

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Feed' })).toHaveAttribute('href', '/feed')
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/perfil')
    expect(screen.getByRole('link', { name: 'Sobre nós' })).toHaveAttribute('href', '/sobre')
  })

  it('marks the current page', () => {
    renderWithAuth(<SidebarNav />, { route: '/feed' })

    expect(screen.getByRole('link', { name: 'Feed' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Perfil' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('offers Login to an anonymous visitor, and no Sair', () => {
    renderWithAuth(<SidebarNav />)

    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument()
  })

  it('offers Sair to a signed-in user, and no Login', () => {
    renderWithAuth(<SidebarNav />, {
      auth: { status: 'authenticated', user: ana },
    })

    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument()
  })

  it('shows neither while the session is still being checked', () => {
    renderWithAuth(<SidebarNav />, { auth: { status: 'loading' } })

    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument()
  })

  it('signs out and goes back to the feed', async () => {
    const user = userEvent.setup()
    const signOut = vi.fn()
    renderWithAuth(
      <Routes>
        <Route path="/" element={<SidebarNav />} />
        <Route path="/feed" element={<p>página do feed</p>} />
      </Routes>,
      { auth: { status: 'authenticated', user: ana, signOut } },
    )

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('página do feed')).toBeInTheDocument()
  })

  it('goes to the publish page from the Publicar button', async () => {
    const user = userEvent.setup()
    renderWithAuth(
      <Routes>
        <Route path="/" element={<SidebarNav />} />
        <Route path="/publicar" element={<p>página de publicar</p>} />
      </Routes>,
    )

    await user.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(await screen.findByText('página de publicar')).toBeInTheDocument()
  })
})
