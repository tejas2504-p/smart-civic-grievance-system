import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Smartphone, 
  CheckCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Clock, 
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '../../components/ui/SharedComponents';
import TurnstileCaptcha from '../../components/common/TurnstileCaptcha';
import { api } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: contact + CAPTCHA, 2: OTP + new password, 3: success
  const [channel, setChannel] = useState('email'); // 'email' | 'mobile'
  const [target, setTarget] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // CAPTCHA State
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const turnstileRef = useRef(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Request Password Reset OTP with Turnstile CAPTCHA
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setCaptchaError('');

    if (!target.trim()) {
      toast.error(`Please enter your registered ${channel === 'email' ? 'email' : 'mobile number'}.`);
      return;
    }

    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (channel === 'mobile' && !/^[6-9]\d{9}$/.test(target.trim().replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const token = turnstileRef.current ? turnstileRef.current.getToken() : captchaToken;
    if (!token && !captchaToken) {
      setCaptchaError('Please complete the human verification (CAPTCHA).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        purpose: 'password_reset',
        captchaToken: token || captchaToken,
        channel: channel === 'email' ? 'email' : 'phone',
      };
      if (channel === 'email') {
        payload.email = target.trim().toLowerCase();
      } else {
        payload.phone = target.trim();
      }

      const res = await api.sendOTP(payload);
      if (res.success && res.verificationId) {
        setVerificationId(res.verificationId);
        setStep(2);
        setCountdown(45);

        toast.success(`Password reset OTP dispatched to your ${channel === 'email' ? 'Email' : 'Mobile Number'}!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send reset OTP.');
      if (turnstileRef.current) turnstileRef.current.reset();
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please check and retype.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP
      if (channel === 'email') {
        await api.verifyEmailOTP({ verificationId, otp: otpCode.trim() });
      } else {
        await api.verifyPhoneOTP({ verificationId, otp: otpCode.trim() });
      }

      // 2. Reset password
      const res = await api.resetPassword({
        verificationId,
        newPassword,
      });

      if (res.success) {
        toast.success('Password reset successfully!');
        setStep(3);
      }
    } catch (err) {
      toast.error(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #09223e 0%, #123B63 100%)', padding: '24px', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Lock size={24} color="#fff" />
              </div>
              <h1 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 750, marginBottom: 4 }}>
                Reset Account Password
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem' }}>
                Secure OTP-based password recovery
              </p>
            </div>

            <div style={{ padding: '28px' }}>
              
              {/* STEP 1: SELECT CHANNEL, ENTER TARGET & SOLVE CAPTCHA */}
              {step === 1 && (
                <form onSubmit={handleSendOTP}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                    Enter your registered email address or mobile number to receive a secure password reset code.
                  </p>

                  {/* Channel Toggle */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <button
                      type="button"
                      onClick={() => { setChannel('email'); setTarget(''); }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: channel === 'email' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: channel === 'email' ? '#EEF4FA' : '#fff',
                        color: channel === 'email' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontWeight: channel === 'email' ? 700 : 500,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Mail size={15} />
                      <span>Reset via Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setChannel('mobile'); setTarget(''); }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: channel === 'mobile' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: channel === 'mobile' ? '#EEF4FA' : '#fff',
                        color: channel === 'mobile' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontWeight: channel === 'mobile' ? 700 : 500,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Smartphone size={15} />
                      <span>Reset via Mobile</span>
                    </button>
                  </div>

                  {/* Contact Input */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label" htmlFor="reset-target">
                      {channel === 'email' ? 'Registered Email Address' : '10-Digit Registered Mobile'}{' '}
                      <span className="required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="reset-target"
                      type={channel === 'email' ? 'email' : 'tel'}
                      className="form-input"
                      placeholder={channel === 'email' ? 'name@example.com' : '9876543210'}
                      value={target}
                      onChange={e => setTarget(e.target.value)}
                      required
                    />
                  </div>

                  {/* Cloudflare Turnstile CAPTCHA */}
                  <TurnstileCaptcha
                    ref={turnstileRef}
                    onVerify={(tok) => {
                      setCaptchaToken(tok);
                      setCaptchaError('');
                    }}
                    onExpire={() => setCaptchaToken('')}
                  />
                  {captchaError && <p className="form-error" style={{ marginTop: -8, marginBottom: 12 }} role="alert">{captchaError}</p>}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.925rem', fontWeight: 700, marginTop: 8 }}
                    disabled={loading}
                  >
                    {loading ? <><Spinner size={16} /> Verifying & Sending OTP…</> : 'Send Reset Code'}
                  </button>
                </form>
              )}

              {/* STEP 2: ENTER OTP & NEW PASSWORD */}
              {step === 2 && (
                <form onSubmit={handleResetPassword}>
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <p style={{ fontSize: '0.8125rem', color: '#166534', margin: 0, lineHeight: 1.4 }}>
                      Security code sent to <strong>{target}</strong>. Enter the 6-digit OTP below:
                    </p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label" htmlFor="otp-code">
                      6-Digit Security OTP <span className="required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="otp-code"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="form-input"
                      placeholder="••••••"
                      style={{ fontSize: '1.25rem', textAlign: 'center', letterSpacing: '0.3em', fontWeight: 700 }}
                      autoFocus
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label" htmlFor="new-pwd">
                      New Password <span className="required" aria-hidden="true">*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="new-pwd"
                        type={showPwd ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="form-input"
                        placeholder="Min. 8 characters"
                        style={{ paddingRight: 40 }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(v => !v)}
                        aria-label={showPwd ? 'Hide' : 'Show'}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label className="form-label" htmlFor="confirm-pwd">
                      Confirm New Password <span className="required" aria-hidden="true">*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="confirm-pwd"
                        type={showConfirmPwd ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="form-input"
                        placeholder="Re-enter new password"
                        style={{ paddingRight: 40 }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(v => !v)}
                        aria-label={showConfirmPwd ? 'Hide' : 'Show'}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                      >
                        {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} />
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Did not receive code?'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        if (countdown === 0) handleSendOTP(e);
                      }}
                      disabled={countdown > 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: countdown > 0 ? 'var(--color-text-secondary)' : 'var(--color-secondary)',
                        fontWeight: 650,
                        cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Resend OTP
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.925rem', fontWeight: 700, marginBottom: 10 }}
                    disabled={loading || otpCode.length !== 6}
                  >
                    {loading ? <><Spinner size={16} /> Updating Password…</> : 'Reset Password'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem' }}
                    onClick={() => { setStep(1); setOtpCode(''); }}
                  >
                    <ArrowLeft size={14} /> Back to Contact Details
                  </button>
                </form>
              )}

              {/* STEP 3: SUCCESS */}
              {step === 3 && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #a7f3d0' }}>
                    <CheckCircle size={32} style={{ color: 'var(--color-success)' }} />
                  </div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 750, color: 'var(--color-primary)', marginBottom: 8 }}>
                    Password Reset Complete
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 24, lineHeight: 1.5 }}>
                    Your password has been securely updated in the database. You can now log into your citizen portal account.
                  </p>
                  <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontWeight: 700 }}>
                    Go to Login
                  </Link>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Remember your password?{' '}
                <Link to="/login" style={{ color: 'var(--color-secondary)', fontWeight: 700, textDecoration: 'none' }}>
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
