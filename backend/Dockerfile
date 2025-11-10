# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.10.11
FROM python:${PYTHON_VERSION}-slim as base

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1
# Keeps Python from buffering stdout and stderr.
ENV PYTHONUNBUFFERED=1
# OpenCV headless mode environment variables
ENV QT_QPA_PLATFORM=offscreen
ENV DISPLAY=:99
ENV LIBGL_ALWAYS_SOFTWARE=1

# Install system dependencies for OpenCV and other requirements
RUN apt-get update && apt-get install -y \
    # Basic utilities
    git \
    wget \
    curl \
    gosu \
    # Essential OpenGL libraries for OpenCV
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgtk-3-0 \
    # Critical OpenGL libraries that were missing
    libgl1 \
    libglu1-mesa \
    libglu1 \
    # Video processing libraries
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    # Image processing libraries
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libwebp-dev \
    # Math libraries
    libatlas-base-dev \
    liblapack-dev \
    # Python development
    python3-dev \
    python3-numpy \
    # Additional OpenGL and GUI libraries
    libfontconfig1 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \ 
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    libasound2 \
    libdrm2 \
    libxkbcommon0 \
    # GStreamer core and base
    libgstreamer1.0-0 \
    libgstreamer-plugins-base1.0-0 \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer1.0-dev \
    # GStreamer plugins
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-plugins-base \
    gstreamer1.0-libav \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

WORKDIR /app

# Create a non-privileged user.
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/app" \
    --shell "/bin/bash" \
    --uid "${UID}" \
    appuser

# Create necessary directories with proper permissions
RUN mkdir -p /app/projects /app/safe_projects /app/temp && \
    chown -R appuser:appuser /app

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY requirements.txt .

# Install dependencies using cache.
RUN python -m pip install --timeout=600 -r requirements.txt

# Copy source code.
COPY . .

# Set proper ownership and permissions
RUN chown -R appuser:appuser /app && \
    chmod -R 755 /app

# Note: We don't switch to appuser here - the entrypoint will do it
# This allows the entrypoint to run as root to fix permissions first

# Expose port.
EXPOSE 8888

# Set entrypoint to fix permissions, then switch to appuser
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Run FastAPI application.
CMD ["uvicorn", "server:app", "--host=0.0.0.0", "--port=8888"]