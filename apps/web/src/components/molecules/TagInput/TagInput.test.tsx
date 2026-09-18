import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TagInput } from './TagInput'

function Harness({ initial = [] as string[], onChange = vi.fn() }) {
  const [tags, setTags] = useState(initial)
  return (
    <TagInput
      label="Tags"
      value={tags}
      onChange={(next) => {
        setTags(next)
        onChange(next)
      }}
    />
  )
}

describe('TagInput', () => {
  it('adds a tag on Enter without submitting a form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event) => event.preventDefault())
    const onChange = vi.fn()
    render(
      <form onSubmit={onSubmit}>
        <Harness onChange={onChange} />
      </form>,
    )

    await user.type(screen.getByLabelText('Tags'), 'React{Enter}')

    expect(onChange).toHaveBeenLastCalledWith(['React'])
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Tags')).toHaveValue('')
  })

  it('adds a tag on comma', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.type(screen.getByLabelText('Tags'), 'CSS,')

    expect(onChange).toHaveBeenLastCalledWith(['CSS'])
  })

  it('commits a pending tag when the field loses focus', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.type(screen.getByLabelText('Tags'), 'Node')
    await user.tab()

    expect(onChange).toHaveBeenLastCalledWith(['Node'])
  })

  it('ignores duplicates regardless of case', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness initial={['React']} onChange={onChange} />)

    await user.type(screen.getByLabelText('Tags'), 'react{Enter}')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('removes a tag', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness initial={['React', 'CSS']} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Remover React' }))

    expect(onChange).toHaveBeenLastCalledWith(['CSS'])
  })
})
