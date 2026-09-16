import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../atoms/Button'
import { Checkbox } from '../../atoms/Checkbox'
import { FormField } from '../../molecules/FormField'

export interface SignupFormValues {
  name: string
  email: string
  password: string
  remember: boolean
}

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => void
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
}

export function SignupForm({ onSubmit }: SignupFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    if (!name.trim()) {
      nextErrors.name = 'Informe seu nome completo'
    }
    if (!email.trim()) {
      nextErrors.email = 'Informe seu email'
    }
    if (!password) {
      nextErrors.password = 'Informe uma senha'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({ name, email, password, remember })
  }

  return (
    <form noValidate className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FormField
        label="Nome"
        placeholder="Nome completo"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
      />
      <FormField
        label="Email"
        type="email"
        placeholder="Digite seu email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />
      <FormField
        label="Senha"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />

      <Checkbox
        checked={remember}
        onChange={(event) => setRemember(event.target.checked)}
      >
        Lembrar-me
      </Checkbox>

      <Button type="submit" icon="arrow-right" fullWidth>
        Cadastrar
      </Button>
    </form>
  )
}
