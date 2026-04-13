import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import './Login.css';

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resp = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();

      if (resp.ok && data.success) {
        localStorage.setItem('chemsroot_auth', 'true');
        setAuth(true);
        navigate('/');
      } else {
        setError(data.error || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Connection failed. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background-glow"></div>
      
      <div className="login-header animate-fade-in">
        <h1 className="login-brand">Chemsroot</h1>
        <p className="login-tagline">Sign in to your account</p>
      </div>

      <div className="login-card glass-panel animate-fade-in">
        <div className="login-content">
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">Enter your credentials to access your account</p>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="login-error-msg">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>
          </form>
        </div>
      </div>
      
      <div className="login-footer">
        <ShieldCheck size={14} style={{ marginRight: '6px' }} />
        Secured access for Chemsroot Ads
      </div>
    </div>
  );
};

export default Login;
