import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface LoginFormProps {
  onLogin: (credentials: { username: string; password: string }) => void;
  error: string | null;
  isLoading: boolean;
}

export default function LoginForm({ onLogin, error, isLoading }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLogin({ username: username.trim(), password });
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 p-3 rounded-full transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 border border-gray-700'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
        }`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className={`w-full max-w-md transition-all duration-200 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      } rounded-2xl shadow-2xl border p-8`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-50'
          }`}>
            <Shield className={`w-8 h-8 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            NetWatch Pro
          </h1>
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Secure access to network monitoring dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="Enter your email address"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg border ${
              theme === 'dark'
                ? 'bg-red-900/20 border-red-800 text-red-400'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              isLoading || !username.trim() || !password.trim()
                ? theme === 'dark'
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20'
            } focus:outline-none transform hover:scale-[1.02] active:scale-[0.98]`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Authenticating...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={`mt-8 pt-6 border-t text-center ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <p className={`text-xs ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Network Monitoring System v2.1.0
          </p>
        </div>
      </div>
    </div>
  );
}