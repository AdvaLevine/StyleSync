import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from 'react-oidc-context';

// Current production configuration
const cognitoAuthConfig = {
    authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_V2oTCr6Jg",
    client_id: "2k4ish6qqks2nq1ghk48nc81td",
    redirect_uri: "https://main.d42bas3xeg2w1.amplifyapp.com/login",
    post_logout_redirect_uri: "https://main.d42bas3xeg2w1.amplifyapp.com/login",
    response_type: "code",
    scope: "email openid profile",
    onSigninCallback: () => {
        // Clean up the URL after login
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
