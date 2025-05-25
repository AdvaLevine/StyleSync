import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from "react-router-dom";
import { forceWardrobeCacheRefresh } from "../services/wardrobeCache";
import { invalidateCountCache } from "../services/itemsCache";

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
      const email = auth.user.profile.email || "No email provided";
      const birthdate = auth.user.profile.birthdate || "No birthdate provided";

      localStorage.setItem("user_id", userId);
      localStorage.setItem("name", name);
      localStorage.setItem("email", email);
      localStorage.setItem("birthdate", birthdate);
      
      // Add cache refresh logic that was in Login and Signup
      forceWardrobeCacheRefresh();
      invalidateCountCache();

      navigate("/home");
    }
  }, [auth, auth.isAuthenticated, auth.user, navigate]);

  return null;
};

export default LoginPage;