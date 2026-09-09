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
  CheckCircle2, 
  Mail, 
  Smartphone, 
  Clock, 
  ShieldCheck,
  RotateCw,
  ArrowLeft,
  Check
} from 'lucide-react';
import { Spinner } from '../../components/ui/SharedComponents';
import TurnstileCaptcha from '../../components/common/TurnstileCaptcha';
import { api } from '../../lib/api';
import { io } from 'socket.io-client';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number (without +91 or 0)'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  address: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City / District is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms and conditions' }) }),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

const Field = ({ id, label, error, required, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label className="form-label" htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span>{label}</span>
      {required && <span className="required" aria-hidden="true">*</span>}
    </label>
    {children}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // UI Steps: 1 = Details + CAPTCHA, 2 = OTP Verification, 3 = Complete
  const [step, setStep] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verification Session States
  const [verificationId, setVerificationId] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [expiresIn, setExpiresIn] = useState(300); // 5 mins in seconds
  const [resendCooldown, setResendCooldown] = useState(0); // 60s cooldown
  const [resendsRemaining, setResendsRemaining] = useState(5);

  // OTP inputs & states
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [phoneAttemptsLeft, setPhoneAttemptsLeft] = useState(5);
  const [emailAttemptsLeft, setEmailAttemptsLeft] = useState(5);

  // CAPTCHA State
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const turnstileRef = useRef(null);
  const socketRef = useRef(null);

  // React Hook Form
  const { register, handleSubmit, watch, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { state: 'Maharashtra', agreeTerms: false },
  });

  // Expiration countdown timer
  useEffect(() => {
    let timer;
    if (step === 2 && expiresIn > 0) {
      timer = setInterval(() => {
        setExpiresIn(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, expiresIn]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(c => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Real-time Socket.IO listener for live verification status sync
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (verificationId) {
        socket.emit('join_verification', verificationId);
      }
    });

    // Support both canonical otp:* and legacy event formats
    const handlePhoneVerified = (data) => {
      if (!data?.verificationId || data.verificationId === verificationId) {
        setPhoneVerified(true);
      }
    };

    const handleEmailVerified = (data) => {
      if (!data?.verificationId || data.verificationId === verificationId) {
        setEmailVerified(true);
      }
    };

    const handleCompleted = (data) => {
      if (!data?.verificationId || data.verificationId === verificationId) {
        setPhoneVerified(true);
        setEmailVerified(true);
        toast.success('🎉 Both Phone and Email verified successfully!');
      }
    };

    socket.on('otp:phone-verified', handlePhoneVerified);
    socket.on('PHONE_VERIFIED', handlePhoneVerified);

    socket.on('otp:email-verified', handleEmailVerified);
    socket.on('EMAIL_VERIFIED', handleEmailVerified);

    socket.on('otp:verification-complete', handleCompleted);
    socket.on('VERIFICATION_COMPLETED', handleCompleted);

    return () => {
      socket.disconnect();
    };
  }, [verificationId]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Send OTP to Phone & Email with Server-Side CAPTCHA Verification
  const handleSendOTP = async () => {
    setCaptchaError('');

    const phone = getValues('mobile');
    const email = getValues('email');

    if (!phone || !/^[6-9]\d{9}$/.test(phone.trim())) {
      toast.error('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // Check CAPTCHA
    const token = turnstileRef.current ? turnstileRef.current.getToken() : captchaToken;
    if (!token && !captchaToken) {
      setCaptchaError('Please complete the security check (CAPTCHA) before sending OTP.');
      toast.error('Please complete the security check first.');
      return;
    }

    setLoading(true);
    try {
      const allValues = getValues();
      const res = await api.register({
        name: allValues.fullName,
        email: email.trim(),
        phone: phone.trim(),
        password: allValues.password,
        address: `${allValues.address}, ${allValues.city}, ${allValues.state} - ${allValues.pincode}`,
        role: 'citizen',
        captchaToken: token || captchaToken,
      });

      if (res.success && res.verificationId) {
        setVerificationId(res.verificationId);
        setMaskedPhone(res.phoneMasked || `+91 ******${phone.slice(-4)}`);
        setMaskedEmail(res.emailMasked || email);
        setExpiresIn(res.expiresIn || 300);
        setResendCooldown(60);
        setStep(2);

        toast.success('Verification OTPs dispatched!', {
          description: `SMS sent to ${res.phoneMasked || phone} and Email sent to ${res.emailMasked || email}.`,
          duration: 6000,
        });

        // Join socket room
        if (socketRef.current) {
          socketRef.current.emit('join_verification', res.verificationId);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP. Please check your details and try again.');
      if (turnstileRef.current) turnstileRef.current.reset();
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Phone OTP
  const handleVerifyPhone = async (e) => {
    e?.preventDefault();
    if (!phoneOtp || phoneOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit Phone OTP.');
      return;
    }

    if (expiresIn <= 0) {
      toast.error('OTP has expired. Please click Resend OTP to request a fresh code.');
      return;
    }

    setPhoneVerifying(true);
    try {
      const res = await api.verifyPhoneOTP({
        verificationId,
        otp: phoneOtp.trim(),
      });

      if (res.success) {
        setPhoneVerified(true);
        toast.success('📱 Phone number verified successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid Phone OTP.');
      if (err.attemptsRemaining !== undefined) {
        setPhoneAttemptsLeft(err.attemptsRemaining);
      }
    } finally {
      setPhoneVerifying(false);
    }
  };

  // 3. Verify Email OTP
  const handleVerifyEmail = async (e) => {
    e?.preventDefault();
    if (!emailOtp || emailOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit Email OTP.');
      return;
    }

    if (expiresIn <= 0) {
      toast.error('OTP has expired. Please click Resend OTP to request a fresh code.');
      return;
    }

    setEmailVerifying(true);
    try {
      const res = await api.verifyEmailOTP({
        verificationId,
        otp: emailOtp.trim(),
      });

      if (res.success) {
        setEmailVerified(true);
        toast.success('📧 Email address verified successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid Email OTP.');
      if (err.attemptsRemaining !== undefined) {
        setEmailAttemptsLeft(err.attemptsRemaining);
      }
    } finally {
      setEmailVerifying(false);
    }
  };

  // 4. Resend OTP Handler
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    try {
      const res = await api.resendOTP({
        verificationId,
        channel: 'both',
      });

      if (res.success) {
        setExpiresIn(res.expiresIn || 300);
        setResendCooldown(60);
        setPhoneOtp('');
        setEmailOtp('');
        if (res.resendsRemaining !== undefined) {
          setResendsRemaining(res.resendsRemaining);
        }
        toast.success('New OTP codes dispatched to your phone and email!');
      }
    } catch (err) {
      toast.error(err.message || 'Unable to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  // 5. Final Registration Submission
  const onFinalSubmit = async (data) => {
    if (!phoneVerified || !emailVerified) {
      toast.error('Both Phone and Email must be verified before completing registration.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        name: data.fullName,
        email: data.email,
        phone: data.mobile,
        password: data.password,
        address: `${data.address}, ${data.city}, ${data.state} - ${data.pincode}`,
        role: 'citizen',
        verificationId,
      });

      if (res.success && res.data) {
        localStorage.setItem('auth_token', res.data.token);
        login(res.data);
        toast.success('🎉 Citizen account created successfully! Welcome to the portal.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 660 }}>

          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #09223e 0%, #123B63 100%)', padding: '24px', textAlign: 'center' }}>
              <img
                src="/logo.jpg"
                alt="Logo"
                style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', objectFit: 'cover', margin: '0 auto 10px', display: 'block' }}
              />
              <h1 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 750, marginBottom: 4 }}>
                Citizen Portal Registration
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem' }}>
                Government of Maharashtra · Real-Time OTP & CAPTCHA Protected
              </p>
            </div>

            {/* Progress Stepper */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--color-border)', background: '#F8FAFC' }}>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: step === 1 ? '2px solid var(--color-primary)' : '2px solid transparent', color: step === 1 ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: step === 1 ? 700 : 500, fontSize: '0.825rem' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: step === 1 ? 'var(--color-primary)' : '#e2e8f0', color: step === 1 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</span>
                <span>Details & CAPTCHA</span>
              </div>

              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: step === 2 ? '2px solid var(--color-primary)' : '2px solid transparent', color: step === 2 ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: step === 2 ? 700 : 500, fontSize: '0.825rem' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: step === 2 ? 'var(--color-primary)' : '#e2e8f0', color: step === 2 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</span>
                <span>Phone & Email OTP Verification</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(step === 1 ? handleSendOTP : onFinalSubmit)} noValidate style={{ padding: '28px' }}>
              
              {/* STEP 1: PERSONAL DETAILS + CAPTCHA */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 6, borderBottom: '2px solid #eef2f6' }}>
                    1. Citizen Identification
                  </h2>

                  <Field id="fullName" label="Full Name (as per Govt ID)" error={errors.fullName?.message} required>
                    <input id="fullName" type="text" className={`form-input${errors.fullName ? ' error' : ''}`} placeholder="e.g. Rajesh Narayan Patil" {...register('fullName')} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Field id="mobile" label="10-Digit Indian Mobile Number" error={errors.mobile?.message} required>
                      <div style={{ display: 'flex' }}>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: '#F1F5F9', border: '1px solid var(--color-border)', borderRight: 'none', borderRadius: '6px 0 0 6px', fontSize: '0.8125rem', fontWeight: 650, color: '#334155' }}>
                          +91
                        </span>
                        <input
                          id="mobile"
                          type="tel"
                          maxLength={10}
                          className={`form-input${errors.mobile ? ' error' : ''}`}
                          placeholder="8452940085"
                          style={{ borderRadius: '0 6px 6px 0' }}
                          {...register('mobile')}
                        />
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '4px 0 0' }}>
                        Demo Mode: Real SMS OTP is restricted to <strong>+91 8452940085</strong>
                      </p>
                    </Field>

                    <Field id="email" label="Email Address" error={errors.email?.message} required>
                      <input id="email" type="email" className={`form-input${errors.email ? ' error' : ''}`} placeholder="rajesh.patil@example.com" {...register('email')} />
                    </Field>
                  </div>

                  <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', margin: '14px 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 6, borderBottom: '2px solid #eef2f6' }}>
                    2. Security & Password
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Field id="password" label="Account Password" error={errors.password?.message} required>
                      <div style={{ position: 'relative' }}>
                        <input id="password" type={showPwd ? 'text' : 'password'} className={`form-input${errors.password ? ' error' : ''}`} placeholder="Min. 8 characters" style={{ paddingRight: 40 }} {...register('password')} />
                        <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Hide' : 'Show'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                          {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </Field>

                    <Field id="confirmPassword" label="Confirm Password" error={errors.confirmPassword?.message} required>
                      <div style={{ position: 'relative' }}>
                        <input id="confirmPassword" type={showConfirmPwd ? 'text' : 'password'} className={`form-input${errors.confirmPassword ? ' error' : ''}`} placeholder="Re-enter password" style={{ paddingRight: 40 }} {...register('confirmPassword')} />
                        <button type="button" onClick={() => setShowConfirmPwd(v => !v)} aria-label={showConfirmPwd ? 'Hide' : 'Show'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                          {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </Field>
                  </div>

                  <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', margin: '14px 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 6, borderBottom: '2px solid #eef2f6' }}>
                    3. Residential Address
                  </h2>

                  <Field id="address" label="Street Address / Building" error={errors.address?.message} required>
                    <input id="address" type="text" className={`form-input${errors.address ? ' error' : ''}`} placeholder="Flat 402, Shivneri Heights, FC Road" {...register('address')} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
                    <Field id="city" label="City / District" error={errors.city?.message} required>
                      <input id="city" type="text" className={`form-input${errors.city ? ' error' : ''}`} placeholder="Pune" {...register('city')} />
                    </Field>
                    <Field id="state" label="State" error={errors.state?.message} required>
                      <select id="state" className={`form-input${errors.state ? ' error' : ''}`} {...register('state')}>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Goa">Goa</option>
                      </select>
                    </Field>
                    <Field id="pincode" label="PIN Code" error={errors.pincode?.message} required>
                      <input id="pincode" type="text" className={`form-input${errors.pincode ? ' error' : ''}`} placeholder="411001" maxLength={6} {...register('pincode')} />
                    </Field>
                  </div>

                  {/* Cloudflare Turnstile Human Verification */}
                  <TurnstileCaptcha
                    ref={turnstileRef}
                    onVerify={(tok) => {
                      setCaptchaToken(tok);
                      setCaptchaError('');
                    }}
                    onExpire={() => setCaptchaToken('')}
                  />
                  {captchaError && <p className="form-error" style={{ marginTop: -8, marginBottom: 12 }} role="alert">{captchaError}</p>}

                  {/* Terms Checkbox */}
                  <div style={{ margin: '16px 0 20px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      <input type="checkbox" {...register('agreeTerms')} style={{ marginTop: 2, accentColor: 'var(--color-primary)' }} />
                      <span>
                        I declare the information provided is correct. I agree to the{' '}
                        <a href="#" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Citizen Charter</a> and{' '}
                        <a href="#" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Privacy Regulations</a>.
                      </span>
                    </label>
                    {errors.agreeTerms && <p className="form-error" role="alert">{errors.agreeTerms.message}</p>}
                  </div>

                  {/* Send OTP Button */}
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <><Spinner size={16} /> Verifying Details & Dispatching Real OTPs…</>
                    ) : (
                      'Send Verification OTPs (Phone & Email)'
                    )}
                  </button>
                </div>
              )}

              {/* STEP 2: DUAL OTP VERIFICATION SCREEN */}
              {step === 2 && (
                <div>
                  {/* Delivery notification banner */}
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <ShieldCheck size={20} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#166534', margin: '0 0 4px' }}>
                          OTPs Dispatched Successfully
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#15803D', margin: 0, lineHeight: 1.4 }}>
                          We sent separate 6-digit security codes to:
                        </p>
                        <ul style={{ fontSize: '0.8rem', color: '#166534', margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
                          <li>Phone SMS: <strong>{maskedPhone}</strong></li>
                          <li>Email Inbox: <strong>{maskedEmail}</strong></li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status Overview Banner */}
                  <div style={{ background: phoneVerified && emailVerified ? '#ecfdf5' : '#f8fafc', border: `1px solid ${phoneVerified && emailVerified ? '#10b981' : 'var(--color-border)'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>Status:</span>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem', background: phoneVerified ? '#dcfce7' : '#fef3c7', color: phoneVerified ? '#15803d' : '#b45309', border: `1px solid ${phoneVerified ? '#86efac' : '#fde68a'}` }}>
                        Phone: {phoneVerified ? '✓ Verified' : '⏳ Not verified'}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem', background: emailVerified ? '#dcfce7' : '#fef3c7', color: emailVerified ? '#15803d' : '#b45309', border: `1px solid ${emailVerified ? '#86efac' : '#fde68a'}` }}>
                        Email: {emailVerified ? '✓ Verified' : '⏳ Not verified'}
                      </span>
                    </div>
                    {phoneVerified && emailVerified && (
                      <span style={{ color: '#059669', fontWeight: 750, fontSize: '0.78rem' }}>Ready for activation</span>
                    )}
                  </div>

                  {/* 1. Phone OTP Section */}
                  <div style={{ background: '#fff', border: phoneVerified ? '2px solid var(--color-success)' : '1px solid var(--color-border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <label className="form-label" htmlFor="phone-otp" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        <Smartphone size={16} color="var(--color-primary)" />
                        <span>Phone Number OTP (SMS)</span>
                        <span className="required">*</span>
                      </label>
                      {phoneVerified ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, background: '#ecfdf5', padding: '3px 8px', borderRadius: 4, border: '1px solid #a7f3d0' }}>
                          <CheckCircle2 size={13} /> ✓ Verified
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, background: '#fef3c7', padding: '2px 8px', borderRadius: 4, border: '1px solid #fde68a' }}>
                          ⏳ Not verified ({phoneAttemptsLeft} attempts left)
                        </span>
                      )}
                    </div>

                    {!phoneVerified ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          id="phone-otp"
                          type="text"
                          maxLength={6}
                          value={phoneOtp}
                          onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="••••••"
                          className="form-input"
                          style={{ flex: 1, fontSize: '1.15rem', textAlign: 'center', letterSpacing: '0.25em', fontWeight: 700 }}
                          autoFocus
                          disabled={phoneVerifying}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhone}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0 18px', fontWeight: 700, flexShrink: 0 }}
                          disabled={phoneVerifying || phoneOtp.length !== 6 || expiresIn <= 0}
                        >
                          {phoneVerifying ? <Spinner size={14} /> : 'Verify Phone'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--color-success)', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={16} /> Phone verified with server-side SMS code.
                      </div>
                    )}
                  </div>

                  {/* 2. Email OTP Section */}
                  <div style={{ background: '#fff', border: emailVerified ? '2px solid var(--color-success)' : '1px solid var(--color-border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <label className="form-label" htmlFor="email-otp" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        <Mail size={16} color="var(--color-primary)" />
                        <span>Email Address OTP</span>
                        <span className="required">*</span>
                      </label>
                      {emailVerified ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, background: '#ecfdf5', padding: '3px 8px', borderRadius: 4, border: '1px solid #a7f3d0' }}>
                          <CheckCircle2 size={13} /> ✓ Verified
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, background: '#fef3c7', padding: '2px 8px', borderRadius: 4, border: '1px solid #fde68a' }}>
                          ⏳ Not verified ({emailAttemptsLeft} attempts left)
                        </span>
                      )}
                    </div>

                    {!emailVerified ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          id="email-otp"
                          type="text"
                          maxLength={6}
                          value={emailOtp}
                          onChange={e => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="••••••"
                          className="form-input"
                          style={{ flex: 1, fontSize: '1.15rem', textAlign: 'center', letterSpacing: '0.25em', fontWeight: 700 }}
                          disabled={emailVerifying}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmail}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0 18px', fontWeight: 700, flexShrink: 0 }}
                          disabled={emailVerifying || emailOtp.length !== 6 || expiresIn <= 0}
                        >
                          {emailVerifying ? <Spinner size={14} /> : 'Verify Email'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--color-success)', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={16} /> Email verified with Resend verification code.
                      </div>
                    )}
                  </div>

                  {/* Expiration & Resend Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--color-border)', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: expiresIn > 0 ? 'var(--color-text-secondary)' : 'var(--color-danger)' }}>
                      <Clock size={15} />
                      {expiresIn > 0 ? (
                        <span>OTP expires in <strong>{formatTime(expiresIn)}</strong></span>
                      ) : (
                        <strong>OTP expired. Please request a new OTP.</strong>
                      )}
                    </div>

                    <div>
                      {resendCooldown > 0 ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                          Resend OTP in {resendCooldown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resending || resendsRemaining <= 0}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-secondary)',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            textDecoration: 'underline'
                          }}
                        >
                          <RotateCw size={13} />
                          <span>{resending ? 'Resending…' : `Resend OTP (${resendsRemaining} left)`}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Complete Account Creation Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.975rem', fontWeight: 750, marginBottom: 12 }}
                    disabled={loading || !phoneVerified || !emailVerified}
                  >
                    {loading ? (
                      <><Spinner size={16} /> Creating Verified Account…</>
                    ) : phoneVerified && emailVerified ? (
                      '✓ Complete Citizen Registration'
                    ) : (
                      'Verify Both Phone & Email to Continue'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep(1); }}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem' }}
                  >
                    <ArrowLeft size={14} /> Back to Edit Phone / Email
                  </button>
                </div>
              )}

              {/* Security Badge */}
              <div style={{ marginTop: 18, padding: '12px', background: 'var(--color-bg)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Shield size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Cryptographically secure OTP verification compliant with Government Digital Redressal Standards. Plaintext OTPs are never stored in databases.
                </p>
              </div>
            </form>

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--color-secondary)', fontWeight: 700, textDecoration: 'none' }}>
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
