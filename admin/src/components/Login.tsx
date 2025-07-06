import React, { useState } from 'react'
import { Shield, Eye, EyeOff, Globe } from 'lucide-react'

interface LoginProps {
  onLogin: () => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (username === 'admin' && password === 'lottery2025') {
      onLogin()
    } else {
      setError('Invalid credentials. Please try again.')
    }

    setIsLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-icon">
            <Shield size={32} />
          </div>
          <h1>Admin Access</h1>
          <p>Lottery Management System</p>
        </div>
        
        <div className="web-notice">
          <Globe size={16} />
          <span>Web-only secure interface</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div style={{ 
              background: '#fecaca', 
              color: '#dc2626', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="demo-credentials">
            <p><strong>Demo Credentials:</strong></p>
            <p>Username: <code>admin</code></p>
            <p>Password: <code>lottery2025</code></p>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            <span style={{ display: isLoading ? 'none' : 'block' }}>
              Sign In
            </span>
            {isLoading && <div className="spinner"></div>}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login