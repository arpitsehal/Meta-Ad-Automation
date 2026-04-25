import React, { useState, useEffect } from 'react';
import { Rocket, MapPin, X, ChevronDown, ChevronRight, Building2, Layers } from 'lucide-react';
import './Campaigns.css';
import { INDIA_STATES_DATA } from '../data/indiaLocations';

// ── Indian districts organised by pharmaceutical demand profile ────────────────
const DISTRICT_GROUPS = [
  {
    group: 'Tier 1 – Ultra High Pharma Demand (Metros)',
    districts: [
      'Mumbai City', 'Mumbai Suburban', 'Pune', 'Thane', 'Ahmedabad', 'Surat', 
      'Bengaluru Urban', 'Hyderabad', 'Chennai', 'Kolkata', 'Coimbatore', 'Ernakulam (Kochi)'
    ],
  },
  {
    group: 'Tier 2 – High Density Pharma Hubs (B2B & Distribution)',
    districts: [
      'Vadodara', 'Indore', 'Bhopal', 'Nagpur', 'Nashik', 'Aurangabad', 'Rajkot',
      'Visakhapatnam', 'Vijayawada', 'Guntur', 'Madurai', 'Tiruchirappalli', 'Salem',
      'Mysuru', 'Hubli-Dharwad', 'Mangaluru', 'Thiruvananthapuram', 'Kozhikode',
      'Raipur', 'Bhubaneswar', 'Cuttack', 'Ranchi', 'Jamshedpur', 'Guwahati',
      'Jabalpur', 'Gwalior', 'Haora', 'Dhanbad', 'Anantapur', 'Chittoor'
    ],
  },
  {
    group: 'Tier 3 – Emerging Retail Markets (Large Scale Coverage)',
    districts: [
      'Anand', 'Bharuch', 'Bhavnagar', 'Jamnagar', 'Amreli', 'Junagadh', 'Kutch', 'Mehsana',
      'Ahmednagar', 'Kolhapur', 'Solapur', 'Amravati', 'Sangli', 'Satara', 'Jalgaon', 'Latur',
      'Belagavi', 'Davanagere', 'Ballari', 'Tumakuru', 'Udupi', 'Shivamogga', 'Hassan', 'Bidar',
      'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Kadapa', 'East Godavari', 'West Godavari',
      'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam', 'Mahabubnagar',
      'Kanyakumari', 'Vellore', 'Erode', 'Thanjavur', 'Dindigul', 'Virudhunagar',
      'Thrissur', 'Palakkad', 'Malappuram', 'Kottayam', 'Kannur', 'Alappuzha',
      'Khordha', 'Baleswar', 'Sambalpur', 'Puri', 'Ganjam', 'Angul',
      'Bokaro', 'Hazaribagh', 'Palamu', 'Deoghar', 'West Singhbhum',
      'Kamrup Metropolitan', 'Cachar', 'Nagaon', 'Dhubri', 'Jorhat', 'Dibrugarh',
      'Bilaspur', 'Durg', 'Korba', 'Rajnandgaon', 'Surguja'
    ],
  },
];

// ── Industry Keywords for Pharma B2B ─────────────────────────────────────────
// ── Industry Keywords (Compatible with Meta Interest Database) ─────────────────
const PHARMA_KEYWORDS = {
  industry: ['Pharmaceuticals', 'Healthcare industry', 'Pharmacy', 'Medicine', 'Medical manufacturing'],
  professional: ['Physician', 'Doctor of Medicine', 'Pharmacist', 'Medical occupation', 'Health care provider'],
  specialty: ['Ayurvedic medicine', 'Dermatology', 'Neurology', 'Pediatrics', 'Cardiology'],
};

const ALL_DISTRICTS = DISTRICT_GROUPS.flatMap(g => g.districts);

const Campaigns = () => {
  const [campaignData, setCampaignData] = useState({
    name: '',
    target_audience: 'doctors',
    budget: '',
    objective: 'OUTCOME_TRAFFIC',
    lead_gen_form_id: ''
  });
  const [leadForms, setLeadForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [districtSearch, setDistrictSearch] = useState('');
  
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  
  const [statusMsg, setStatusMsg] = useState('');
  const [campaignsList, setCampaignsList] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState('Tier 1 – Ultra High Pharma Demand (Metros)');
  const [targetingMode, setTargetingMode] = useState('tiers'); // 'tiers' or 'branches'
  const [expandedState, setExpandedState] = useState(null);

  const loadCampaigns = () =>
    fetch('http://localhost:3001/api/campaigns')
      .then(res => res.json())
      .then(data => setCampaignsList(data))
      .catch(err => console.error(err));

  const loadLeadForms = () => {
    setLoadingForms(true);
    fetch('http://localhost:3001/api/meta/lead-forms')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLeadForms(data);
          if (data.length > 0 && !campaignData.lead_gen_form_id) {
            setCampaignData(prev => ({ ...prev, lead_gen_form_id: data[0].id }));
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingForms(false));
  };

  useEffect(() => { 
    loadCampaigns(); 
    loadLeadForms();
  }, []);

  // ── Auto-suggestion logic ──────────────────────────────────
  const getAutoSuggestions = () => {
    const audience = campaignData.target_audience;
    if (audience === 'doctors') return ['Medical Practitioner', 'Clinic Owner', 'Pharma Hub', 'Specialist Outreach'];
    if (audience === 'patients') return ['Healthcare Services', 'Pharmacy Near Me', 'Medicine Online', 'Health Tips'];
    return ['Pharma Business', 'Medicine Distribution', 'Drug License Help', 'B2B Pharma'];
  };

  // ── District selection helpers ────────────────────────────
  const toggleDistrict = (district) => {
    setSelectedDistricts(prev =>
      prev.includes(district) ? prev.filter(c => c !== district) : [...prev, district]
    );
  };

  const selectGroup = (districts) => {
    setSelectedDistricts(prev => {
      const allIn = districts.every(c => prev.includes(c));
      if (allIn) return prev.filter(c => !districts.includes(c));
      return [...new Set([...prev, ...districts])];
    });
  };

  const clearDistricts = () => setSelectedDistricts([]);
  const selectAll = () => setSelectedDistricts([...ALL_DISTRICTS]);

  const selectStateDistricts = (districts) => {
    setSelectedDistricts(prev => {
      const allIn = districts.every(c => prev.includes(c));
      if (allIn) return prev.filter(c => !districts.includes(c));
      return [...new Set([...prev, ...districts])];
    });
  };

  const filteredGroups = DISTRICT_GROUPS.map(g => ({
    ...g,
    districts: districtSearch
      ? g.districts.filter(c => c.toLowerCase().includes(districtSearch.toLowerCase()))
      : g.districts,
  })).filter(g => g.districts.length > 0);

  const filteredStates = INDIA_STATES_DATA.map(s => ({
    ...s,
    districts: districtSearch
      ? s.districts.filter(c => c.toLowerCase().includes(districtSearch.toLowerCase()))
      : s.districts,
  })).filter(s => s.districts.length > 0);

  // ── Keyword helpers ───────────────────────────────────────
  const addKeyword = (kw) => {
    if (!kw || selectedKeywords.includes(kw)) return;
    setSelectedKeywords([...selectedKeywords, kw]);
    setKeywordInput('');
  };

  const removeKeyword = (kw) => setSelectedKeywords(selectedKeywords.filter(k => k !== kw));

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword(keywordInput.trim());
    }
  };

  // ── Handlers ─────────────────────────────────────────────
  const handleLaunch = async () => {
    if (selectedDistricts.length === 0) {
      return setStatusMsg('⚠️ Please select at least one target district.');
    }
    if (campaignData.objective === 'OUTCOME_LEADS' && !campaignData.lead_gen_form_id) {
      return setStatusMsg('⚠️ Please select a Lead Form for Lead Generation ads.');
    }

    // Auto-add any pending text in the keyword input box
    let finalKeywords = [...selectedKeywords];
    if (keywordInput.trim() && !finalKeywords.includes(keywordInput.trim())) {
      finalKeywords.push(keywordInput.trim());
    }

    setStatusMsg('Creating campaign draft...');
    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:3001/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...campaignData, 
          target_cities: selectedDistricts,
          target_keywords: finalKeywords 
        }),
      });
      const result = await response.json();
      setStatusMsg(result.message || 'Draft created!');
      setSelectedKeywords([]); // Clear for next
      setKeywordInput('');
      loadCampaigns();
      setTimeout(() => setStatusMsg(''), 4000);
    } catch {
      setStatusMsg('Failed to connect to backend.');
    } finally {
      setIsCreating(false);
    }
  };

  const handlePublish = async (id) => {
    setStatusMsg(`Publishing campaign ${id}...`);
    setPublishingId(id);
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${id}/publish`, { method: 'PUT' });
      const result = await response.json();
      setStatusMsg(result.message || result.error || 'Published');
      loadCampaigns();
      setTimeout(() => setStatusMsg(''), 4000);
    } catch { setStatusMsg('Failed to publish.'); }
    finally { setPublishingId(null); }
  };

  const handleStop = async (id) => {
    setStatusMsg(`Stopping campaign ${id}...`);
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${id}/stop`, { method: 'PUT' });
      const result = await response.json();
      setStatusMsg(result.message || 'Stopped');
      loadCampaigns();
      setTimeout(() => setStatusMsg(''), 4000);
    } catch { setStatusMsg('Failed to stop.'); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/campaigns/${id}`, { method: 'DELETE' });
      setStatusMsg('Draft deleted.');
      loadCampaigns();
      setTimeout(() => setStatusMsg(''), 3000);
    } catch { setStatusMsg('Failed to delete.'); }
  };

  const handleCreateLeadForm = async () => {
    setStatusMsg('Creating Lead Form...');
    try {
      const response = await fetch('http://localhost:3001/api/meta/lead-forms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Contact Form - ${new Date().toISOString().replace('T', ' ').slice(0, 19)}` }),
      });
      const data = await response.json();
      if (data.id) {
        setStatusMsg('Lead Form created successfully!');
        setCampaignData(prev => ({ ...prev, lead_gen_form_id: data.id }));
        loadLeadForms(); // Refresh the list
      } else {
        setStatusMsg(data.error || 'Failed to create form.');
      }
    } catch (err) {
      setStatusMsg('Failed to connect to backend.');
    }
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="campaigns-container animate-fade-in">
      <div className="header">
        <h1 className="title">Campaign Automation</h1>
        <p className="subtitle">Select target districts, set your budget, and launch your Meta campaign for the Indian pharmaceutical market.</p>
      </div>

      {/* ── New Campaign Form ─────────────────────────────── */}
      <div className="glass-panel automation-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Rocket color="var(--accent-primary)" />
          <h2 className="title" style={{ margin: 0 }}>Create New Campaign</h2>
        </div>

        <div className="form-grid">
          {/* Campaign Name */}
          <div className="form-group">
            <label>Campaign Name</label>
            <input
              type="text"
              placeholder="e.g. Chemsroot - District Outreach"
              value={campaignData.name}
              onChange={e => setCampaignData({ ...campaignData, name: e.target.value })}
            />
          </div>

          {/* Demographics */}
          <div className="form-group">
            <label>Target Demographics</label>
            <select
              value={campaignData.target_audience}
              onChange={e => setCampaignData({ ...campaignData, target_audience: e.target.value })}
            >
              <option value="doctors">Physicians &amp; Specialists</option>
              <option value="patients">General Patients</option>
              <option value="broad">Broad Pharmaceutical Market</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Objective */}
          <div className="form-group">
            <label>Campaign Objective</label>
            <select
              value={campaignData.objective}
              onChange={e => setCampaignData({ ...campaignData, objective: e.target.value })}
            >
              <option value="OUTCOME_TRAFFIC">Website Traffic</option>
              <option value="OUTCOME_LEADS">Lead Generation (In-App Form)</option>
            </select>
          </div>

          {/* Lead Form Selection (Conditional) */}
          {campaignData.objective === 'OUTCOME_LEADS' && (
            <div className="form-group">
              <label>Select Lead Form</label>
              {loadingForms ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading forms...</span>
              ) : leadForms.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={campaignData.lead_gen_form_id}
                    onChange={e => setCampaignData({ ...campaignData, lead_gen_form_id: e.target.value })}
                    style={{ flex: 1 }}
                  >
                    <option value="" disabled>Select a form</option>
                    {leadForms.map(form => (
                      <option key={form.id} value={form.id}>{form.name}</option>
                    ))}
                  </select>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleCreateLeadForm}
                    title="Create a new form with the latest custom questions"
                    style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    + Create New
                  </button>
                </div>
              ) : (
                <div style={{ background: 'var(--danger-faded)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--danger)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '0.75rem', display: 'block', fontWeight: 500 }}>
                    No active forms found on your Meta Page.
                  </span>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={handleCreateLeadForm}
                    style={{ marginBottom: '1rem', width: '100%' }}
                  >
                    Auto-Create Standard Form
                  </button>
                  
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    — OR —
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Enter Meta Lead Form ID manually"
                    value={campaignData.lead_gen_form_id}
                    onChange={e => setCampaignData({ ...campaignData, lead_gen_form_id: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Budget */}
          <div className="form-group">
            <label>Total Yearly Budget (₹)</label>
            <input
              type="number"
              placeholder="1500000"
              value={campaignData.budget}
              onChange={e => setCampaignData({ ...campaignData, budget: e.target.value })}
            />
          </div>
        </div>

        {/* ── District Multi-Select ─── */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <MapPin size={16} color="var(--accent-primary)" />
            <label style={{ margin: 0, fontWeight: 600 }}>Geographic Targeting – Select Districts</label>
          </div>

          {/* Selected chips */}
          <div className="city-chips">
            {selectedDistricts.length === 0 ? (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No district selected yet.</span>
            ) : selectedDistricts.map(district => (
              <span key={district} className="city-chip">
                {district}
                <button onClick={() => toggleDistrict(district)} aria-label={`Remove ${district}`}><X size={12} /></button>
              </span>
            ))}
          </div>

          {/* Pan India tile */}
          <div className="pan-india-tile" onClick={selectedDistricts.length === ALL_DISTRICTS.length ? clearDistricts : selectAll}>
            <span className="pan-india-flag">🇮🇳</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Large-Scale Targeting (excluding North India)</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Target all {ALL_DISTRICTS.length} high-demand districts in one click
              </div>
            </div>
            <div className={`pan-india-check ${selectedDistricts.length === ALL_DISTRICTS.length ? 'pan-india-check--on' : ''}`}>
              {selectedDistricts.length === ALL_DISTRICTS.length ? '✓ Active' : 'Select All Districts'}
            </div>
          </div>

          {/* Target Mode Toggle */}
          <div className="targeting-mode-selector">
            <button 
              className={`mode-btn ${targetingMode === 'tiers' ? 'mode-btn--active' : ''}`}
              onClick={() => setTargetingMode('tiers')}
            >
              <Layers size={14} /> Pharma Tiers
            </button>
            <button 
              className={`mode-btn ${targetingMode === 'branches' ? 'mode-btn--active' : ''}`}
              onClick={() => setTargetingMode('branches')}
            >
              <Building2 size={14} /> State-Wise (Branches)
            </button>
          </div>

          {/* Search + bulk actions */}
          <div className="city-toolbar">
            <input
              type="text"
              placeholder={`🔍 Search ${targetingMode === 'tiers' ? 'district' : 'state or district'}...`}
              value={districtSearch}
              onChange={e => setDistrictSearch(e.target.value)}
              className="city-search"
            />
            {targetingMode === 'tiers' && (
              <button className="btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={selectAll}>Select All</button>
            )}
            <button className="btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={clearDistricts}>Clear</button>
          </div>

          {/* Accordion groups */}
          <div className="city-accordion">
            {targetingMode === 'tiers' ? (
              filteredGroups.map(group => {
                const allSelected = group.districts.every(c => selectedDistricts.includes(c));
                const someSelected = group.districts.some(c => selectedDistricts.includes(c));
                const open = expandedGroup === group.group || districtSearch.length > 0;
                return (
                  <div key={group.group} className="accordion-group">
                    <button
                      className={`accordion-header ${someSelected ? 'accordion-header--active' : ''}`}
                      onClick={() => setExpandedGroup(open && !districtSearch ? null : group.group)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>{group.group} ({group.districts.length})</span>
                      </div>
                      <label className="check-all-label" onClick={e => { e.stopPropagation(); selectGroup(group.districts); }}>
                        <input type="checkbox" readOnly checked={allSelected} style={{ marginRight: '0.3rem' }} />
                        Select all
                      </label>
                    </button>
                    {open && (
                      <div className="accordion-body">
                        {group.districts.map(district => (
                          <label key={district} className={`city-option ${selectedDistricts.includes(district) ? 'city-option--selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={selectedDistricts.includes(district)}
                              onChange={() => toggleDistrict(district)}
                            />
                            {district}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              filteredStates.map(stateData => {
                const allSelected = stateData.districts.every(c => selectedDistricts.includes(c));
                const someSelected = stateData.districts.some(c => selectedDistricts.includes(c));
                const open = expandedState === stateData.state || districtSearch.length > 0;
                return (
                  <div key={stateData.state} className="accordion-group branch-group">
                    <button
                      className={`accordion-header ${someSelected ? 'accordion-header--active' : ''}`}
                      onClick={() => setExpandedState(open && !districtSearch ? null : stateData.state)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span style={{ fontWeight: 600 }}>{stateData.state}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({stateData.districts.length} districts)</span>
                      </div>
                      <label className="check-all-label" onClick={e => { e.stopPropagation(); selectStateDistricts(stateData.districts); }}>
                        <input type="checkbox" readOnly checked={allSelected} style={{ marginRight: '0.3rem' }} />
                        Select all
                      </label>
                    </button>
                    {open && (
                      <div className="accordion-body">
                        {stateData.districts.map(district => (
                          <label key={district} className={`city-option ${selectedDistricts.includes(district) ? 'city-option--selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={selectedDistricts.includes(district)}
                              onChange={() => toggleDistrict(district)}
                            />
                            {district}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {selectedDistricts.length} district/districts selected
          </div>
        </div>

        {/* ── Keyword & Interest Targeting ─── */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🎯</span>
              <label style={{ margin: 0, fontWeight: 600 }}>Keyword &amp; Interest Targeting</label>
            </div>
            {selectedKeywords.length > 0 && (
              <span style={{ fontSize: '0.75rem', background: 'var(--success-faded)', color: 'var(--success)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600 }}>
                {selectedKeywords.length} Targeted Interests
              </span>
            )}
          </div>

          <div className="city-chips">
            {selectedKeywords.length === 0 ? (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No keywords added. Enter custom ones or select from suggestions.</span>
            ) : selectedKeywords.map(kw => (
              <span key={kw} className="city-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--success)', color: 'var(--success)' }}>
                {kw}
                <button onClick={() => removeKeyword(kw)} style={{ color: 'var(--success)' }}><X size={12} /></button>
              </span>
            ))}
          </div>

          <div className="city-toolbar">
            <input
              type="text"
              placeholder="Type keyword and press Enter (e.g. Paracetamol, Franchise...)"
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
              className="city-search"
            />
            <button className="btn btn-primary" style={{ padding: '0.4rem 1rem' }} onClick={() => addKeyword(keywordInput.trim())}>Add</button>
          </div>

          {/* Suggestions */}
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              ✨ Smart Suggestions (Based on Audience)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {getAutoSuggestions().map(sug => (
                <button key={sug} className="city-option" style={{ fontStyle: 'italic', background: 'rgba(99, 102, 241, 0.05)' }} onClick={() => addKeyword(sug)}>
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              📁 Industry Nodes (PCD &amp; Manufacturing)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(PHARMA_KEYWORDS).map(([key, list]) => (
                <div key={key}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>{key}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                    {list.map(kw => (
                      <button key={kw} className="city-option" onClick={() => addKeyword(kw)}>+ {kw}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
          {statusMsg && <span style={{ color: 'var(--success)', fontWeight: 500 }}>{statusMsg}</span>}
          <button 
            className="btn btn-primary" 
            onClick={handleLaunch}
            disabled={isCreating}
          >
            <Rocket size={16} /> {isCreating ? 'Processing...' : 'Initialize Campaign Draft'}
          </button>
        </div>
      </div>

      {/* ── Campaign List ─────────────────────────────────── */}
      <div className="glass-panel table-panel">
        <h3 className="title">Active & Handled Campaigns</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="campaigns-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Audience</th>
                <th>Districts</th>
                <th>Keywords</th>
                <th>Budget (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaignsList.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No campaigns yet. Create one above.</td></tr>
              ) : (
                campaignsList.map(camp => {
                  let districts = [];
                  let keywords = [];
                  try { districts = JSON.parse(camp.target_cities || '[]'); } catch { districts = []; }
                  try { keywords = JSON.parse(camp.target_keywords || '[]'); } catch { keywords = []; }
                  return (
                    <tr key={camp.id}>
                      <td style={{ fontWeight: 500 }}>{camp.name}</td>
                      <td>{camp.target_audience}</td>
                      <td>
                        <div className="city-tag-list">
                          {districts.slice(0, 3).map(c => <span key={c} className="city-tag">{c}</span>)}
                          {districts.length > 3 && <span className="city-tag city-tag--more">+{districts.length - 3}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="city-tag-list">
                          {keywords.slice(0, 2).map(k => <span key={k} className="city-tag" style={{ borderColor: 'var(--success-faded)', color: 'var(--success)' }}>{k}</span>)}
                          {keywords.length > 2 && <span className="city-tag city-tag--more">+{keywords.length - 2}</span>}
                        </div>
                      </td>
                      <td>₹ {Number(camp.budget).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${
                          camp.status === 'active' ? 'status-active' :
                          camp.status === 'stopped' ? 'status-stopped' : 'status-learning'
                        }`}>
                          {camp.status.toUpperCase()}
                          {camp.status === 'draft' && camp.creative_id ? ' ✓ Creative' : ''}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {camp.status === 'draft' && (
                            <>
                              {!camp.creative_id && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>Needs Creative</span>
                              )}
                              {camp.creative_id && (
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                  onClick={() => handlePublish(camp.id)}
                                  disabled={publishingId === camp.id}
                                >
                                  {publishingId === camp.id ? '...' : 'Publish'}
                                </button>
                              )}
                              <button
                                className="btn"
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                                onClick={() => handleDelete(camp.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {camp.status === 'active' && (
                            <button
                              className="btn"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--warning)', color: 'var(--warning)' }}
                              onClick={() => handleStop(camp.id)}
                            >
                              Stop
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
