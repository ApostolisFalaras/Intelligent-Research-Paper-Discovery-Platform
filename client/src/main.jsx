import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from "./context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      {/* Enclosing the whole App in the AuthProvider context,
      in order to be able to access user auth information */}
      <AuthProvider>
        <App />
      </AuthProvider>
  </React.StrictMode>,
);
