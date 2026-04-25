import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Activity, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import './Auth.css';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Please enter your email address.');

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-brand">
            <div className="auth-brand-icon">
              <Activity size={20} strokeWidth={2.5} />
            </div>
            Queue<strong>Ease</strong>
          </Link>
          <h1>Forgot your<br />password?</h1>
          <p>
            No worries — it happens! Enter the email address tied to your account
            and we'll send you a secure reset link.
          </p>
          <div className="fp-tips">
            <div className="fp-tip"><span className="check-icon">✓</span><span>Link expires in 15 minutes</span></div>
            <div className="fp-tip"><span className="check-icon">✓</span><span>Check your spam folder too</span></div>
            <div className="fp-tip"><span className="check-icon">✓</span><span>Your data stays safe</span></div>
          </div>
        </div>
        <div className="auth-left-blob" />
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          {/* ── Success state ── */}
          {sent ? (
            <div className="fp-success fade-up">
              <div className="fp-success-icon">
                <CheckCircle size={40} color="var(--green)" />
              </div>
              <h2>Check your inbox!</h2>
              <p>
                We've sent a password reset link to <strong>{email}</strong>.
                The link will expire in <strong>15 minutes</strong>.
              </p>
              <div className="fp-success-note">
                <span>💡</span>
                <span>
                  During development, the reset link is printed to the
                  <strong> server console</strong> if SMTP is not configured.
                </span>
              </div>
              <div className="fp-success-actions">
                <button
                  className="fp-resend-btn"
                  onClick={() => { setSent(false); }}
                >
                  Try a different email
                </button>
                <Link to="/login" className="fp-login-link">
                  Back to Login →
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="auth-form-header fade-up">
                <Link to="/login" className="fp-back-link">
                  <ArrowLeft size={15} /> Back to Login
                </Link>
                <h2>Reset Password</h2>
                <p>Enter your account email and we'll send you a link.</p>
              </div>

              <form className="auth-form fade-up-1" onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrap">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  {error && <p className="fp-error">{error}</p>}
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading
                    ? <span className="btn-spinner" />
                    : <><Send size={16} /><span>Send Reset Link</span></>
                  }
                </button>
              </form>

              <p className="auth-switch fade-up-2">
                Remembered it? <Link to="/login">Sign in →</Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}