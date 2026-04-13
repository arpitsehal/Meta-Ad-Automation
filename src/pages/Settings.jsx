import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';

const Settings = () => {
  const [keys, setKeys] = useState({
    meta_app_id: '',
    meta_app_secret: '',
    meta_access_token: '',
    meta_ad_account_id: '',
    meta_page_id: ''
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Fetch existing keys on load
    fetch('http://localhost:3001/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setKeys({
            meta_app_id: data.meta_app_id || '',
            meta_app_secret: data.meta_app_secret || '',
            meta_access_token: data.meta_access_token || '',
            meta_ad_account_id: data.meta_ad_account_id || '',
            meta_page_id: data.meta_page_id || ''
          });
        }
      })
      .catch(err => console.error("Could not fetch settings", err));
  }, []);

  const handleSave = async () => {
    setStatus('Saving...');
    try {
      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keys)
      });
      const data = await response.json();
      setStatus(data.message || 'Saved successfully.');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('Failed to save.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 className="title">System Configuration</h1>
        <p className="subtitle">Securely store your Meta API credentials to enable campaign publishing.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Key color="var(--accent-primary)" />
          <h2 className="title" style={{ margin: 0, fontSize: '1.25rem' }}>API Credentials</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label>Meta App ID</label>
            <input 
              type="text" 
              placeholder="1234567890" 
              value={keys.meta_app_id}
              onChange={(e) => setKeys({...keys, meta_app_id: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Meta App Secret</label>
            <input 
              type="password" 
              placeholder="ab12cd34..." 
              value={keys.meta_app_secret}
              onChange={(e) => setKeys({...keys, meta_app_secret: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Meta System User Access Token</label>
            <input 
              type="password" 
              placeholder="EAA..." 
              value={keys.meta_access_token}
              onChange={(e) => setKeys({...keys, meta_access_token: e.target.value})}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

          <div className="form-group">
            <label>Meta Ad Account ID (act_...)</label>
            <input 
              type="text" 
              placeholder="act_123456789" 
              value={keys.meta_ad_account_id}
              onChange={(e) => setKeys({...keys, meta_ad_account_id: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Facebook Page ID</label>
            <input 
              type="text" 
              placeholder="10928374..." 
              value={keys.meta_page_id}
              onChange={(e) => setKeys({...keys, meta_page_id: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Keys
            </button>
            <button 
              className="btn" 
              style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}
              onClick={async () => {
                setStatus('Testing connection...');
                try {
                  // Dynamically use current hostname to avoid 'Server unreachable'
                  const backendUrl = `http://${window.location.hostname}:3001/api/meta/test-connection`;
                  const res = await fetch(backendUrl);
                  const data = await res.json();
                  if (res.ok) setStatus('✅ Connection Successful!');
                  else setStatus(`❌ ${data.error || 'Connection Failed'}`);
                } catch {
                  setStatus('❌ Server unreachable');
                }
              }}
            >
              Test Connection
            </button>
            {status && <span style={{ color: status.includes('✅') ? 'var(--success)' : (status.includes('❌') ? 'var(--danger)' : 'var(--accent-primary)'), fontSize: '0.875rem' }}>{status}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
