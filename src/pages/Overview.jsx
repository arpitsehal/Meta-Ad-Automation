import React from 'react';
import { Target, TrendingUp, Users, Activity, Rocket, MousePointer2, PieChart } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import './Overview.css';

const Overview = () => {
  const [metrics, setMetrics] = React.useState(null);   
  const [campaigns, setCampaigns] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Load local campaign counts
    fetch('http://localhost:3001/api/campaigns')
      .then(r => r.json())
      .then(data => setCampaigns(data))
      .catch(console.error);

    // Load real-time analytics from Meta
    fetch('http://localhost:3001/api/analytics/overview')
      .then(r => r.json())
      .then(data => {
        // We consider it "has data" if we have chart points or any spend > 0
        const hasData = (data && data.chartData && data.chartData.length > 0) || (data && data.totalSpend > 0);
        setMetrics(hasData ? data : null);
      })
      .catch((err) => {
        console.error('Analytics Fetch Error:', err);
        setMetrics(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const draftCampaigns  = campaigns.filter(c => c.status === 'draft');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel" style={{ padding: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0, color: 'var(--accent-primary)' }}>Spend: ₹{payload[0].value.toFixed(2)}</p>
          <p style={{ margin: 0, color: 'var(--success)' }}>Reach: {payload[1].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="overview-container animate-fade-in">
      <div className="header">
        <h1 className="title">Campaign Overview</h1>
        <p className="subtitle">Real-time performance data synced directly from Meta Business Suite.</p>
      </div>

      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span>Status</span>
            <Activity size={18} color="var(--success)" />
          </div>
          <div className="metric-value" style={{ color: activeCampaigns.length > 0 ? 'var(--success)' : 'inherit' }}>
            {loading ? '—' : activeCampaigns.length > 0 ? 'LIVE' : 'IDLE'}
          </div>
          <div className="metric-trend">
            <span style={{ color: 'var(--text-secondary)' }}>
              {activeCampaigns.length} Active / {draftCampaigns.length} Drafts
            </span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span>Spend (last 30d)</span>
            <TrendingUp size={18} color="var(--accent-secondary)" />
          </div>
          <div className="metric-value">
            {loading ? '—' : metrics ? `₹${metrics.totalSpend.toLocaleString()}` : '₹0'}
          </div>
          <div className="metric-trend">
            <span style={{ color: 'var(--text-secondary)' }}>
               INR Account Currency
            </span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span>Reach / Impressions</span>
            <Users size={18} color="var(--accent-primary)" />
          </div>
          <div className="metric-value">
            {loading ? '—' : metrics ? metrics.reach.toLocaleString() : '0'}
          </div>
          <div className="metric-trend">
            <span style={{ color: 'var(--text-secondary)' }}>
               {metrics ? `${metrics.impressions.toLocaleString()} Impressions` : 'No reach yet'}
            </span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span>CPC (Avg)</span>
            <MousePointer2 size={18} color="var(--accent-primary)" />
          </div>
          <div className="metric-value">
            {loading ? '—' : metrics ? `₹${metrics.cpc.toFixed(2)}` : '—'}
          </div>
          <div className="metric-trend">
            <span style={{ color: 'var(--text-secondary)' }}>
              {metrics ? `${metrics.clicks} Clicks` : '0 Link Clicks'}
            </span>
          </div>
        </div>
      </div>

      {metrics && metrics.chartData && metrics.chartData.length > 0 ? (
        <div className="charts-grid">
          <div className="glass-panel chart-card">
            <h2 className="title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--accent-primary)" />
              Performance Trends (Last 7 Days)
            </h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.chartData}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    yAxisId="left"
                    name="Spend"
                    type="monotone" 
                    dataKey="spend" 
                    stroke="var(--accent-primary)" 
                    fillOpacity={1} 
                    fill="url(#colorSpend)" 
                    strokeWidth={2}
                  />
                  <Area 
                    yAxisId="right"
                    name="Reach"
                    type="monotone" 
                    dataKey="reach" 
                    stroke="var(--success)" 
                    fillOpacity={1} 
                    fill="url(#colorReach)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel chart-card">
            <h2 className="title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={20} color="var(--accent-secondary)" />
              Key Insights
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
               <div className="empty-step" style={{ background: 'rgba(0, 150, 255, 0.05)' }}>
                  <strong>Efficiency:</strong> Your average CPC is currently ₹{metrics.cpc.toFixed(2)}. Best performing in Metro areas.
               </div>
               <div className="empty-step" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                  <strong>Growth:</strong> Total reach has hit {metrics.reach.toLocaleString()} unique users this month.
               </div>
               <div className="empty-step" style={{ background: 'rgba(168, 85, 247, 0.05)' }}>
                  <strong>Engagement:</strong> {metrics.clicks} potential customers clicked your ad links.
               </div>
            </div>
          </div>
        </div>
      ) : !loading && (
        <div className="glass-panel empty-state">
          <div className="empty-icon">📊</div>
          <h2 className="title" style={{ fontSize: '1.25rem' }}>No Performance Data Yet</h2>
          <p className="subtitle" style={{ maxWidth: 480, textAlign: 'center' }}>
            Analytics will appear here automatically once your first campaign is
            published and begins delivering on Meta.
          </p>
          <div className="empty-steps">
            <div className="empty-step">
              <span className="step-num">1</span>
              <span>Go to <strong>Creative Studio</strong> — select a template, add copy & image</span>
            </div>
            <div className="empty-step">
              <span className="step-num">2</span>
              <span>Go to <strong>Campaign Auto</strong> — create draft, pick cities, set budget</span>
            </div>
            <div className="empty-step">
              <span className="step-num">3</span>
              <span>Ensure your <strong>System User Token</strong> is in Settings, then hit Publish</span>
            </div>
            <div className="empty-step">
              <span className="step-num">4</span>
              <span>Return here — <strong>live spend, reach & charts</strong> will show up automatically</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
