import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/api/errors'
import { useAsyncData } from './useAsyncData'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('useAsyncData', () => {
  it('goes from loading to success', async () => {
    const { result } = renderHook(() =>
      useAsyncData(() => Promise.resolve('dados'), []),
    )

    expect(result.current.state.status).toBe('loading')
    await waitFor(() => expect(result.current.state.status).toBe('success'))
    expect(result.current.state.data).toBe('dados')
  })

  it('goes from loading to error with a normalized ApiError', async () => {
    const failure = new ApiError('server', 500, ['boom'])
    const { result } = renderHook(() =>
      useAsyncData(() => Promise.reject(failure), []),
    )

    await waitFor(() => expect(result.current.state.status).toBe('error'))
    expect(result.current.state.error).toBe(failure)
  })

  it('reloads through the loading state', async () => {
    const load = vi.fn().mockResolvedValue('x')
    const { result } = renderHook(() => useAsyncData(load, []))
    await waitFor(() => expect(result.current.state.status).toBe('success'))

    act(() => result.current.reload())

    expect(result.current.state.status).toBe('loading')
    await waitFor(() => expect(result.current.state.status).toBe('success'))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('refetches when a dependency changes', async () => {
    const load = vi.fn((page: number) => Promise.resolve(`página ${page}`))
    const { result, rerender } = renderHook(
      ({ page }) => useAsyncData(() => load(page), [page]),
      { initialProps: { page: 1 } },
    )
    await waitFor(() => expect(result.current.state.data).toBe('página 1'))

    rerender({ page: 2 })

    await waitFor(() => expect(result.current.state.data).toBe('página 2'))
  })

  it('changes the loaded data locally with setData', async () => {
    const { result } = renderHook(() =>
      useAsyncData(() => Promise.resolve(1), []),
    )
    await waitFor(() => expect(result.current.state.status).toBe('success'))

    act(() => result.current.setData((previous) => previous + 1))

    expect(result.current.state.data).toBe(2)
  })

  it('ignores a slow response that arrives after a newer one', async () => {
    const slow = deferred<string>()
    const fast = deferred<string>()
    const responses: Record<string, Promise<string>> = {
      antiga: slow.promise,
      nova: fast.promise,
    }
    const { result, rerender } = renderHook(
      ({ query }) => useAsyncData(() => responses[query], [query]),
      { initialProps: { query: 'antiga' } },
    )

    rerender({ query: 'nova' })
    await act(async () => fast.resolve('resposta nova'))
    await act(async () => slow.resolve('resposta antiga'))

    expect(result.current.state.data).toBe('resposta nova')
  })
})
