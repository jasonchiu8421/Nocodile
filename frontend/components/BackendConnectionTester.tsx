"use client";

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { log } from '@/lib/logger';

interface TestResult {
  endpoint: string;
  method: string;
  success: boolean;
  status?: number;
  duration: number;
  error?: string;
  response?: any;
}

interface ConnectionTesterProps {
  projectId: number;
  backendUrl?: string;
}

const BackendConnectionTester: React.FC<ConnectionTesterProps> = ({ 
  projectId, 
  backendUrl = 'http://localhost:8888' 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const runConnectionTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    setResults([]);
    
    console.log('🧪 [CONNECTION_TESTER] Starting comprehensive backend tests', { projectId, backendUrl });
    log.info('CONNECTION_TESTER', 'Starting comprehensive backend tests', { projectId, backendUrl });

    const tests: Array<() => Promise<TestResult>> = [
      // Test 1: Health check
      async () => {
        const startTime = Date.now();
        try {
          const response = await fetch(`${backendUrl}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });
          const duration = Date.now() - startTime;
          const data = await response.json();
          
          return {
            endpoint: '/health',
            method: 'GET',
            success: response.ok,
            status: response.status,
            duration,
            response: data
          };
        } catch (error) {
          return {
            endpoint: '/health',
            method: 'GET',
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      },

      // Test 2: Test endpoint
      async () => {
        const startTime = Date.now();
        try {
          const response = await fetch(`${backendUrl}/test`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });
          const duration = Date.now() - startTime;
          const data = await response.json();
          
          return {
            endpoint: '/test',
            method: 'GET',
            success: response.ok,
            status: response.status,
            duration,
            response: data
          };
        } catch (error) {
          return {
            endpoint: '/test',
            method: 'GET',
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      },

      // Test 3: Get uploaded videos
      async () => {
        const startTime = Date.now();
        try {
          const response = await fetch(`${backendUrl}/get_uploaded_videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId.toString() }),
            signal: AbortSignal.timeout(10000)
          });
          const duration = Date.now() - startTime;
          const data = await response.json();
          
          return {
            endpoint: '/get_uploaded_videos',
            method: 'POST',
            success: response.ok,
            status: response.status,
            duration,
            response: data
          };
        } catch (error) {
          return {
            endpoint: '/get_uploaded_videos',
            method: 'POST',
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      },

      // Test 4: Get project details
      async () => {
        const startTime = Date.now();
        try {
          const response = await fetch(`${backendUrl}/get_project_details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId.toString() }),
            signal: AbortSignal.timeout(10000)
          });
          const duration = Date.now() - startTime;
          const data = await response.json();
          
          return {
            endpoint: '/get_project_details',
            method: 'POST',
            success: response.ok,
            status: response.status,
            duration,
            response: data
          };
        } catch (error) {
          return {
            endpoint: '/get_project_details',
            method: 'POST',
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      },

      // Test 5: Get classes
      async () => {
        const startTime = Date.now();
        try {
          const response = await fetch(`${backendUrl}/get_classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId.toString() }),
            signal: AbortSignal.timeout(10000)
          });
          const duration = Date.now() - startTime;
          const data = await response.json();
          
          return {
            endpoint: '/get_classes',
            method: 'POST',
            success: response.ok,
            status: response.status,
            duration,
            response: data
          };
        } catch (error) {
          return {
            endpoint: '/get_classes',
            method: 'POST',
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    ];

    const testResults: TestResult[] = [];
    let successCount = 0;

    for (let i = 0; i < tests.length; i++) {
      console.log(`🧪 [CONNECTION_TESTER] Running test ${i + 1}/${tests.length}...`);
      const result = await tests[i]();
      testResults.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`✅ [CONNECTION_TESTER] Test ${i + 1} passed: ${result.endpoint}`);
      } else {
        console.error(`❌ [CONNECTION_TESTER] Test ${i + 1} failed: ${result.endpoint} - ${result.error}`);
      }
      
      setResults([...testResults]);
      
      // Small delay between tests
      if (i < tests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const overallSuccess = successCount === tests.length;
    setOverallStatus(overallSuccess ? 'success' : 'error');
    
    console.log(`🎯 [CONNECTION_TESTER] All tests completed: ${successCount}/${tests.length} passed`);
    log.info('CONNECTION_TESTER', 'All tests completed', { 
      successCount, 
      totalTests: tests.length, 
      overallSuccess 
    });

    setIsRunning(false);
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-700' : 'text-red-700';
  };

  const getOverallStatusIcon = () => {
    switch (overallStatus) {
      case 'running':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getOverallStatusText = () => {
    switch (overallStatus) {
      case 'running':
        return 'Running tests...';
      case 'success':
        return 'All tests passed!';
      case 'error':
        return 'Some tests failed';
      default:
        return 'Ready to test';
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'running':
        return 'text-blue-700';
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="border p-4 rounded-md border-gray-300 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getOverallStatusIcon()}
          <h3 className="text-lg font-semibold">Backend Connection Tester</h3>
        </div>
        <button
          onClick={runConnectionTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Run Tests
            </>
          )}
        </button>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          <strong>Backend URL:</strong> {backendUrl}
        </div>
        <div className="text-sm text-gray-600 mb-2">
          <strong>Project ID:</strong> {projectId}
        </div>
        <div className={`text-sm font-medium ${getOverallStatusColor()}`}>
          <strong>Status:</strong> {getOverallStatusText()}
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Test Results:</h4>
          {results.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.success)}
                <span className="font-mono text-sm">
                  {result.method} {result.endpoint}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className={getStatusColor(result.success)}>
                  {result.success ? 'PASS' : 'FAIL'}
                </span>
                <span className="text-gray-500">
                  {result.duration}ms
                </span>
                {result.status && (
                  <span className="text-gray-500">
                    {result.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-medium text-gray-700 mb-2">Summary:</h4>
          <div className="text-sm text-gray-600">
            <div>Total tests: {results.length}</div>
            <div className="text-green-600">
              Passed: {results.filter(r => r.success).length}
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

export default BackendConnectionTester;
