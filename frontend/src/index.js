import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from 'react-oidc-context';

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_LvYLNwjnh",
  client_id: "6jt8p3s82dcj78eomqpra1qo0i",
  //redirect_uri: "https://main.d1qreohr4migr5.amplifyapp.com/login",
  redirect_uri: "http://localhost:3000/login",
  //post_logout_redirect_uri: "https://main.d1qreohr4migr5.amplifyapp.com/login",
  post_logout_redirect_uri: "http://localhost:3000/login",
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
