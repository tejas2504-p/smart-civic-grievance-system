import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { categories } from '../../data/mockData';
import { Breadcrumb, Alert } from '../../components/ui/SharedComponents';
import { MapPin, Upload, CheckCircle, ArrowLeft, ArrowRight, X, Sparkles, AlertCircle } from 'lucide-react';
import { generateComplaintId } from '../../lib/utils';

const STEPS = [
  { id: 1, label: 'Complaint Details' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Evidence' },
  { id: 4, label: 'Review & Submit' },
];

function StepIndicator({ currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
      {STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div
              className={`step-circle ${currentStep > step.id ? 'done' : currentStep === step.id ? 'active' : 'pending'}`}
            >
              {currentStep > step.id ? '✓' : step.id}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: currentStep === step.id ? 600 : 400, color: currentStep >= step.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-connector ${currentStep > step.id ? 'done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// AI analysis mock
const mockAI = {
  category: 'Road Infrastructure',
  subcategory: 'Pothole',
  priority: 'High',
  department: 'Road Maintenance',
  summary: 'Large pothole reported on main road causing safety hazard.',
  confidence: 94,
};

function AIPanel({ visible }) {
  if (!visible) return null;
  return (
    <div style={{ background: '#f0f7ff', border: '1px solid #b3d4ec', borderRadius: 8, padding: 16, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Sparkles size={15} style={{ color: 'var(--color-secondary)' }} />
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>AI Complaint Analysis</span>
        <span style={{ fontSize: '0.6875rem', background: 'var(--color-secondary)', color: '#fff', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>AI-assisted</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
        {[
          { label: 'Suggested Category', value: mockAI.category },
          { label: 'Priority', value: mockAI.priority },
          { label: 'Department', value: mockAI.department },
          { label: 'Confidence', value: `${mockAI.confidence}%` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #c2d9f0' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>AI Summary</p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{mockAI.summary}</p>
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 10 }}>
        <AlertCircle size={11} style={{ display: 'inline', marginRight: 4 }} />
        Please review AI suggestions before submitting. You can override them.
      </p>
    </div>
  );
}

export default function NewComplaintPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState([]);
  const [showAI, setShowAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = categories.find(c => c.name === formData.category);

  const handleNext = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    if (step === 1) setShowAI(true);
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    const id = generateComplaintId();
    toast.success(`Complaint ${id} submitted successfully!`);
    navigate('/complaints');
    setSubmitting(false);
  };

  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'My Complaints', href: '/complaints' }, { label: 'Register Complaint' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Register a Complaint</h1>
          <p className="page-desc">Fill in the details below to submit your grievance</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <StepIndicator currentStep={step} />

        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '28px' }}>
          {/* Step 1: Complaint Details */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 20 }}>
                Step 1 — Complaint Details
              </h2>
              <Step1Form onNext={handleNext} initial={formData} />
              <AIPanel visible={false} />
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 20 }}>
                Step 2 — Location
              </h2>
              {showAI && <AIPanel visible={true} />}
              <Step2Form onNext={handleNext} onBack={() => setStep(1)} initial={formData} />
            </div>
          )}

          {/* Step 3: Evidence */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                Step 3 — Upload Evidence
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                Attach photos, videos, or documents to support your complaint. (Optional but recommended)
              </p>
              <div
                onClick={() => document.getElementById('file-upload').click()}
                style={{ border: '2px dashed var(--color-border)', borderRadius: 8, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: 'var(--color-bg)' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
                role="button"
                aria-label="Upload files"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && document.getElementById('file-upload').click()}
              >
                <Upload size={32} style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }} />
                <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Click or drag to upload</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Images, videos, PDFs (max 10MB each)</p>
                <input id="file-upload" type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleFileAdd} style={{ display: 'none' }} />
              </div>

              {files.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 10, color: 'var(--color-text-secondary)' }}>
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </p>
                  {files.map((file, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: '1.25rem' }}>{file.type.startsWith('image') ? '🖼️' : file.type.startsWith('video') ? '🎥' : '📄'}</span>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} aria-label="Remove file" className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button className="btn btn-primary" onClick={() => setStep(4)} style={{ marginLeft: 'auto' }}>
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                Step 4 — Review & Submit
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                Please review your complaint details before submitting.
              </p>

              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>Complaint Summary</h3>
                <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px 16px', fontSize: '0.875rem' }}>
                  <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Title</dt>
                  <dd style={{ color: 'var(--color-text-primary)' }}>{formData.title || '—'}</dd>
                  <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Category</dt>
                  <dd style={{ color: 'var(--color-text-primary)' }}>{formData.category || '—'} {formData.subcategory ? `› ${formData.subcategory}` : ''}</dd>
                  <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Description</dt>
                  <dd style={{ color: 'var(--color-text-primary)', lineHeight: 1.6 }}>{formData.description || '—'}</dd>
                  <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Location</dt>
                  <dd style={{ color: 'var(--color-text-primary)' }}>{[formData.address, formData.city, formData.pincode].filter(Boolean).join(', ') || '—'}</dd>
                  <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Attachments</dt>
                  <dd style={{ color: 'var(--color-text-primary)' }}>{files.length > 0 ? `${files.length} file(s) attached` : 'None'}</dd>
                </dl>
              </div>

              {/* AI panel in review */}
              <AIPanel visible={true} />

              <Alert type="info" style={{ marginTop: 16 }}>
                <div>
                  <strong>What happens next?</strong>
                  <p style={{ marginTop: 4, fontSize: '0.8125rem' }}>
                    After submission, your complaint will be reviewed by an admin and assigned to the relevant department within 24 hours. You will receive status updates via notifications.
                  </p>
                </div>
              </Alert>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setStep(3)}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  style={{ marginLeft: 'auto' }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit Complaint'}
                  {!submitting && <CheckCircle size={15} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1 sub-form
function Step1Form({ onNext, initial }) {
  const schema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Please provide a more detailed description (min. 20 characters)'),
    category: z.string().min(1, 'Please select a category'),
    subcategory: z.string().optional(),
  });
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: initial });
  const watchCat = watch('category');
  const selectedCat = categories.find(c => c.name === watchCat);

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <div style={{ marginBottom: 16 }}>
        <label className="form-label" htmlFor="title">Complaint Title <span className="required" aria-hidden="true">*</span></label>
        <input id="title" type="text" className={`form-input${errors.title ? ' error' : ''}`} placeholder="Brief description of your problem (e.g. Large pothole on MG Road)" {...register('title')} />
        {errors.title && <p className="form-error" role="alert">{errors.title.message}</p>}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label className="form-label" htmlFor="description">Describe Your Problem <span className="required" aria-hidden="true">*</span></label>
        <textarea id="description" rows={4} className={`form-input${errors.description ? ' error' : ''}`} placeholder="Provide detailed information about the issue — what is the problem, how long has it been happening, what impact is it having..." style={{ resize: 'vertical' }} {...register('description')} />
        {errors.description && <p className="form-error" role="alert">{errors.description.message}</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label" htmlFor="category">Category <span className="required" aria-hidden="true">*</span></label>
          <select id="category" className={`form-input${errors.category ? ' error' : ''}`} {...register('category')}>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          {errors.category && <p className="form-error" role="alert">{errors.category.message}</p>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label" htmlFor="subcategory">Subcategory</label>
          <select id="subcategory" className="form-input" {...register('subcategory')} disabled={!selectedCat}>
            <option value="">Select subcategory</option>
            {selectedCat?.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {selectedCat && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f0f7ff', border: '1px solid #c2d9f0', borderRadius: 6, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
          This complaint will be assigned to <strong>{selectedCat.department}</strong> · Default priority: <strong>{selectedCat.defaultPriority}</strong> · Expected resolution: <strong>{selectedCat.slaDays} day{selectedCat.slaDays > 1 ? 's' : ''}</strong>
        </div>
      )}
      <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto', display: 'flex' }}>
        Next <ArrowRight size={15} />
      </button>
    </form>
  );
}

// Step 2 sub-form
function Step2Form({ onNext, onBack, initial }) {
  const schema = z.object({
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit PIN code'),
  });
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: initial });
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(null);

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }); setLocating(false); toast.success('Location detected.'); },
      () => { setLocating(false); toast.error('Could not detect location. Please enter manually.'); }
    );
  };

  return (
    <form onSubmit={handleSubmit(d => onNext({ ...d, coords }))} noValidate style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <label className="form-label" htmlFor="loc-address">Address <span className="required" aria-hidden="true">*</span></label>
        <input id="loc-address" type="text" className={`form-input${errors.address ? ' error' : ''}`} placeholder="Street address, landmark" {...register('address')} />
        {errors.address && <p className="form-error" role="alert">{errors.address.message}</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label" htmlFor="loc-city">City <span className="required" aria-hidden="true">*</span></label>
          <input id="loc-city" type="text" className={`form-input${errors.city ? ' error' : ''}`} placeholder="Pune" {...register('city')} />
          {errors.city && <p className="form-error" role="alert">{errors.city.message}</p>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label" htmlFor="loc-pin">PIN Code <span className="required" aria-hidden="true">*</span></label>
          <input id="loc-pin" type="text" className={`form-input${errors.pincode ? ' error' : ''}`} placeholder="411001" maxLength={6} {...register('pincode')} />
          {errors.pincode && <p className="form-error" role="alert">{errors.pincode.message}</p>}
        </div>
      </div>
      <button type="button" className="btn btn-outline btn-sm" onClick={getLocation} disabled={locating} style={{ marginBottom: 16 }}>
        <MapPin size={14} /> {locating ? 'Detecting…' : 'Use My Current Location'}
      </button>
      {coords && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-success)', marginBottom: 12 }}>
          ✓ Location detected: {coords.lat}, {coords.lng}
        </p>
      )}
      <div style={{ height: 200, background: '#e8f4fd', border: '1px solid var(--color-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ textAlign: 'center', color: 'var(--color-secondary)' }}>
          <MapPin size={32} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Map — Select Location</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>Map loads when complaint detail page is opened</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn btn-ghost" onClick={onBack}><ArrowLeft size={15} /> Back</button>
        <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>Next <ArrowRight size={15} /></button>
      </div>
    </form>
  );
}
