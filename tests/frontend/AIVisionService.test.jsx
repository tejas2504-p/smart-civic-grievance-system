import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateImageFile,
  analyzeGrievanceImage,
  AI_VISION_BASE_URL,
  YOLO_CLASS_MAPPING,
} from '../../src/services/ai/aiVisionService';
import AIVisionAssistant from '../../src/components/ai/AIVisionAssistant';

describe('AI Vision Service & Complaint Form Integration (Phase 2)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('1. File Type and Size Validation', () => {
    it('should validate supported image formats (JPEG, PNG, WebP) within size limit', () => {
      const validJpg = new File(['dummy jpg content'], 'pothole.jpg', { type: 'image/jpeg' });
      const validPng = new File(['dummy png content'], 'garbage.png', { type: 'image/png' });
      const validWebp = new File(['dummy webp content'], 'drain.webp', { type: 'image/webp' });

      expect(validateImageFile(validJpg).valid).toBe(true);
      expect(validateImageFile(validPng).valid).toBe(true);
      expect(validateImageFile(validWebp).valid).toBe(true);
    });

    it('should reject unsupported file types (PDF, TXT, DOCX)', () => {
      const pdfFile = new File(['dummy pdf'], 'document.pdf', { type: 'application/pdf' });
      const txtFile = new File(['dummy text'], 'notes.txt', { type: 'text/plain' });

      const pdfValidation = validateImageFile(pdfFile);
      expect(pdfValidation.valid).toBe(false);
      expect(pdfValidation.error).toContain('Unsupported image format');

      const txtValidation = validateImageFile(txtFile);
      expect(txtValidation.valid).toBe(false);
      expect(txtValidation.error).toContain('Unsupported image format');
    });

    it('should reject files exceeding the 15 MB limit', () => {
      const oversizedFile = new File([''], 'huge_photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(oversizedFile, 'size', { value: 16 * 1024 * 1024 }); // 16 MB

      const validation = validateImageFile(oversizedFile);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('File is too large');
      expect(validation.error).toContain('15 MB');
    });

    it('should reject empty files (0 bytes)', () => {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
      Object.defineProperty(emptyFile, 'size', { value: 0 });

      const validation = validateImageFile(emptyFile);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('empty');
    });
  });

  describe('2. Successful YOLO Prediction with Category Suggestion', () => {
    it('should send multipart request with exact field name "file" and parse detections', async () => {
      const mockApiResponse = {
        success: true,
        has_detections: true,
        total_detections: 2,
        message: 'Detected 2 civic defect(s): 2 pothole.',
        primary_detection: {
          class_id: 0,
          class_name: 'pothole',
          confidence: 0.8088,
          box: { x1: 100, y1: 100, x2: 200, y2: 200, width: 100, height: 100 },
        },
        detections: [
          { class_id: 0, class_name: 'pothole', confidence: 0.8088 },
          { class_id: 0, class_name: 'pothole', confidence: 0.3677 },
        ],
        class_counts: { pothole: 2 },
        image_dimensions: { width: 3000, height: 4000 },
        inference_time_ms: 85.4,
      };

      let sentFormData = null;
      global.fetch = vi.fn().mockImplementation((url, options) => {
        sentFormData = options.body;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponse),
        });
      });

      const testFile = new File(['image bytes'], 'road_pothole.jpg', { type: 'image/jpeg' });
      const result = await analyzeGrievanceImage(testFile);

      // Verify exact multipart field name `file`
      expect(sentFormData).toBeInstanceOf(FormData);
      expect(sentFormData.get('file')).toBeTruthy();
      expect(sentFormData.get('file').name).toBe('road_pothole.jpg');

      // Verify parsed output and mapped taxonomy
      expect(result.success).toBe(true);
      expect(result.hasDetections).toBe(true);
      expect(result.totalDetections).toBe(2);
      expect(result.primaryDefect).toBe('Pothole');
      expect(result.confidencePct).toBe(81);
      expect(result.suggestedCategory).toBe('Road Infrastructure');
      expect(result.suggestedSubcategory).toBe('Pothole');
      expect(result.suggestedDepartment).toBe('Road Maintenance');
      expect(result.suggestedPriority).toBe('High');
      expect(result.classCounts).toEqual({ pothole: 2 });
    });
  });

  describe('3. Zero Detections Handling', () => {
    it('should return clear zero-detection result when no objects meet confidence threshold', async () => {
      const mockApiResponse = {
        success: true,
        has_detections: false,
        total_detections: 0,
        message: 'No civic grievance issues detected with confidence >= 0.25.',
        primary_detection: null,
        detections: [],
        class_counts: {},
        image_dimensions: { width: 1920, height: 1080 },
        inference_time_ms: 45.1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      const testFile = new File(['image bytes'], 'clear_road.jpg', { type: 'image/jpeg' });
      const result = await analyzeGrievanceImage(testFile);

      expect(result.success).toBe(true);
      expect(result.hasDetections).toBe(false);
      expect(result.totalDetections).toBe(0);
      expect(result.primaryDefect).toBeNull();
      expect(result.suggestedCategory).toBeNull();
      expect(result.message).toContain('No civic grievance issues detected');
    });
  });

  describe('4. AI Service Failure & Network/CORS Resilience', () => {
    it('should handle service 503 Unavailable gracefully without breaking user flow', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ detail: 'Model is not loaded in memory.' }),
      });

      const testFile = new File(['image bytes'], 'road.jpg', { type: 'image/jpeg' });
      await expect(analyzeGrievanceImage(testFile)).rejects.toThrow(
        /AI Vision Model is temporarily initializing or unavailable/
      );
    });

    it('should handle network disconnection or CORS failure gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const testFile = new File(['image bytes'], 'photo.jpg', { type: 'image/jpeg' });
      await expect(analyzeGrievanceImage(testFile)).rejects.toThrow(
        /Unable to connect to Bharat Civic Vision AI/
      );
    });

    it('should handle request timeout (AbortError)', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const testFile = new File(['image bytes'], 'photo.jpg', { type: 'image/jpeg' });
      await expect(analyzeGrievanceImage(testFile)).rejects.toThrow(
        /AI Vision request timed out/
      );
    });
  });

  describe('5. AIVisionAssistant Component UI Tests', () => {
    beforeEach(() => {
      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-preview');
      global.URL.revokeObjectURL = vi.fn();
    });

    it('should render initial upload dropzone', () => {
      render(
        <AIVisionAssistant
          onApplySuggestion={vi.fn()}
          currentCategory=""
          currentSubcategory=""
        />
      );

      expect(screen.getByText(/AI Smart Photo Categorization/i)).toBeInTheDocument();
      expect(screen.getByText(/Click or tap to select a photo/i)).toBeInTheDocument();
    });

    it('should select an image and display "Analyze Image with AI" button', async () => {
      const onFileSelected = vi.fn();
      render(
        <AIVisionAssistant
          onApplySuggestion={vi.fn()}
          onFileSelected={onFileSelected}
          currentCategory=""
          currentSubcategory=""
        />
      );

      const input = document.querySelector('input[type="file"]');
      const testFile = new File(['bytes'], 'test_pothole.jpg', { type: 'image/jpeg' });

      fireEvent.change(input, { target: { files: [testFile] } });

      expect(screen.getByText('test_pothole.jpg')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Analyze Image with AI/i })).toBeInTheDocument();
      expect(onFileSelected).toHaveBeenCalledWith(testFile);
    });

    it('should display detection results and apply suggested category on click', async () => {
      const mockApiResponse = {
        success: true,
        has_detections: true,
        total_detections: 1,
        message: 'Detected 1 pothole.',
        primary_detection: {
          class_id: 0,
          class_name: 'pothole',
          confidence: 0.88,
          box: { x1: 50, y1: 50, x2: 150, y2: 150, width: 100, height: 100 },
        },
        detections: [{ class_id: 0, class_name: 'pothole', confidence: 0.88 }],
        class_counts: { pothole: 1 },
        image_dimensions: { width: 1000, height: 1000 },
        inference_time_ms: 70,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      const handleApply = vi.fn();
      render(
        <AIVisionAssistant
          onApplySuggestion={handleApply}
          currentCategory=""
          currentSubcategory=""
        />
      );

      const input = document.querySelector('input[type="file"]');
      const testFile = new File(['bytes'], 'pothole_sample.jpg', { type: 'image/jpeg' });
      fireEvent.change(input, { target: { files: [testFile] } });

      const analyzeBtn = screen.getByRole('button', { name: /Analyze Image with AI/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(screen.getByText(/Detected: Pothole/i)).toBeInTheDocument();
        expect(screen.getByText(/88% Model Match/i)).toBeInTheDocument();
        expect(screen.getByText(/Road Infrastructure/i)).toBeInTheDocument();
      });

      const applyBtn = screen.getByRole('button', { name: /Apply AI Suggestion/i });
      fireEvent.click(applyBtn);

      expect(handleApply).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Road Infrastructure',
          subcategory: 'Pothole',
          department: 'Road Maintenance',
          priority: 'High',
          defect: 'Pothole',
          confidencePct: 88,
        })
      );
    });
  });
});
