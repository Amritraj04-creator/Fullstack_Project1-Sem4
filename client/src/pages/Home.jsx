import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Shield, Smartphone, Users, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const features = [
  {
    icon: Clock,
    color: '#0EA5E9',
    title: 'Real-Time Queue',
    desc: 'See live token numbers and estimated wait times before you even leave home.',
  },
  {
    icon: MapPin,
    color: '#10B981',
    title: 'Nearby Clinics',
    desc: 'Discover verified clinics near you with specialization filters and ratings.',
  },
  {
    icon: Smartphone,
    color: '#8B5CF6',
    title: 'Book in Seconds',
    desc: 'Get your token number instantly. No forms, no waiting rooms, no stress.',
  },
  {
    icon: Shield,
    color: '#F59E0B',
    title: 'Secure & Private',
    desc: 'Your health data is encrypted and never shared without your consent.',
  },
];

const steps = [
  { num: '01', title: 'Sign Up', desc: 'Create your free account in under a minute.' },
  { num: '02', title: 'Find a Clinic', desc: 'Search nearby clinics by city or specialization.' },
  { num: '03', title: 'Book Token', desc: 'Get your token number and estimated wait time.' },
  { num: '04', title: 'Walk In', desc: 'Arrive just in time — no early waiting required.' },
];

const stats = [
  { value: '500+', label: 'Clinics Registered' },
  { value: '50K+', label: 'Tokens Issued' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '2 min', label: 'Avg Booking Time' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob blob-1" />
          <div className="hero-blob blob-2" />
          <div className="hero-grid" />
        </div>
        <div className="container hero-content">
          <div className="hero-badge fade-up">
            <span className="badge-dot" />
            No more physical queues
          </div>
          <h1 className="hero-title fade-up-1">
            Healthcare Queue,<br />
            <span className="gradient-text">Reimagined.</span>
          </h1>
          <p className="hero-sub fade-up-2">
            Book your clinic token online. Track the live queue from home.
            Walk in exactly when it's your turn — zero waiting, zero stress.
          </p>
          <div className="hero-actions fade-up-3">
            <Link to={user ? '/dashboard' : '/signup'} className="btn-primary">
              {user ? 'Go to Dashboard' : 'Get Started Free'}
              <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="btn-ghost">
              How it works
            </Link>
          </div>
          <div className="hero-stats fade-up-4">
            {stats.map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating token card */}
        <div className="hero-visual fade-up-3">
          <div className="float-card card-main">
            <div className="fc-header">
              <div className="fc-logo" />
              <span>QueueEase</span>
            </div>
            <div className="fc-token">
              <p>Your Token</p>
              <h2>#42</h2>
              <p className="fc-clinic">City Wellness Clinic</p>
            </div>
            <div className="fc-row">
              <div>
                <p>Current</p><strong>#38</strong>
              </div>
              <div>
                <p>Est. Wait</p><strong>~18 min</strong>
              </div>
              <div>
                <p>Status</p>
                <strong style={{ color: '#10B981' }}>Active</strong>
              </div>
            </div>
          </div>
          <div className="float-card card-notif">
            <span>🔔</span>
            <div>
              <p>2 people ahead of you</p>
              <small>Be ready in ~8 min</small>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="section-label">Why QueueEase?</div>
          <h2 className="section-title">Everything you need,<br />nothing you don't.</h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={f.title} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon" style={{ background: `${f.color}15`, color: f.color }}>
                  <f.icon size={22} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="steps-section">
        <div className="container">
          <div className="section-label">Simple Process</div>
          <h2 className="section-title">From signup to seat,<br />in 4 easy steps.</h2>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div className="step-card" key={s.num}>
                <div className="step-num">{s.num}</div>
                {i < steps.length - 1 && <div className="step-line" />}
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-bg-blob" />
            <Users size={36} color="rgba(255,255,255,0.6)" />
            <h2>Ready to skip the queue?</h2>
            <p>Join thousands of patients already saving time with QueueEase.</p>
            <div className="cta-actions">
              <Link to={user ? '/dashboard' : '/signup'} className="btn-white">
                {user ? 'Open Dashboard' : 'Create Free Account'}
                <ArrowRight size={16} />
              </Link>
              <Link to="/register-clinic" className="btn-outline-white">
                Register Your Clinic
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <span>© 2024 QueueEase. All rights reserved.</span>
          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/register-clinic">For Clinics</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}