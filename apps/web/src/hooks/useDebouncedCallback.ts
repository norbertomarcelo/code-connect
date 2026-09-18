import { useCallback, useEffect, useMemo, useRef } from 'react'

export interface DebouncedCallback<Args extends unknown[]> {
  run: (...args: Args) => void
  /** Drops a call that is still waiting. */
  cancel: () => void
}

/**
 * Calls `callback` once `delayMs` have passed without another `run`. Driven by
 * events rather than by a debounced value, so it never re-fires when something
 * else (a back navigation, say) changes what the callback closes over.
 * A pending call is dropped on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs = 300,
): DebouncedCallback<Args> {
  const callbackRef = useRef(callback)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    callbackRef.current = callback
  })

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current)
  }, [])

  const run = useCallback(
    (...args: Args) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => callbackRef.current(...args), delayMs)
    },
    [delayMs],
  )

  useEffect(() => cancel, [cancel])

  return useMemo(() => ({ run, cancel }), [run, cancel])
}
