import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedCallback } from './useDebouncedCallback'

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls back once, with the last arguments, after the delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    result.current.run('a')
    act(() => vi.advanceTimersByTime(200))
    result.current.run('ab')
    act(() => vi.advanceTimersByTime(200))
    expect(callback).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(100))

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('ab')
  })

  it('drops a pending call on cancel', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    result.current.run('a')
    result.current.cancel()
    act(() => vi.advanceTimersByTime(500))

    expect(callback).not.toHaveBeenCalled()
  })

  it('drops a pending call on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(callback, 300),
    )

    result.current.run('a')
    unmount()
    act(() => vi.advanceTimersByTime(500))

    expect(callback).not.toHaveBeenCalled()
  })

  it('uses the latest callback, not the one from when run was called', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, 300),
      { initialProps: { callback: first } },
    )

    result.current.run()
    rerender({ callback: second })
    act(() => vi.advanceTimersByTime(300))

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
