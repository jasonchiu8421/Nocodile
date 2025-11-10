#!/bin/bash
set -e

# This script runs as root to fix permissions, then switches to appuser

echo "🔧 Fixing permissions for /app/projects and /app/safe_projects..."

# Create directories if they don't exist
mkdir -p /app/projects /app/safe_projects /app/temp

# Fix ownership - change to appuser:appuser (UID:GID 10001:10001)
chown -R appuser:appuser /app/projects /app/safe_projects /app/temp

# Verify permissions were set correctly
ls -la /app/ | grep -E "projects|safe_projects|temp"

echo "✅ Permissions fixed successfully"

# Switch to appuser and execute the main command
exec gosu appuser "$@"