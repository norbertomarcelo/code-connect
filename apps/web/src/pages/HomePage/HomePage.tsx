import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../../components/atoms/Button'

export function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    signOut()
    await navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-3xl font-semibold text-offwhite">
        Olá, {user?.name ?? 'visitante'}!
      </h1>
      <p className="text-muted">Você está autenticado no Code Connect.</p>
      <Button onClick={handleSignOut}>Sair</Button>
    </main>
  )
}
