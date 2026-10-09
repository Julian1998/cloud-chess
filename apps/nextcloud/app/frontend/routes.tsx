import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

const InvitationsPage = lazy(() => import('./pages/InvitationsPage'));

export const appRoutes: RouteObject[] = [
  { path: '/', element: <InvitationsPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
];
