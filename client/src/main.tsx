import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

const queryClient = new QueryClient()
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import UsersPage from './pages/users/UsersPage'
import TicketsPage from './pages/tickets/TicketsPage'
import TicketDetailPage from './pages/tickets/TicketDetailPage'
import ProtectedLayout from './layouts/ProtectedLayout'
import AdminLayout from './layouts/AdminLayout'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tickets', element: <TicketsPage /> },
      { path: 'tickets/:id', element: <TicketDetailPage /> },
      {
        element: <AdminLayout />,
        children: [{ path: 'users', element: <UsersPage /> }],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
