import { useEffect } from "react";

// Remove the hardcoded URL constant entirely.
// const COGNITO_LOGIN_URL = "...";

export const useCheckUserLoggedIn = (auth) => {
  useEffect(() => {
      if (!auth.isAuthenticated && !auth.isLoading) {
        // Use the library's method to handle the redirect
        auth.signinRedirect();
      }
  }, [auth.isAuthenticated, auth.isLoading]);

// Return loading and auth state to handle conditional rendering
  return {
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
  };
};