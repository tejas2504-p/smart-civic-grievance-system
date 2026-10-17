import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Eye,
  Camera,
  Info,
} from 'lucide-react';
import {
  analyzeGrievanceImage,
  validateImageFile,
  SUPPORTED_EXTENSIONS,
} from '../../services/ai/aiVisionService';

/**
 * AIVisionAssistant Component
 *
 * Integrates directly into the citizen complaint registration flow.
 * Enables image upload, client-side validation, FastAPI YOLO inference,
 * and seamless one-click application of predicted civic categories.
 */
export default function AIVisionAssistant({
  onApplySuggestion,
  onFileSelected,
  currentCategory,
  currentSubcategory,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);
  const fileInputRef = useRef(null);

  // Clean up object URLs on file change or unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(null);
    setAnalysisResult(null);
    setApplied(false);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);

    // Notify parent to add this file to evidence files
    if (onFileSelected) {
      onFileSelected(file);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setError(null);
    setApplied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setApplied(false);

    try {
      const result = await analyzeGrievanceImage(selectedFile, { conf: 0.25 });
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message || 'Image analysis failed. Please select your category manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!analysisResult?.suggestedCategory) return;

    if (onApplySuggestion) {
      onApplySuggestion({
        category: analysisResult.suggestedCategory,
        subcategory: analysisResult.suggestedSubcategory || '',
        department: analysisResult.suggestedDepartment || '',
        priority: analysisResult.suggestedPriority || 'Medium',
        defect: analysisResult.primaryDefect,
        confidencePct: analysisResult.confidencePct,
      });
    }
    setApplied(true);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)',
        border: '1px solid #bbf7d0',
        borderRadius: 10,
        padding: 18,
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div
          style={{
            background: '#dcfce7',
            padding: 6,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={18} color="#15803d" />
        </div>
        <div>
          <h3
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: '#14532d',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            AI Smart Photo Categorization
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                background: '#dcfce7',
                color: '#166534',
                padding: '2px 6px',
                borderRadius: 4,
                textTransform: 'uppercase',
              }}
            >
              YOLO Vision
            </span>
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#166534', margin: '2px 0 0 0' }}>
            Upload a photo of the issue to automatically suggest category, subcategory & department.
          </p>
        </div>
      </div>

      {/* Upload & Preview Area */}
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #86efac',
            borderRadius: 8,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: '#ffffff',
            transition: 'border-color 0.2s',
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <Camera size={26} color="#16a34a" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#15803d', margin: '0 0 4px' }}>
            Click or tap to select a photo of the civic problem
          </p>
          <p style={{ fontSize: '0.6875rem', color: '#4b5563', margin: 0 }}>
            Supports JPG, JPEG, PNG, WebP (up to 15 MB)
          </p>
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Selected issue preview"
                style={{
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #111827)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedFile.name}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0 0' }}>
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type || 'Image'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-ghost btn-sm"
              style={{ padding: 4 }}
              title="Remove photo"
              aria-label="Remove photo"
              disabled={analyzing}
            >
              <X size={16} />
            </button>
          </div>

          {/* Action Button: Analyze Image with AI */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAnalyze}
              disabled={analyzing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {analyzing ? (
                <>
                  <RefreshCw size={14} className="spin-animation" />
                  Analyzing Photo...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Analyze Image with AI
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
              style={{ fontSize: '0.75rem', color: '#4b5563' }}
            >
              Change Photo
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_EXTENSIONS.join(',')}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Error State */}
      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', color: '#991b1b', margin: 0, lineHeight: 1.4 }}>
              {error}
            </p>
            <p style={{ fontSize: '0.6875rem', color: '#7f1d1d', margin: '4px 0 0' }}>
              💡 You may still proceed by manually selecting your category and subcategory below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="btn btn-ghost btn-sm"
            style={{ padding: 2, color: '#991b1b' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Detection Results */}
      {analysisResult && (
        <div style={{ marginTop: 14 }}>
          {analysisResult.hasDetections ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #86efac',
                borderRadius: 8,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={16} color="#16a34a" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#14532d' }}>
                    Detected: {analysisResult.primaryDefect}
                  </span>
                  {analysisResult.totalDetections > 1 && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      {analysisResult.totalDetections} defects found
                    </span>
                  )}
                </div>

                {analysisResult.confidencePct !== null && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    {analysisResult.confidencePct}% Model Match
                  </span>
                )}
              </div>

              {/* Taxonomy Suggestion */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '8px 12px',
                  marginBottom: 10,
                  fontSize: '0.75rem',
                  color: '#334155',
                  lineHeight: 1.5,
                }}
              >
                <div>
                  Suggested Category:{' '}
                  <strong style={{ color: '#0f172a' }}>{analysisResult.suggestedCategory}</strong>
                  {analysisResult.suggestedSubcategory && (
                    <span>
                      {' '}
                      ›{' '}
                      <strong style={{ color: '#0f172a' }}>
                        {analysisResult.suggestedSubcategory}
                      </strong>
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 2, color: '#64748b' }}>
                  Assigned Department: <strong>{analysisResult.suggestedDepartment}</strong> · Priority:{' '}
                  <strong>{analysisResult.suggestedPriority}</strong>
                </div>
              </div>

              {/* Apply Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${applied ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={handleApply}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: applied ? '#dcfce7' : undefined,
                    color: applied ? '#166534' : undefined,
                    borderColor: applied ? '#86efac' : undefined,
                  }}
                >
                  <CheckCircle size={14} />
                  {applied ? 'Category Applied to Form ✓' : 'Apply AI Suggestion'}
                </button>

                <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                  You can still manually change or fine-tune any field below.
                </span>
              </div>
            </div>
          ) : (
            /* Zero Detections Card */
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <Info size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#0369a1' }}>
                  No civic defects recognized with high confidence
                </p>
                <p style={{ margin: 0, color: '#64748b', lineHeight: 1.4 }}>
                  The photo may be blurry, captured from an angle, or contain an issue outside the
                  model's 10 trained categories. Please select your category and subcategory
                  manually below.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Non-intrusive advisory disclaimer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 10,
          fontSize: '0.6875rem',
          color: '#6b7280',
        }}
      >
        <Info size={12} color="#9ca3af" />
        <span>
          AI suggestions are automated estimations to assist with classification. The citizen has
          full authority to review or change the category before submission.
        </span>
      </div>
    </div>
  );
}
