import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRoutes } from 'react-router-dom';
import ErrorFallback from './components/ErrorFallback';
import SplashScreen from './components/SplashScreen';
import { appRoutes } from './routes';

function AppRoutes() {
  return useRoutes(appRoutes);
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<SplashScreen />}>
        <AppRoutes />
      </Suspense>
    </ErrorBoundary>
  );
}
