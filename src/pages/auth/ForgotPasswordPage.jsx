import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: enter email, 2: OTP, 3: success
  const [email, setEmail] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('OTP sent to your registered email / mobile.');
    setStep(2);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    toast.success('Password reset successfully! Please login.');
    setStep(3);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--color-primary)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/login" style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/logo.jpg"
            alt="Logo"
            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ color: '#fff', fontWeight: 600 }}>Bharat Civic Connect | भारत नागरिक सेवा</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-md)' }}>
            <div style={{ background: 'var(--color-primary)', padding: '24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Mail size={22} color="#fff" />
              </div>
              <h1 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>Forgot Password</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem' }}>Reset your account password</p>
            </div>
            <div style={{ padding: '28px' }}>
              {step === 1 && (
                <form onSubmit={handleSend}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                    Enter your registered mobile number or email address. We will send an OTP to reset your password.
                  </p>
                  <label className="form-label" htmlFor="reset-email">
                    Mobile Number / Email <span className="required" aria-hidden="true">*</span>
                  </label>
                  <input id="reset-email" type="text" className="form-input" placeholder="9876543210 or name@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 20 }} required />
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Send OTP
                  </button>
                </form>
              )}
              {step === 2 && (
                <form onSubmit={handleVerify}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                    Enter the OTP sent to your registered contact, along with your new password.
                  </p>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label" htmlFor="otp-code">OTP <span className="required" aria-hidden="true">*</span></label>
                    <input id="otp-code" type="text" className="form-input" placeholder="Enter 6-digit OTP" maxLength={6} required />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label" htmlFor="new-pwd">New Password <span className="required" aria-hidden="true">*</span></label>
                    <input id="new-pwd" type="password" className="form-input" placeholder="Min. 8 characters" required />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label className="form-label" htmlFor="confirm-pwd">Confirm Password <span className="required" aria-hidden="true">*</span></label>
                    <input id="confirm-pwd" type="password" className="form-input" placeholder="Re-enter new password" required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Reset Password
                  </button>
                </form>
              )}
              {step === 3 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 16 }} />
                  <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Password Reset Successful</h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
                    Your password has been reset. You can now log in with your new password.
                  </p>
                  <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>Go to Login</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
