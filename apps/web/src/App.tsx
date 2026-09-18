import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
} from 'react-router'
import { AuthProvider, ProtectedRoute } from './auth'
import { AppShell } from './components/templates/AppShell'
import { AboutPage } from './pages/AboutPage'
import { FeedPage } from './pages/FeedPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { NewPostPage } from './pages/NewPostPage'
import { PostPage } from './pages/PostPage'
import { ProfilePage } from './pages/ProfilePage'
import { SignupPage } from './pages/SignupPage'

/**
 * A layout route, so the sidebar mounts once and survives navigation between
 * the feed and a post instead of being rebuilt by every page.
 */
function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/feed" replace /> },
  // Kept so old bookmarks land somewhere sensible.
  { path: '/inicio', element: <Navigate to="/feed" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <SignupPage /> },
  { path: '/recuperar-senha', element: <ForgotPasswordPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/feed', element: <FeedPage /> },
      { path: '/publicacoes/:id', element: <PostPage /> },
      { path: '/sobre', element: <AboutPage /> },
      {
        path: '/publicar',
        element: (
          <ProtectedRoute>
            <NewPostPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/perfil',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
