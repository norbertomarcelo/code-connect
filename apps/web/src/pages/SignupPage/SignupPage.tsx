import { AuthRedirect } from '../../components/molecules/AuthRedirect'
import { SignupForm } from '../../components/organisms/SignupForm'
import type { SignupFormValues } from '../../components/organisms/SignupForm'
import { SocialLogin } from '../../components/organisms/SocialLogin'
import type { SocialProvider } from '../../components/organisms/SocialLogin'
import { AuthTemplate } from '../../components/templates/AuthTemplate'

function handleSubmit(values: SignupFormValues) {
  console.info('signup submit', values)
}

function handleSocialSelect(provider: SocialProvider) {
  console.info('signup social', provider)
}

export function SignupPage() {
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
      <SignupForm onSubmit={handleSubmit} />
      <SocialLogin
        label="ou entre com outras contas"
        onSelect={handleSocialSelect}
      />
    </AuthTemplate>
  )
}
