import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SocialButton } from './SocialButton'

describe('SocialButton', () => {
  it('gets its accessible name from the image alt text and calls onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<SocialButton src="/github.png" alt="Github" onClick={onClick} />)

    const button = screen.getByRole('button', { name: 'Github' })
    await user.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
