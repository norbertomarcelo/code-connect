import { useState } from 'react'
import { useNavigate } from 'react-router'
import { signupErrorDisplay } from '../../auth/messages'
import type { SignupFieldErrors } from '../../auth/messages'
import { useAuth } from '../../auth/useAuth'
import { AuthRedirect } from '../../components/molecules/AuthRedirect'
import { SignupForm } from '../../components/organisms/SignupForm'
import type { SignupFormValues } from '../../components/organisms/SignupForm'
import { SocialLogin } from '../../components/organisms/SocialLogin'
import type { SocialProvider } from '../../components/organisms/SocialLogin'
import { AuthTemplate } from '../../components/templates/AuthTemplate'

function handleSocialSelect(provider: SocialProvider) {
  console.info('signup social', provider)
}

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({})

  async function handleSubmit(values: SignupFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)
    setFieldErrors({})

    try {
      await signUp({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      await navigate('/login', {
        replace: true,
        state: {
          notice: 'Cadastro realizado! Faça login para continuar.',
          email: values.email,
          remember: values.remember,
        },
      })
    } catch (error) {
      const display = signupErrorDisplay(error)
      setSubmitError(display.formError ?? null)
      setFieldErrors(display.fieldErrors ?? {})
      setIsSubmitting(false)
    }
  }

  return (
    <AuthTemplate
      bannerSrc="/banner-cadastro.webp"
      bannerAlt="Code Connect"
      bannerWidth={960}
      bannerHeight={640}
      title="Cadastro"
      subtitle="Olá! Preencha seus dados."
      footer={
        <AuthRedirect
          question="Já tem conta?"
          linkText="Faça seu login!"
          to="/login"
          icon="login"
        />
      }
    >
      <SignupForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        fieldErrors={fieldErrors}
      />
      <SocialLogin
        label="ou entre com outras contas"
        onSelect={handleSocialSelect}
      />
    </AuthTemplate>
  )
}
