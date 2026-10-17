/**
 * Bharat Civic Connect — AI Vision Service Client
 *
 * Connects the citizen grievance form directly with the FastAPI YOLO Vision service.
 *
 * IMPORTANT SECURITY NOTICE:
 * Any environment variables prefixed with `VITE_` are injected by Vite directly into
 * client-side JavaScript bundles and are publicly accessible to anyone inspecting network
 * requests or client source code in the browser.
 * NEVER store server credentials, database passwords, private API keys, or model secrets
 * in `VITE_` variables!
 */

export const AI_VISION_BASE_URL = (
  import.meta.env.VITE_AI_SERVICE_URL ||
  import.meta.env.VITE_AI_VISION_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/+$/, '');

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB max

/**
 * Mapping from the 10 YOLO trained classes to portal grievance taxonomy
 */
export const YOLO_CLASS_MAPPING = {
  pothole: {
    label: 'Pothole',
    category: 'Road Infrastructure',
    subcategory: 'Pothole',
    department: 'Road Maintenance',
    defaultPriority: 'High',
    description: 'Road surface cavity causing safety hazard to motorists and pedestrians.',
  },
  garbage: {
    label: 'Garbage / Refuse',
    category: 'Sanitation',
    subcategory: 'Garbage Not Collected',
    department: 'Sanitation',
    defaultPriority: 'Medium',
    description: 'Accumulation of uncollected municipal solid waste or illegal trash dumping.',
  },
  drainage_issue: {
    label: 'Drainage Issue',
    category: 'Sanitation',
    subcategory: 'Blocked Drain',
    department: 'Sanitation',
    defaultPriority: 'High',
    description: 'Clogged, overflowing, or malfunctioning storm/waste drainage channel.',
  },
  waterlogging: {
    label: 'Waterlogging',
    category: 'Road Infrastructure',
    subcategory: 'Road Obstruction',
    department: 'Road Maintenance',
    defaultPriority: 'High',
    description: 'Stagnant pool of accumulated water obstructing roadway or pedestrian movement.',
  },
  damaged_sign: {
    label: 'Damaged / Missing Sign',
    category: 'Road Infrastructure',
    subcategory: 'Missing Road Sign',
    department: 'Road Maintenance',
    defaultPriority: 'Medium',
    description: 'Traffic, directional, or civic advisory signage damaged, bent, or missing.',
  },
  pole_damage: {
    label: 'Damaged Utility Pole',
    category: 'Electricity',
    subcategory: 'Streetlight Issue',
    department: 'Electricity',
    defaultPriority: 'High',
    description: 'Tilted, cracked, or electrically hazardous streetlight or utility pole.',
  },
  fallen_tree: {
    label: 'Fallen Tree / Branch',
    category: 'Parks & Public Spaces',
    subcategory: 'Encroachment',
    department: 'Parks & Recreation',
    defaultPriority: 'High',
    description: 'Uprooted tree or large fallen branch obstructing public thoroughfare.',
  },
  smoke: {
    label: 'Smoke / Open Burning',
    category: 'Sanitation',
    subcategory: 'Illegal Dumping',
    department: 'Sanitation',
    defaultPriority: 'Critical',
    description: 'Hazardous smoke, air pollution, or open trash combustion in civic area.',
  },
  open_manhole: {
    label: 'Open Manhole',
    category: 'Sanitation',
    subcategory: 'Open Drain',
    department: 'Sanitation',
    defaultPriority: 'Critical',
    description: 'Uncovered sewer or storm drain manhole posing severe hazard.',
  },
  damaged_footpath: {
    label: 'Damaged Footpath',
    category: 'Road Infrastructure',
    subcategory: 'Broken Footpath',
    department: 'Road Maintenance',
    defaultPriority: 'Medium',
    description: 'Broken pavement tiles, uneven walkway, or damaged pedestrian walkway.',
  },
};

/**
 * Validates image file type and size before uploading
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No image file selected.' };
  }

  const name = (file.name || '').toLowerCase();
  const hasValidExt = SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasValidType = !file.type || SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase());

  if (!hasValidExt && !hasValidType) {
    return {
      valid: false,
      error: `Unsupported image format. Allowed formats: JPG, JPEG, PNG, and WebP.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed upload size is 15 MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  return { valid: true };
}

/**
 * Check connectivity to the FastAPI AI Vision Service
 * @returns {Promise<{ healthy: boolean, data?: object, error?: string }>}
 */
export async function checkAIVisionHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`${AI_VISION_BASE_URL}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (res.ok && data.status === 'healthy') {
      return { healthy: true, data };
    }
    return {
      healthy: false,
      error: data.error || 'AI Vision service is in a degraded or uninitialized state.',
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      healthy: false,
      error:
        err.name === 'AbortError'
          ? 'Health check timed out.'
          : `Cannot reach AI Vision Service at ${AI_VISION_BASE_URL}.`,
    };
  }
}

/**
 * Sends an uploaded grievance photo to the FastAPI /predict endpoint.
 *
 * Uses the exact multipart field name `file` expected by the server.
 *
 * @param {File} file
 * @param {object} options
 * @param {number} [options.conf=0.25] - Confidence threshold (0.01 to 1.0)
 * @param {boolean} [options.saveAnnotated=false] - Whether to request server rendering
 * @param {number} [options.timeoutMs=18000] - Timeout in milliseconds
 * @returns {Promise<{
 *   success: boolean,
 *   hasDetections: boolean,
 *   totalDetections: number,
 *   primaryDefect: string | null,
 *   confidencePct: number | null,
 *   suggestedCategory: string | null,
 *   suggestedSubcategory: string | null,
 *   suggestedDepartment: string | null,
 *   suggestedPriority: string | null,
 *   classCounts: Record<string, number>,
 *   allDetections: Array<object>,
 *   message: string,
 *   imageDimensions: { width: number, height: number } | null,
 *   inferenceTimeMs: number | null,
 * }>}
 */
export async function analyzeGrievanceImage(file, options = {}) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { conf = 0.25, saveAnnotated = false, timeoutMs = 18000 } = options;

  // Exact multipart field name expected by FastAPI: `file`
  const formData = new FormData();
  formData.append('file', file, file.name);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const predictUrl = new URL(`${AI_VISION_BASE_URL}/predict`);
  predictUrl.searchParams.set('conf', String(conf));
  if (saveAnnotated) {
    predictUrl.searchParams.set('save_annotated', 'true');
  }

  try {
    const res = await fetch(predictUrl.toString(), {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('Image exceeds maximum allowed size (15 MB).');
      }
      if (res.status === 415) {
        throw new Error('Image format unsupported by the vision engine.');
      }
      if (res.status === 503) {
        throw new Error(
          'AI Vision Model is temporarily initializing or unavailable. You can proceed by selecting the category manually.'
        );
      }
      throw new Error(data.detail || data.message || `AI prediction failed with status ${res.status}.`);
    }

    const hasDetections = Boolean(data.has_detections && data.total_detections > 0);
    const primary = data.primary_detection || null;
    const primaryClass = primary ? primary.class_name : null;
    const mapping = primaryClass ? YOLO_CLASS_MAPPING[primaryClass] : null;

    const confidencePct = primary ? Math.round(primary.confidence * 100) : null;

    return {
      success: true,
      hasDetections,
      totalDetections: data.total_detections || 0,
      primaryDefect: mapping?.label || primaryClass,
      rawPrimaryClass: primaryClass,
      confidencePct,
      suggestedCategory: mapping?.category || null,
      suggestedSubcategory: mapping?.subcategory || null,
      suggestedDepartment: mapping?.department || null,
      suggestedPriority: mapping?.defaultPriority || null,
      defectDescription: mapping?.description || null,
      classCounts: data.class_counts || {},
      allDetections: data.detections || [],
      message: data.message || (hasDetections ? 'Defects detected.' : 'No civic defects detected.'),
      imageDimensions: data.image_dimensions || null,
      inferenceTimeMs: data.inference_time_ms || null,
      savedAnnotatedImage: data.saved_annotated_image || null,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new Error(
        'AI Vision request timed out after 18 seconds. Please check your network or select your category manually.'
      );
    }

    if (
      err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.name === 'TypeError'
    ) {
      throw new Error(
        `Unable to connect to Bharat Civic Vision AI at ${AI_VISION_BASE_URL}. Ensure the service is running, or proceed by choosing your category manually.`
      );
    }

    throw err;
  }
}

export default {
  AI_VISION_BASE_URL,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  YOLO_CLASS_MAPPING,
  validateImageFile,
  checkAIVisionHealth,
  analyzeGrievanceImage,
};
