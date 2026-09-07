import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { toast } from 'sonner';
import { User, Phone, Mail, MapPin, Lock, Eye, EyeOff, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSave = () => {
    toast.success('Profile updated successfully.');
    setEditMode(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-desc">Manage your personal information and account settings</p>
        </div>
        {!editMode ? (
          <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>Edit Profile</button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Changes</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Profile card */}
        <div>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '28px 20px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, margin: '0 auto 16px' }}>
              {user?.name?.[0] || 'U'}
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: 4 }}>{user?.name}</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>{user?.email}</p>
            <span className="badge status-resolved" style={{ textTransform: 'capitalize' }}>{role}</span>
            {editMode && (
              <button className="btn btn-outline btn-sm" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                Change Photo
              </button>
            )}
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Account</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Member since</span>
                <span>Jan 2025</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Complaints</span>
                <span>4</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Resolved</span>
                <span style={{ color: 'var(--color-success)' }}>1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--color-border)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
              {[
                { label: 'Full Name', id: 'pf-name', type: 'text', value: user?.name, icon: User },
                { label: 'Mobile Number', id: 'pf-mobile', type: 'tel', value: user?.mobile, icon: Phone },
                { label: 'Email Address', id: 'pf-email', type: 'email', value: user?.email, icon: Mail },
                { label: 'Address', id: 'pf-addr', type: 'text', value: user?.address, icon: MapPin },
                { label: 'City', id: 'pf-city', type: 'text', value: user?.city, icon: null },
                { label: 'PIN Code', id: 'pf-pin', type: 'text', value: user?.pincode, icon: null },
              ].map(field => (
                <div key={field.id}>
                  <label className="form-label" htmlFor={field.id}>{field.label}</label>
                  {editMode ? (
                    <input id={field.id} type={field.type} className="form-input" defaultValue={field.value} />
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>{field.value || '—'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Change password */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--color-border)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={14} /> Change Password
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
              <div>
                <label className="form-label" htmlFor="pf-current">Current Password</label>
                <input id="pf-current" type={showPwd ? 'text' : 'password'} className="form-input" placeholder="Current password" />
              </div>
              <div>
                <label className="form-label" htmlFor="pf-new">New Password</label>
                <input id="pf-new" type={showPwd ? 'text' : 'password'} className="form-input" placeholder="New password (min. 8 characters)" />
              </div>
              <div>
                <label className="form-label" htmlFor="pf-confirm">Confirm New Password</label>
                <input id="pf-confirm" type={showPwd ? 'text' : 'password'} className="form-input" placeholder="Re-enter new password" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showPwd} onChange={e => setShowPwd(e.target.checked)} />
                Show passwords
              </label>
              <button className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast.success('Password changed successfully.')}>
                Update Password
              </button>
            </div>
          </div>

          {/* Notification preferences */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px 24px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--color-border)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Notification Preferences
            </h3>
            {[
              { label: 'Status change notifications', id: 'notif-status', defaultChecked: true },
              { label: 'Officer messages', id: 'notif-msg', defaultChecked: true },
              { label: 'SLA reminders', id: 'notif-sla', defaultChecked: false },
              { label: 'SMS notifications', id: 'notif-sms', defaultChecked: true },
              { label: 'Email notifications', id: 'notif-email', defaultChecked: true },
            ].map(pref => (
              <label key={pref.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" id={pref.id} defaultChecked={pref.defaultChecked} style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }} />
                {pref.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
