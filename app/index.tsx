import { Redirect } from 'expo-router';
import { useApp } from '@/context/AppContext';

/**
 * Initial route handler
 * Redirects based on authentication status and user role
 */
export default function Index() {
  const { isAuthenticated, userProfile } = useApp();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Redirect Admin users to admin module, others to dashboard
  if (userProfile?.role === 'Admin') {
    return <Redirect href="/admin" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}


