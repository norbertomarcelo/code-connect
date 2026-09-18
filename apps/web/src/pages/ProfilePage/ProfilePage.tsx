import { Avatar } from '../../components/atoms/Avatar'
import { useAuth } from '../../auth/useAuth'

/** Placeholder: the profile screen has not been designed into the app yet. */
export function ProfilePage() {
  const { user } = useAuth()

  return (
    <section className="flex flex-col items-center gap-4 rounded-lg bg-page p-8 text-center text-muted">
      <h1 className="text-xl font-semibold text-offwhite">Perfil</h1>
      {user ? (
        <>
          <Avatar name={user.name} size="md" />
          <p className="text-lg text-offwhite">{user.name}</p>
          <p>{user.email}</p>
        </>
      ) : null}
      <p>Em breve você poderá editar seu perfil por aqui.</p>
    </section>
  )
}
