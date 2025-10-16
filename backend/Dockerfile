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

# Install dependencies using cache.
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=bind,source=requirements.txt,target=requirements.txt \
    python -m pip install -r requirements.txt

# Copy source code.
COPY . .

# Set proper ownership and permissions
RUN chown -R appuser:appuser /app && \
    chmod -R 755 /app

# Switch to non-privileged user.
USER appuser

# Expose port.
EXPOSE 8888

# Run FastAPI application.
CMD uvicorn 'server:app' --host=0.0.0.0 --port=8888
# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG PYTHON_VERSION=3.10.11
FROM python:${PYTHON_VERSION}-slim AS base

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1

# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y git

# Create a non-privileged user that the app will run under.
# See https://docs.docker.com/go/dockerfile-user-best-practices/
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.cache/pip to speed up subsequent builds.
# Leverage a bind mount to requirements.txt to avoid having to copy them into
# into this layer.
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=bind,source=requirements.txt,target=requirements.txt \
    python -m pip install -r requirements.txt

# Switch to the non-privileged user to run the application.
USER appuser

# Copy the source code into the container.
COPY . .

# Expose the port that the application listens on.
EXPOSE 8000

# Run the application.
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
