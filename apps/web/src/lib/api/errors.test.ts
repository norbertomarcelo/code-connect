import { describe, expect, it } from 'vitest'
import { ApiError, hasMessageForField, normalizeError } from './errors'

function axiosError(status: number | null, data?: unknown) {
  return Object.assign(new Error('request failed'), {
    isAxiosError: true,
    response: status === null ? undefined : { status, data },
    config: { url: '/x' },
  })
}

describe('normalizeError', () => {
  it('maps a 422 with a message array', () => {
    const error = normalizeError(
      axiosError(422, {
        message: ['email must be an email', 'name should not be empty'],
        error: 'Unprocessable Entity',
        statusCode: 422,
      }),
    )

    expect(error.kind).toBe('validation')
    expect(error.status).toBe(422)
    expect(error.messages).toEqual([
      'email must be an email',
      'name should not be empty',
    ])
  })

  it('maps a 409 with a string message', () => {
    const error = normalizeError(
      axiosError(409, { message: 'Email already registered', statusCode: 409 }),
    )

    expect(error.kind).toBe('conflict')
    expect(error.messages).toEqual(['Email already registered'])
  })

  it('maps a guard 401 that has no error key', () => {
    const error = normalizeError(
      axiosError(401, { message: 'Unauthorized', statusCode: 401 }),
    )

    expect(error.kind).toBe('unauthorized')
    expect(error.messages).toEqual(['Unauthorized'])
  })

  it('maps a 404 to not-found', () => {
    const error = normalizeError(
      axiosError(404, { message: 'Post not found', statusCode: 404 }),
    )

    expect(error.kind).toBe('not-found')
    expect(error.messages).toEqual(['Post not found'])
  })

  it('maps a response-less failure to a network error', () => {
    const error = normalizeError(axiosError(null))

    expect(error.kind).toBe('network')
    expect(error.status).toBeNull()
  })

  it('maps 5xx to server and falls back when the body is empty', () => {
    const error = normalizeError(axiosError(500, ''))

    expect(error.kind).toBe('server')
    expect(error.messages).toEqual(['Request failed with status 500'])
  })

  it('returns an ApiError unchanged and wraps unknown errors', () => {
    const original = new ApiError('conflict', 409, ['x'])

    expect(normalizeError(original)).toBe(original)
    expect(normalizeError(new Error('boom')).kind).toBe('unknown')
  })
})

describe('hasMessageForField', () => {
  it('matches class-validator messages by field prefix', () => {
    const error = new ApiError('validation', 422, [
      'password must be longer than or equal to 8 characters',
    ])

    expect(hasMessageForField(error, 'password')).toBe(true)
    expect(hasMessageForField(error, 'email')).toBe(false)
  })
})
