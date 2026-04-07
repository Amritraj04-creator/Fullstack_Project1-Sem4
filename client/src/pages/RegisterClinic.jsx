import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Building2, FileText, Stethoscope, MapPin, Phone,
  Mail, Clock, Hash, ArrowRight, CheckCircle
} from 'lucide-react';
import './RegisterClinic.css';

const SPECIALIZATIONS = [
  'General', 'Dentistry', 'Orthopedics', 'Dermatology',
  'Pediatrics', 'Cardiology', 'Ophthalmology', 'ENT',
  'Neurology', 'Gynecology', 'Urology', 'Psychiatry',
];

export default function RegisterClinic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    registrationNumber: '',
    specialization: 'General',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    openTime: '09:00',
    closeTime: '18:00',
    lat: '',
    lng: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ['name', 'registrationNumber', 'specialization', 'street', 'city', 'state', 'pincode', 'phone', 'email'];
    for (const f of required) {
      if (!form[f]) return toast.error(`Please fill in: ${f}`);
    }

    setLoading(true);
    try {
      await api.post('/clinics/register', {
        name: form.name,
        registrationNumber: form.registrationNumber,
        specialization: form.specialization,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
        phone: form.phone,
        email: form.email,
        openTime: form.openTime,
        closeTime: form.closeTime,
        lat: form.lat,
        lng: form.lng,
      });
      setSuccess(true);
      toast.success('Clinic registered successfully! 🏥');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rc-success">
        <div className="rc-success-card">
          <div className="rc-success-icon">
            <CheckCircle size={48} color="var(--green)" />
          </div>
          <h2>Clinic Registered!</h2>
          <p>Your clinic is now live on QueueEase. Patients can find and book tokens at your clinic.</p>
          <div className="rc-success-actions">
            <button className="btn-primary-rc" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
            <button className="btn-ghost-rc" onClick={() => { setSuccess(false); setForm({ name:'',registrationNumber:'',specialization:'General',street:'',city:'',state:'',pincode:'',phone:'',email:'',openTime:'09:00',closeTime:'18:00',lat:'',lng:'' }); }}>
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rc-page">
      <div className="rc-header">
        <div className="container">
          <Building2 size={28} color="var(--teal)" />
          <h1>Register Your Clinic</h1>
          <p>Join QueueEase and let patients book tokens at your clinic digitally.</p>
        </div>
      </div>

      <div className="container rc-body">
        <form className="rc-form" onSubmit={handleSubmit} noValidate>
          {/* Basic Info */}
          <div className="rc-section">
            <div className="rc-section-head">
              <FileText size={18} />
              <span>Basic Information</span>
            </div>
            <div className="rc-grid-2">
              <div className="form-group">
                <label>Clinic Name *</label>
                <div className="rc-input-wrap">
                  <Building2 size={15} className="rc-icon" />
                  <input name="name" placeholder="City Wellness Clinic" value={form.name} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Registration Number *</label>
                <div className="rc-input-wrap">
                  <Hash size={15} className="rc-icon" />
                  <input name="registrationNumber" placeholder="MCI-12345" value={form.registrationNumber} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Specialization *</label>
              <div className="rc-input-wrap">
                <Stethoscope size={15} className="rc-icon" />
                <select name="specialization" value={form.specialization} onChange={handleChange}>
                  {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="rc-section">
            <div className="rc-section-head">
              <MapPin size={18} />
              <span>Address</span>
            </div>
            <div className="form-group">
              <label>Street Address *</label>
              <div className="rc-input-wrap">
                <MapPin size={15} className="rc-icon" />
                <input name="street" placeholder="123 MG Road" value={form.street} onChange={handleChange} />
              </div>
            </div>
            <div className="rc-grid-3">
              <div className="form-group">
                <label>City *</label>
                <input className="rc-bare-input" name="city" placeholder="Mumbai" value={form.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input className="rc-bare-input" name="state" placeholder="Maharashtra" value={form.state} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Pincode *</label>
                <input className="rc-bare-input" name="pincode" placeholder="400001" value={form.pincode} onChange={handleChange} />
              </div>
            </div>
            <div className="rc-grid-2">
              <div className="form-group">
                <label>Latitude (optional)</label>
                <input className="rc-bare-input" name="lat" placeholder="19.0760" value={form.lat} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Longitude (optional)</label>
                <input className="rc-bare-input" name="lng" placeholder="72.8777" value={form.lng} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Contact & Hours */}
          <div className="rc-section">
            <div className="rc-section-head">
              <Phone size={18} />
              <span>Contact & Timings</span>
            </div>
            <div className="rc-grid-2">
              <div className="form-group">
                <label>Phone *</label>
                <div className="rc-input-wrap">
                  <Phone size={15} className="rc-icon" />
                  <input name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Email *</label>
                <div className="rc-input-wrap">
                  <Mail size={15} className="rc-icon" />
                  <input name="email" type="email" placeholder="clinic@example.com" value={form.email} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Opening Time</label>
                <div className="rc-input-wrap">
                  <Clock size={15} className="rc-icon" />
                  <input name="openTime" type="time" value={form.openTime} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Closing Time</label>
                <div className="rc-input-wrap">
                  <Clock size={15} className="rc-icon" />
                  <input name="closeTime" type="time" value={form.closeTime} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="rc-submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : (
              <><span>Register Clinic</span><ArrowRight size={17} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}