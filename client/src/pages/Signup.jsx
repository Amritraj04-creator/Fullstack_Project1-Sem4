import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Activity, User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import './Auth.css';

export default function Signup() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return toast.error('Please fill in all required fields');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    const result = await register(form.name, form.email, form.password, form.phone);
    if (result.success) {
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-brand">
            <div className="auth-brand-icon">
              <Activity size={20} strokeWidth={2.5} />
            </div>
            Queue<strong>Ease</strong>
          </Link>
          <h1>Your health,<br />your time.</h1>
          <p>Create a free account and start booking clinic tokens in seconds — no more standing in queues.</p>
          <div className="auth-features">
            {['Free to use, always', 'Real-time queue tracking', 'Cancel anytime'].map((f) => (
              <div key={f} className="auth-feature-item">
                <span className="check-icon">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-left-blob" />
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header fade-up">
            <h2>Create your account</h2>
            <p>Free forever. No credit card required.</p>
          </div>

          <form className="auth-form fade-up-1" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <div className="input-wrap">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Ravi Kumar"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <div className="input-wrap">
                  <Phone size={16} className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password *</label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass((s) => !s)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : (
                <><span>Create Account</span><ArrowRight size={17} /></>
              )}
            </button>
          </form>

          <p className="auth-switch fade-up-2">
            Already have an account?{' '}
            <Link to="/login">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}