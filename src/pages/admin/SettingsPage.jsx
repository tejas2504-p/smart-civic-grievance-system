import React, { useState } from 'react';
import { toast } from 'sonner';
import { Shield, Globe, Bell, Layout, Database, Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', label: 'General', icon: Layout },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'data', label: 'Data Management', icon: Database },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-desc">Configure portal settings and preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Section nav */}
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px', height: 'fit-content' }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={activeSection === s.id ? 'sidebar-nav-item active' : 'sidebar-nav-item'}
              style={{ width: '100%', background: activeSection === s.id ? '#e8f4fd' : 'transparent', color: activeSection === s.id ? 'var(--color-primary)' : 'var(--color-text-secondary)', border: 'none', cursor: 'pointer', borderRadius: 6, margin: '2px 0' }}
            >
              <s.icon size={16} className="icon" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Settings content */}
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '24px' }}>
          {activeSection === 'general' && (
            <div>
              <h2 className="section-title" style={{ marginBottom: 20 }}>General Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label className="form-label" htmlFor="portal-name">Portal Name</label>
                  <input id="portal-name" type="text" className="form-input" defaultValue="Bharat Civic Connect | भारत नागरिक सेवा" style={{ maxWidth: 400 }} />
                </div>
                <div>
                  <label className="form-label" htmlFor="govt-name">Government Name</label>
                  <input id="govt-name" type="text" className="form-input" defaultValue="Government of Maharashtra" style={{ maxWidth: 400 }} />
                </div>
                <div>
                  <label className="form-label" htmlFor="support-email">Support Email</label>
                  <input id="support-email" type="email" className="form-input" defaultValue="grievance@mh.gov.in" style={{ maxWidth: 400 }} />
                </div>
                <div>
                  <label className="form-label" htmlFor="helpline">Helpline Number</label>
                  <input id="helpline" type="text" className="form-input" defaultValue="1800-XXX-XXXX" style={{ maxWidth: 400 }} />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }} />
                    Enable AI-assisted complaint analysis
                  </label>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }} />
                    Allow public complaint tracking (no login required)
                  </label>
                </div>
                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast.success('Settings saved.')}>
                  <Save size={14} /> Save Settings
                </button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h2 className="section-title" style={{ marginBottom: 20 }}>Notification Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Email notifications to citizens', defaultChecked: true },
                  { label: 'SMS notifications to citizens', defaultChecked: true },
                  { label: 'Email notifications to officers', defaultChecked: true },
                  { label: 'SLA breach alerts to admin', defaultChecked: true },
                  { label: 'Daily digest report', defaultChecked: false },
                  { label: 'Push notifications', defaultChecked: false },
                ].map(pref => (
                  <label key={pref.label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <input type="checkbox" defaultChecked={pref.defaultChecked} style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }} />
                    {pref.label}
                  </label>
                ))}
                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => toast.success('Notification settings saved.')}>
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <h2 className="section-title" style={{ marginBottom: 20 }}>Security Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label className="form-label" htmlFor="session-timeout">Session Timeout (minutes)</label>
                  <input id="session-timeout" type="number" className="form-input" defaultValue={30} min={5} max={120} style={{ maxWidth: 200 }} />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }} />
                    Require OTP for login
                  </label>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }} />
                    Enable two-factor authentication for officers
                  </label>
                </div>
                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast.success('Security settings saved.')}>
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
          )}

          {activeSection === 'language' && (
            <div>
              <h2 className="section-title" style={{ marginBottom: 20 }}>Language Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label" htmlFor="default-lang">Default Language</label>
                  <select id="default-lang" className="form-input" style={{ maxWidth: 250 }}>
                    <option value="en">English</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }} />
                    Show language selector in header
                  </label>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', padding: 12, background: 'var(--color-bg)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                  English, Marathi, and Hindi are currently supported. Additional languages can be added by providing translation files.
                </p>
                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast.success('Language settings saved.')}>
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div>
              <h2 className="section-title" style={{ marginBottom: 20 }}>Data Management</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Export All Complaints</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Download complete complaint data as CSV</p>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => toast.success('Export initiated.')}>Export CSV</button>
                </div>
                <div style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Backup Database</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Create a full system backup</p>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => toast.success('Backup initiated.')}>Create Backup</button>
                </div>
                <div style={{ padding: 16, border: '1px solid var(--color-danger-light)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-danger)' }}>Archive Closed Complaints</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Move all closed complaints older than 1 year to archive</p>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => toast.warning('Archive action requires confirmation.')}>Archive</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
