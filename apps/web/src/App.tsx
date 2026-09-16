import { Navigate, RouterProvider, createBrowserRouter } from 'react-router'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <SignupPage /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
