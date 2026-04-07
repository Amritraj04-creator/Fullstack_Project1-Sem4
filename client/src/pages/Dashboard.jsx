import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ClinicCard from '../components/ClinicCard';
import TokenCard from '../components/TokenCard';
import {
  Search, MapPin, RefreshCw, Ticket, Building2,
  SlidersHorizontal, X, Bell, ArrowRight
} from 'lucide-react';
import './Dashboard.css';

const SPECIALIZATIONS = ['All','General','Dentistry','Orthopedics','Dermatology','Pediatrics','Cardiology','Ophthalmology','ENT'];

export default function Dashboard() {
  const { user } = useAuth();
  const [clinics, setClinics]         = useState([]);
  const [tokens, setTokens]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [search, setSearch]           = useState('');
  const [city, setCity]               = useState('');
  const [spec, setSpec]               = useState('All');
  const [activeTab, setActiveTab]     = useState('clinics');
  const prevTokenStatuses = useRef({});  // track status changes for notifications

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (city)   params.city   = city;
      if (spec !== 'All') params.specialization = spec;
      const { data } = await api.get('/clinics', { params });
      setClinics(data);
    } catch { toast.error('Failed to load clinics'); }
    finally { setLoading(false); }
  }, [search, city, spec]);

  const fetchTokens = useCallback(async (silent = false) => {
    if (!silent) setTokensLoading(true);
    try {
      const { data } = await api.get('/tokens/my');
      
      // Detect status changes and notify patient
      data.forEach(token => {
        const prev = prevTokenStatuses.current[token._id];
        if (prev && prev !== token.status) {
          if (token.status === 'in-progress') {
            toast.success(`🩺 It's your turn at ${token.clinic?.name}! Token #${token.tokenNumber}`, { duration: 8000 });
          } else if (token.status === 'completed') {
            toast.success(`✅ Consultation completed at ${token.clinic?.name}`, { duration: 5000 });
          }
        }
        prevTokenStatuses.current[token._id] = token.status;
      });

      setTokens(data);
    } catch { if (!silent) toast.error('Failed to load your tokens'); }
    finally { if (!silent) setTokensLoading(false); }
  }, []);

  useEffect(() => { fetchClinics(); }, [fetchClinics]);
  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  // Fast polling every 10 seconds for tokens (patient sees real-time updates)
  useEffect(() => {
    const iv = setInterval(() => {
      fetchTokens(true);   // silent — no spinner
      fetchClinics();
    }, 10000);
    return () => clearInterval(iv);
  }, [fetchTokens, fetchClinics]);

  const handleCancel = async (tokenId) => {
    if (!window.confirm('Cancel this token?')) return;
    try {
      await api.put(`/tokens/${tokenId}/cancel`);
      toast.success('Token cancelled');
      fetchTokens();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const clearFilters = () => { setSearch(''); setCity(''); setSpec('All'); };
  const hasFilters   = search || city || spec !== 'All';

  const activeTokens  = tokens.filter(t => t.status === 'waiting' || t.status === 'in-progress');
  const yourTurnTokens = tokens.filter(t => t.status === 'in-progress');
  const pastTokens    = tokens.filter(t => t.status === 'completed' || t.status === 'cancelled');

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-header">
        <div className="container dash-header-inner">
          <div>
            <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
            <p>Find clinics nearby and manage your queue tokens</p>
          </div>
          <div className="dash-header-actions">
            {yourTurnTokens.length > 0 && (
              <button
                className="your-turn-chip"
                onClick={() => setActiveTab('tokens')}
              >
                <Bell size={14}/>
                It's your turn!
              </button>
            )}
            {activeTokens.length > 0 && yourTurnTokens.length === 0 && (
              <div className="active-token-chip">
                <span className="pulse-dot"/>
                {activeTokens.length} active token{activeTokens.length > 1 ? 's' : ''}
              </div>
            )}
            <button className="refresh-btn" onClick={() => { fetchClinics(); fetchTokens(); }} title="Refresh">
              <RefreshCw size={16}/>
            </button>
          </div>
        </div>
      </div>

      {/* YOUR TURN alert banner */}
      {yourTurnTokens.length > 0 && (
        <div className="global-turn-banner">
          <div className="container gtb-inner">
            <div className="gtb-left">
              <Bell size={18}/>
              <div>
                <strong>It's your turn!</strong>
                <span> — Please proceed to {yourTurnTokens[0].clinic?.name} for your consultation.</span>
              </div>
            </div>
            <button className="gtb-view-btn" onClick={() => setActiveTab('tokens')}>
              View Token <ArrowRight size={14}/>
            </button>
          </div>
        </div>
      )}

      <div className="container dash-body">
        {/* Tabs */}
        <div className="dash-tabs">
          <button className={`tab-btn ${activeTab==='clinics'?'active':''}`} onClick={()=>setActiveTab('clinics')}>
            <Building2 size={15}/> Find Clinics
          </button>
          <button className={`tab-btn ${activeTab==='tokens'?'active':''}`} onClick={()=>setActiveTab('tokens')}>
            <Ticket size={15}/> My Tokens
            {yourTurnTokens.length > 0
              ? <span className="tab-badge turn-badge">Your Turn!</span>
              : activeTokens.length > 0
                ? <span className="tab-badge">{activeTokens.length}</span>
                : null
            }
          </button>
        </div>

        {/* ── Clinics Tab ── */}
        {activeTab === 'clinics' && (
          <div>
            <div className="filters-bar">
              <div className="search-wrap">
                <Search size={16} className="search-icon"/>
                <input type="text" placeholder="Search clinics..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div className="filter-wrap">
                <MapPin size={16} className="filter-icon"/>
                <input type="text" placeholder="City" value={city} onChange={e=>setCity(e.target.value)}/>
              </div>
              <button className="filter-apply-btn" onClick={fetchClinics}>
                <SlidersHorizontal size={14}/> Search
              </button>
              {hasFilters && (
                <button className="clear-btn" onClick={clearFilters}><X size={14}/> Clear</button>
              )}
            </div>

            <div className="spec-chips">
              {SPECIALIZATIONS.map(s => (
                <button key={s} className={`spec-chip ${spec===s?'active':''}`} onClick={()=>setSpec(s)}>{s}</button>
              ))}
            </div>

            {loading ? (
              <div className="clinics-grid">
                {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{height:220}}/>)}
              </div>
            ) : clinics.length === 0 ? (
              <div className="empty-state">
                <Building2 size={40} color="var(--gray-300)"/>
                <h3>No clinics found</h3>
                <p>Try adjusting your search or filters</p>
                {hasFilters && <button className="btn-link" onClick={clearFilters}>Clear filters</button>}
              </div>
            ) : (
              <>
                <p className="result-count">{clinics.length} clinic{clinics.length!==1?'s':''} found</p>
                <div className="clinics-grid">
                  {clinics.map(c => <ClinicCard key={c._id} clinic={c}/>)}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tokens Tab ── */}
        {activeTab === 'tokens' && (
          <div>
            {tokensLoading ? (
              <div className="tokens-list">
                {[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{height:100}}/>)}
              </div>
            ) : tokens.length === 0 ? (
              <div className="empty-state">
                <Ticket size={40} color="var(--gray-300)"/>
                <h3>No tokens yet</h3>
                <p>Find a clinic and book your first token</p>
                <button className="btn-link" onClick={()=>setActiveTab('clinics')}>Browse clinics →</button>
              </div>
            ) : (
              <>
                {/* YOUR TURN tokens — top priority, most visible */}
                {yourTurnTokens.length > 0 && (
                  <div className="token-section">
                    <h3 className="section-head turn-head">🩺 Your Turn Now</h3>
                    <div className="tokens-list">
                      {yourTurnTokens.map(t => (
                        <TokenCard key={t._id} token={t} onCancel={handleCancel} highlight/>
                      ))}
                    </div>
                  </div>
                )}

                {/* Waiting tokens */}
                {activeTokens.filter(t=>t.status==='waiting').length > 0 && (
                  <div className="token-section">
                    <h3 className="section-head">⏳ Waiting</h3>
                    <div className="tokens-list">
                      {activeTokens.filter(t=>t.status==='waiting').map(t => (
                        <TokenCard key={t._id} token={t} onCancel={handleCancel}/>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past tokens */}
                {pastTokens.length > 0 && (
                  <div className="token-section">
                    <h3 className="section-head">History</h3>
                    <div className="tokens-list">
                      {pastTokens.map(t => <TokenCard key={t._id} token={t}/>)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}