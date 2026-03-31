import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { NewRequest } from './pages/student/NewRequest';
import { RequestDetail } from './pages/student/RequestDetail';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { ReviewRequest } from './pages/employee/ReviewRequest';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/student',
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'new-request',
        element: (
          <ProtectedRoute allowedRole="student">
            <NewRequest />
          </ProtectedRoute>
        ),
      },
      {
        path: 'request/:id',
        element: (
          <ProtectedRoute allowedRole="student">
            <RequestDetail />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/employee',
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute allowedRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'review/:id',
        element: (
          <ProtectedRoute allowedRole="employee">
            <ReviewRequest />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);