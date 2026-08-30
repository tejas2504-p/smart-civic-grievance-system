import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Clock, MapPin, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function HelpPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Support request submitted. We will respond within 24 hours.');
    e.target.reset();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div style={{ background: 'var(--color-primary)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Home
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/logo.jpg"
            alt="Logo"
            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ color: '#fff', fontWeight: 600 }}>Bharat Civic Connect | भारत नागरिक सेवा</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Help & Support
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            We are here to help. Reach out through any of the following channels.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { icon: Phone, label: 'Helpline', value: '1800-XXX-XXXX', sub: 'Toll-free · Mon–Sat, 9AM–6PM', color: '#e8f4fd', iconColor: 'var(--color-secondary)' },
            { icon: Mail, label: 'Email Support', value: 'grievance@mh.gov.in', sub: 'Response within 24 hours', color: '#fff3e0', iconColor: 'var(--color-warning)' },
            { icon: Clock, label: 'Working Hours', value: '9:00 AM – 6:00 PM', sub: 'Monday to Saturday', color: 'var(--color-success-light)', iconColor: 'var(--color-success)' },
            { icon: MapPin, label: 'Office Address', value: 'Mantralaya, Mumbai', sub: 'Maharashtra State', color: '#e8eaf6', iconColor: '#3f51b5' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '20px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: item.iconColor }}>
                <item.icon size={20} />
              </div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)', marginBottom: 4 }}>{item.value}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '28px' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 6 }}>Send us a message</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>Fill in the form and our support team will get back to you.</p>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="help-name">Your Name <span className="required">*</span></label>
                <input id="help-name" type="text" className="form-input" placeholder="Full name" required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="help-email">Email / Mobile <span className="required">*</span></label>
                <input id="help-email" type="text" className="form-input" placeholder="email or mobile" required />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="help-subject">Subject <span className="required">*</span></label>
              <input id="help-subject" type="text" className="form-input" placeholder="Brief description of your issue" required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" htmlFor="help-message">Message <span className="required">*</span></label>
              <textarea id="help-message" rows={4} className="form-input" placeholder="Describe your issue in detail..." required style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary">
              <MessageSquare size={15} /> Send Message
            </button>
          </form>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link to="/faq" style={{ fontSize: '0.875rem', color: 'var(--color-secondary)', textDecoration: 'none' }}>
            Check our FAQ for quick answers →
          </Link>
        </div>
      </div>
    </div>
  );
}
