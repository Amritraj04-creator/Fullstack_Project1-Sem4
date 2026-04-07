import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  MapPin, Clock, Phone, Mail, Star, Users, ChevronLeft,
  Ticket, RefreshCw, Stethoscope, ArrowRight
} from 'lucide-react';
import './ClinicDetail.css';

export default function ClinicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [reason, setReason] = useState('General Checkup');
  const [showForm, setShowForm] = useState(false);
  const [myToken, setMyToken] = useState(null);

  const fetchClinic = async () => {
    try {
      const [clinicRes, queueRes] = await Promise.all([
        api.get(`/clinics/${id}`),
        api.get(`/clinics/${id}/queue`),
      ]);
      setClinic(clinicRes.data);
      setQueue(queueRes.data);
    } catch {
      toast.error('Failed to load clinic');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyToken = async () => {
    try {
      const { data } = await api.get('/tokens/my');
      const today = new Date().toISOString().split('T')[0];
      const active = data.find(
        (t) => t.clinic?._id === id && t.date === today &&
          (t.status === 'waiting' || t.status === 'in-progress')
      );
      setMyToken(active || null);
    } catch {}
  };

  useEffect(() => {
    fetchClinic();
    fetchMyToken();
    const iv = setInterval(() => { fetchClinic(); fetchMyToken(); }, 20000);
    return () => clearInterval(iv);
  }, [id]);

  const bookToken = async () => {
    setBooking(true);
    try {
      const { data } = await api.post('/tokens/book', { clinicId: id, reason });
      toast.success(`Token #${data.tokenNumber} booked! 🎉`);
      setMyToken(data);
      setShowForm(false);
      fetchClinic();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const cancelMyToken = async () => {
    if (!window.confirm('Cancel your token?')) return;
    try {
      await api.put(`/tokens/${myToken._id}/cancel`);
      toast.success('Token cancelled');
      setMyToken(null);
      fetchClinic();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="spinner" />
        <p>Loading clinic…</p>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="detail-loading">
        <p>Clinic not found.</p>
        <button onClick={() => navigate('/dashboard')}>← Back</button>
      </div>
    );
  }

  const waitingCount = queue.filter((t) => t.status === 'waiting').length;
  const myPosition = myToken
    ? queue.findIndex((t) => t._id === myToken._id) + 1
    : null;

  return (
    <div className="detail-page">
      {/* Back */}
      <div className="container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ChevronLeft size={18} />
          Back to Dashboard
        </button>
      </div>

      {/* Clinic Hero */}
      <div className="detail-hero">
        <div className="container detail-hero-inner">
          <div className="detail-icon">
            <Stethoscope size={28} color="white" />
          </div>
          <div className="detail-info">
            <div className="detail-top-row">
              <h1>{clinic.name}</h1>
              <div className={`status-pill ${clinic.isOpen ? 'open' : 'closed'}`}>
                <span className="s-dot" />
                {clinic.isOpen ? 'Open Now' : 'Closed'}
              </div>
            </div>
            <p className="detail-spec">{clinic.specialization}</p>
            <div className="detail-meta">
              <span><MapPin size={14} />{clinic.address.street}, {clinic.address.city}, {clinic.address.state} - {clinic.address.pincode}</span>
              <span><Clock size={14} />{clinic.openTime} – {clinic.closeTime}</span>
              <span><Phone size={14} />{clinic.phone}</span>
              <span><Mail size={14} />{clinic.email}</span>
              {clinic.rating > 0 && (
                <span><Star size={14} fill="#F59E0B" color="#F59E0B" />{clinic.rating.toFixed(1)} ({clinic.totalRatings} reviews)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container detail-body">
        <div className="detail-grid">
          {/* Left column */}
          <div>
            {/* My Token Card */}
            {myToken && (
              <div className="my-token-card fade-up">
                <div className="my-token-header">
                  <span>Your Token</span>
                  <span className={`token-status-pill ${myToken.status}`}>
                    {myToken.status === 'in-progress' ? '🟢 In Progress' : '🟡 Waiting'}
                  </span>
                </div>
                <div className="my-token-number">#{myToken.tokenNumber}</div>
                <div className="my-token-meta">
                  <div>
                    <p>Reason</p>
                    <strong>{myToken.reason}</strong>
                  </div>
                  {myPosition && (
                    <div>
                      <p>Queue Position</p>
                      <strong>#{myPosition}</strong>
                    </div>
                  )}
                  <div>
                    <p>People Ahead</p>
                    <strong>{Math.max(0, (myPosition || 1) - 1)}</strong>
                  </div>
                </div>
                <button className="cancel-token-btn" onClick={cancelMyToken}>
                  Cancel Token
                </button>
              </div>
            )}

            {/* Book Token */}
            {!myToken && clinic.isOpen && (
              <div className="book-section fade-up">
                {!showForm ? (
                  <button className="book-main-btn" onClick={() => setShowForm(true)}>
                    <Ticket size={18} />
                    Book a Token
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <div className="book-form">
                    <h3>Book Your Token</h3>
                    <div className="form-group-d">
                      <label>Reason for Visit</label>
                      <select value={reason} onChange={(e) => setReason(e.target.value)}>
                        <option>General Checkup</option>
                        <option>Follow-up</option>
                        <option>New Consultation</option>
                        <option>Lab Report</option>
                        <option>Prescription Renewal</option>
                        <option>Emergency</option>
                      </select>
                    </div>
                    <div className="book-form-actions">
                      <button className="confirm-btn" onClick={bookToken} disabled={booking}>
                        {booking ? <span className="btn-spinner" /> : 'Confirm Booking'}
                      </button>
                      <button className="cancel-btn-form" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Queue Stats */}
            <div className="queue-stats fade-up-1">
              <div className="qs-card">
                <Users size={20} color="var(--teal)" />
                <div>
                  <p>In Queue</p>
                  <strong>{waitingCount}</strong>
                </div>
              </div>
              <div className="qs-card">
                <Ticket size={20} color="var(--amber)" />
                <div>
                  <p>Current Token</p>
                  <strong>#{clinic.currentTokenNumber || 0}</strong>
                </div>
              </div>
              <div className="qs-card">
                <Clock size={20} color="var(--green)" />
                <div>
                  <p>Avg Wait</p>
                  <strong>{clinic.avgWaitTimeMinutes} min</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right column – Live Queue */}
          <div>
            <div className="live-queue-header">
              <h2>Live Queue</h2>
              <button className="mini-refresh" onClick={fetchClinic}>
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            {queue.length === 0 ? (
              <div className="empty-queue">
                <Users size={32} color="var(--gray-300)" />
                <p>Queue is empty</p>
              </div>
            ) : (
              <div className="queue-list">
                {queue.map((t, i) => (
                  <div
                    key={t._id}
                    className={`queue-item ${t.status} ${myToken?._id === t._id ? 'mine' : ''}`}
                  >
                    <div className="qi-pos">{i + 1}</div>
                    <div className="qi-token">#{t.tokenNumber}</div>
                    <div className="qi-info">
                      <span>{t.patientName}</span>
                      <small>{t.reason}</small>
                    </div>
                    <div className={`qi-status ${t.status}`}>
                      {t.status === 'in-progress' ? 'In Progress' : 'Waiting'}
                    </div>
                    {myToken?._id === t._id && (
                      <div className="you-tag">You</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}