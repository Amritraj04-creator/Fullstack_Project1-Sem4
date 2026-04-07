import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Users, Ticket, CheckCircle, XCircle, ToggleLeft, ToggleRight,
  RefreshCw, Settings, Clock, TrendingUp, Phone, Mail, MapPin,
  Edit2, Save, X, RotateCcw, Stethoscope, AlertTriangle,
  BarChart2, List, Hash, PlayCircle, ChevronRight, ArrowRight
} from 'lucide-react';
import './ClinicDashboard.css';

const SPECIALIZATIONS = [
  'General','Dentistry','Orthopedics','Dermatology',
  'Pediatrics','Cardiology','Ophthalmology','ENT',
  'Neurology','Gynecology','Urology','Psychiatry',
];

// Status flow definition
const STATUS_FLOW = {
  waiting:     { next: 'in-progress', nextLabel: 'Start Consultation', nextIcon: PlayCircle,   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',   label: 'Waiting' },
  'in-progress':{ next: 'completed',  nextLabel: 'Mark Completed',     nextIcon: CheckCircle,  color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)',   label: 'In Progress' },
  completed:   { next: null,          nextLabel: null,                  nextIcon: null,          color: '#10B981', bg: 'rgba(16,185,129,0.1)',   label: 'Completed' },
  cancelled:   { next: null,          nextLabel: null,                  nextIcon: null,          color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    label: 'Cancelled' },
};

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const [clinic, setClinic]     = useState(null);
  const [queue, setQueue]       = useState([]);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState(null); // tokenId being updated
  const [editForm, setEditForm] = useState({});

  /* ── Fetch helpers ── */
  const fetchClinic = useCallback(async () => {
    try {
      const { data } = await api.get('/clinics/my-clinic');
      setClinic(data);
      setEditForm({
        name: data.name,
        specialization: data.specialization,
        phone: data.phone,
        email: data.email,
        openTime: data.openTime,
        closeTime: data.closeTime,
        avgWaitTimeMinutes: data.avgWaitTimeMinutes,
        street: data.address?.street,
        city: data.address?.city,
        state: data.address?.state,
        pincode: data.address?.pincode,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('No clinic found. Register one first.');
        navigate('/register-clinic');
      } else {
        toast.error('Failed to load clinic data');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchQueue = useCallback(async () => {
    if (!clinic?._id) return;
    try {
      const { data } = await api.get(`/clinics/${clinic._id}/queue`);
      setQueue(data);
    } catch {
      toast.error('Failed to refresh queue');
    }
  }, [clinic?._id]);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/clinics/my-clinic/history');
      setHistory(data);
    } catch {}
  }, []);

  useEffect(() => { fetchClinic(); }, [fetchClinic]);
  useEffect(() => { if (clinic) { fetchQueue(); fetchHistory(); } }, [clinic, fetchQueue, fetchHistory]);

  // Live auto-refresh every 15 seconds
  useEffect(() => {
    const iv = setInterval(() => { fetchClinic(); fetchQueue(); }, 15000);
    return () => clearInterval(iv);
  }, [fetchClinic, fetchQueue]);

  /* ── Actions ── */
  const handleToggleOpen = async () => {
    setTogglingOpen(true);
    try {
      const { data } = await api.put(`/clinics/${clinic._id}/toggle`);
      setClinic(prev => ({ ...prev, isOpen: data.isOpen }));
      toast.success(data.isOpen ? 'Clinic is now Open 🟢' : 'Clinic is now Closed 🔴');
    } catch { toast.error('Failed to toggle status'); }
    finally { setTogglingOpen(false); }
  };

  // ✅ Core: change a token's status step by step
  const handleChangeStatus = async (token, newStatus) => {
    setChangingStatus(token._id);
    try {
      await api.put(`/tokens/${token._id}/status`, { status: newStatus });

      const messages = {
        'in-progress': `Token #${token.tokenNumber} — Consultation Started 🩺`,
        completed:     `Token #${token.tokenNumber} — Marked as Completed ✅`,
        cancelled:     `Token #${token.tokenNumber} — Cancelled`,
      };
      toast.success(messages[newStatus] || 'Status updated');

      // Refresh everything so patient & admin see latest
      await Promise.all([fetchClinic(), fetchQueue()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setChangingStatus(null);
    }
  };

  const handleResetQueue = async () => {
    if (!window.confirm('⚠️ Cancel ALL active tokens and reset counter to 0? This cannot be undone.')) return;
    try {
      await api.put(`/clinics/${clinic._id}/reset-queue`);
      toast.success('Queue reset successfully');
      fetchClinic(); fetchQueue();
    } catch { toast.error('Failed to reset queue'); }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/clinics/${clinic._id}`, {
        name: editForm.name,
        specialization: editForm.specialization,
        phone: editForm.phone,
        email: editForm.email,
        openTime: editForm.openTime,
        closeTime: editForm.closeTime,
        avgWaitTimeMinutes: editForm.avgWaitTimeMinutes,
        address: { street: editForm.street, city: editForm.city, state: editForm.state, pincode: editForm.pincode },
      });
      toast.success('Clinic details updated ✅');
      setEditing(false);
      fetchClinic();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally { setSaving(false); }
  };

  const maxHistory = Math.max(...(history.map(h => h.total) || [1]), 1);

  if (loading) return <div className="cd-loading"><div className="spinner" /><p>Loading your clinic…</p></div>;
  if (!clinic) return null;

  const { stats } = clinic;
  const inProgressTokens = queue.filter(t => t.status === 'in-progress');
  const waitingTokens    = queue.filter(t => t.status === 'waiting');

  return (
    <div className="cd-page">

      {/* ── Header ── */}
      <div className="cd-header">
        <div className="container cd-header-inner">
          <div className="cd-header-left">
            <div className="cd-clinic-icon"><Stethoscope size={24} color="white" /></div>
            <div>
              <h1>{clinic.name}</h1>
              <p>{clinic.specialization} · {clinic.address?.city}, {clinic.address?.state}</p>
            </div>
          </div>
          <div className="cd-header-right">
            <button
              className={`open-toggle-btn ${clinic.isOpen ? 'is-open' : 'is-closed'}`}
              onClick={handleToggleOpen}
              disabled={togglingOpen}
            >
              {clinic.isOpen ? <><ToggleRight size={18}/>Clinic Open</> : <><ToggleLeft size={18}/>Clinic Closed</>}
            </button>
            <button className="cd-refresh-btn" onClick={() => { fetchClinic(); fetchQueue(); }} title="Refresh">
              <RefreshCw size={15}/>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="container cd-stats-row">
        <StatCard icon={<Users size={20}/>}       label="Waiting"          value={stats.waitingCount}      color="#F59E0B" bg="rgba(245,158,11,0.1)"/>
        <StatCard icon={<PlayCircle size={20}/>}  label="In Progress"      value={stats.inProgressCount}   color="#0EA5E9" bg="rgba(14,165,233,0.1)"/>
        <StatCard icon={<CheckCircle size={20}/>} label="Completed Today"  value={stats.completedToday}    color="#10B981" bg="rgba(16,185,129,0.1)"/>
        <StatCard icon={<XCircle size={20}/>}     label="Cancelled Today"  value={stats.cancelledToday}    color="#EF4444" bg="rgba(239,68,68,0.1)"/>
        <StatCard icon={<Hash size={20}/>}        label="Total Today"      value={stats.totalToday}        color="#8B5CF6" bg="rgba(139,92,246,0.1)"/>
        <StatCard icon={<TrendingUp size={20}/>}  label="All Time Tokens"  value={stats.totalTokensAllTime} color="#14B8A6" bg="rgba(20,184,166,0.1)"/>
      </div>

      {/* ── Tabs ── */}
      <div className="container cd-tabs-wrap">
        <div className="cd-tabs">
          {[
            { id:'queue',    label:`Live Queue (${queue.length})`,  icon: List },
            { id:'overview', label:'Overview & Stats',              icon: BarChart2 },
            { id:'settings', label:'Clinic Settings',               icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} className={`cd-tab-btn ${activeTab===id?'active':''}`} onClick={()=>setActiveTab(id)}>
              <Icon size={15}/>{label}
            </button>
          ))}
        </div>
      </div>

      <div className="container cd-body">

        {/* ══════════════════════════════════════
            QUEUE TAB — main view for admins
        ══════════════════════════════════════ */}
        {activeTab === 'queue' && (
          <div className="cd-queue-tab">

            <div className="cd-queue-top">
              <div className="cd-queue-legend">
                <span className="legend-pill waiting">⏳ Waiting</span>
                <span className="legend-pill in-progress">🩺 In Progress</span>
                <span className="legend-pill completed">✅ Completed</span>
                <ChevronRight size={14} color="var(--gray-400)"/>
                <span className="legend-note">Click buttons to move patient through queue</span>
              </div>
              <div className="cd-queue-top-actions">
                <div className="live-dot-row">
                  <span className="pulse-dot"/>
                  Live · refreshes every 15s
                </div>
                <button className="reset-queue-btn" onClick={handleResetQueue}>
                  <RotateCcw size={13}/> Reset Queue
                </button>
              </div>
            </div>

            {/* ── IN PROGRESS section (highlighted) ── */}
            {inProgressTokens.length > 0 && (
              <div className="cd-queue-section">
                <div className="cds-head in-progress-head">
                  <PlayCircle size={15}/> Currently In Consultation
                  <span className="cds-count">{inProgressTokens.length}</span>
                </div>
                <div className="cd-queue-list">
                  {inProgressTokens.map((token, i) => (
                    <QueueRow
                      key={token._id}
                      token={token}
                      index={i}
                      onChangeStatus={handleChangeStatus}
                      changing={changingStatus === token._id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── WAITING section ── */}
            {waitingTokens.length > 0 && (
              <div className="cd-queue-section">
                <div className="cds-head waiting-head">
                  <Users size={15}/> Waiting
                  <span className="cds-count">{waitingTokens.length}</span>
                </div>
                <div className="cd-queue-list">
                  {waitingTokens.map((token, i) => (
                    <QueueRow
                      key={token._id}
                      token={token}
                      index={i}
                      onChangeStatus={handleChangeStatus}
                      changing={changingStatus === token._id}
                    />
                  ))}
                </div>
              </div>
            )}

            {queue.length === 0 && (
              <div className="cd-empty-queue">
                <Users size={40} color="var(--gray-300)"/>
                <h3>Queue is empty</h3>
                <p>No active patients right now. Waiting for bookings.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="cd-overview">
            <div className="cd-info-card">
              <div className="cd-info-header">
                <h3>Clinic Information</h3>
                <div className={`cd-open-badge ${clinic.isOpen?'open':'closed'}`}>
                  <span className="s-dot"/>{clinic.isOpen?'Open':'Closed'}
                </div>
              </div>
              <div className="cd-info-grid">
                <InfoRow icon={<MapPin size={14}/>}  label="Address"
                  value={`${clinic.address?.street}, ${clinic.address?.city}, ${clinic.address?.state} - ${clinic.address?.pincode}`}/>
                <InfoRow icon={<Phone size={14}/>}   label="Phone"  value={clinic.phone}/>
                <InfoRow icon={<Mail size={14}/>}    label="Email"  value={clinic.email}/>
                <InfoRow icon={<Clock size={14}/>}   label="Timings" value={`${clinic.openTime} – ${clinic.closeTime}`}/>
                <InfoRow icon={<Ticket size={14}/>}  label="Registration No." value={clinic.registrationNumber}/>
                <InfoRow icon={<Clock size={14}/>}   label="Avg Wait Time" value={`${clinic.avgWaitTimeMinutes} minutes per patient`}/>
              </div>
              <div className="cd-token-row">
                <div className="cd-token-box">
                  <p>Currently Serving</p><h2>#{clinic.currentTokenNumber}</h2>
                </div>
                <div className="cd-token-box">
                  <p>Last Token Issued</p><h2>#{clinic.lastTokenIssued}</h2>
                </div>
                <div className="cd-token-box warn">
                  <p>Still Waiting</p><h2>{stats.waitingCount}</h2>
                </div>
              </div>
            </div>

            <div className="cd-history-card">
              <h3>7-Day Token History</h3>
              <div className="cd-chart">
                {history.map(h => (
                  <div key={h.date} className="cd-bar-group">
                    <div className="cd-bars">
                      <div className="cd-bar completed" style={{height:`${(h.completed/maxHistory)*140}px`}} title={`Completed: ${h.completed}`}/>
                      <div className="cd-bar cancelled" style={{height:`${(h.cancelled/maxHistory)*140}px`}} title={`Cancelled: ${h.cancelled}`}/>
                    </div>
                    <span className="cd-bar-label">{new Date(h.date).toLocaleDateString('en-IN',{weekday:'short'})}</span>
                    <span className="cd-bar-total">{h.total}</span>
                  </div>
                ))}
              </div>
              <div className="cd-chart-legend">
                <span><span className="legend-dot completed"/>Completed</span>
                <span><span className="legend-dot cancelled"/>Cancelled</span>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            SETTINGS TAB
        ══════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="cd-settings-tab">
            <div className="cd-settings-header">
              <h3>Edit Clinic Details</h3>
              {!editing
                ? <button className="edit-start-btn" onClick={()=>setEditing(true)}><Edit2 size={15}/> Edit Details</button>
                : <div className="edit-action-btns">
                    <button className="save-btn" onClick={handleSaveEdit} disabled={saving}>
                      {saving ? <span className="btn-spinner-sm"/> : <><Save size={15}/> Save Changes</>}
                    </button>
                    <button className="discard-btn" onClick={()=>setEditing(false)}><X size={15}/> Discard</button>
                  </div>
              }
            </div>
            <div className="cd-settings-form">
              <div className="settings-section">
                <h4>Basic Information</h4>
                <div className="settings-grid-2">
                  <SettingsField label="Clinic Name"      name="name"           value={editForm.name}           editing={editing} onChange={e=>setEditForm({...editForm,name:e.target.value})}/>
                  <SettingsField label="Specialization"   name="specialization" value={editForm.specialization} editing={editing} type="select" options={SPECIALIZATIONS} onChange={e=>setEditForm({...editForm,specialization:e.target.value})}/>
                  <SettingsField label="Phone"            name="phone"          value={editForm.phone}          editing={editing} onChange={e=>setEditForm({...editForm,phone:e.target.value})}/>
                  <SettingsField label="Email"            name="email"          type="email" value={editForm.email} editing={editing} onChange={e=>setEditForm({...editForm,email:e.target.value})}/>
                </div>
              </div>
              <div className="settings-section">
                <h4>Timings</h4>
                <div className="settings-grid-3">
                  <SettingsField label="Opening Time"      name="openTime"           type="time"   value={editForm.openTime}           editing={editing} onChange={e=>setEditForm({...editForm,openTime:e.target.value})}/>
                  <SettingsField label="Closing Time"      name="closeTime"          type="time"   value={editForm.closeTime}          editing={editing} onChange={e=>setEditForm({...editForm,closeTime:e.target.value})}/>
                  <SettingsField label="Avg Wait (minutes)" name="avgWaitTimeMinutes" type="number" value={editForm.avgWaitTimeMinutes} editing={editing} onChange={e=>setEditForm({...editForm,avgWaitTimeMinutes:e.target.value})}/>
                </div>
              </div>
              <div className="settings-section">
                <h4>Address</h4>
                <div className="settings-grid-2">
                  <SettingsField label="Street"  name="street"  value={editForm.street}  editing={editing} onChange={e=>setEditForm({...editForm,street:e.target.value})}/>
                  <SettingsField label="City"    name="city"    value={editForm.city}    editing={editing} onChange={e=>setEditForm({...editForm,city:e.target.value})}/>
                  <SettingsField label="State"   name="state"   value={editForm.state}   editing={editing} onChange={e=>setEditForm({...editForm,state:e.target.value})}/>
                  <SettingsField label="Pincode" name="pincode" value={editForm.pincode} editing={editing} onChange={e=>setEditForm({...editForm,pincode:e.target.value})}/>
                </div>
              </div>
              <div className="settings-section danger-zone">
                <h4><AlertTriangle size={16} color="#EF4444"/> Danger Zone</h4>
                <div className="danger-row">
                  <div>
                    <p className="danger-title">Reset Today's Queue</p>
                    <p className="danger-desc">Cancel all active tokens and reset counter to 0. Cannot be undone.</p>
                  </div>
                  <button className="danger-btn" onClick={handleResetQueue}><RotateCcw size={14}/> Reset Queue</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   QueueRow — individual patient row with status buttons
════════════════════════════════ */
function QueueRow({ token, index, onChangeStatus, changing }) {
  const cfg = STATUS_FLOW[token.status];
  const NextIcon = cfg?.nextIcon;

  return (
    <div className={`cd-queue-item status-${token.status}`}>
      {/* Position */}
      <div className="cdq-pos">{index + 1}</div>

      {/* Token number */}
      <div className={`cdq-token-num status-${token.status}`}>#{token.tokenNumber}</div>

      {/* Patient info */}
      <div className="cdq-patient-info">
        <span className="cdq-name">{token.patientName}</span>
        <span className="cdq-meta">
          {token.reason}
          {token.patient?.phone && ` · 📞 ${token.patient.phone}`}
        </span>
      </div>

      {/* Current status badge */}
      <div className="cdq-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
        <span className="cdq-status-dot" style={{ background: cfg.color }}/>
        {cfg.label}
      </div>

      {/* Action buttons */}
      <div className="cdq-actions">
        {/* Advance status button */}
        {cfg.next && (
          <button
            className={`cdq-advance-btn advance-to-${cfg.next}`}
            onClick={() => onChangeStatus(token, cfg.next)}
            disabled={changing}
            title={cfg.nextLabel}
          >
            {changing
              ? <span className="btn-spinner-sm"/>
              : <>{NextIcon && <NextIcon size={14}/>}{cfg.nextLabel}<ArrowRight size={13}/></>
            }
          </button>
        )}

        {/* Cancel button (only for waiting/in-progress) */}
        {(token.status === 'waiting' || token.status === 'in-progress') && (
          <button
            className="cdq-cancel-btn"
            onClick={() => onChangeStatus(token, 'cancelled')}
            disabled={changing}
            title="Cancel this token"
          >
            <X size={13}/> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Tiny sub-components ── */
function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="cd-stat-card">
      <div className="cd-stat-icon" style={{ color, background: bg }}>{icon}</div>
      <div>
        <p className="cd-stat-label">{label}</p>
        <h3 className="cd-stat-value">{value}</h3>
      </div>
    </div>
  );
}
function InfoRow({ icon, label, value }) {
  return (
    <div className="info-row">
      <div className="info-row-label">{icon}<span>{label}</span></div>
      <p className="info-row-value">{value}</p>
    </div>
  );
}
function SettingsField({ label, name, value, editing, onChange, type='text', options=[] }) {
  return (
    <div className="settings-field">
      <label>{label}</label>
      {editing
        ? type==='select'
          ? <select name={name} value={value} onChange={onChange}>{options.map(o=><option key={o}>{o}</option>)}</select>
          : <input type={type} name={name} value={value} onChange={onChange}/>
        : <p>{value||'—'}</p>
      }
    </div>
  );
}