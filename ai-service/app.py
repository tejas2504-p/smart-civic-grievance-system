import io
import logging
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import cv2
import torch
from fastapi import FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from PIL import Image
from pydantic import BaseModel, Field
from ultralytics import YOLO

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("civic-ai-service")

# ---------------------------------------------------------------------------
# Constants & Directory Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MODEL_RELATIVE_PATH = Path("runs/civic/baseline-2/weights/best.pt")
MODEL_PATH = BASE_DIR / MODEL_RELATIVE_PATH
PREDICTIONS_DIR = BASE_DIR / "runs" / "predictions"

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB max file upload
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Ensure controlled prediction directory exists
PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Pydantic Schemas for OpenAPI & API Responses
# ---------------------------------------------------------------------------
class BoundingBox(BaseModel):
    x1: float = Field(..., description="Top-left X coordinate in pixels")
    y1: float = Field(..., description="Top-left Y coordinate in pixels")
    x2: float = Field(..., description="Bottom-right X coordinate in pixels")
    y2: float = Field(..., description="Bottom-right Y coordinate in pixels")
    width: float = Field(..., description="Box width in pixels")
    height: float = Field(..., description="Box height in pixels")


class NormalizedBoundingBox(BaseModel):
    x1: float = Field(..., description="Normalized top-left X (0.0 to 1.0)")
    y1: float = Field(..., description="Normalized top-left Y (0.0 to 1.0)")
    x2: float = Field(..., description="Normalized bottom-right X (0.0 to 1.0)")
    y2: float = Field(..., description="Normalized bottom-right Y (0.0 to 1.0)")
    width: float = Field(..., description="Normalized box width (0.0 to 1.0)")
    height: float = Field(..., description="Normalized box height (0.0 to 1.0)")


class DetectionItem(BaseModel):
    class_id: int = Field(..., description="Numeric class ID assigned during model training")
    class_name: str = Field(..., description="Readable label for civic grievance defect")
    confidence: float = Field(..., description="Model detection confidence (0.0 to 1.0)")
    box: BoundingBox = Field(..., description="Pixel coordinate bounding box")
    box_normalized: NormalizedBoundingBox = Field(..., description="Normalized 0.0 to 1.0 bounding box coordinates")


class ImageDimensions(BaseModel):
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")


class PredictionResponse(BaseModel):
    success: bool = Field(True, description="Whether the prediction request completed successfully")
    has_detections: bool = Field(..., description="True if one or more civic issues were detected")
    total_detections: int = Field(..., description="Total count of detected objects")
    message: str = Field(..., description="Human-readable result summary")
    primary_detection: Optional[DetectionItem] = Field(
        None,
        description="The detected issue with highest confidence (ideal for auto-categorizing complaints)",
    )
    detections: List[DetectionItem] = Field(
        default_factory=list,
        description="List of all detected civic defects",
    )
    class_counts: Dict[str, int] = Field(
        default_factory=dict,
        description="Frequency count of detections per category",
    )
    image_dimensions: ImageDimensions = Field(..., description="Dimensions of the processed image")
    inference_time_ms: float = Field(..., description="Model inference runtime in milliseconds")
    saved_annotated_image: Optional[str] = Field(
        None,
        description="Relative safe path/identifier for the saved annotated image, if requested",
    )


class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health state: 'healthy' or 'degraded'")
    service: str = Field(..., description="Service identifier")
    version: str = Field(..., description="API Version")
    model_loaded: bool = Field(..., description="True if the YOLO model checkpoint is loaded in memory")
    model_path: Optional[str] = Field(None, description="Relative path of loaded model checkpoint")
    num_classes: int = Field(..., description="Number of recognized civic defect classes")
    classes: List[str] = Field(default_factory=list, description="List of recognized civic defect classes")
    device: str = Field(..., description="Compute device used for inference (CPU or CUDA)")
    error: Optional[str] = Field(None, description="Load error message if status is degraded")


# ---------------------------------------------------------------------------
# Lifespan Management: Load Model Once at Service Startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load the trained YOLO model once when the FastAPI server initializes.
    Ensures zero redundant downloads or re-initializations during requests.
    """
    logger.info("Initializing Bharat Civic Connect AI Vision Service...")
    app.state.model = None
    app.state.model_loaded = False
    app.state.classes = []
    app.state.device = "cuda:0" if torch.cuda.is_available() else "cpu"
    app.state.model_path = MODEL_RELATIVE_PATH.as_posix()
    app.state.load_error = None

    if not MODEL_PATH.exists():
        err_msg = f"Model weights checkpoint not found at: {MODEL_PATH}"
        logger.error(err_msg)
        app.state.load_error = err_msg
    else:
        try:
            logger.info(f"Loading YOLO model checkpoint from: {MODEL_PATH}")
            model = YOLO(str(MODEL_PATH))
            # Cache model and metadata on app state
            app.state.model = model
            app.state.model_loaded = True
            # Extract class names mapping (dict of id -> name)
            if hasattr(model, "names") and isinstance(model.names, dict):
                app.state.classes = [model.names[i] for i in sorted(model.names.keys())]
            else:
                app.state.classes = []

            logger.info(
                f"Model loaded successfully on {app.state.device}! "
                f"Configured with {len(app.state.classes)} civic classes: {app.state.classes}"
            )
        except Exception as exc:
            err_msg = f"Failed to load YOLO model: {exc}"
            logger.exception(err_msg)
            app.state.load_error = err_msg

    yield

    logger.info("Shutting down Bharat Civic Connect AI Vision Service...")
    app.state.model = None


# ---------------------------------------------------------------------------
# FastAPI Application Setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Bharat Civic Connect — AI Vision Service",
    description=(
        "Production-grade AI inference service for automated civic grievance detection.\n\n"
        "Detects civic issues including potholes, garbage, drainage issues, waterlogging, "
        "damaged signs, pole damage, fallen trees, smoke, open manholes, and damaged footpaths."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for Node.js / React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/",
    summary="Root Service Info",
    description="Provides service metadata, documentation links, and operational status.",
)
async def root():
    return {
        "service": "Bharat Civic Connect — AI Vision Service",
        "description": "FastAPI inference service for civic grievance defect detection",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "docs": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json",
        },
        "model_loaded": getattr(app.state, "model_loaded", False),
        "supported_classes": getattr(app.state, "classes", []),
        "status": "running",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    description="Check the service status, hardware device, and confirm whether the model is loaded.",
)
async def health_check():
    model_loaded = getattr(app.state, "model_loaded", False)
    classes = getattr(app.state, "classes", [])
    device = getattr(app.state, "device", "unknown")
    model_path = getattr(app.state, "model_path", None)
    load_error = getattr(app.state, "load_error", None)

    if not model_loaded:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "service": "Bharat Civic Connect - AI Vision Service",
                "version": "1.0.0",
                "model_loaded": False,
                "model_path": model_path,
                "num_classes": 0,
                "classes": [],
                "device": device,
                "error": load_error or "Model is not loaded in memory.",
            },
        )

    return HealthResponse(
        status="healthy",
        service="Bharat Civic Connect - AI Vision Service",
        version="1.0.0",
        model_loaded=True,
        model_path=model_path,
        num_classes=len(classes),
        classes=classes,
        device=device,
        error=None,
    )


@app.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Detect Civic Issues in Uploaded Image",
    description=(
        "Upload a civic grievance photograph (JPEG, PNG, or WEBP) using multipart/form-data. "
        "The service executes YOLO inference and returns detailed bounding boxes, confidence "
        "scores, categorized counts, and identifies the primary detected defect."
    ),
)
async def predict_image(
    file: UploadFile = File(..., description="Civic grievance image file (JPEG, PNG, WEBP)"),
    conf: float = Query(
        0.25,
        ge=0.01,
        le=1.0,
        description="Confidence threshold for object detection (default: 0.25)",
    ),
    iou: float = Query(
        0.45,
        ge=0.01,
        le=1.0,
        description="Non-Maximum Suppression (NMS) IoU threshold (default: 0.45)",
    ),
    save_annotated: bool = Query(
        False,
        description="Whether to render and safely store the annotated prediction image on the server",
    ),
):
    # 1. Verify model readiness
    model: Optional[YOLO] = getattr(app.state, "model", None)
    if model is None or not getattr(app.state, "model_loaded", False):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model is not ready or failed to load. Please verify server health at /health.",
        )

    # 2. Validate filename and extension
    filename = file.filename or "upload.jpg"
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions are: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # 3. Read uploaded bytes in chunks and enforce size limit
    file_bytes = bytearray()
    chunk_size = 1024 * 1024  # 1 MB chunks
    try:
        while chunk := await file.read(chunk_size):
            file_bytes.extend(chunk)
            if len(file_bytes) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Uploaded file exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
                )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded image stream: {exc}",
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    # 4. Validate image integrity and decode to RGB via Pillow
    try:
        # Verify file structure
        temp_img = Image.open(io.BytesIO(file_bytes))
        temp_img.verify()

        # Re-open after verify() to load image data
        image = Image.open(io.BytesIO(file_bytes))
        format_lower = (image.format or "").lower()
        if format_lower not in {"jpeg", "png", "webp"}:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported image encoding '{image.format}'. Supported: JPEG, PNG, WEBP.",
            )
        image = image.convert("RGB")
        img_width, img_height = image.size
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {exc}",
        )

    # 5. Execute YOLO inference
    start_time = time.perf_counter()
    try:
        results = model.predict(
            source=image,
            conf=conf,
            iou=iou,
            verbose=False,
        )
    except Exception as exc:
        logger.exception("YOLO inference failed unexpectedly.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model inference failed: {exc}",
        )
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # 6. Parse detections
    detections: List[DetectionItem] = []
    class_counts: Dict[str, int] = {}

    result = results[0]
    names_dict = result.names if hasattr(result, "names") else {}

    if result.boxes is not None and len(result.boxes) > 0:
        for box in result.boxes:
            cls_id = int(box.cls[0].item())
            cls_name = names_dict.get(cls_id, f"class_{cls_id}")
            confidence = round(float(box.conf[0].item()), 4)

            # xyxy pixel coordinates
            xyxy = box.xyxy[0].tolist()
            x1 = round(float(xyxy[0]), 2)
            y1 = round(float(xyxy[1]), 2)
            x2 = round(float(xyxy[2]), 2)
            y2 = round(float(xyxy[3]), 2)
            box_w = round(max(0.0, x2 - x1), 2)
            box_h = round(max(0.0, y2 - y1), 2)

            # Normalized 0.0 to 1.0 coordinates
            norm_x1 = round(max(0.0, min(1.0, x1 / img_width)), 4) if img_width > 0 else 0.0
            norm_y1 = round(max(0.0, min(1.0, y1 / img_height)), 4) if img_height > 0 else 0.0
            norm_x2 = round(max(0.0, min(1.0, x2 / img_width)), 4) if img_width > 0 else 0.0
            norm_y2 = round(max(0.0, min(1.0, y2 / img_height)), 4) if img_height > 0 else 0.0
            norm_w = round(max(0.0, min(1.0, box_w / img_width)), 4) if img_width > 0 else 0.0
            norm_h = round(max(0.0, min(1.0, box_h / img_height)), 4) if img_height > 0 else 0.0

            item = DetectionItem(
                class_id=cls_id,
                class_name=cls_name,
                confidence=confidence,
                box=BoundingBox(
                    x1=x1,
                    y1=y1,
                    x2=x2,
                    y2=y2,
                    width=box_w,
                    height=box_h,
                ),
                box_normalized=NormalizedBoundingBox(
                    x1=norm_x1,
                    y1=norm_y1,
                    x2=norm_x2,
                    y2=norm_y2,
                    width=norm_w,
                    height=norm_h,
                ),
            )
            detections.append(item)
            class_counts[cls_name] = class_counts.get(cls_name, 0) + 1

    # Sort detections by confidence descending
    detections.sort(key=lambda d: d.confidence, reverse=True)
    primary_detection = detections[0] if detections else None
    has_detections = len(detections) > 0

    # 7. Optionally save annotated image using controlled storage and safe filenames
    saved_annotated_image: Optional[str] = None
    if save_annotated:
        try:
            annotated_bgr = result.plot()
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            safe_token = uuid.uuid4().hex[:8]
            safe_filename = f"pred_{timestamp}_{safe_token}.jpg"
            save_path = PREDICTIONS_DIR / safe_filename
            cv2.imwrite(str(save_path), annotated_bgr)
            # Return safe relative identifier without exposing full server paths
            saved_annotated_image = f"predictions/{safe_filename}"
            logger.info(f"Saved annotated image: {safe_filename}")
        except Exception as exc:
            logger.warning(f"Failed to save annotated image: {exc}")
            saved_annotated_image = None

    # 8. Construct informative message
    if has_detections:
        counts_summary = ", ".join(f"{cnt} {cls}" for cls, cnt in class_counts.items())
        message = f"Detected {len(detections)} civic defect(s): {counts_summary}."
    else:
        message = f"No civic grievance issues detected with confidence >= {conf:.2f}."

    return PredictionResponse(
        success=True,
        has_detections=has_detections,
        total_detections=len(detections),
        message=message,
        primary_detection=primary_detection,
        detections=detections,
        class_counts=class_counts,
        image_dimensions=ImageDimensions(width=img_width, height=img_height),
        inference_time_ms=elapsed_ms,
        saved_annotated_image=saved_annotated_image,
    )


@app.get(
    "/predictions/{filename}",
    response_class=FileResponse,
    summary="Retrieve Saved Annotated Image",
    description="Securely fetches a saved annotated prediction image by its safe filename without path traversal.",
)
async def get_prediction_image(filename: str):
    # Sanitize filename to prevent directory traversal
    safe_name = Path(filename).name
    file_path = (PREDICTIONS_DIR / safe_name).resolve()

    if not file_path.is_file() or not file_path.is_relative_to(PREDICTIONS_DIR.resolve()):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annotated image not found.",
        )

    return FileResponse(
        path=str(file_path),
        media_type="image/jpeg",
        filename=safe_name,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
