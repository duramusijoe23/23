import React from 'react';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

function App() {
  const { user, profile, isAuthenticated, isLoading, error, login, logout, clearError } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Loading NetWatch Pro...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginForm 
        onLogin={login}
        error={error}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="App">
      <Dashboard user={user!} onLogout={logout} />
    </div>
  );
}

export default App;