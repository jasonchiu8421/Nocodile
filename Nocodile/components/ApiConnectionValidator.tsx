"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { log } from '@/lib/logger';

interface ApiEndpoint {
  name: string;
  endpoint: string;
  method: string;
  body?: any;
  required: boolean;
  description: string;
}

interface ApiValidationResult {
  endpoint: string;
  name: string;
  success: boolean;
  status?: number;
  duration: number;
  error?: string;
  response?: any;
  required: boolean;
}

interface ApiConnectionValidatorProps {
  projectId?: string | number;
  userId?: string | number;
  onValidationComplete?: (results: ApiValidationResult[]) => void;
  showDetails?: boolean;
  autoValidate?: boolean;
}

const ApiConnectionValidator: React.FC<ApiConnectionValidatorProps> = ({
  projectId,
  userId,
  onValidationComplete,
  showDetails = true,
  autoValidate = true
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<ApiValidationResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'validating' | 'success' | 'error' | 'partial'>('idle');
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  // Define all API endpoints used across the application
  const getApiEndpoints = (): ApiEndpoint[] => {
    const baseEndpoints: ApiEndpoint[] = [
      {
        name: 'Health Check',
        endpoint: '/health',
        method: 'GET',
        required: true,
        description: 'Basic server health check'
      },
      {
        name: 'Test Endpoint',
        endpoint: '/test',
        method: 'GET',
        required: false, // 改為非必需，避免 404 錯誤
        description: 'Server functionality test'
      }
    ];

    const projectEndpoints: ApiEndpoint[] = projectId ? [
      {
        name: 'Get Project Details',
        endpoint: '/get_project_details',
        method: 'POST',
        body: { project_id: projectId.toString() },
        required: true,
        description: 'Fetch project information'
      },
      {
        name: 'Get Uploaded Videos',
        endpoint: '/get_uploaded_videos',
        method: 'POST',
        body: { project_id: projectId.toString() },
        required: true,
        description: 'Get videos for project'
      },
      {
        name: 'Get Classes',
        endpoint: '/get_classes',
        method: 'POST',
        body: { project_id: projectId.toString() },
        required: true,
        description: 'Get annotation classes'
      },
      {
        name: 'Get Next Frame',
        endpoint: '/get_next_frame_to_annotate',
        method: 'POST',
        body: { 
          project_id: projectId.toString(),
          video_id: 'video_1' // Default video ID for testing
        },
        required: false,
        description: 'Get frame for annotation'
      },
      {
        name: 'Check Annotation Status',
        endpoint: '/check_annotation_status',
        method: 'POST',
        body: { 
          project_id: projectId.toString(),
          video_id: 'video_1'
        },
        required: false,
        description: 'Check annotation progress'
      },
      {
        name: 'Create Dataset',
        endpoint: '/create_dataset',
        method: 'POST',
        body: { project_id: projectId.toString() },
        required: false,
        description: 'Start dataset creation'
      },
      {
        name: 'Get Training Progress',
        endpoint: '/get_training_progress',
        method: 'POST',
        body: { project_id: projectId.toString() },
        required: false,
        description: 'Get training status'
      },
      {
        name: 'Get Model Performance',
        endpoint: '/get_model_performance',
        method: 'POST',
        body: { project_id: projectId.toString() },
        required: false,
        description: 'Get model metrics'
      },
      {
        name: 'Get Model Path',
        endpoint: '/get_model_path',
        method: 'POST',
        body: { project_id: projectId.toString() },
        required: false,
        description: 'Get model file paths'
      }
    ] : [];

    const userEndpoints: ApiEndpoint[] = userId ? [
      {
        name: 'Get Projects Info',
        endpoint: '/get_projects_info',
        method: 'POST',
        body: { userID: userId.toString() },
        required: true,
        description: 'Get user projects'
      }
    ] : [];

    return [...baseEndpoints, ...projectEndpoints, ...userEndpoints];
  };

  const validateApiConnection = async () => {
    setIsValidating(true);
    setOverallStatus('validating');
    setResults([]);

    const endpoints = getApiEndpoints();
    const validationResults: ApiValidationResult[] = [];
    let successCount = 0;
    let requiredSuccessCount = 0;
    let totalRequired = 0;

    log.info('API_VALIDATOR', 'Starting comprehensive API validation', { 
      projectId, 
      userId, 
      endpointCount: endpoints.length 
    });

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const result: ApiValidationResult = {
        endpoint: endpoint.endpoint,
        name: endpoint.name,
        success: false,
        duration: 0,
        required: endpoint.required
      };

      if (endpoint.required) {
        totalRequired++;
      }

      try {
        log.debug('API_VALIDATOR', `Testing endpoint: ${endpoint.name}`, { 
          endpoint: endpoint.endpoint, 
          method: endpoint.method 
        });

        const response = await fetch(`http://localhost:8888${endpoint.endpoint}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        const duration = Date.now() - startTime;
        result.duration = duration;

        if (response.ok) {
          result.success = true;
          result.status = response.status;
          successCount++;
          if (endpoint.required) {
            requiredSuccessCount++;
          }
          
          try {
            result.response = await response.json();
          } catch {
            result.response = { message: 'Response received but not JSON' };
          }

          log.info('API_VALIDATOR', `Endpoint ${endpoint.name} passed`, { 
            duration, 
            status: response.status 
          });
        } else {
          result.error = `HTTP ${response.status}: ${response.statusText}`;
          log.warn('API_VALIDATOR', `Endpoint ${endpoint.name} failed`, { 
            status: response.status, 
            duration 
          });
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        result.duration = duration;
        result.error = error instanceof Error ? error.message : String(error);
        
        log.error('API_VALIDATOR', `Endpoint ${endpoint.name} error`, { 
          error: result.error, 
          duration 
        });
      }

      validationResults.push(result);
      setResults([...validationResults]);

      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Determine overall status
    if (requiredSuccessCount === totalRequired && successCount === endpoints.length) {
      setOverallStatus('success');
    } else if (requiredSuccessCount === totalRequired) {
      setOverallStatus('partial');
    } else {
      setOverallStatus('error');
    }

    setLastValidated(new Date());
    setIsValidating(false);

    log.info('API_VALIDATOR', 'API validation completed', {
      totalEndpoints: endpoints.length,
      successCount,
      requiredSuccessCount,
      totalRequired,
      overallStatus: overallStatus
    });

    if (onValidationComplete) {
      onValidationComplete(validationResults);
    }
  };

  useEffect(() => {
    if (autoValidate) {
      validateApiConnection();
    }
  }, [projectId, userId, autoValidate]);

  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'validating':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <WifiOff className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (overallStatus) {
      case 'validating':
        return 'Validating APIs...';
      case 'success':
        return 'All APIs Connected';
      case 'partial':
        return 'Core APIs Connected';
      case 'error':
        return 'API Connection Issues';
      default:
        return 'Not Validated';
    }
  };

  const getStatusColor = () => {
    switch (overallStatus) {
      case 'validating':
        return 'text-blue-700';
      case 'success':
        return 'text-green-700';
      case 'partial':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const requiredResults = results.filter(r => r.required);
  const optionalResults = results.filter(r => !r.required);
  const requiredSuccessCount = requiredResults.filter(r => r.success).length;
  const optionalSuccessCount = optionalResults.filter(r => r.success).length;

  return (
    <div className="border p-4 rounded-md border-gray-300 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold">API Connection Status</h3>
        </div>
        <button
          onClick={validateApiConnection}
          disabled={isValidating}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Validate APIs
            </>
          )}
        </button>
      </div>

      <div className="mb-4">
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
        {lastValidated && (
          <div className="text-xs text-gray-500">
            Last validated: {lastValidated.toLocaleTimeString()}
          </div>
        )}
        {results.length > 0 && (
          <div className="text-xs text-gray-600 mt-1">
            Required: {requiredSuccessCount}/{requiredResults.length} | 
            Optional: {optionalSuccessCount}/{optionalResults.length}
          </div>
        )}
      </div>

      {showDetails && results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">API Endpoints:</h4>
          
          {/* Required endpoints */}
          {requiredResults.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">Required APIs:</h5>
              {requiredResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-mono">{result.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{result.duration}ms</span>
                    {result.status && <span>({result.status})</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Optional endpoints */}
          {optionalResults.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">Optional APIs:</h5>
              {optionalResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-mono">{result.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{result.duration}ms</span>
                    {result.status && <span>({result.status})</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-medium text-gray-700 mb-2">Summary:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Total endpoints: {results.length}</div>
            <div className="text-green-600">
              Successful: {results.filter(r => r.success).length}
            </div>
            <div className="text-red-600">
              Failed: {results.filter(r => !r.success).length}
            </div>
            <div>
              Average response time: {Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiConnectionValidator;
