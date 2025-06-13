import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Editor from './components/Editor';
import PensPage from './pages/PensPage';
import { useAuth, AuthProvider } from './contexts/AuthContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/pens"
        element={
          <PrivateRoute>
            <PensPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/editor"
        element={
          <PrivateRoute>
            <Editor />
          </PrivateRoute>
        }
      />
      <Route
        path="/editor/:id"
        element={
          <PrivateRoute>
            <Editor />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/pens" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
