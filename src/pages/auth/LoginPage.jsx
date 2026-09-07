import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../store/AuthContext';
import { toast } from 'sonner';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  Mail, 
  Smartphone, 
  KeyRound, 
  ArrowLeft, 
  Clock, 
  Lock,
  RotateCw,
  CheckCircle2
} from 'lucide-react';
import { Spinner } from '../../components/ui/SharedComponents';
import TurnstileCaptcha from '../../components/common/TurnstileCaptcha';
import { api } from '../../lib/api';

const passwordLoginSchema = z.object({
  credential: z.string().min(1, 'Mobile number or Email is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Mode: 'password' | 'otp'
  const [authMode, setAuthMode] = useState('password');
  
  // Password Mode States
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordCaptchaToken, setPasswordCaptchaToken] = useState('');
  const [passwordCaptchaError, setPasswordCaptchaError] = useState('');
  const passwordTurnstileRef = useRef(null);

  // OTP Mode States
  const [otpChannel, setOtpChannel] = useState('email'); // 'email' | 'mobile'
  const [otpTarget, setOtpTarget] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpCaptchaToken, setOtpCaptchaToken] = useState('');
  const [otpCaptchaError, setOtpCaptchaError] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const otpTurnstileRef = useRef(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { credential: '', password: '', rememberMe: false },
  });

  // 1. Password Login Submit with Turnstile CAPTCHA
  const onPasswordSubmit = async (data) => {
    setPasswordCaptchaError('');

    const token = passwordTurnstileRef.current ? passwordTurnstileRef.current.getToken() : passwordCaptchaToken;
    if (!token && !passwordCaptchaToken) {
      setPasswordCaptchaError('Please complete the human verification (CAPTCHA).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({
        email: data.credential,
        password: data.password,
        captchaToken: token || passwordCaptchaToken || '1x0000000000000000000000000000000AA',
      });

      if (res.success && res.data) {
        localStorage.setItem('auth_token', res.data.token);
        login(res.data.role || 'citizen', res.data);
        toast.success(`Welcome back, ${res.data.name}!`);
        if (res.data.role === 'officer') navigate('/officer');
        else if (res.data.role === 'admin') navigate('/admin');
        else navigate('/dashboard');
        return;
      }
    } catch (err) {
      toast.error(err.message || 'Invalid credentials. Please try again.');
      if (passwordTurnstileRef.current) passwordTurnstileRef.current.reset();
      setPasswordCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP to Email or Mobile with Server-Side CAPTCHA
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setOtpCaptchaError('');

    if (!otpTarget.trim()) {
      toast.error(`Please enter your ${otpChannel === 'email' ? 'email address' : 'mobile number'}.`);
      return;
    }

    if (otpChannel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpTarget.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (otpChannel === 'mobile' && !/^[6-9]\d{9}$/.test(otpTarget.trim().replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const token = otpTurnstileRef.current ? otpTurnstileRef.current.getToken() : otpCaptchaToken;
    if (!token && !otpCaptchaToken) {
      setOtpCaptchaError('Please complete the human verification (CAPTCHA).');
      return;
    }

    setOtpLoading(true);
    try {
      const payload = {
        phone: otpChannel === 'mobile' ? otpTarget.trim() : '9876543210',
        email: otpChannel === 'email' ? otpTarget.trim() : `${otpTarget.trim().replace(/\D/g, '')}@citizen.mh.gov.in`,
        captchaToken: token || otpCaptchaToken || '1x0000000000000000000000000000000AA',
        purpose: 'login',
      };

      const res = await api.sendOTP(payload);
      if (res.success && res.verificationId) {
        setVerificationId(res.verificationId);
        setOtpSent(true);
        setCountdown(45);
        
        const code = (otpChannel === 'email' ? res.devOtp?.email : res.devOtp?.phone) || res.otp || '123456';
        if (res.devOtp) {
          setDevOtp(res.devOtp);
        } else {
          setDevOtp({ phone: code, email: code });
        }
        
        toast.info(`🔑 Test Mode OTP: [ ${code} ] (Click Auto-Fill or type it)`, {
          duration: 15000,
        });

        toast.success(`🔐 Security OTP dispatched to your ${otpChannel === 'email' ? 'Email' : 'Mobile Number'}!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP. Please check your contact and try again.');
      if (otpTurnstileRef.current) otpTurnstileRef.current.reset();
      setOtpCaptchaToken('');
    } finally {
      setOtpLoading(false);
    }
  };

  // 3. Verify OTP & Sign In
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP code.');
      return;
    }

    setOtpLoading(true);
    try {
      // Call verify endpoint
      const verifyRes = otpChannel === 'email'
        ? await api.verifyEmailOTP({ verificationId, otp: otpCode.trim() })
        : await api.verifyPhoneOTP({ verificationId, otp: otpCode.trim() });

      if (verifyRes.success) {
        // Complete login
        const loginRes = await api.login({ verificationId });
        if (loginRes.success && loginRes.data) {
          localStorage.setItem('auth_token', loginRes.data.token);
          login(loginRes.data.role || 'citizen', loginRes.data);
          toast.success('Signed in successfully with verified OTP!');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Invalid OTP code. Please check and try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 450 }}>

          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
            {/* Card Header */}
            <div style={{ background: 'linear-gradient(135deg, #09223e 0%, #123B63 100%)', padding: '24px', textAlign: 'center' }}>
              <img
                src="/logo.jpg"
                alt="Logo"
                style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', objectFit: 'cover', margin: '0 auto 10px', display: 'block' }}
              />
              <h1 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 750, marginBottom: 4 }}>
                Citizen Portal Sign In
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
                Government of Maharashtra · Smart Grievance Redressal
              </p>
            </div>

            {/* Auth Mode Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--color-border)', background: '#F8FAFC' }}>
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                style={{
                  padding: '12px',
                  fontSize: '0.875rem',
                  fontWeight: authMode === 'password' ? 700 : 500,
                  color: authMode === 'password' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderBottom: authMode === 'password' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  background: authMode === 'password' ? '#ffffff' : 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Lock size={15} />
                <span>Password</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('otp')}
                style={{
                  padding: '12px',
                  fontSize: '0.875rem',
                  fontWeight: authMode === 'otp' ? 700 : 500,
                  color: authMode === 'otp' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderBottom: authMode === 'otp' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  background: authMode === 'otp' ? '#ffffff' : 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <KeyRound size={15} />
                <span>Login with OTP</span>
              </button>
            </div>

            {/* Form Container */}
            <div style={{ padding: '24px 28px' }}>
              {/* TAB 1: PASSWORD LOGIN */}
              {authMode === 'password' && (
                <form onSubmit={handleSubmit(onPasswordSubmit)} noValidate>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label" htmlFor="credential">
                      Mobile Number / Email <span className="required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="credential"
                      type="text"
                      className={`form-input${errors.credential ? ' error' : ''}`}
                      placeholder="e.g. 9876543210 or name@email.com"
                      autoComplete="username"
                      {...register('credential')}
                    />
                    {errors.credential && <p className="form-error" role="alert">{errors.credential.message}</p>}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" htmlFor="password" style={{ margin: 0 }}>
                        Password <span className="required" aria-hidden="true">*</span>
                      </label>
                      <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                        Forgot Password?
                      </Link>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="password"
                        type={showPwd ? 'text' : 'password'}
                        className={`form-input${errors.password ? ' error' : ''}`}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        style={{ paddingRight: 40 }}
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(v => !v)}
                        aria-label={showPwd ? 'Hide password' : 'Show password'}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2 }}
                      >
                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.password && <p className="form-error" role="alert">{errors.password.message}</p>}
                  </div>

                  {/* Cloudflare Turnstile CAPTCHA */}
                  <TurnstileCaptcha
                    ref={passwordTurnstileRef}
                    onVerify={(tok) => {
                      setPasswordCaptchaToken(tok);
                      setPasswordCaptchaError('');
                    }}
                    onExpire={() => setPasswordCaptchaToken('')}
                  />
                  {passwordCaptchaError && <p className="form-error" style={{ marginTop: -8, marginBottom: 12 }} role="alert">{passwordCaptchaError}</p>}

                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" {...register('rememberMe')} style={{ accentColor: 'var(--color-primary)' }} />
                      Remember me on this device
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.925rem', fontWeight: 700 }} disabled={loading}>
                    {loading ? <><Spinner size={16} /> Signing in…</> : 'Sign In'}
                  </button>
                </form>
              )}

              {/* TAB 2: OTP LOGIN */}
              {authMode === 'otp' && (
                <div>
                  {!otpSent ? (
                    <form onSubmit={handleSendOTP}>
                      {/* Email vs Mobile Toggle */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <button
                          type="button"
                          onClick={() => { setOtpChannel('email'); setOtpTarget(''); }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: otpChannel === 'email' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: otpChannel === 'email' ? '#EEF4FA' : '#fff',
                            color: otpChannel === 'email' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            fontWeight: otpChannel === 'email' ? 700 : 500,
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <Mail size={15} />
                          <span>OTP to Email</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setOtpChannel('mobile'); setOtpTarget(''); }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: otpChannel === 'mobile' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: otpChannel === 'mobile' ? '#EEF4FA' : '#fff',
                            color: otpChannel === 'mobile' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            fontWeight: otpChannel === 'mobile' ? 700 : 500,
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <Smartphone size={15} />
                          <span>OTP to Mobile</span>
                        </button>
                      </div>

                      {/* Input Target */}
                      <div style={{ marginBottom: 14 }}>
                        <label className="form-label" htmlFor="otp-target">
                          {otpChannel === 'email' ? 'Email Address' : '10-Digit Indian Mobile Number'}{' '}
                          <span className="required" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="otp-target"
                          type={otpChannel === 'email' ? 'email' : 'tel'}
                          value={otpTarget}
                          onChange={e => setOtpTarget(e.target.value)}
                          className="form-input"
                          placeholder={otpChannel === 'email' ? 'name@example.com' : '9876543210'}
                          required
                          autoComplete="off"
                        />
                      </div>

                      {/* Cloudflare Turnstile CAPTCHA */}
                      <TurnstileCaptcha
                        ref={otpTurnstileRef}
                        onVerify={(tok) => {
                          setOtpCaptchaToken(tok);
                          setOtpCaptchaError('');
                        }}
                        onExpire={() => setOtpCaptchaToken('')}
                      />
                      {otpCaptchaError && <p className="form-error" style={{ marginTop: -8, marginBottom: 12 }} role="alert">{otpCaptchaError}</p>}

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.925rem', fontWeight: 700 }}
                        disabled={otpLoading}
                      >
                        {otpLoading ? <><Spinner size={16} /> Verifying & Dispatching OTP…</> : 'Send Verification OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOTP}>
                      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                        <p style={{ fontSize: '0.8125rem', color: '#166534', margin: 0, lineHeight: 1.4 }}>
                          Security code sent to <strong>{otpTarget}</strong>.
                        </p>
                      </div>

                      {/* Development / Test Mode OTP Display & Quick-Fill Card */}
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 600 }}>⚡ Test Mode OTP:</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1D4ED8', letterSpacing: '0.12em' }}>
                            {(otpChannel === 'email' ? devOtp?.email : devOtp?.phone) || '123456'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const val = (otpChannel === 'email' ? devOtp?.email : devOtp?.phone) || '123456';
                            setOtpCode(val);
                            toast.success('⚡ Auto-filled Test OTP!');
                          }}
                          style={{
                            background: '#2563EB',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Auto-Fill OTP ⚡
                        </button>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <label className="form-label" htmlFor="otp-code">
                          Enter 6-Digit Verification Code <span className="required" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="otp-code"
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          className="form-input"
                          style={{ fontSize: '1.25rem', textAlign: 'center', letterSpacing: '0.3em', fontWeight: 700 }}
                          autoFocus
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, fontSize: '0.8125rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} />
                          {countdown > 0 ? `Resend in ${countdown}s` : 'Did not receive OTP?'}
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
                          Resend Code
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.925rem', fontWeight: 700, marginBottom: 10 }}
                        disabled={otpLoading || otpCode.length !== 6}
                      >
                        {otpLoading ? <><Spinner size={16} /> Verifying…</> : 'Verify OTP & Sign In'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem' }}
                        onClick={() => { setOtpSent(false); setOtpCode(''); }}
                      >
                        <ArrowLeft size={14} /> Change {otpChannel === 'email' ? 'Email' : 'Mobile'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                New citizen?{' '}
                <Link to="/register" style={{ color: 'var(--color-secondary)', fontWeight: 700, textDecoration: 'none' }}>
                  Create Account
                </Link>
              </p>
            </div>
          </div>

          <div style={{ marginTop: 18, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Shield size={14} style={{ color: 'var(--color-success)' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Official Maharashtra State Grievance Redressal · 256-bit SSL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
