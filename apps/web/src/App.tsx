import { Navigate, RouterProvider, createBrowserRouter } from 'react-router'
import { LoginPage } from './pages/LoginPage'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
