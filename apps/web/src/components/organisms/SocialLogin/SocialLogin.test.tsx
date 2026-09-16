import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SocialLogin } from './SocialLogin'

describe('SocialLogin', () => {
  it('calls onSelect with the chosen provider', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<SocialLogin label="ou entre com outras contas" onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: 'Github' }))
    await user.click(screen.getByRole('button', { name: 'Gmail' }))

    expect(onSelect).toHaveBeenNthCalledWith(1, 'github')
    expect(onSelect).toHaveBeenNthCalledWith(2, 'google')
  })
})
