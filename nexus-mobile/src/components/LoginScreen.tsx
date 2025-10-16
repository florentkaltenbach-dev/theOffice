// Written by: Priya - Frontend Team
// Reviewed by: Sarah Williams
// Status: Production-Ready

import { useState } from 'react';
import './LoginScreen.css';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  error?: string;
}

export default function LoginScreen({ onLogin, error }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!username || !password) {
      setLocalError('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      await onLogin(username, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>Nexus Software Solutions</h1>
          <p className="login-subtitle">Your Development Team</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              disabled={loading}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {(error || localError) && (
            <div className="error-message">{error || localError}</div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <div className="login-hint">
            <small>Default: admin / changeme</small>
          </div>
        </form>

        <div className="login-footer">
          <p>Secure connection to your Nexus instance</p>
        </div>
      </div>
    </div>
  );
}
