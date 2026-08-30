import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../store/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { Spinner } from '../../components/ui/SharedComponents';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms and conditions' }) }),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

const Field = ({ id, label, error, required, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label className="form-label" htmlFor={id}>
      {label} {required && <span className="required" aria-hidden="true">*</span>}
    </label>
    {children}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { state: 'Maharashtra' },
  });

  const onSubmit = async (data) => {
    if (!otpVerified) {
      toast.error('Please verify your mobile number first.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    login('citizen');
    toast.success('Account created successfully! Welcome to the portal.');
    navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--color-primary)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Home
        </Link>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/logo.jpg"
            alt="Logo"
            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9375rem' }}>Bharat Civic Connect | भारत नागरिक सेवा</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 600 }}>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--color-primary)', padding: '24px', textAlign: 'center' }}>
              <h1 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>Create Citizen Account</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem' }}>Register to access government services</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                Personal Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field id="fullName" label="Full Name" error={errors.fullName?.message} required>
                  <input id="fullName" type="text" className={`form-input${errors.fullName ? ' error' : ''}`} placeholder="Rajesh Kumar" {...register('fullName')} />
                </Field>
                <Field id="mobile" label="Mobile Number" error={errors.mobile?.message} required>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input id="mobile" type="tel" className={`form-input${errors.mobile ? ' error' : ''}`} placeholder="9876543210" {...register('mobile')} style={{ flex: 1 }} />
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => { setOtpSent(true); toast.success('OTP sent to your mobile.'); }} style={{ flexShrink: 0, fontSize: '0.75rem' }}>
                      {otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  </div>
                </Field>
              </div>

              {otpSent && !otpVerified && (
                <div style={{ marginBottom: 16, padding: 14, background: '#f0f7ff', border: '1px solid #c2d9f0', borderRadius: 8 }}>
                  <label className="form-label" htmlFor="otp">Enter OTP sent to your mobile</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input id="otp" type="text" className="form-input" placeholder="Enter 6-digit OTP" maxLength={6} style={{ flex: 1 }} />
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => { setOtpVerified(true); toast.success('Mobile number verified!'); }} style={{ flexShrink: 0 }}>Verify</button>
                  </div>
                </div>
              )}
              {otpVerified && (
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)', fontSize: '0.8125rem', fontWeight: 500 }}>
                  <CheckCircle size={16} /> Mobile number verified
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field id="email" label="Email Address" error={errors.email?.message} required>
                  <input id="email" type="email" className={`form-input${errors.email ? ' error' : ''}`} placeholder="name@email.com" {...register('email')} />
                </Field>
                <div />
                <Field id="password" label="Password" error={errors.password?.message} required>
                  <div style={{ position: 'relative' }}>
                    <input id="password" type={showPwd ? 'text' : 'password'} className={`form-input${errors.password ? ' error' : ''}`} placeholder="Min. 8 characters" style={{ paddingRight: 40 }} {...register('password')} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Hide' : 'Show'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>
                <Field id="confirmPassword" label="Confirm Password" error={errors.confirmPassword?.message} required>
                  <input id="confirmPassword" type="password" className={`form-input${errors.confirmPassword ? ' error' : ''}`} placeholder="Re-enter password" {...register('confirmPassword')} />
                </Field>
              </div>

              <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '8px 0 16px', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                Address Details
              </h2>

              <Field id="address" label="Address" error={errors.address?.message} required>
                <input id="address" type="text" className={`form-input${errors.address ? ' error' : ''}`} placeholder="House number, street, area" {...register('address')} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
                <Field id="city" label="City" error={errors.city?.message} required>
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

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  <input type="checkbox" {...register('agreeTerms')} style={{ marginTop: 2, accentColor: 'var(--color-primary)' }} />
                  I agree to the{' '}
                  <a href="#" style={{ color: 'var(--color-secondary)' }}>Terms & Conditions</a>{' '}
                  and{' '}
                  <a href="#" style={{ color: 'var(--color-secondary)' }}>Privacy Policy</a>
                </label>
                {errors.agreeTerms && <p className="form-error" role="alert">{errors.agreeTerms.message}</p>}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? <><Spinner size={16} /> Creating Account…</> : 'Create Account'}
              </button>

              <div style={{ marginTop: 16, padding: '12px', background: 'var(--color-bg)', borderRadius: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Shield size={14} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Your personal information is securely protected and will only be used for grievance management purposes.
                </p>
              </div>
            </form>

            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--color-secondary)', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
