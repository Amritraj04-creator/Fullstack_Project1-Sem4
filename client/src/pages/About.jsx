import { Link } from 'react-router-dom';
import { Activity, Clock, MapPin, Shield, Users, Zap, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './About.css';

const values = [
  { icon: Heart, title: 'Patient First', desc: 'Every design decision starts with improving the patient experience.', color: '#EF4444' },
  { icon: Zap, title: 'Simplicity', desc: 'Complex technology hidden behind a simple, intuitive interface.', color: '#F59E0B' },
  { icon: Shield, title: 'Trust & Privacy', desc: 'Your medical data stays private and is never monetized or shared.', color: '#0EA5E9' },
  { icon: Users, title: 'Accessibility', desc: 'Built for everyone — from metro cities to tier-2 towns across India.', color: '#10B981' },
];

const howItWorksDetail = [
  {
    num: '01',
    title: 'Create a free account',
    desc: 'Sign up in seconds with just your name and email. No subscriptions, no hidden fees.',
    icon: Users,
  },
  {
    num: '02',
    title: 'Discover nearby clinics',
    desc: 'Browse verified clinics in your city, filter by specialization, and check live wait times before you decide.',
    icon: MapPin,
  },
  {
    num: '03',
    title: 'Book your token instantly',
    desc: 'Tap "Book Token", choose your reason for visit, and get your token number and estimated wait time immediately.',
    icon: Clock,
  },
  {
    num: '04',
    title: 'Walk in right on time',
    desc: 'Track the live queue from home. Get notified when your turn is near. Arrive at the clinic just in time — no waiting.',
    icon: Zap,
  },
];

export default function About() {
  const { user } = useAuth();

  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-bg">
          <div className="ah-blob-1" />
          <div className="ah-blob-2" />
        </div>
        <div className="container about-hero-content">
          <div className="about-tag fade-up">Our Mission</div>
          <h1 className="fade-up-1">
            Healthcare should be about <span className="hl">healing</span>,
            <br />not <span className="hl-red">waiting</span>.
          </h1>
          <p className="fade-up-2">
            QueueEase was built from a frustrating experience — spending hours at a clinic waiting
            for a 5-minute consultation. We knew there had to be a better way.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="story-section">
        <div className="container story-inner">
          <div className="story-text">
            <div className="section-label-about">Our Story</div>
            <h2>Built by patients, for patients.</h2>
            <p>
              Every year, millions of people across India spend hours standing in queues at clinics and
              hospitals. This isn't just inconvenient — it's exhausting, especially for the elderly, people
              with chronic conditions, and busy working individuals.
            </p>
            <p>
              QueueEase digitizes the token system that clinics already use, making it accessible from
              any smartphone. No special hardware needed. No complex setup for clinics. Just a seamless
              connection between patients and the care they need.
            </p>
          </div>
          <div className="story-visual">
            <div className="sv-card sv-card-1">
              <div className="sv-icon"><Activity size={20} color="white" /></div>
              <p>Live Queue Tracking</p>
              <div className="sv-bar"><div style={{ width: '65%' }} /></div>
              <span>Token #38 of 58 served</span>
            </div>
            <div className="sv-card sv-card-2">
              <Clock size={16} color="var(--teal)" />
              <p>Your estimated wait</p>
              <h3>~12 min</h3>
            </div>
            <div className="sv-card sv-card-3">
              <span className="sv-num">500+</span>
              <p>Clinics onboarded</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (detailed) */}
      <section className="hiw-section">
        <div className="container">
          <div className="section-label-about">How It Works</div>
          <h2>Four steps to a stress-free visit.</h2>
          <div className="hiw-list">
            {howItWorksDetail.map((step, i) => (
              <div className="hiw-item" key={step.num}>
                <div className="hiw-left">
                  <div className="hiw-num">{step.num}</div>
                  <div className="hiw-line" />
                </div>
                <div className="hiw-body">
                  <div className="hiw-icon"><step.icon size={20} /></div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="values-section">
        <div className="container">
          <div className="section-label-about">What We Stand For</div>
          <h2>Our core values.</h2>
          <div className="values-grid">
            {values.map((v) => (
              <div className="value-card" key={v.title}>
                <div className="value-icon" style={{ background: `${v.color}15`, color: v.color }}>
                  <v.icon size={22} />
                </div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container">
          <div className="about-cta-box">
            <h2>Ready to skip the wait?</h2>
            <p>Join thousands of patients and hundreds of clinics already on QueueEase.</p>
            <Link to={user ? '/dashboard' : '/signup'} className="about-cta-btn">
              {user ? 'Open Dashboard' : 'Get Started Free'}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}