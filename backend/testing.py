# main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pathlib import Path
import os

app = FastAPI(
    title="best.pt Download Service",
    description="Securely stream the `best.pt` model file.",
)


# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------
# Put your `best.pt` file next to this script or change the path.
MODEL_DIR = Path(__file__).parent.resolve()
MODEL_PATH = MODEL_DIR / "yolo11m.pt"

# Safety check – make sure the file really exists at startup
if not MODEL_PATH.is_file():
    raise RuntimeError(f"Model file not found: {MODEL_PATH}")


# ----------------------------------------------------------------------
# Helper: stream the file in chunks (low memory usage)
# ----------------------------------------------------------------------
def file_iterator(file_path: Path, chunk_size: int = 8192):
    """Yield file chunks – perfect for large models."""
    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            yield chunk


# ----------------------------------------------------------------------
# Endpoint: /download/best.pt
# ----------------------------------------------------------------------
@app.get("/download/best.pt")
async def download_best_pt(request: Request):
    """
    Stream `best.pt` to the client.
    - Forces download (Content-Disposition: attachment)
    - Uses chunked streaming (no full load in RAM)
    - Prevents path-traversal by hard-coding the file name
    """
    # Optional: add authentication here (e.g. API key, JWT, etc.)

    # ------------------------------------------------------------------
    # 1. Build safe headers
    # ------------------------------------------------------------------
    file_name = MODEL_PATH.name  # "best.pt"
    file_size = MODEL_PATH.stat().st_size

    headers = {
        "Content-Disposition": f'attachment; filename="{file_name}"',
        "Content-Type": "application/octet-stream",
        "Content-Length": str(file_size),
        # Optional: allow resumable downloads
        "Accept-Ranges": "bytes",
    }

    # ------------------------------------------------------------------
    # 2. Return StreamingResponse
    # ------------------------------------------------------------------
    return StreamingResponse(
        file_iterator(MODEL_PATH),
        media_type="application/octet-stream",
        headers=headers,
    )


# ----------------------------------------------------------------------
# Health-check / info endpoint
# ----------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "message": "best.pt streaming server is running",
        "download_url": "/download/best.pt",
        "file_size_bytes": MODEL_PATH.stat().st_size,
    }