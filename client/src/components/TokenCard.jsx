import { Clock, MapPin, Hash, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import './TokenCard.css';

const statusConfig = {
  waiting:      { label: 'Waiting',     color: '#B45309', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)' },
  'in-progress':{ label: 'Your Turn! 🩺', color: '#0369A1', bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.5)' },
  completed:    { label: 'Completed',   color: '#047857', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  cancelled:    { label: 'Cancelled',   color: '#DC2626', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
};

export default function TokenCard({ token, onCancel, highlight }) {
  const cfg = statusConfig[token.status] || statusConfig.waiting;
  const isActive  = token.status === 'waiting' || token.status === 'in-progress';
  const isTurn    = token.status === 'in-progress';

  const estimatedTime = token.estimatedTime
    ? new Date(token.estimatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`token-card ${token.status} ${isTurn ? 'your-turn-card' : ''} ${highlight ? 'highlight-card' : ''}`}>
      {/* YOUR TURN banner */}
      {isTurn && (
        <div className="your-turn-banner">
          <span className="yt-pulse"/>
          <span>🩺 It's your turn! Please proceed to the consultation room.</span>
        </div>
      )}

      <div className="token-card-inner">
        {/* Token number */}
        <div className={`token-number-section ${token.status}`}>
          <div className="token-badge">
            <Hash size={12}/>
            <span className="tn">{token.tokenNumber}</span>
          </div>
          {token.queuePosition && token.status === 'waiting' && (
            <div className="queue-pos">#{token.queuePosition} in queue</div>
          )}
        </div>

        {/* Details */}
        <div className="token-details">
          <h4 className="token-clinic-name">{token.clinic?.name || 'Clinic'}</h4>
          <div className="token-meta">
            <span><MapPin size={11}/>{token.clinic?.address?.city || '—'}</span>
            {estimatedTime && token.status === 'waiting' && (
              <span><Clock size={11}/>Est. {estimatedTime}</span>
            )}
          </div>
          <p className="token-reason">{token.reason}</p>

          {/* People ahead */}
          {token.status === 'waiting' && typeof token.peopleAhead === 'number' && (
            <p className="people-ahead">
              {token.peopleAhead === 0
                ? '🔜 You are next!'
                : `${token.peopleAhead} person${token.peopleAhead > 1 ? 's' : ''} ahead of you`
              }
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="token-right">
          <div
            className="token-status-badge"
            style={{ color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.border}` }}
          >
            {isTurn && <span className="status-pulse-dot" style={{ background: cfg.color }}/>}
            {cfg.label}
          </div>

          {token.status === 'completed' && (
            <div className="completed-icon"><CheckCircle size={18} color="var(--green)"/></div>
          )}
          {token.status === 'cancelled' && (
            <div className="completed-icon"><AlertCircle size={18} color="var(--red)"/></div>
          )}

          {isActive && onCancel && (
            <button className="cancel-btn" onClick={() => onCancel(token._id)}>
              <X size={13}/> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}