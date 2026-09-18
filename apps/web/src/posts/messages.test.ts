import { describe, expect, it } from 'vitest'
import { ApiError } from '../lib/api/errors'
import {
  commentErrorMessage,
  newPostErrorDisplay,
  postsErrorMessage,
} from './messages'

describe('postsErrorMessage', () => {
  it('names a missing post', () => {
    expect(postsErrorMessage(new ApiError('not-found', 404, ['x']))).toBe(
      'Publicação não encontrada.',
    )
  })

  it('treats a malformed id as a missing post', () => {
    expect(postsErrorMessage(new ApiError('unknown', 400, ['x']))).toBe(
      'Publicação não encontrada.',
    )
  })

  it('names a lost connection and falls back for anything else', () => {
    expect(postsErrorMessage(new ApiError('network', null, ['x']))).toMatch(
      /conectar ao servidor/,
    )
    expect(postsErrorMessage(new Error('boom'))).toMatch(/carregar as publicações/)
  })
})

describe('newPostErrorDisplay', () => {
  it('maps validation messages to their fields', () => {
    const display = newPostErrorDisplay(
      new ApiError('validation', 422, [
        'title should not be empty',
        'thumbnailUrl must be a URL address',
      ]),
    )

    expect(display.fieldErrors).toEqual({
      title: 'Informe o nome do projeto',
      thumbnailUrl: 'Informe uma URL válida (http ou https)',
    })
  })

  it('falls back to a form error for an unmapped validation message', () => {
    expect(
      newPostErrorDisplay(new ApiError('validation', 422, ['something odd'])),
    ).toEqual({ formError: 'Confira os dados informados' })
  })

  it('handles network and unknown failures', () => {
    expect(newPostErrorDisplay(new ApiError('network', null, ['x'])).formError).toMatch(
      /conectar ao servidor/,
    )
    expect(newPostErrorDisplay(new Error('boom')).formError).toMatch(/publicar/)
  })
})

describe('commentErrorMessage', () => {
  it('explains the one-level limit', () => {
    expect(
      commentErrorMessage(
        new ApiError('validation', 422, ['Replies are limited to one level']),
      ),
    ).toBe('Só é possível responder a um comentário principal.')
  })

  it('asks anonymous users to sign in', () => {
    expect(commentErrorMessage(new ApiError('unauthorized', 401, ['x']))).toBe(
      'Entre na sua conta para comentar.',
    )
  })

  it('falls back to a generic message', () => {
    expect(commentErrorMessage(new Error('boom'))).toMatch(/enviar o comentário/)
  })
})
