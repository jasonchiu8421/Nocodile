"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiService } from "../../../../lib/api";
import ApiConnectionValidator from "@/components/ApiConnectionValidator";
import { log } from "@/lib/logger";

const getSteps = (projectId: string) => [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Upload", href: `/project/${projectId}/upload` },
  { label: "Annotate", href: `/project/${projectId}/annotate` },
  { label: "Train", href: `/project/${projectId}/training` },
  { label: "Deploy", href: `/project/${projectId}/deploy` },
];

interface ModelPerformance {
  mAP?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  accuracy?: number;
  status?: string;
}

interface ModelPath {
  onnx_path?: string;
  pytorch_path?: string;
  config_path?: string;
  weights_path?: string;
}

interface TrainingStatus {
  success: boolean;
  status: string;
  progress: number;
  message?: string;
}

interface DebugInfo {
  project_id: string;
  opencv_available: boolean;
  current_working_dir: string;
  project_paths: Array<{
    path: string;
    exists: boolean;
    is_dir: boolean;
    videos_dir?: string;
    videos_dir_exists?: boolean;
    video_files: string[];
  }>;
  video_files: string[];
  total_videos: number;
}

interface HealthStatus {
  status: string;
  message: string;
  timestamp?: string;
}

export default function DeployPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  // State for model data
  const [performance, setPerformance] = useState<ModelPerformance>({});
  const [modelPath, setModelPath] = useState<ModelPath>({});
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  
  // State for debug information
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deploy' | 'debug' | 'training'>('deploy');
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    const loadDeploymentData = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        log.info('DEPLOY', 'Loading deployment data', { projectId });
        
        // Load all data in parallel
        const [
          performanceData, 
          pathData, 
          trainingData,
          healthData,
          routesData
        ] = await Promise.all([
          ApiService.getModelPerformance(projectId),
          ApiService.getModelPath(projectId),
          ApiService.getTrainingStatus(projectId),
          ApiService.checkBackendHealth(),
          ApiService.getAvailableRoutes()
        ]);
        
        // Set performance data
        if (performanceData.success) {
          setPerformance(performanceData["model performance"]);
          log.info('DEPLOY', 'Model performance loaded', { 
            projectId, 
            performance: performanceData["model performance"] 
          });
        }
        
        // Set model paths
        if (pathData.success) {
          setModelPath(pathData["model path"]);
          log.info('DEPLOY', 'Model paths loaded', { 
            projectId, 
            paths: pathData["model path"] 
          });
        }

        // Set training status
        setTrainingStatus(trainingData);
        log.info('DEPLOY', 'Training status loaded', { 
          projectId, 
          training: trainingData 
        });

        // Set health status
        setHealthStatus(healthData);
        log.info('DEPLOY', 'Health status loaded', { 
          projectId, 
          health: healthData 
        });

        // Set available routes
        setAvailableRoutes(routesData.available_routes || []);
        log.info('DEPLOY', 'Available routes loaded', { 
          projectId, 
          routesCount: routesData.available_routes?.length || 0 
        });
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        log.error('DEPLOY', 'Error loading deployment data', { 
          projectId, 
          error: errorMessage 
        });
        console.error('Error loading deployment data:', err);
        setError('Failed to load deployment data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDeploymentData();
  }, [projectId]);

  const loadDebugInfo = async () => {
    if (!projectId) return;
    
    try {
      log.info('DEPLOY', 'Loading debug information', { projectId });
      
      const [projectDebug, frameDebug, videoDebug] = await Promise.all([
        ApiService.getProjectDebugInfo(projectId),
        ApiService.getFrameDebugInfo(projectId),
        ApiService.getVideoDebugInfo(projectId)
      ]);
      
      setDebugInfo(projectDebug);
      log.info('DEPLOY', 'Debug information loaded', { 
        projectId, 
        debug: { projectDebug, frameDebug, videoDebug }
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error('DEPLOY', 'Error loading debug information', { 
        projectId, 
        error: errorMessage 
      });
      console.error('Error loading debug information:', err);
    }
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined) return 'N/A';
    return `${Math.round(value * 100)}%`;
  };

  const handleDownloadModel = async (modelType: 'onnx' | 'pytorch' | 'weights' | 'config') => {
    try {
      const result = await ApiService.downloadModelFile(projectId, modelType);
      
      if (result.success && result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `model_${projectId}.${modelType === 'pytorch' ? 'pth' : modelType === 'weights' ? 'pt' : modelType === 'config' ? 'json' : 'onnx'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(result.error || 'Model file not available for download');
      }
    } catch (error) {
      console.error('Error downloading model:', error);
      alert('Failed to download model file');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'healthy':
        return 'text-green-600';
      case 'training':
      case 'in progress':
        return 'text-blue-600';
      case 'failed':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/templogo.png" alt="Nocodile AI" className="h-8 w-8" />
            <span className="font-semibold">Nocodile AI</span>
          </div>
          <div className="flex-1 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Project
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-white rounded-xl border border-gray-200 p-4 h-fit">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Workflow Steps</h2>
          <ol className="space-y-1">
            {getSteps(projectId).map((step) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 ${
                    step.label === "Deploy" ? "bg-blue-50 text-blue-700 border border-blue-200" : ""
                  }`}
                >
                  <span className="w-6 text-center">
                    {String(getSteps(projectId).findIndex((s) => s.label === step.label) + 1)}.
                  </span>
                  <span>{step.label}</span>
                </Link>
              </li>
            ))}
          </ol>

          {/* Tab Navigation */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">View Options</h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('deploy')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  activeTab === 'deploy' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                📊 Deployment
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  activeTab === 'training' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                🚀 Training Status
              </button>
              <button
                onClick={() => {
                  setActiveTab('debug');
                  if (!debugInfo) loadDebugInfo();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  activeTab === 'debug' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                🔧 Debug Info
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="space-y-6">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Deployment Tab */}
          {activeTab === 'deploy' && (
            <>
              {/* Model Performance */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h1 className="text-lg font-semibold">Model Performance</h1>
                  {performance.status && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      performance.status.includes('Fallback') 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : performance.status.includes('mock') 
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {performance.status.includes('Fallback') ? '⚠️ Fallback Data' : 
                       performance.status.includes('mock') ? '🔄 Mock Data' : 
                       '✅ Backend Data'}
                    </div>
                  )}
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading performance metrics from backend...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="text-sm font-medium text-gray-600">mAP (Mean Average Precision)</div>
                      <div className="mt-2 text-3xl font-bold text-green-600">
                        {formatPercentage(performance.mAP)}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="text-sm font-medium text-gray-600">Precision</div>
                      <div className="mt-2 text-2xl font-bold text-green-600">
                        {formatPercentage(performance.precision)}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="text-sm font-medium text-gray-600">Recall</div>
                      <div className="mt-2 text-2xl font-bold text-orange-600">
                        {formatPercentage(performance.recall)}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="text-sm font-medium text-gray-600">F1-Score</div>
                      <div className="mt-2 text-2xl font-bold text-purple-600">
                        {formatPercentage(performance.f1_score)}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Deploy Your Model */}
              <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                <h2 className="text-lg font-semibold">Deploy Your Model</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Option 1: Download Model Files */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold">Option 1: Download Model Files</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Download the trained model files in various formats for deployment.
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-gray-500">
                        Available formats: ONNX, PyTorch, Weights, Config
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => handleDownloadModel('onnx')}
                          className="inline-flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Download ONNX
                        </button>
                        <button 
                          onClick={() => handleDownloadModel('pytorch')}
                          className="inline-flex items-center bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm"
                        >
                          Download PyTorch
                        </button>
                        <button 
                          onClick={() => handleDownloadModel('weights')}
                          className="inline-flex items-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                        >
                          Download Weights
                        </button>
                        <button 
                          onClick={() => handleDownloadModel('config')}
                          className="inline-flex items-center bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
                        >
                          Download Config
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Cloud API */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold">Option 2: Cloud API</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Use our hosted API for inference. Here's how to get started:
                    </p>
                    <pre className="mt-3 bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`curl -X POST "http://localhost:8888/predict" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@/path/to/image.jpg" \\
  -F "project_id=${projectId}"`}
                    </pre>
                    <div className="mt-2 flex gap-2">
                      <Link href="#" className="inline-flex text-blue-600 hover:underline text-sm">
                        Get API Key
                      </Link>
                      <span className="text-gray-400">|</span>
                      <Link href="#" className="inline-flex text-blue-600 hover:underline text-sm">
                        View API Docs
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Bottom buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2">
                  <div className="flex gap-3">
                    <Link
                      href={`/project/${projectId}/training`}
                      className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      Back to Training
                    </Link>
                    <Link
                      href="#"
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Configure Behavior Rules
                    </Link>
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    Create New Project
                  </Link>
                </div>
              </section>
            </>
          )}

          {/* Training Status Tab */}
          {activeTab === 'training' && (
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Training Status</h2>
              
              {trainingStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <span className={`text-sm font-semibold ${getStatusColor(trainingStatus.status)}`}>
                      {trainingStatus.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Progress:</span>
                      <span className="text-sm font-semibold">{trainingStatus.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(trainingStatus.progress)}`}
                        style={{ width: `${Math.min(trainingStatus.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {trainingStatus.message && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">{trainingStatus.message}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading training status...</p>
                </div>
              )}
            </section>
          )}

          {/* Debug Info Tab */}
          {activeTab === 'debug' && (
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Debug Information</h2>
                <button
                  onClick={loadDebugInfo}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Refresh Debug Info
                </button>
              </div>

              {/* Health Status */}
              {healthStatus && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Backend Health</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm font-semibold ${getStatusColor(healthStatus.status)}`}>
                        {healthStatus.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Message:</span>
                      <span className="text-sm">{healthStatus.message}</span>
                    </div>
                    {healthStatus.timestamp && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Timestamp:</span>
                        <span className="text-sm">{healthStatus.timestamp}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Available Routes */}
              {availableRoutes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Available API Routes ({availableRoutes.length})</h3>
                  <div className="max-h-40 overflow-y-auto">
                    <div className="space-y-1">
                      {availableRoutes.slice(0, 10).map((route, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-blue-600">{route.methods?.join(', ') || 'GET'}</span>
                          <span className="text-gray-600">{route.path}</span>
                        </div>
                      ))}
                      {availableRoutes.length > 10 && (
                        <div className="text-xs text-gray-500">
                          ... and {availableRoutes.length - 10} more routes
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Project Debug Info */}
              {debugInfo && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Project Debug Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">OpenCV Available:</span>
                      <span className={`text-sm font-semibold ${debugInfo.opencv_available ? 'text-green-600' : 'text-red-600'}`}>
                        {debugInfo.opencv_available ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Videos:</span>
                      <span className="text-sm font-semibold">{debugInfo.total_videos}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Working Directory:</span>
                      <span className="text-sm font-mono text-gray-500">{debugInfo.current_working_dir}</span>
                    </div>
                  </div>

                  {/* Project Paths */}
                  {debugInfo.project_paths.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Project Paths</h4>
                      <div className="space-y-2">
                        {debugInfo.project_paths.map((path, index) => (
                          <div key={index} className="bg-white rounded p-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-gray-600">{path.path}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                path.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {path.exists ? 'Exists' : 'Not Found'}
                              </span>
                            </div>
                            {path.videos_dir && (
                              <div className="mt-1 text-xs text-gray-500">
                                Videos: {path.videos_dir} ({path.video_files.length} files)
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!debugInfo && (
                <div className="text-center py-8">
                  <button
                    onClick={loadDebugInfo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Load Debug Information
                  </button>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}