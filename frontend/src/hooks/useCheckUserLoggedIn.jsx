import { useEffect } from "react";

const COGNITO_LOGIN_URL = "https://us-east-1v2otcr6jg.auth.us-east-1.amazoncognito.com/login?client_id=6jt8p3s82dcj78eomqpra1qo0i&response_type=code&scope=email+openid&redirect_uri=http://localhost:3000/login";

export const useCheckUserLoggedIn = (auth) => {
  useEffect(() => {
    if (!auth.isAuthenticated && !auth.isLoading) {
      window.location.href = COGNITO_LOGIN_URL;
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  // Return loading and auth state to handle conditional rendering
  return {
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
  };
};
