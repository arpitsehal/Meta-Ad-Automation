import React, { useState, useEffect } from 'react';
import { Download, Users } from 'lucide-react';

const Leads = () => {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [leads, setLeads] = useState([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/meta/lead-forms');
      const data = await res.json();
      if (Array.isArray(data)) {
        setForms(data);
      } else {
        setErrorMsg('Failed to load forms.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend.');
    } finally {
      setLoadingForms(false);
    }
  };

  const fetchLeads = async (formId) => {
    setLoadingLeads(true);
    setErrorMsg('');
    try {
      const res = await fetch(`http://localhost:3001/api/meta/lead-forms/${formId}/leads`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      } else {
        setErrorMsg(`Meta API Error: ${data.details || data.error || 'Failed to load leads.'}`);
      }
    } catch (err) {
      setErrorMsg('Failed to fetch leads. Please check your internet connection.');
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleFormChange = (e) => {
    const formId = e.target.value;
    setSelectedForm(formId);
    if (formId) fetchLeads(formId);
  };

  const getFieldValue = (fieldData, fieldName) => {
    if (!fieldData || !Array.isArray(fieldData)) return '-';
    // Try exact match first
    let field = fieldData.find(f => f.name === fieldName);
    
    // If not found, try case-insensitive partial match for custom questions
    if (!field) {
      const search = fieldName.toLowerCase();
      field = fieldData.find(f => 
        f.name.toLowerCase().includes(search) || 
        search.includes(f.name.toLowerCase()) ||
        (search.includes('inquiry') && f.name.toLowerCase().includes('inquiry'))
      );
    }

    if (!field || !field.values || field.values.length === 0) return '-';
    return field.values[0];
  };

  const downloadCSV = () => {
    if (leads.length === 0) return;
    
    let csvContent = "Date,Name,Email,Phone,Inquiry Type\n";
    
    leads.forEach(lead => {
      const date = new Date(lead.created_time).toLocaleString();
      const name = getFieldValue(lead.field_data, 'full_name').replace(/,/g, '');
      const email = getFieldValue(lead.field_data, 'email');
      const phone = getFieldValue(lead.field_data, 'phone_number');
      const inquiry = getFieldValue(lead.field_data, 'Inquiry for (PCD Pharma or 3rd Party Manufacturing)?');
      csvContent += `"${date}","${name}","${email}","${phone}","${inquiry}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${selectedForm}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={32} color="var(--primary)" /> Incoming Leads
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>View and download contact submissions from your Meta forms.</p>
        </div>
        
        {leads.length > 0 && (
          <button className="btn btn-primary" onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} /> Download CSV
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select Meta Lead Form</label>
        {loadingForms ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading forms...</p>
        ) : forms.length > 0 ? (
          <select 
            value={selectedForm} 
            onChange={handleFormChange}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="" disabled>-- Select a Form --</option>
            {forms.map(form => (
              <option key={form.id} value={form.id}>{form.name}</option>
            ))}
          </select>
        ) : (
          <p style={{ color: 'var(--danger)' }}>No active forms found on your Meta Page.</p>
        )}
      </div>

      {errorMsg && <div style={{ color: 'var(--danger)', padding: '1rem', background: 'var(--danger-faded)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--danger)' }}>{errorMsg}</div>}

      {selectedForm && (
        <div className="card" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {loadingLeads ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Fetching leads from Meta...</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No leads found for this form yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Date Received</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Full Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Email</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Phone Number</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Inquiry Type</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='var(--bg-tertiary)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{new Date(lead.created_time).toLocaleString()}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{getFieldValue(lead.field_data, 'full_name')}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{getFieldValue(lead.field_data, 'email')}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{getFieldValue(lead.field_data, 'phone_number')}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 600, color: 'var(--primary)' }}>{getFieldValue(lead.field_data, 'Inquiry for (PCD Pharma or 3rd Party Manufacturing)?')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leads;
