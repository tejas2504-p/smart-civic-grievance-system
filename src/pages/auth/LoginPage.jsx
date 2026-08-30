import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../store/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import { Spinner } from '../../components/ui/SharedComponents';

const loginSchema = z.object({
  credential: z.string().min(1, 'Mobile number or email is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpMode, setOtpMode] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { credential: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate API call
    login('citizen');
    toast.success('Welcome back! Login successful.');
    navigate('/dashboard');
    setLoading(false);
  };

  const quickLogin = async (role) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    login(role);
    toast.success(`Logged in as ${role}`);
    if (role === 'officer') navigate('/officer');
    else if (role === 'admin') navigate('/admin');
    else navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ background: 'var(--color-primary)', padding: '24px', textAlign: 'center' }}>
              <img
                src="/logo.jpg"
                alt="Bharat Civic Connect Logo"
                style={{ width: 90, height: 90, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', objectFit: 'cover', margin: '0 auto 12px', display: 'block' }}
              />
              <h1 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>
                Citizen Login
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem' }}>
                Government of Maharashtra
              </p>
            </div>

            {/* Form */}
            <div style={{ padding: '28px 28px 20px' }}>
              {!otpMode ? (
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label" htmlFor="credential">
                      Mobile Number / Email <span className="required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="credential"
                      type="text"
                      className={`form-input${errors.credential ? ' error' : ''}`}
                      placeholder="9876543210 or name@email.com"
                      autoComplete="username"
                      {...register('credential')}
                    />
                    {errors.credential && <p className="form-error" role="alert">{errors.credential.message}</p>}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <label className="form-label" htmlFor="password">
                      Password <span className="required" aria-hidden="true">*</span>
                    </label>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" {...register('rememberMe')} style={{ accentColor: 'var(--color-primary)' }} />
                      Remember me
                    </label>
                    <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                      Forgot Password?
                    </Link>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} disabled={loading}>
                    {loading ? <><Spinner size={16} /> Logging in…</> : 'Login'}
                  </button>
                  <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOtpMode(true)}>
                    Login with OTP
                  </button>
                </form>
              ) : (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label" htmlFor="otp-mobile">Mobile Number <span className="required" aria-hidden="true">*</span></label>
                    <input id="otp-mobile" type="tel" className="form-input" placeholder="Enter your mobile number" />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
                    Send OTP
                  </button>
                  <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOtpMode(false)}>
                    Use Password Instead
                  </button>
                </div>
              )}

              {/* Demo quick access */}
              <div style={{ marginTop: 20, padding: '14px', background: '#f0f7ff', borderRadius: 8, border: '1px solid #c2d9f0' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>Demo Quick Access</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => quickLogin('citizen')} className="btn btn-sm" style={{ fontSize: '0.75rem', background: 'var(--color-primary)', color: '#fff', border: 'none' }}>As Citizen</button>
                  <button onClick={() => quickLogin('officer')} className="btn btn-sm" style={{ fontSize: '0.75rem', background: 'var(--color-secondary)', color: '#fff', border: 'none' }}>As Officer</button>
                  <button onClick={() => quickLogin('admin')} className="btn btn-sm" style={{ fontSize: '0.75rem', background: '#5c35b8', color: '#fff', border: 'none' }}>As Admin</button>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                New citizen?{' '}
                <Link to="/register" style={{ color: 'var(--color-secondary)', fontWeight: 600, textDecoration: 'none' }}>Create Account</Link>
              </p>
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Shield size={14} style={{ color: 'var(--color-success)' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Secured with 256-bit encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
