import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setToken, setStoredUser } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitLogin = async (loginEmail, loginPassword) => {
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await login(loginEmail, loginPassword);
      setToken(token);
      setStoredUser(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitLogin(email, password);
  };

  const handleDemoLogin = async () => {
    const demoEmail = process.env.REACT_APP_DEMO_EMAIL || '';
    const demoPassword = process.env.REACT_APP_DEMO_PASSWORD || '';
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    if (demoEmail && demoPassword) {
      await submitLogin(demoEmail, demoPassword);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-brand">MRF COMMAND</h1>
        <p className="login-sub">Materials Recovery Facility Ops</p>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <div className="ai-error" style={{ marginBottom: 12 }}>{error}</div>}

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading || !process.env.REACT_APP_DEMO_EMAIL || !process.env.REACT_APP_DEMO_PASSWORD}
          aria-label="Fill Demo Credentials"
          style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
        >
          Fill Demo Credentials
        </button>
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? <><span className="spinner" />Authenticating...</> : 'Sign In'}
        </button>

        {(!process.env.REACT_APP_DEMO_EMAIL || !process.env.REACT_APP_DEMO_PASSWORD) && (
          <p className="login-hint">Demo autofill is unavailable until a demo email and password are configured for this frontend.</p>
        )}
      </form>
    </div>
  );
}
