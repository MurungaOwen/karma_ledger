// Re-export the useAuth hook for convenience
export { useAuth } from '../contexts/AuthContext';

// Import the hook locally to avoid circular reference
import { useAuth } from '../contexts/AuthContext';

// Additional auth-related hooks can be added here
export const useAuthToken = () => {
  const { token } = useAuth();
  return token;
};

export const useAuthUser = () => {
  const { user } = useAuth();
  return user;
};

export const useAuthStatus = () => {
  const { user, token, isLoading } = useAuth();
  return {
    isAuthenticated: !!token,
    isLoading,
    user,
  };
};
