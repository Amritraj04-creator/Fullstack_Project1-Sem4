import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, Users, ChevronRight, Stethoscope } from 'lucide-react';
import './ClinicCard.css';

const specializationColors = {
  'General': '#0EA5E9',
  'Dentistry': '#8B5CF6',
  'Orthopedics': '#F59E0B',
  'Dermatology': '#EC4899',
  'Pediatrics': '#10B981',
  'Cardiology': '#EF4444',
  'Ophthalmology': '#6366F1',
  'ENT': '#14B8A6',
};

export default function ClinicCard({ clinic }) {
  const color = specializationColors[clinic.specialization] || '#0EA5E9';
  const waitingCount = clinic.waitingCount ?? 0;

  return (
    <Link to={`/clinic/${clinic._id}`} className="clinic-card">
      <div className="clinic-card-header" style={{ '--accent': color }}>
        <div className="clinic-icon-wrap" style={{ background: `${color}18` }}>
          <Stethoscope size={22} color={color} />
        </div>
        <div className={`clinic-status ${clinic.isOpen ? 'open' : 'closed'}`}>
          <span className="status-dot" />
          {clinic.isOpen ? 'Open' : 'Closed'}
        </div>
      </div>

      <div className="clinic-card-body">
        <h3 className="clinic-name">{clinic.name}</h3>
        <span className="clinic-spec" style={{ color, background: `${color}12` }}>
          {clinic.specialization}
        </span>

        <div className="clinic-meta">
          <div className="meta-item">
            <MapPin size={13} />
            <span>{clinic.address?.city}, {clinic.address?.state}</span>
          </div>
          <div className="meta-item">
            <Clock size={13} />
            <span>{clinic.openTime} – {clinic.closeTime}</span>
          </div>
          {clinic.rating > 0 && (
            <div className="meta-item">
              <Star size={13} fill="#F59E0B" color="#F59E0B" />
              <span>{clinic.rating.toFixed(1)} ({clinic.totalRatings})</span>
            </div>
          )}
        </div>
      </div>

      <div className="clinic-card-footer">
        <div className="queue-info">
          <Users size={14} />
          <span>
            <strong>{waitingCount}</strong> in queue
          </span>
          {clinic.currentTokenNumber > 0 && (
            <span className="current-token">
              · Now serving <strong>#{clinic.currentTokenNumber}</strong>
            </span>
          )}
        </div>
        <div className="book-btn">
          Book <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  );
}