import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { faqs } from '../../data/mockData';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQPage() {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '24px 0 48px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 20 }}>
          <Link to="/" style={{ color: 'var(--color-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Frequently Asked Questions
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Find answers to common questions about the portal
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textAlign: 'left' }}
                aria-expanded={open === i}
                aria-controls={`faq-${i}`}
                id={`faq-btn-${i}`}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>{faq.question}</span>
                {open === i ? <ChevronUp size={18} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />}
              </button>
              {open === i && (
                <div id={`faq-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} style={{ padding: '0 20px 16px', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, textAlign: 'center', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '28px 24px' }}>
          <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>Still have questions?</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>Our support team is here to help you.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/help" className="btn btn-primary btn-sm">Contact Support</Link>
            <Link to="/register" className="btn btn-outline btn-sm">Register a Complaint</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
