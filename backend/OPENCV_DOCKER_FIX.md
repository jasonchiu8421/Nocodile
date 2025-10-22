# OpenCV Docker Container Fix

## Problem
The Docker container was constantly restarting due to OpenCV dependency issues, specifically:
```
ImportError: libGL.so.1: cannot open shared object file: No such file or directory
```

## Root Cause
The issue was caused by missing OpenGL libraries required by OpenCV, particularly `libGL.so.1`. The original Dockerfile was missing several critical OpenGL dependencies.

## Solution Applied

### 1. Updated Dockerfile
- Added missing OpenGL libraries: `libgl1`, `libglu1-mesa`, `libglu1`
- Added additional OpenCV headless libraries: `libgthread-2.0-0`, `libgstreamer-gl1.0-0`, `libgstreamer-plugins-bad1.0-0`
- Added environment variables for headless operation:
  - `QT_QPA_PLATFORM=offscreen`
  - `DISPLAY=:99`
  - `LIBGL_ALWAYS_SOFTWARE=1`

### 2. Updated docker-compose.yml
- Added OpenCV environment variables to the backend service
- These ensure OpenCV runs in headless mode without requiring a display

### 3. Created Alternative Dockerfile
- `Dockerfile.opencv` - A backup Dockerfile with the same fixes
- Can be used as an alternative if the main Dockerfile has issues

## Files Modified
- `Dockerfile` - Main Dockerfile with OpenCV fixes
- `docker-compose.yml` - Added OpenCV environment variables
- `Dockerfile.opencv` - Alternative Dockerfile (backup)
- `test_opencv.py` - Test script to verify OpenCV functionality

## Testing
Run the test script to verify OpenCV is working:
```bash
docker-compose exec backend python test_opencv.py
```

## Key Dependencies Added
- `libgl1` - Core OpenGL library
- `libglu1-mesa` - OpenGL Utility library
- `libglu1` - OpenGL Utility library (alternative)
- `libgthread-2.0-0` - Threading library for GStreamer
- `libgstreamer-gl1.0-0` - GStreamer OpenGL plugin
- `libgstreamer-plugins-bad1.0-0` - Additional GStreamer plugins

## Environment Variables
- `QT_QPA_PLATFORM=offscreen` - Forces Qt to use offscreen rendering
- `DISPLAY=:99` - Sets a virtual display (not used but prevents errors)
- `LIBGL_ALWAYS_SOFTWARE=1` - Forces software rendering for OpenGL

## Notes
- The application already uses `opencv-python-headless` which is correct for Docker
- The fix ensures OpenCV works in headless mode without requiring a display server
- All OpenCV functionality should work including video processing and computer vision operations
