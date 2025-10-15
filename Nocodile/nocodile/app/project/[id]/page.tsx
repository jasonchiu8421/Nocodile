"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, FolderOpen, Image, Video, Calendar, RefreshCw } from "lucide-react";
import Link from "next/link";
import ApiConnectionValidator from "@/components/ApiConnectionValidator";
import { useProjectContext } from "@/contexts/ProjectContext";
import { log } from "@/lib/logger";
import "../../../css/dashboard.css";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { getProject, refreshProject, isLoading, error } = useProjectContext();
  
  const [project, setProject] = useState(() => {
    const cachedProject = getProject(projectId);
    return cachedProject || {
      id: projectId,
      name: "Loading...",
      description: "Loading project details...",
      videoCount: 0,
      imageCount: 0,
      status: "Unknown",
      lastUpdated: "2024-01-01T00:00:00.000Z"
    };
  });

  // Load project details from context/API
  useEffect(() => {
    const loadProjectDetails = async () => {
      if (!projectId) return;
      
      try {
        // First try to get from cache
        const cachedProject = getProject(projectId);
        if (cachedProject) {
          setProject(cachedProject);
          log.info('PROJECT', 'Using cached project details', { 
            projectId, 
            name: cachedProject.name 
          });
        }
        
        // Then refresh from API to get latest data
        await refreshProject(projectId);
        
      } catch (error) {
        log.error('PROJECT', 'Failed to load project details', { 
          projectId, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    };

    loadProjectDetails();
  }, [projectId, getProject, refreshProject]);

  // Update local state when context changes
  useEffect(() => {
    const cachedProject = getProject(projectId);
    if (cachedProject) {
      setProject(cachedProject);
    }
  }, [projectId, getProject]);

  return (
    <div className="dashboard-container">
      {/* API Connection Status */}
      <div className="mb-4">
        <ApiConnectionValidator 
          projectId={Array.isArray(projectId) ? projectId[0] : projectId}
          showDetails={true}
          autoValidate={true}
        />
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-flex">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="btn-secondary">
                <ArrowLeft className="btn-icon" />
                Back to Projects
              </Link>
              <div>
                <h1 className="header-title">{project.name}</h1>
                <div className="project-id">ID: {project.id}</div>
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading project details...
                  </div>
                )}
                {error && (
                  <div className="text-sm text-red-500">
                    Error: {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-grid">
          {/* Project Info Section */}
          <div className="projects-section">
            <div className="section-header">
              <h2 className="section-title">Project Details</h2>
            </div>
            
            <div className="project-card">
              <div className="project-header">
                <div className="flex items-center gap-3">
                  <FolderOpen className="text-blue-500" size={24} />
                  <div>
                    <h3 className="project-title">{project.name}</h3>
                    <div className="project-id">ID: {project.id}</div>
                  </div>
                </div>
              </div>
              
              {project.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600">{project.description}</p>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>Last Updated: {new Date(project.lastUpdated).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    project.status === 'Active' ? 'bg-green-500' : 
                    project.status === 'Training' ? 'bg-yellow-500' : 
                    'bg-gray-500'
                  }`}></div>
                  <span>Status: {project.status}</span>
                </div>
              </div>

              <div className="media-stats">
                <div className="media-item">
                  <div className="media-icon">
                    <Image className="icon" />
                  </div>
                  <div className="media-info">
                    <span className="media-count">{project.imageCount}</span>
                    <span className="media-label">Images</span>
                  </div>
                </div>
                <div className="media-item">
                  <div className="media-icon">
                    <Video className="icon" />
                  </div>
                  <div className="media-info">
                    <span className="media-count">{project.videoCount}</span>
                    <span className="media-label">Videos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
