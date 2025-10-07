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
}

interface ModelPath {
  onnx_path?: string;
  pytorch_path?: string;
  config_path?: string;
  weights_path?: string;
}

export default function DeployPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [performance, setPerformance] = useState<ModelPerformance>({});
  const [modelPath, setModelPath] = useState<ModelPath>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeploymentData = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        log.info('DEPLOY', 'Loading deployment data', { projectId });
        
        // Load model performance and paths in parallel
        const [performanceData, pathData] = await Promise.all([
          ApiService.getModelPerformance(projectId),
          ApiService.getModelPath(projectId)
        ]);
        
        if (performanceData.success) {
          setPerformance(performanceData["model performance"]);
          log.info('DEPLOY', 'Model performance loaded', { 
            projectId, 
            performance: performanceData["model performance"] 
          });
        }
        
        if (pathData.success) {
          setModelPath(pathData["model path"]);
          log.info('DEPLOY', 'Model paths loaded', { 
            projectId, 
            paths: pathData["model path"] 
          });
        }
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

  const formatPercentage = (value?: number) => {
    if (value === undefined) return 'N/A';
    return `${Math.round(value * 100)}%`;
  };

  const handleDownloadModel = () => {
    if (modelPath.onnx_path) {
      // Create a download link for the ONNX model
      const link = document.createElement('a');
      link.href = modelPath.onnx_path;
      link.download = `model_${projectId}.onnx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Model file not available for download');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* API Connection Status */}
      <div className="bg-white border-b border-gray-200 p-4">
        <ApiConnectionValidator 
          projectId={projectId}
          showDetails={true}
          autoValidate={true}
        />
      </div>
      
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
        </aside>

        {/* Main content */}
        <main className="space-y-6">
          {/* My Projects / Metrics */}
          <section className="space-y-3">
            <h1 className="text-lg font-semibold">Model Performance</h1>
            
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading performance metrics...</span>
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
              {/* Option 1 */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold">Option 1: Download Model Files</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Download the trained model files in various formats for deployment.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-500">
                    Available formats: ONNX, PyTorch, Weights
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {modelPath.onnx_path && (
                      <button 
                        onClick={handleDownloadModel}
                        className="inline-flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Download ONNX
                      </button>
                    )}
                    {modelPath.pytorch_path && (
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = modelPath.pytorch_path!;
                          link.download = `model_${projectId}.pth`;
                          link.click();
                        }}
                        className="inline-flex items-center bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm"
                      >
                        Download PyTorch
                      </button>
                    )}
                    {modelPath.weights_path && (
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = modelPath.weights_path!;
                          link.download = `weights_${projectId}.pt`;
                          link.click();
                        }}
                        className="inline-flex items-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        Download Weights
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Option 2 */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold">Option 2: Cloud API</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Use our hosted API for inference. Here's how to get started:
                </p>
                <pre className="mt-3 bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`curl -X POST "http://localhost:8888/predict" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/image.jpg" \
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
        </main>
      </div>
    </div>
  );
}


