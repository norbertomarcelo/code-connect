import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PostForm } from '../../components/organisms/PostForm'
import type { PostFormValues } from '../../components/organisms/PostForm'
import { createPost } from '../../lib/api/posts'
import { newPostErrorDisplay } from '../../posts/messages'
import type { PostFieldErrors } from '../../posts/messages'

export function NewPostPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<PostFieldErrors>({})

  async function handleSubmit(values: PostFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)
    setFieldErrors({})

    try {
      const created = await createPost({
        title: values.title,
        description: values.description,
        body: values.body,
        thumbnailUrl: values.thumbnailUrl || null,
        tags: values.tags,
      })
      await navigate(`/publicacoes/${created.id}`, { replace: true })
    } catch (error) {
      const display = newPostErrorDisplay(error)
      setSubmitError(display.formError ?? null)
      setFieldErrors(display.fieldErrors ?? {})
      setIsSubmitting(false)
    }
  }

  async function handleDiscard() {
    await navigate('/feed')
  }

  return (
    <>
      <h1 className="sr-only">Publicar</h1>
      <PostForm
        onSubmit={handleSubmit}
        onDiscard={handleDiscard}
        isSubmitting={isSubmitting}
        submitError={submitError}
        fieldErrors={fieldErrors}
      />
    </>
  )
}
