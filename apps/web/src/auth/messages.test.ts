import { describe, expect, it } from 'vitest'
import { ApiError } from '../lib/api/errors'
import { loginErrorMessage, signupErrorDisplay } from './messages'

describe('loginErrorMessage', () => {
  it('maps 401 to an invalid credentials message', () => {
    expect(loginErrorMessage(new ApiError('unauthorized', 401, ['x']))).toBe(
      'Email ou senha inválidos',
    )
  })

  it('maps network failures and unknown errors', () => {
    expect(loginErrorMessage(new ApiError('network', null, ['x']))).toMatch(
      /conectar ao servidor/,
    )
    expect(loginErrorMessage(new Error('boom'))).toMatch(/Não foi possível entrar/)
  })
})

describe('signupErrorDisplay', () => {
  it('maps 409 to an email field error', () => {
    expect(
      signupErrorDisplay(new ApiError('conflict', 409, ['Email already registered'])),
    ).toEqual({ fieldErrors: { email: 'Este email já está cadastrado' } })
  })

  it('maps 422 messages to their fields', () => {
    const display = signupErrorDisplay(
      new ApiError('validation', 422, [
        'password must be longer than or equal to 8 characters',
        'email must be an email',
      ]),
    )

    expect(display.fieldErrors).toEqual({
      email: 'Informe um email válido',
      password: 'A senha deve ter ao menos 8 caracteres',
    })
  })

  it('falls back to a form error for an unmapped 422', () => {
    expect(
      signupErrorDisplay(new ApiError('validation', 422, ['something odd'])),
    ).toEqual({ formError: 'Confira os dados informados' })
  })
})
