// client/src/hooks/useAuth.ts
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async (): Promise<User> => {
      const response = await fetch('/api/user', {
        credentials: 'include', // Important for session cookies
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch user');
      }
      
      return response.json();
    },
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message === 'Unauthorized') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}