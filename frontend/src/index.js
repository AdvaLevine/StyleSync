import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from 'react-oidc-context';

// Production Cognito - https://main.d1qreohr4migr5.amplifyapp.com/login
// Dev Cognito - http://localhost:3000/login
const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_LvYLNwjnh",
  client_id: "6jt8p3s82dcj78eomqpra1qo0i",
  redirect_uri: "https://main.d1qreohr4migr5.amplifyapp.com/login",
  //redirect_uri: "http://localhost:3000/login",
  post_logout_redirect_uri: "https://main.d1qreohr4migr5.amplifyapp.com/login",
  //post_logout_redirect_uri: "https://us-east-1lvylnwjnh.auth.us-east-1.amazoncognito.com/login?client_id=6jt8p3s82dcj78eomqpra1qo0i&response_type=code&scope=email+openid&redirect_uri=http://localhost:3000/login",
  response_type: "code",
  scope: "email openid profile",
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
