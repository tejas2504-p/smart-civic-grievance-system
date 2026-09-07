import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { RefreshCw, Volume2, ShieldCheck } from 'lucide-react';

export const Captcha = forwardRef(function Captcha({ onValidate, error, onChange }, ref) {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const canvasRef = useRef(null);

  const generateRandomCode = () => {
    // Alphanumeric characters without ambiguous symbols (avoid 0, O, 1, I, l)
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const drawCaptcha = (code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(0.5, '#eef2f6');
    gradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Random background noise lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, 0.3)`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Random background noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, ${Math.floor(Math.random() * 180)}, 0.4)`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw characters with random rotation and colors
    const fonts = ['Arial', 'Verdana', 'Trebuchet MS', 'Georgia', 'Courier New'];
    const colors = ['#123B63', '#1D5D91', '#991B1B', '#15803D', '#B45309', '#6B21A8'];

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      ctx.font = `bold ${22 + Math.floor(Math.random() * 5)}px ${fonts[i % fonts.length]}`;
      ctx.fillStyle = colors[i % colors.length];

      ctx.save();
      const x = 16 + i * 22;
      const y = 30 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 0.4 - 0.2); // slight tilt
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  };

  const refreshCaptcha = () => {
    const newCode = generateRandomCode();
    setCaptchaCode(newCode);
    setUserInput('');
    if (onChange) onChange('');
    setTimeout(() => drawCaptcha(newCode), 50);
  };

  useEffect(() => {
    const code = generateRandomCode();
    setCaptchaCode(code);
    setTimeout(() => drawCaptcha(code), 50);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setUserInput(val);
    if (onChange) onChange(val);
  };

  // Speak captcha characters for accessibility
  const handleAudioSpeak = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const spelled = captchaCode.split('').join(' ');
      const utterance = new SpeechSynthesisUtterance(`Security captcha code is: ${spelled}`);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Expose validation methods to parent via ref
  useImperativeHandle(ref, () => ({
    validate: () => {
      const isValid = userInput.trim().toLowerCase() === captchaCode.trim().toLowerCase();
      if (!isValid) refreshCaptcha();
      return isValid;
    },
    refresh: refreshCaptcha,
    getValue: () => userInput,
  }));

  return (
    <div style={{ marginBottom: 16 }}>
      <label className="form-label" htmlFor="captcha-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <ShieldCheck size={14} color="var(--color-primary)" />
          <span>Security Verification (Captcha)</span>
          <span className="required" aria-hidden="true">*</span>
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
          Case-insensitive
        </span>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {/* Canvas displaying distorted visual Captcha */}
        <div 
          style={{ 
            border: '1px solid var(--color-border)', 
            borderRadius: 6, 
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <canvas 
            ref={canvasRef} 
            width={160} 
            height={44} 
            style={{ display: 'block', cursor: 'pointer' }}
            onClick={refreshCaptcha}
            title="Click image to refresh captcha"
          />
        </div>

        {/* Action buttons: Refresh and Listen */}
        <button
          type="button"
          onClick={refreshCaptcha}
          className="btn btn-outline btn-sm"
          style={{ padding: '8px 10px', height: 44, borderColor: 'var(--color-border)' }}
          title="Get new captcha code"
          aria-label="Refresh captcha image"
        >
          <RefreshCw size={15} />
        </button>

        <button
          type="button"
          onClick={handleAudioSpeak}
          className="btn btn-ghost btn-sm"
          style={{ padding: '8px 10px', height: 44, color: 'var(--color-secondary)' }}
          title="Listen to captcha code (Audio)"
          aria-label="Read captcha characters aloud"
        >
          <Volume2 size={16} />
        </button>
      </div>

      {/* Captcha Input */}
      <input
        id="captcha-input"
        type="text"
        value={userInput}
        onChange={handleInputChange}
        placeholder="Enter 6 characters shown above"
        className={`form-input${error ? ' error' : ''}`}
        maxLength={8}
        autoComplete="off"
        spellCheck="false"
        style={{ letterSpacing: '0.08em', fontWeight: 600 }}
      />
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
});

export default Captcha;
