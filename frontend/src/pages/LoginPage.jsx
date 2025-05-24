import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated && !auth.isLoading) {
      auth.signinRedirect();
    }
  }, [auth]);

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const userId = auth.user.profile.sub;
      const name = auth.user.profile.name || "Guest";

      localStorage.setItem("user_id", userId);
      localStorage.setItem("name", name);

      navigate("/home");
    }
  }, [auth.isAuthenticated, auth.user, navigate]);

  return null;
};

export default LoginPage;
