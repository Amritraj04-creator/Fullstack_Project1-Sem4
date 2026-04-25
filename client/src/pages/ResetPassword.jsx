import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Activity, Lock, Eye, EyeOff, ArrowRight,
  CheckCircle, XCircle, Loader2
} from 'lucide-react';
import './Auth.css';
import './ResetPassword.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate   = useNavigate();
  const { updateUser } = useAuth();

  const [verifying, setVerifying]   = useState(true);  // checking token validity
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail]   = useState('');
  const [form, setForm]             = useState({ password: '', confirm: '' });
  const [showPass, setShowPass]     = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  // Verify the token as soon as the page loads
  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/reset-password/${token}`);
        setTokenValid(true);
        setUserEmail(data.email);
      } catch (err) {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };
    if (token) verify();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.password || form.password.length < 6)
      return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm)
      return setError('Passwords do not match.');

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, {
        password: form.password,
      });
      setSuccess(true);

      // Auto-login: store returned JWT so user doesn't have to log in again
      if (data.token) {
        localStorage.setItem('queueease_user', JSON.stringify(data));
        updateUser(data);
      }

      // Redirect to dashboard after 2.5 seconds
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Password strength indicator ── */
  const strength = getStrength(form.password);

  /* ── Render ── */
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
          <h1>Set a new<br />password.</h1>
          <p>Choose a strong password you haven't used before. It will be updated immediately.</p>
          <div className="rp-tips">
            <div className="fp-tip"><span className="check-icon">✓</span><span>At least 6 characters</span></div>
            <div className="fp-tip"><span className="check-icon">✓</span><span>Mix letters, numbers & symbols</span></div>
            <div className="fp-tip"><span className="check-icon">✓</span><span>Never share your password</span></div>
          </div>
        </div>
        <div className="auth-left-blob" />
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          {/* ── Verifying token spinner ── */}
          {verifying && (
            <div className="rp-verifying fade-up">
              <Loader2 size={32} className="rp-spin" color="var(--teal)" />
              <p>Verifying your reset link…</p>
            </div>
          )}

          {/* ── Invalid / expired token ── */}
          {!verifying && !tokenValid && (
            <div className="rp-invalid fade-up">
              <div className="rp-invalid-icon">
                <XCircle size={40} color="var(--red)" />
              </div>
              <h2>Link Expired</h2>
              <p>
                This password reset link is invalid or has expired.
                Reset links are only valid for <strong>15 minutes</strong>.
              </p>
              <Link to="/forgot-password" className="auth-submit-btn rp-try-again-btn">
                Request a New Link
              </Link>
              <Link to="/login" className="rp-login-link">
                Back to Login →
              </Link>
            </div>
          )}

          {/* ── Success state ── */}
          {!verifying && tokenValid && success && (
            <div className="rp-success fade-up">
              <div className="rp-success-icon">
                <CheckCircle size={40} color="var(--green)" />
              </div>
              <h2>Password Reset!</h2>
              <p>
                Your password has been updated successfully.
                You're being redirected to your dashboard…
              </p>
              <div className="rp-redirect-bar">
                <div className="rp-redirect-fill" />
              </div>
            </div>
          )}

          {/* ── The form ── */}
          {!verifying && tokenValid && !success && (
            <>
              <div className="auth-form-header fade-up">
                <h2>Create New Password</h2>
                <p>
                  Setting a new password for <strong>{userEmail}</strong>
                </p>
              </div>

              <form className="auth-form fade-up-1" onSubmit={handleSubmit} noValidate>
                {/* New password */}
                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-wrap">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPass(s => !s)}
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {form.password && (
                    <div className="rp-strength">
                      <div className="rp-strength-bar">
                        {[0, 1, 2, 3].map(i => (
                          <div
                            key={i}
                            className={`rp-strength-seg ${i < strength.score ? `seg-${strength.level}` : ''}`}
                          />
                        ))}
                      </div>
                      <span className={`rp-strength-label label-${strength.level}`}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="input-wrap">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showConf ? 'text' : 'password'}
                      name="confirm"
                      placeholder="Re-enter your password"
                      value={form.confirm}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowConf(s => !s)}
                      tabIndex={-1}
                    >
                      {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Match indicator */}
                  {form.confirm && (
                    <p className={`rp-match ${form.password === form.confirm ? 'match-ok' : 'match-no'}`}>
                      {form.password === form.confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {error && <p className="rp-error">{error}</p>}

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || form.password !== form.confirm || form.password.length < 6}
                >
                  {loading
                    ? <span className="btn-spinner" />
                    : <><span>Reset Password</span><ArrowRight size={17} /></>
                  }
                </button>
              </form>

              <p className="auth-switch fade-up-2">
                <Link to="/login">← Back to Login</Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* ── Helper: password strength ── */
function getStrength(password) {
  if (!password) return { score: 0, level: 'weak', label: '' };
  let score = 0;
  if (password.length >= 6)  score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

  const levels = ['weak', 'fair', 'good', 'strong'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const idx    = Math.max(0, Math.min(score - 1, 3));
  return { score, level: levels[idx], label: labels[idx] };
}