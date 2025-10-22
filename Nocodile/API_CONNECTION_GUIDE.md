# API Connection Validation Guide

This document provides a comprehensive overview of the API connection validation system implemented across all pages in the Nocodile application.

## Overview

The application now includes comprehensive API connection validation that ensures all backend endpoints are properly connected and functioning. This eliminates the use of fallback data and provides real-time feedback on API connectivity.

## Components

### 1. ApiConnectionValidator Component

**Location**: `components/ApiConnectionValidator.tsx`

A comprehensive component that validates all API endpoints used across the application.

**Features**:

- Tests all critical backend endpoints
- Provides real-time connection status
- Shows detailed test results
- Supports both required and optional endpoints
- Auto-validation on component mount
- Manual validation trigger

**Props**:

- `projectId`: Project ID for project-specific endpoints
- `userId`: User ID for user-specific endpoints
- `onValidationComplete`: Callback for validation results
- `showDetails`: Whether to show detailed test results
- `autoValidate`: Whether to validate automatically on mount

### 2. BackendConnectionTester Component

**Location**: `components/BackendConnectionTester.tsx`

A specialized component for comprehensive backend testing with detailed results.

**Features**:

- Tests all backend endpoints systematically
- Shows individual test results with timing
- Provides summary statistics
- Visual status indicators
- Detailed error reporting

## Page Implementations

### 1. Login Page (`/login`)

**API Endpoints Tested**:

- `/health` - Basic server health
- `/test` - Server functionality
- `/login` - User authentication

**Features**:

- Real-time API connection status
- Proper error handling for login failures
- Backend connection validation before login attempts
- User-friendly error messages

### 2. Dashboard Page (`/dashboard`)

**API Endpoints Tested**:

- `/health` - Basic server health
- `/test` - Server functionality
- `/get_projects_info` - User projects list

**Features**:

- Multiple backend URL fallback system
- Comprehensive error handling
- Real-time project loading
- Connection status indicators

### 3. Project Page (`/project/[id]`)

**API Endpoints Tested**:

- `/health` - Basic server health
- `/test` - Server functionality
- `/get_project_details` - Project information
- `/get_uploaded_videos` - Project videos
- `/get_classes` - Annotation classes

**Features**:

- Real-time project details loading
- API connection validation
- Error handling with fallback data
- Loading states and error messages

### 4. Upload Page (`/project/[id]/upload`)

**API Endpoints Tested**:

- `/health` - Basic server health
- `/test` - Server functionality
- `/get_uploaded_videos` - Project videos
- `/upload` - Video upload functionality

**Features**:

- Comprehensive connection validation
- Upload functionality disabled when not connected
- Real-time video list updates
- Detailed error handling and user feedback

### 5. Annotate Page (`/project/[id]/annotate`)

**API Endpoints Tested**:

- `/health` - Basic server health
- `/test` - Server functionality
- `/get_classes` - Annotation classes
- `/get_next_frame_to_annotate` - Frame data
- `/check_annotation_status` - Annotation progress
- `/annotate` - Save annotations

**Features**:

- Real-time class loading
- Annotation status checking
- Frame data retrieval
- Comprehensive error handling

### 6. Training Page (`/project/[id]/train`)

**API Endpoints Tested**:

- `/health` - Basic server health
- `/test` - Server functionality
- `/create_dataset` - Dataset creation
- `/get_training_progress` - Training status
- `/get_auto_annotation_progress` - Auto-annotation progress

**Features**:

- Real-time training progress monitoring
- Dataset creation validation
- Auto-annotation progress tracking
- Comprehensive error handling

### 7. Deploy Page (`/project/[id]/deploy`)

**API Endpoints Tested**:

- `/health` - Basic server health
- `/test` - Server functionality
- `/get_model_performance` - Model metrics
- `/get_model_path` - Model file paths

**Features**:

- Real-time model performance loading
- Model file path validation
- Download functionality validation
- Comprehensive error handling

## API Endpoint Mapping

### Core Endpoints (All Pages)

- `GET /health` - Server health check
- `GET /test` - Server functionality test

### Authentication

- `POST /login` - User login

### Project Management

- `POST /get_projects_info` - Get user projects
- `POST /get_project_details` - Get project details
- `POST /create_project` - Create new project
- `POST /change_project_name` - Update project name

### Video Management

- `POST /upload` - Upload videos
- `POST /get_uploaded_videos` - Get project videos

### Annotation

- `POST /get_classes` - Get annotation classes
- `POST /add_class` - Add new class
- `POST /modify_class` - Modify class
- `POST /delete_class` - Delete class
- `POST /get_next_frame_to_annotate` - Get frame data
- `POST /check_annotation_status` - Check annotation status
- `POST /annotate` - Save annotations
- `POST /next_video` - Get next video

### Training

- `POST /create_dataset` - Create dataset
- `POST /get_auto_annotation_progress` - Get auto-annotation progress
- `POST /train` - Start training
- `POST /get_training_progress` - Get training progress

### Deployment

- `POST /get_model_performance` - Get model metrics
- `POST /get_model_path` - Get model file paths

## Error Handling Strategy

### 1. Connection Validation

- All pages validate backend connection before making API calls
- Multiple fallback URLs are tested
- Clear error messages are displayed to users

### 2. API Call Failures

- Comprehensive error logging
- User-friendly error messages
- Graceful degradation when possible
- No fallback data usage (as requested)

### 3. Timeout Handling

- All API calls have appropriate timeouts
- AbortSignal.timeout() is used for fetch requests
- Retry logic where appropriate

## Logging

All API interactions are logged using the centralized logger:

```typescript
import { log } from "@/lib/logger";

// API call logging
log.apiCall(endpoint, method, body);
log.apiSuccess(url, method, status, duration, data);
log.apiError(url, method, error, duration);

// Connection testing
log.connectionTest(url, success, duration);

// General logging
log.info(component, message, data);
log.warn(component, message, data);
log.error(component, message, data);
```

## Usage Examples

### Basic API Validator

```tsx
<ApiConnectionValidator
  projectId="123"
  showDetails={true}
  autoValidate={true}
/>
```

### Custom Validation Callback

```tsx
<ApiConnectionValidator
  projectId="123"
  onValidationComplete={(results) => {
    console.log("Validation results:", results);
    // Handle validation results
  }}
/>
```

### Minimal Validator (No Details)

```tsx
<ApiConnectionValidator
  projectId="123"
  showDetails={false}
  autoValidate={true}
/>
```

## Benefits

1. **No Fallback Data**: All pages now use real API data only
2. **Real-time Validation**: Users see connection status immediately
3. **Comprehensive Testing**: All endpoints are validated
4. **User-Friendly**: Clear error messages and status indicators
5. **Developer-Friendly**: Detailed logging and debugging information
6. **Maintainable**: Centralized validation logic
7. **Scalable**: Easy to add new endpoints or pages

## Troubleshooting

### Common Issues

1. **Backend Not Running**: Check Docker containers and backend service
2. **Network Issues**: Verify backend URL configuration
3. **Database Issues**: Check database connection in backend
4. **CORS Issues**: Verify CORS configuration in backend

### Debug Steps

1. Check browser console for error messages
2. Check backend logs for API call details
3. Use the API validator component to test specific endpoints
4. Verify backend URL configuration
5. Check network connectivity

## Future Enhancements

1. **Health Monitoring**: Add periodic health checks
2. **Performance Metrics**: Track API response times
3. **Alert System**: Notify users of connection issues
4. **Retry Logic**: Implement exponential backoff for failed requests
5. **Caching**: Add intelligent caching for frequently accessed data

This comprehensive API connection validation system ensures that all pages in the Nocodile application have proper backend connectivity and provide a reliable user experience without fallback data.
