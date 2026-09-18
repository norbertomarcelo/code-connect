import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../../../auth/useAuth'
import { Button } from '../../atoms/Button'
import { Icon } from '../../atoms/Icon'
import type { IconName } from '../../atoms/Icon'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const items: NavItem[] = [
  { to: '/feed', label: 'Feed', icon: 'feed' },
  { to: '/perfil', label: 'Perfil', icon: 'account_circle' },
  { to: '/sobre', label: 'Sobre nós', icon: 'info' },
]

const itemClasses =
  'flex flex-col items-center gap-2 rounded px-4 py-2 text-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'

function linkClasses({ isActive }: { isActive: boolean }) {
  return [itemClasses, isActive ? 'text-white' : 'text-input hover:text-offwhite'].join(' ')
}

export function SidebarNav() {
  const { status, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    signOut()
    await navigate('/feed')
  }

  return (
    <aside className="flex w-full flex-row flex-wrap items-center justify-between gap-4 rounded-lg bg-page p-4 md:w-44 md:flex-col md:justify-start md:gap-20 md:self-stretch md:px-4 md:py-10">
      <Link
        to="/feed"
        className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <img src="/logo.svg" alt="Code Connect" width={127} height={40} />
      </Link>

      <nav
        aria-label="Principal"
        className="flex flex-wrap items-center gap-4 md:w-full md:flex-col md:gap-10"
      >
        <Button
          variant="outline"
          className="text-xl md:w-full"
          onClick={() => navigate('/publicar')}
        >
          Publicar
        </Button>

        <ul className="flex flex-wrap items-center gap-4 md:flex-col md:gap-10">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClasses}>
                <Icon name={item.icon} size="lg" />
                {item.label}
              </NavLink>
            </li>
          ))}

          {status === 'authenticated' ? (
            <li>
              <button
                type="button"
                onClick={handleSignOut}
                className={`${itemClasses} text-input hover:text-offwhite`}
              >
                <Icon name="logout" size="lg" />
                Sair
              </button>
            </li>
          ) : null}

          {status === 'anonymous' ? (
            <li>
              <NavLink to="/login" className={linkClasses}>
                <Icon name="login" size="lg" />
                Login
              </NavLink>
            </li>
          ) : null}
        </ul>
      </nav>
    </aside>
  )
}
