import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../atoms/Button'
import { FormField } from '../../molecules/FormField'
import { PostThumbnail } from '../../molecules/PostThumbnail'
import { TagInput } from '../../molecules/TagInput'
import { TextareaField } from '../../molecules/TextareaField'

export interface PostFormValues {
  title: string
  description: string
  body: string
  thumbnailUrl: string
  tags: string[]
}

interface FormErrors {
  title?: string
  description?: string
  body?: string
  thumbnailUrl?: string
  tags?: string
}

interface PostFormProps {
  onSubmit: (values: PostFormValues) => void
  onDiscard: () => void
  isSubmitting?: boolean
  submitError?: string | null
  /** Errors reported by the API, shown until the next submit. */
  fieldErrors?: FormErrors
}

const urlPattern = /^https?:\/\/\S+$/

export function PostForm({
  onSubmit,
  onDiscard,
  isSubmitting = false,
  submitError,
  fieldErrors,
}: PostFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [body, setBody] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})

  const trimmedUrl = thumbnailUrl.trim()
  const previewSrc = urlPattern.test(trimmedUrl) ? trimmedUrl : null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    if (!title.trim()) nextErrors.title = 'Informe o nome do projeto'
    if (!description.trim()) nextErrors.description = 'Informe uma descrição'
    if (!body.trim()) nextErrors.body = 'Informe o código'
    if (trimmedUrl && !urlPattern.test(trimmedUrl)) {
      nextErrors.thumbnailUrl = 'Informe uma URL válida (http ou https)'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      body,
      thumbnailUrl: trimmedUrl,
      tags,
    })
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-lg bg-page p-6 md:grid-cols-2"
    >
      <div className="flex flex-col gap-4">
        <div className="h-60 rounded-lg bg-input p-6">
          <PostThumbnail src={previewSrc} />
        </div>
        <FormField
          label="URL da imagem (opcional)"
          type="url"
          placeholder="https://..."
          value={thumbnailUrl}
          onChange={(event) => setThumbnailUrl(event.target.value)}
          error={errors.thumbnailUrl ?? fieldErrors?.thumbnailUrl}
        />
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-offwhite">Novo projeto</h2>

        <FormField
          label="Nome do projeto"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title ?? fieldErrors?.title}
        />
        <TextareaField
          label="Descrição"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description ?? fieldErrors?.description}
        />
        <TextareaField
          label="Código"
          className="font-mono"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          error={errors.body ?? fieldErrors?.body}
        />
        <TagInput
          label="Tags"
          placeholder="Digite e pressione Enter"
          value={tags}
          onChange={setTags}
          error={fieldErrors?.tags}
        />

        {submitError ? (
          <p role="alert" className="text-sm text-danger">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-4">
          <Button
            variant="secondary"
            icon="delete"
            iconSize="md"
            onClick={onDiscard}
            disabled={isSubmitting}
          >
            Descartar
          </Button>
          <Button type="submit" icon="upload" iconSize="md" disabled={isSubmitting}>
            {isSubmitting ? 'Publicando...' : 'Publicar'}
          </Button>
        </div>
      </div>
    </form>
  )
}
